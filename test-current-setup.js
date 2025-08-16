// Simple test to see current Qdrant connection with enabled settings
const { QdrantClient } = require('@qdrant/js-client-rest');

function parseQdrantUrl(url) {
  try {
    const parsedUrl = new URL(url)
    return {
      host: parsedUrl.hostname,
      port: parseInt(parsedUrl.port) || (parsedUrl.protocol === 'https:' ? 443 : 6333),
      https: parsedUrl.protocol === 'https:'
    }
  } catch {
    return {
      host: 'localhost',
      port: 6333,
      https: false
    }
  }
}

async function testCurrentQdrantSetup() {
  const qdrantUrl = 'https://e808fcd7-a692-4089-a99c-e0eff7b21d36.us-west-1-0.aws.cloud.qdrant.io:6333'
  const { host, port, https } = parseQdrantUrl(qdrantUrl)
  
  const client = new QdrantClient({
    host,
    port,
    https,
    apiKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3MiOiJtIn0.9oNCV90-ut5tl_I4WA6-xKEaa8DV8aOcl6HdnjnNlyc',
    timeout: 60000
  });

  try {
    console.log('🔄 Testing Qdrant connection...');
    console.log('🔧 Config:', { host, port, https });
    
    const startTime = Date.now();
    const collections = await client.getCollections();
    const endTime = Date.now();
    
    console.log(`✅ Connection successful! (${endTime - startTime}ms)`);
    console.log('📊 Collections:', collections.collections?.length || 0);
    
    if (collections.collections && collections.collections.length > 0) {
      console.log('📋 Available collections:');
      collections.collections.forEach(col => {
        console.log(`  - ${col.name}`);
      });
    }
    
    return true;
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    if (error.cause) {
      console.error('🔍 Cause:', error.cause.code || error.cause.message);
    }
    return false;
  }
}

testCurrentQdrantSetup();
