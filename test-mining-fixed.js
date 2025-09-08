const axios = require('axios');

async function simpleMiningTest() {
    console.log('⛏️ SIMPLE MINING TEST\n');
    
    try {
        console.log('1. Checking initial stats...');
        let statsResponse = await axios.get('http://localhost:8080/api/blockchain/stats');
        console.log(`   Total Blocks: ${statsResponse.data.stats.totalBlocks}`);
        console.log(`   Pending Transactions: ${statsResponse.data.stats.pendingTransactions}`);
        
        if (statsResponse.data.stats.pendingTransactions > 0) {
            console.log('\n2. Mining pending transactions...');
            const mineResponse = await axios.post('http://localhost:8080/api/mining/start', {
                minerAddress: '14C62y2NhfPgfy9wQywKYfrYSvTQXvBc4H' // Valid wallet address from previous test
            });
            
            console.log('Mining Response:', JSON.stringify(mineResponse.data, null, 2));
            
            if (mineResponse.data.success) {
                console.log('✅ Mining started successfully!');
                
                // Wait a bit for mining to complete
                console.log('\n3. Waiting for mining to complete...');
                await new Promise(resolve => setTimeout(resolve, 3000));
                
                // Check stats again
                console.log('\n4. Checking stats after mining...');
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
