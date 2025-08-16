import { QdrantClient } from '@qdrant/js-client-rest'
import { prisma } from './prisma'
import { generateEmbeddings } from './jina'

const qdrant = new QdrantClient({
  url: process.env.QDRANT_URL || 'http://localhost:6333',
  apiKey: process.env.QDRANT_API_KEY,
})

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
      await qdrant.createCollection(collectionName, {
        vectors: {
          size: 768, // Jina v2-base-en embedding size
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
    const embeddings = await generateEmbeddings(text, {
      model: 'jina-embeddings-v2-base-en',
      task: 'retrieval.passage'
    })
    
    return embeddings[0] // Return the first (and only) embedding
  } catch (error) {
    console.error('Error generating embedding:', error)
    // Fallback: return a zero vector (you might want to handle this differently)
    return new Array(768).fill(0) // Jina v2-base-en has 768 dimensions
  }
}

// Upsert course material to Qdrant
export async function upsertCourseMaterial(material: CourseMaterial) {
  try {
    const collectionName = 'course_materials'
    
    // Generate embedding from content
    const embedding = await generateEmbedding(material.content)
    
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

    console.log(`✅ Upserted material to Qdrant: ${material.title} (ID: ${material.id})`)
  } catch (error) {
    console.error('Error upserting to Qdrant:', error)
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
  try {
    const collectionName = 'course_materials'
    
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
