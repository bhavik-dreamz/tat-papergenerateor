import { Pinecone } from '@pinecone-database/pinecone'

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
})

export const index = pinecone.index(process.env.PINECONE_INDEX_NAME || 'tat-paper-generator')

export interface CourseMaterial {
  id: string
  courseId: string
  type: string // 'syllabus', 'old_paper', 'notes', 'textbook'
  title: string
  content: string
  year?: number
  weightings?: any
  styleNotes?: string
  relevanceScore?: number
}

export async function upsertCourseMaterial(material: CourseMaterial) {
  try {
    const vector = await generateEmbedding(material.content)
    
    await index.upsert([{
      id: material.id,
      values: vector,
      metadata: {
        courseId: material.courseId,
        type: material.type,
        title: material.title,
        content: material.content,
        year: material.year,
        weightings: JSON.stringify(material.weightings),
        styleNotes: material.styleNotes,
      }
    }])
    
    return true
  } catch (error) {
    console.error('Error upserting course material:', error)
    throw new Error('Failed to upsert course material')
  }
}

export async function searchCourseMaterials(
  courseId: string,
  query: string,
  topK: number = 12,
  filter?: any
) {
  try {
    const queryVector = await generateEmbedding(query)
    
    const searchResponse = await index.query({
      vector: queryVector,
      topK,
      filter: {
        courseId: { $eq: courseId },
        ...filter
      },
      includeMetadata: true,
    })
    
    return searchResponse.matches?.map(match => ({
      id: match.id,
      score: match.score,
      metadata: match.metadata as any,
    })) || []
  } catch (error) {
    console.error('Error searching course materials:', error)
    throw new Error('Failed to search course materials')
  }
}

// Simple embedding generation (you might want to use a proper embedding service)
async function generateEmbedding(text: string): Promise<number[]> {
  // This is a placeholder - you should use a proper embedding service
  // For now, we'll create a simple hash-based vector
  const hash = text.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0)
    return a & a
  }, 0)
  
  // Create a 1536-dimensional vector (like OpenAI embeddings)
  const vector = new Array(1536).fill(0)
  for (let i = 0; i < 1536; i++) {
    vector[i] = Math.sin(hash + i) * 0.1
  }
  
  return vector
}

export async function deleteCourseMaterial(id: string) {
  try {
    await index.deleteOne(id)
    return true
  } catch (error) {
    console.error('Error deleting course material:', error)
    throw new Error('Failed to delete course material')
  }
}
