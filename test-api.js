// Quick API test
const axios = require('axios');

async function testAPI() {
  try {
    // Test health endpoint first
    console.log('Testing /api/health...');
    const healthResponse = await axios.get('http://localhost:3002/api/health');
    console.log('Health:', JSON.stringify(healthResponse.data, null, 2));
    
    // Test wallet creation with 5 MYC funding
    console.log('\nTesting wallet creation...');
    const walletResponse = await axios.post('http://localhost:3002/api/wallet/create', {});
    console.log('New Wallet:', JSON.stringify(walletResponse.data, null, 2));
    
    // Test blockchain info after wallet creation
    console.log('\nTesting /api/blockchain/info after wallet creation...');
    const infoResponse = await axios.get('http://localhost:3002/api/blockchain/info');
    console.log('Blockchain Info:', JSON.stringify(infoResponse.data, null, 2));
    
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

testAPI();
