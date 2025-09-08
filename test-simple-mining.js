const axios        if (statsResponse.data.stats.pendingTransactions > 0) {
            console.log('\n2. Mining pending transactions...');
            const mineResponse = await axios.post('http://localhost:8080/api/mining/start', {
                minerAddress: '1TestMinerAddress123456789012345678'
            });quire('axios');

async function simpleMiningTest() {
    console.log('⛏️ SIMPLE MINING TEST\n');
    
    try {
        console.log('1. Checking initial stats...');
        let statsResponse = await axios.get('http://localhost:8080/api/blockchain/stats');
        console.log(`   Total Blocks: ${statsResponse.data.stats.totalBlocks}`);
        console.log(`   Pending Transactions: ${statsResponse.data.stats.pendingTransactions}`);
        
        if (statsResponse.data.stats.pendingTransactions > 0) {
            console.log('\n2. Mining pending transactions...');
            const mineResponse = await axios.post('http://localhost:8080/api/mining/mine', {
                minerAddress: '1TestMinerAddress123456789012345678'
            });
            
            if (mineResponse.data.success) {
                console.log('✅ Block mined successfully!');
                console.log(`   Block Hash: ${mineResponse.data.block.hash}`);
                console.log(`   Block Index: ${mineResponse.data.block.index}`);
                
                // Check stats again
                console.log('\n3. Checking stats after mining...');
                statsResponse = await axios.get('http://localhost:8080/api/blockchain/stats');
                console.log(`   Total Blocks: ${statsResponse.data.stats.totalBlocks}`);
                console.log(`   Pending Transactions: ${statsResponse.data.stats.pendingTransactions}`);
                console.log(`   Total UTXOs: ${statsResponse.data.stats.totalUTXOs}`);
                
            } else {
                console.log('❌ Mining failed:', mineResponse.data);
            }
        } else {
            console.log('ℹ️ No pending transactions to mine');
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        if (error.response) {
            console.error('   Status:', error.response.status);
            console.error('   Data:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

simpleMiningTest();
