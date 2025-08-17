import { QdrantClient } from '@qdrant/js-client-rest'
import { prisma } from './prisma'
import { generateEmbeddings } from './jina'

// Check if Qdrant is enabled in environment
export const isQdrantEnabled = () => process.env.QDRANT_ENABLED === 'true'

// Parse URL to extract host and port for QdrantClient
function parseQdrantUrl(url: string) {
  try {
    const parsedUrl = new URL(url)
    return {
      host: parsedUrl.hostname,
      port: parseInt(parsedUrl.port) || (parsedUrl.protocol === 'https:' ? 443 : 6333),
      https: parsedUrl.protocol === 'https:'
    }
  } catch {
    // Fallback for localhost
    return {
      host: 'localhost',
      port: 6333,
      https: false
    }
  }
}

const qdrantUrl = process.env.QDRANT_URL || 'http://localhost:6333'
const { host, port, https } = parseQdrantUrl(qdrantUrl)

const qdrant = new QdrantClient({
  host,
  port,
  https,
  apiKey: process.env.QDRANT_API_KEY,
  // Additional configuration that might help with connection issues
  timeout: 60000, // Increased timeout to 60 seconds
  checkCompatibility: false, // Skip version compatibility check
})

// Retry configuration
const RETRY_ATTEMPTS = 3
const RETRY_DELAY = 2000 // 2 seconds

// Helper function to retry async operations
async function retryAsync<T>(
  operation: () => Promise<T>,
  attempts: number = RETRY_ATTEMPTS,
  delay: number = RETRY_DELAY
): Promise<T> {
  try {
    return await operation()
  } catch (error) {
    if (attempts > 1) {
      console.log(`⚠️ Operation failed, retrying in ${delay}ms... (${attempts - 1} attempts left)`)
      await new Promise(resolve => setTimeout(resolve, delay))
      return retryAsync(operation, attempts - 1, delay)
    }
    throw error
  }
}

export interface CourseMaterial {
  id: string
  courseId: string
  title: string
  description?: string
  type: 'SYLLABUS' | 'OLD_PAPER' | 'REFERENCE'
  content: string
  year?: number
  weightings?: any
  styleNotes?: string
  metadata?: any
}

export interface SearchResult {
  id: string
  score: number
  payload: CourseMaterial
}

// Test Qdrant connection with retry logic
export async function testQdrantConnection(): Promise<boolean> {
  try {
    await retryAsync(async () => {
      const result = await qdrant.getCollections()
      return result
    })
    console.log('✅ Qdrant connection test passed')
    return true
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('❌ Qdrant connection test failed after retries:', errorMessage)
    return false
  }
}

// Initialize Qdrant collection for course materials
export async function initializeCollection(collectionName: string = 'course_materials') {
  try {
    // Check if collection exists
    const collections = await qdrant.getCollections()
    const collectionExists = collections.collections.some(
      (col: any) => col.name === collectionName
    )

    if (!collectionExists) {
      // Create collection with vector configuration
      // Note: jina-embeddings-v3 has 1024 dimensions vs v2's 768
      await qdrant.createCollection(collectionName, {
        vectors: {
          size: 1024, // Updated for Jina v3 embedding size
          distance: 'Cosine',
        },
      })

      // Create payload index for courseId for efficient filtering
      await qdrant.createPayloadIndex(collectionName, {
        field_name: 'courseId',
        field_schema: 'keyword',
      })

      // Create payload index for type
      await qdrant.createPayloadIndex(collectionName, {
        field_name: 'type',
        field_schema: 'keyword',
      })

      console.log(`✅ Created Qdrant collection: ${collectionName}`)
    } else {
      console.log(`✅ Qdrant collection already exists: ${collectionName}`)
    }
  } catch (error) {
    console.error('Error initializing Qdrant collection:', error)
    throw error
  }
}

// Generate embedding using Jina AI API
async function generateEmbedding(text: string): Promise<number[]> {
  try {
    // Validate input
    if (!text || text.trim().length === 0) {
      throw new Error('Text content is empty or invalid')
    }

    // Log the input for debugging
    console.log('Input text for embedding:', {
      length: text.length,
      preview: text.substring(0, 200),
      type: typeof text,
      isEmpty: text.trim().length === 0
    })

    // Truncate text if it's too long (Jina has token limits)
    // Jina v3 typically handles up to 8192 tokens, but let's be conservative
    const maxLength = 6000 // Conservative limit for safety
    const truncatedText = text.length > maxLength ? text.substring(0, maxLength) : text

    if (truncatedText !== text) {
      console.log(`⚠️ Text truncated from ${text.length} to ${truncatedText.length} characters`)
    }

    console.log('Generating embedding for text of length:', truncatedText.length)

    const embeddings = await generateEmbeddings(truncatedText, {
      model: 'jina-embeddings-v3', // Updated to v3
      task: 'text-matching' // Updated to text-matching
    })
    
    if (!embeddings || embeddings.length === 0) {
      throw new Error('No embeddings returned from Jina AI')
    }

    console.log('Successfully generated embedding with dimensions:', embeddings[0].length)
    return embeddings[0] // Return the first (and only) embedding
  } catch (error) {
    console.error('Error generating embedding:', error)
    throw error // Re-throw to handle upstream
  }
}

