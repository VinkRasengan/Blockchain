// Test script for Proof of Stake functionality
const axios = require('axios');

const API_BASE = 'http://localhost:3002/api';

async function testProofOfStake() {
    console.log('🧪 Testing MyCoin Proof of Stake...\n');

    try {
        // 1. Test blockchain stats
        console.log('1. Testing blockchain stats...');
        const statsResponse = await axios.get(`${API_BASE}/blockchain/stats`);
        console.log('✅ Blockchain stats:', JSON.stringify(statsResponse.data, null, 2));

        // 2. Test network stats
        console.log('\n2. Testing network stats...');
        const networkResponse = await axios.get(`${API_BASE}/blockchain/network-stats`);
        console.log('✅ Network stats:', JSON.stringify(networkResponse.data, null, 2));

        // 3. Test recent blocks
        console.log('\n3. Testing recent blocks...');
        const blocksResponse = await axios.get(`${API_BASE}/blockchain/recent-blocks?limit=3`);
        console.log('✅ Recent blocks:', JSON.stringify(blocksResponse.data, null, 2));

        // 4. Test wallet creation
        console.log('\n4. Testing wallet creation...');
        const walletResponse = await axios.post(`${API_BASE}/wallet/create`, {
            password: 'test123456'
        });
        
        if (walletResponse.data.success) {
            const wallet = walletResponse.data.wallet;
            console.log('✅ Wallet created successfully');
            console.log(`   Address: ${wallet.address}`);
            console.log(`   Balance: ${wallet.actualBalance} MYC`);

            // 5. Test staking (this will fail because we're in PoW mode)
            console.log('\n5. Testing staking...');
            try {
                const stakeResponse = await axios.post(`${API_BASE}/mining/stake`, {
                    address: wallet.address,
                    amount: 100
                });
                console.log('✅ Staking successful:', stakeResponse.data);
            } catch (stakeError) {
                console.log('⚠️  Staking failed (expected in PoW mode):', stakeError.response?.data?.error);
            }

            // 6. Test validators list
            console.log('\n6. Testing validators list...');
            try {
                const validatorsResponse = await axios.get(`${API_BASE}/mining/validators`);
                console.log('✅ Validators:', validatorsResponse.data);
            } catch (validatorError) {
                console.log('⚠️  Validators not available (expected in PoW mode):', validatorError.response?.data?.error);
            }

            // 7. Test transaction sending first to create pending transactions
            console.log('\n7. Testing transaction sending...');

            // Create another wallet to send to
            const recipientResponse = await axios.post(`${API_BASE}/wallet/create`, {
                password: 'recipient123'
            });

            if (recipientResponse.data.success) {
                const recipient = recipientResponse.data.wallet;
                console.log(`   Recipient address: ${recipient.address}`);

                // Send transaction
                const sendResponse = await axios.post(`${API_BASE}/transaction/send`, {
                    fromAddress: wallet.address,
                    toAddress: recipient.address,
                    amount: 5,
                    fee: 1,
                    privateKey: wallet.privateKey
                });

                if (sendResponse.data.success) {
                    console.log('✅ Transaction sent successfully');
                    console.log(`   Transaction hash: ${sendResponse.data.transaction.hash}`);

                    // Now test mining
                    console.log('\n8. Testing mining...');
                    const mineResponse = await axios.post(`${API_BASE}/mining/mine`, {
                        minerAddress: wallet.address
                    });

                    if (mineResponse.data.success) {
                        console.log('✅ Mining successful');
                        console.log(`   Block hash: ${mineResponse.data.block.hash}`);
                        console.log(`   Block index: ${mineResponse.data.block.index}`);
                    } else {
                        console.log('❌ Mining failed:', mineResponse.data.error);
                    }
                } else {
                    console.log('❌ Transaction failed:', sendResponse.data.error);
                }
            }

            // 9. Test balance after transactions
            console.log('\n9. Testing balance after transactions...');
            const balanceResponse = await axios.get(`${API_BASE}/wallet/${wallet.address}/balance`);
            console.log('✅ Updated balance:', balanceResponse.data);

            // 10. Test transaction history
            console.log('\n10. Testing transaction history...');
            const historyResponse = await axios.get(`${API_BASE}/transaction/history/${wallet.address}`);
            console.log('✅ Transaction history:', JSON.stringify(historyResponse.data, null, 2));

        } else {
            console.log('❌ Wallet creation failed:', walletResponse.data.error);
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        if (error.response) {
            console.error('   Response:', error.response.data);
        }
    }
}

// Run tests
testProofOfStake().then(() => {
    console.log('\n🎉 Test completed!');
}).catch(error => {
    console.error('💥 Test suite failed:', error.message);
});
