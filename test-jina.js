const axios = require('axios');

async function testJinaAPI() {
  try {
    const response = await axios.post('https://api.jina.ai/v1/embeddings', {
      model: 'jina-embeddings-v3',
      task: 'text-matching',
      input: ['Hello world test']
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': ''
      }
    });

    console.log('✅ Jina API test successful!');
    console.log('Response data:', {
      model: response.data.model,
      embeddings_count: response.data.data.length,
      embedding_dimensions: response.data.data[0].embedding.length
    });
  } catch (error) {
    console.error('❌ Jina API test failed:', error.response?.status, error.response?.data || error.message);
  }
}

testJinaAPI();