// Upsert course material to Qdrant
export async function upsertCourseMaterial(material: CourseMaterial) {
  try {
    const collectionName = process.env.QDRANT_COLLECTION || 'course_materials'
    
    console.log('Starting Qdrant upsert process for material:', material.title)
    
    // Test Qdrant connection first (without retry for faster failure)
    try {
      await qdrant.getCollections()
      console.log('✅ Qdrant connection successful')
    } catch (connectionError) {
      console.error('❌ Qdrant connection failed:', connectionError)
      const errorMessage = connectionError instanceof Error ? connectionError.message : 'Unknown connection error'
      throw new Error(`Qdrant connection failed: ${errorMessage}`)
    }
    
    // Generate embedding from content
    console.log('Generating embedding for material content...')
    const embedding = await generateEmbedding(material.content)
    console.log('✅ Embedding generated successfully')
    
    // Prepare payload with proper relationships
    const payload = {
      courseId: material.courseId,
      materialId: material.id, // Store material ID for direct reference
      title: material.title,
      description: material.description,
      type: material.type,
      content: material.content,
      year: material.year,
      weightings: material.weightings,
      styleNotes: material.styleNotes,
      metadata: material.metadata,
      // Add timestamps for tracking
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    console.log('Upserting to Qdrant collection:', collectionName)
    
    // Upsert point with material ID as the primary key
    await qdrant.upsert(collectionName, {
      points: [
        {
          id: material.id, // Use material ID as the unique identifier
          vector: embedding,
          payload: payload,
        },
      ],
    })

    console.log(`✅ Successfully upserted material to Qdrant: ${material.title} (ID: ${material.id})`)
  } catch (error) {
    console.error('Error upserting to Qdrant:', error)
    // Check if it's a connection timeout specifically
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorCode = (error as any)?.code
    
    if (errorMessage.includes('Connect Timeout') || errorCode === 'UND_ERR_CONNECT_TIMEOUT') {
      throw new Error('Qdrant connection timeout - please check your network connection and Qdrant service status')
    }
    throw error
  }
}

// Search course materials in Qdrant
export async function searchCourseMaterials(
  courseId: string,
  query: string,
  topK: number = 12,
  filter?: any
): Promise<SearchResult[]> {
  try {
    const collectionName = 'course_materials'
    
    // Generate embedding for search query
    const queryEmbedding = await generateEmbedding(query)
    
    // Prepare filter
    const searchFilter = {
      must: [
        {
          key: 'courseId',
          match: { value: courseId },
        },
      ],
    }

    // Add additional filters if provided
    if (filter) {
      if (filter.type) {
        searchFilter.must.push({
          key: 'type',
          match: { value: filter.type },
        })
      }
    }

    // Search in Qdrant
    const searchResult = await qdrant.search(collectionName, {
      vector: queryEmbedding,
      limit: topK,
      filter: searchFilter,
      with_payload: true,
    })

    // Transform results
    const results: SearchResult[] = searchResult.map((result: any) => ({
      id: result.id,
      score: result.score,
      payload: result.payload as CourseMaterial,
    }))

    return results
  } catch (error) {
    console.error('Error searching Qdrant:', error)
    return []
  }
}

// Delete course material from Qdrant
export async function deleteCourseMaterial(materialId: string) {
  if (!isQdrantEnabled()) {
    console.log('ℹ️ Qdrant is disabled - skipping vector database deletion')
    return
  }

  try {
    const collectionName = process.env.QDRANT_COLLECTION || 'course_materials'
    
    // Test connection first (fail fast if unavailable)
    await qdrant.getCollections()
    
    // Delete by material ID (which is the point ID)
    await qdrant.delete(collectionName, {
      points: [materialId],
    })

    console.log(`✅ Deleted material from Qdrant: ${materialId}`)
  } catch (error) {
    console.error('Error deleting from Qdrant:', error)
    throw error
  }
}

// Delete all materials for a specific course
export async function deleteCourseMaterials(courseId: string) {
  try {
    const collectionName = 'course_materials'
    
    // First, get all material IDs for the course
    const materials = await getCourseMaterials(courseId)
    const materialIds = materials.map(material => material.id)
    
    if (materialIds.length > 0) {
      // Delete all materials for the course
      await qdrant.delete(collectionName, {
        points: materialIds,
      })
      
      console.log(`✅ Deleted ${materialIds.length} materials from Qdrant for course: ${courseId}`)
    }
  } catch (error) {
    console.error('Error deleting course materials from Qdrant:', error)
    throw error
  }
}

// Get all materials for a course
export async function getCourseMaterials(courseId: string): Promise<CourseMaterial[]> {
  try {
    const collectionName = 'course_materials'
    
    const scrollResult = await qdrant.scroll(collectionName, {
      filter: {
        must: [
          {
            key: 'courseId',
            match: { value: courseId },
          },
        ],
      },
      limit: 100,
      with_payload: true,
    })

    return scrollResult.points.map((point: any) => ({
      id: point.id,
      courseId: point.payload.courseId,
      title: point.payload.title,
      description: point.payload.description,
      type: point.payload.type,
      content: point.payload.content,
      year: point.payload.year,
      weightings: point.payload.weightings,
      styleNotes: point.payload.styleNotes,
      metadata: point.payload.metadata,
    }))
  } catch (error) {
    console.error('Error getting course materials from Qdrant:', error)
    return []
  }
}

// Sync Qdrant with database to ensure consistency
export async function syncQdrantWithDatabase() {
  try {
    const collectionName = 'course_materials'
    
    // Get all materials from database
    const dbMaterials = await prisma.courseMaterial.findMany({
      include: {
        course: true,
      },
    })

    // Get all points from Qdrant
    const qdrantPoints = await qdrant.scroll(collectionName, {
      limit: 10000, // Adjust based on your needs
      with_payload: true,
    })

    const qdrantMaterialIds = new Set(qdrantPoints.points.map((point: any) => point.id as string))
    const dbMaterialIds = new Set(dbMaterials.map(material => material.id))

    // Find materials that exist in Qdrant but not in database (orphaned)
    const orphanedIds = Array.from(qdrantMaterialIds).filter((id: unknown) => !dbMaterialIds.has(id as string))
    
    // Find materials that exist in database but not in Qdrant (missing)
    const missingMaterials = dbMaterials.filter((material: any) => !qdrantMaterialIds.has(material.id))

    // Delete orphaned points from Qdrant
    if (orphanedIds.length > 0) {
      await qdrant.delete(collectionName, {
        points: orphanedIds as string[],
      })
      console.log(`🗑️ Deleted ${orphanedIds.length} orphaned materials from Qdrant`)
    }

    // Add missing materials to Qdrant
    for (const material of missingMaterials) {
      try {
        await upsertCourseMaterial({
          id: material.id,
          courseId: material.courseId,
          title: material.title,
          description: material.description || undefined,
          type: material.type as 'SYLLABUS' | 'OLD_PAPER' | 'REFERENCE',
          content: material.content || '',
          year: material.year || undefined,
          weightings: material.weightings,
          styleNotes: material.styleNotes || undefined,
        })
      } catch (error) {
        console.error(`Error syncing material ${material.id}:`, error)
      }
    }

    if (missingMaterials.length > 0) {
      console.log(`✅ Added ${missingMaterials.length} missing materials to Qdrant`)
    }

    console.log(`🔄 Qdrant sync completed. Database: ${dbMaterials.length}, Qdrant: ${qdrantPoints.points.length}`)
  } catch (error) {
    console.error('Error syncing Qdrant with database:', error)
    throw error
  }
}

export default qdrant

// Process PDF content and store in Qdrant with Jina embeddings
export async function processPDFContentForStorage(
  pdfText: string,
  material: {
    id: string
    courseId: string
    title: string
    description?: string
    type: 'SYLLABUS' | 'OLD_PAPER' | 'REFERENCE'
    year?: number
    weightings?: any
    styleNotes?: string
  },
  options: {
    chunkSize?: number
    overlap?: number
  } = {}
): Promise<void> {
  try {
    const { processTextForEmbedding } = await import('./jina')
    
    console.log(`📝 Processing PDF content for material: ${material.title}`)
    
    // Process the PDF text with Jina embeddings
    const processedChunks = await processTextForEmbedding(
      pdfText,
      {
        courseId: material.id,
        materialId: material.id,
        title: material.title,
        type: material.type
      },
      {
        chunkSize: options.chunkSize || 1000,
        overlap: options.overlap || 100
      }
    )
    
    const collectionName = 'course_materials'
    
    // Prepare points for Qdrant
    const points = processedChunks.map((chunk, index) => ({
      id: `${material.id}_chunk_${index}`,
      vector: chunk.embedding,
      payload: {
        courseId: material.courseId,
        materialId: material.id,
        title: material.title,
        description: material.description,
        type: material.type,
        content: chunk.text,
        year: material.year,
        weightings: material.weightings,
        styleNotes: material.styleNotes,
        chunkIndex: chunk.metadata.chunkIndex,
        totalChunks: chunk.metadata.totalChunks,
        chunkLength: chunk.metadata.chunkLength,
        startIndex: chunk.metadata.startIndex,
        endIndex: chunk.metadata.endIndex,
      },
    }))
    
    // Upsert all chunks to Qdrant
    await qdrant.upsert(collectionName, {
      wait: true,
      points,
    })
    
    console.log(`✅ Stored ${processedChunks.length} text chunks in Qdrant for material: ${material.title}`)
  } catch (error) {
    console.error('Error processing PDF content for Qdrant storage:', error)
    throw error
  }
}
