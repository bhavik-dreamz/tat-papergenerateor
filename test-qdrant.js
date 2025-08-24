const { QdrantClient } = require('@qdrant/js-client-rest');

async function testQdrantConnection() {
  const qdrant = new QdrantClient({
    url: '',
    apiKey: '',
    timeout: 30000,
    checkCompatibility: false,
  });

  try {
    console.log('Testing Qdrant connection...');
    const collections = await qdrant.getCollections();
    console.log('✅ Qdrant connection successful!');
    console.log('Collections:', collections.collections.map(c => c.name));
    
    // Test if our collection exists
    const collectionExists = collections.collections.some(col => col.name === 'tat-pdfmaterial');
    console.log(`Collection "tat-pdfmaterial" exists: ${collectionExists}`);
  } catch (error) {
    console.error('❌ Qdrant connection failed:', error.message);
    if (error.cause) {
      console.error('Cause:', error.cause);
    }
  }
}

testQdrantConnection();
