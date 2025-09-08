const axios = require('axios');

async function debugWalletCreation() {
    console.log('🔍 DEBUGGING WALLET CREATION WITH 5 MYC FUNDING\n');
    
    try {
        console.log('📤 Creating new wallet for debugging...');
        
        const response = await axios.post('http://localhost:8080/api/wallet/create', {
            password: 'debug123',
            saveToFile: true
        }, {
            timeout: 10000 // 10 second timeout
        });
        
        console.log('📋 Full Response:');
        console.log(JSON.stringify(response.data, null, 2));
        
        if (response.data.success) {
            console.log('\n✅ Wallet Creation Response:');
            console.log(`   Address: ${response.data.wallet.address}`);
            console.log(`   Initial Balance (Expected): ${response.data.wallet.initialBalance} MYC`);
            console.log(`   Actual Balance (Current): ${response.data.wallet.actualBalance} MYC`);
            
            // Check balance via separate API call
            console.log('\n🔍 Checking balance via separate API...');
            const balanceResponse = await axios.get(`http://localhost:8080/api/wallet/${response.data.wallet.address}/balance`, {
                timeout: 5000
            });
            
            console.log('💰 Balance API Response:');
            console.log(JSON.stringify(balanceResponse.data, null, 2));
            
            // Check wallet info
            console.log('\n📊 Checking wallet info...');
            const infoResponse = await axios.get(`http://localhost:8080/api/wallet/${response.data.wallet.address}/info`, {
                timeout: 5000
            });
            
            console.log('ℹ️ Wallet Info Response:');
            console.log(JSON.stringify(infoResponse.data, null, 2));
            
            // Check blockchain stats
            console.log('\n⛓️ Checking blockchain stats...');
            const statsResponse = await axios.get('http://localhost:8080/api/blockchain/stats', {
                timeout: 5000
            });
            
            console.log('📈 Blockchain Stats:');
            console.log(JSON.stringify(statsResponse.data, null, 2));
            
        } else {
            console.log('❌ Wallet creation failed:', response.data);
        }
        
    } catch (error) {
        console.error('❌ Debug test failed:', error.message);
        if (error.response) {
            console.error('   Status:', error.response.status);
            console.error('   Data:', JSON.stringify(error.response.data, null, 2));
        }
        console.error('   Error Code:', error.code || 'Unknown');
    }
}

debugWalletCreation();
