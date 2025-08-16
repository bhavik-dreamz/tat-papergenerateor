const { QdrantClient } = require('@qdrant/js-client-rest');

async function testQdrantConnection() {
  const qdrant = new QdrantClient({
    url: 'https://e808fcd7-a692-4089-a99c-e0eff7b21d36.us-west-1-0.aws.cloud.qdrant.io:6333',
    apiKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3MiOiJtIn0.XUDyggqVccd0fsolpLtubKHNrUzdBX6i7jumdqPzMwE',
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
