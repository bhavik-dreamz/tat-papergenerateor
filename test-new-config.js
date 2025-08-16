const { QdrantClient } = require('@qdrant/js-client-rest');

// Parse URL to extract host and port
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

async function testNewQdrantConfig() {
  const qdrantUrl = 'https://e808fcd7-a692-4089-a99c-e0eff7b21d36.us-west-1-0.aws.cloud.qdrant.io:6333'
  const { host, port, https } = parseQdrantUrl(qdrantUrl)
  
  console.log('🔧 Parsed URL:', { host, port, https })
  
  const client = new QdrantClient({
    host,
    port,
    https,
    apiKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3MiOiJtIn0.9oNCV90-ut5tl_I4WA6-xKEaa8DV8aOcl6HdnjnNlyc'
  });

  try {
    console.log('🔄 Testing new QdrantClient configuration...');
    const collections = await client.getCollections();
    console.log('✅ New Qdrant configuration works!');
    console.log('📊 Collections found:', collections.collections.length);
    console.log('📋 Collection names:', collections.collections.map(c => c.name));
    return true;
  } catch (error) {
    console.error('❌ New configuration failed:', error.message);
    if (error.cause) {
      console.error('🔍 Root cause:', error.cause.code);
    }
    return false;
  }
}

testNewQdrantConfig();
