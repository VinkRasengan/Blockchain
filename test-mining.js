const axios = require('axios');

async function testMining() {
    console.log('⛏️ TESTING MINING FUNCTIONALITY\n');
    
    try {
        console.log('1. Getting initial blockchain stats...');
        let statsResponse = await axios.get('http://localhost:8080/api/blockchain/stats');
        console.log('📊 Initial Stats:', JSON.stringify(statsResponse.data, null, 2));
        
        console.log('\n2. Checking pending transactions...');
        const pendingResponse = await axios.get('http://localhost:8080/api/blockchain/pending-transactions');
        console.log('📋 Pending Transactions:', JSON.stringify(pendingResponse.data, null, 2));
        
        console.log('\n3. Attempting to mine a block...');
        const mineResponse = await axios.post('http://localhost:8080/api/blockchain/mine', {
            minerAddress: '1TestMinerAddress123456789012345678'
        });
        console.log('⛏️ Mining Response:', JSON.stringify(mineResponse.data, null, 2));
        
        console.log('\n4. Checking stats after mining...');
        statsResponse = await axios.get('http://localhost:8080/api/blockchain/stats');
        console.log('📊 Stats After Mining:', JSON.stringify(statsResponse.data, null, 2));
        
        console.log('\n5. Getting all blocks...');
        const blocksResponse = await axios.get('http://localhost:8080/api/blockchain/blocks');
        console.log('🧱 Blocks Count:', blocksResponse.data.length);
        console.log('🧱 Latest Block:', JSON.stringify(blocksResponse.data[blocksResponse.data.length - 1], null, 2));
        
    } catch (error) {
        console.error('❌ Mining test failed:', error.message);
        if (error.response) {
            console.error('   Status:', error.response.status);
            console.error('   Data:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

testMining();
