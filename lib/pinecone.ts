import { Pinecone } from '@pinecone-database/pinecone'

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
})

export const index = pinecone.index(process.env.PINECONE_INDEX_NAME || 'tat-paper-generator')

// Interface for material data
interface Material {
  id: string
  type: string
  title: string
  content: string
  year?: number
  weightings?: any
  styleNotes?: string
}

export async function upsertMaterial(material: Material, embedding: number[]) {
  try {
    await index.upsert([{
      id: material.id,
      values: embedding,
      metadata: {
        type: material.type,
        title: material.title,
        content: material.content,
        year: material.year || 0,
        weightings: JSON.stringify(material.weightings || {}),
        styleNotes: material.styleNotes || '',
      }
    }])
    
    return true
  } catch (error) {
    console.error('Error upserting material to Pinecone:', error)
    return false
  }
}

export async function deleteMaterial(id: string) {
  try {
    await index.deleteOne(id)
    return true
  } catch (error) {
    console.error('Error deleting material from Pinecone:', error)
    return false
  }
}

export async function searchSimilarMaterials(embedding: number[], topK: number = 10) {
  try {
    const result = await index.query({
      vector: embedding,
      topK,
      includeMetadata: true
    })
    
    return result.matches || []
  } catch (error) {
    console.error('Error searching similar materials in Pinecone:', error)
    return []
  }
}
