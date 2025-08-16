const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function setupQdrant() {
  try {
    console.log('🚀 Setting up Qdrant vector database...')

    // Dynamic import for the TypeScript module
    const qdrantModule = await import('../lib/qdrant.js')
    const { initializeCollection, syncQdrantWithDatabase } = qdrantModule

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

module.exports = { setupQdrant }
