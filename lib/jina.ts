import axios from 'axios'

const jinaClient = axios.create({
  baseURL: process.env.JINA_API_URL || 'https://api.jina.ai/v1',
  headers: {
    'Authorization': `Bearer ${process.env.JINA_API_KEY}`,
    'Content-Type': 'application/json',
  },
})

export interface JinaEmbeddingRequest {
  model: string
  input: string | string[]
  encoding_format?: 'float' | 'base64'
  task?: 'retrieval.query' | 'retrieval.passage' | 'text-matching' | 'classification'
}

export interface JinaEmbeddingResponse {
  object: string
  data: Array<{
    object: string
    index: number
    embedding: number[]
  }>
  model: string
  usage: {
    total_tokens: number
    prompt_tokens: number
  }
}

export interface TextChunk {
  text: string
  page?: number
  startIndex?: number
  endIndex?: number
}

/**
 * Generate embeddings for text using Jina AI API
 */
export async function generateEmbeddings(
  text: string | string[],
  options: {
    model?: string
    task?: 'retrieval.query' | 'retrieval.passage' | 'text-matching' | 'classification'
    encoding_format?: 'float' | 'base64'
  } = {}
): Promise<number[][]> {
  try {
    const {
      model = 'jina-embeddings-v3', // Updated to v3 as per demo
      task = 'text-matching', // Updated to text-matching as per demo
      encoding_format = 'float'
    } = options

    // Validate environment variables
    if (!process.env.JINA_API_KEY) {
      throw new Error('JINA_API_KEY environment variable is not set')
    }

    console.log('Generating embeddings with Jina AI...', {
      model,
      task,
      textLength: Array.isArray(text) ? text.length : text.length
    })

    const response = await jinaClient.post<JinaEmbeddingResponse>('/embeddings', {
      model,
      input: text, // Can be string or array as per demo
      task,
      encoding_format
    })

    if (!response.data || !response.data.data || response.data.data.length === 0) {
      throw new Error('No embedding data returned from Jina AI')
    }

    console.log('Successfully generated embeddings:', response.data.data.length)
    return response.data.data.map(item => item.embedding)
  } catch (error) {
    console.error('Error generating embeddings with Jina AI:', error)
    if (error instanceof Error) {
      if ('response' in error) {
        const axiosError = error as any
        console.error('Response status:', axiosError.response?.status)
        console.error('Response data:', axiosError.response?.data)
      }
      throw new Error(`Failed to generate embeddings: ${error.message}`)
    } else {
      throw new Error('Failed to generate embeddings: Unknown error')
    }
  }
}

/**
 * Split text into chunks suitable for embedding
 */
export function splitTextIntoChunks(
  text: string,
  options: {
    maxChunkSize?: number
    overlap?: number
    preserveNewlines?: boolean
  } = {}
): TextChunk[] {
  const {
    maxChunkSize = 1000,
    overlap = 100,
    preserveNewlines = true
  } = options

  if (!text || text.trim().length === 0) {
    return []
  }

  const chunks: TextChunk[] = []
  
  // Split by paragraphs first if preserving newlines
  const paragraphs = preserveNewlines 
    ? text.split(/\n\s*\n/).filter(p => p.trim().length > 0)
    : [text]

  for (const paragraph of paragraphs) {
    if (paragraph.length <= maxChunkSize) {
      chunks.push({
        text: paragraph.trim(),
        startIndex: text.indexOf(paragraph),
        endIndex: text.indexOf(paragraph) + paragraph.length
      })
    } else {
      // Split large paragraphs into smaller chunks
      const words = paragraph.split(/\s+/)
      let currentChunk = ''
      let chunkStart = text.indexOf(paragraph)
      
      for (let i = 0; i < words.length; i++) {
        const word = words[i]
        const testChunk = currentChunk ? `${currentChunk} ${word}` : word
        
        if (testChunk.length > maxChunkSize && currentChunk) {
          // Save current chunk
          chunks.push({
            text: currentChunk.trim(),
            startIndex: chunkStart,
            endIndex: chunkStart + currentChunk.length
          })
          
          // Start new chunk with overlap
          const overlapWords = currentChunk.split(/\s+/).slice(-Math.floor(overlap / 10))
          currentChunk = overlapWords.concat([word]).join(' ')
          chunkStart = text.indexOf(currentChunk, chunkStart)
        } else {
          currentChunk = testChunk
        }
      }
      
      // Add final chunk if there's remaining text
      if (currentChunk.trim()) {
        chunks.push({
          text: currentChunk.trim(),
          startIndex: chunkStart,
          endIndex: chunkStart + currentChunk.length
        })
      }
    }
  }
  
  return chunks.filter(chunk => chunk.text.length > 0)
}

/**
 * Process PDF text content and generate embeddings for course material upload
 */
export async function processTextForEmbedding(
  text: string,
  metadata: {
    courseId: string
    materialId: string
    title: string
    type: 'SYLLABUS' | 'OLD_PAPER' | 'REFERENCE'
    page?: number
  },
  options: {
    chunkSize?: number
    overlap?: number
    model?: string
  } = {}
): Promise<Array<{
  text: string
  embedding: number[]
  metadata: any
}>> {
  const {
    chunkSize = 1000,
    overlap = 100,
    model = 'jina-embeddings-v2-base-en'
  } = options

  // Split text into chunks
  const chunks = splitTextIntoChunks(text, {
    maxChunkSize: chunkSize,
    overlap,
    preserveNewlines: true
  })

  if (chunks.length === 0) {
    throw new Error('No text content found to process')
  }

  // Generate embeddings for all chunks
  const texts = chunks.map(chunk => chunk.text)
  const embeddings = await generateEmbeddings(texts, {
    model,
    task: 'retrieval.passage'
  })

  // Combine chunks with their embeddings and metadata
  return chunks.map((chunk, index) => ({
    text: chunk.text,
    embedding: embeddings[index],
    metadata: {
      ...metadata,
      chunkIndex: index,
      totalChunks: chunks.length,
      startIndex: chunk.startIndex,
      endIndex: chunk.endIndex,
      chunkLength: chunk.text.length
    }
  }))
}

export default jinaClient
