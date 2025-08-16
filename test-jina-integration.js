// Test script to verify Jina API integration with actual response format
const { generateEmbeddings } = require('./lib/jina.ts');

async function testJinaIntegration() {
  try {
    console.log('🧪 Testing Jina API integration with updated v3 settings...');
    
    // Test with single text input
    const embeddings = await generateEmbeddings('Hello world test', {
      model: 'jina-embeddings-v3',
      task: 'text-matching'
    });
    
    console.log('✅ Single embedding test passed!');
    console.log(`📊 Embedding dimensions: ${embeddings[0].length}`);
    console.log(`📈 First few values: [${embeddings[0].slice(0, 5).join(', ')}...]`);
    
    // Test with multiple texts
    const multipleEmbeddings = await generateEmbeddings([
      'First test text',
      'Second test text'
    ], {
      model: 'jina-embeddings-v3',
      task: 'text-matching'
    });
    
    console.log('✅ Multiple embeddings test passed!');
    console.log(`📊 Number of embeddings: ${multipleEmbeddings.length}`);
    console.log(`📊 Each embedding dimension: ${multipleEmbeddings[0].length}`);
    
  } catch (error) {
    console.error('❌ Jina integration test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

if (require.main === module) {
  testJinaIntegration();
}

module.exports = { testJinaIntegration };
