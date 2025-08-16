import { PrismaClient } from '@prisma/client'
import { initializeCollection, syncQdrantWithDatabase } from '../lib/qdrant'

const prisma = new PrismaClient()

async function setupQdrant() {
  try {
    console.log('🚀 Setting up Qdrant vector database...')

    // Initialize Qdrant collection
    console.log('📦 Initializing Qdrant collection...')
    await initializeCollection('course_materials')
    
    // Sync with database
    console.log('🔄 Syncing Qdrant with database...')
    await syncQdrantWithDatabase()
    
    console.log('✅ Qdrant setup completed successfully!')
  } catch (error) {
    console.error('❌ Error setting up Qdrant:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run setup if this file is executed directly
if (require.main === module) {
  setupQdrant()
}

export { setupQdrant }
