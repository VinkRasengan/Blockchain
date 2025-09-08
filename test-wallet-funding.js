const axios = require('axios');

async function testWalletCreation() {
    console.log('🧪 Testing Wallet Creation with 5 MYC Initial Funding\n');
    
    try {
        console.log('📤 Creating new wallet...');
        
        const response = await axios.post('http://localhost:8080/api/wallet/create', {
            password: 'test123',
            saveToFile: true
        });
        
        if (response.data.success) {
            console.log('✅ Wallet created successfully!');
            console.log('📋 Wallet Details:');
            console.log(`   Address: ${response.data.wallet.address}`);
            console.log(`   Initial Balance: ${response.data.wallet.initialBalance} MYC`);
            console.log(`   Actual Balance: ${response.data.wallet.actualBalance} MYC`);
            console.log(`   Mnemonic: ${response.data.wallet.mnemonic}`);
            
            if (response.data.walletFile) {
                console.log(`   Saved File: ${response.data.walletFile.filename}`);
            }
            
            console.log('\n📝 Warnings:');
            response.data.warnings.forEach(warning => {
                console.log(`   - ${warning}`);
            });
            
            // Test wallet balance check
            console.log('\n🔍 Checking wallet balance via API...');
            const balanceResponse = await axios.get(`http://localhost:8080/api/wallet/${response.data.wallet.address}/balance`);
            
            if (balanceResponse.data.success) {
                console.log(`✅ API Balance: ${balanceResponse.data.balance} MYC`);
            }
            
            // Test wallet info
            console.log('\n📊 Getting wallet info...');
            const infoResponse = await axios.get(`http://localhost:8080/api/wallet/${response.data.wallet.address}/info`);
            
            if (infoResponse.data.success) {
                console.log(`✅ Wallet Info - Balance: ${infoResponse.data.wallet.balance} MYC`);
                console.log(`✅ UTXO Count: ${infoResponse.data.wallet.utxoCount}`);
            }
            
        } else {
            console.log('❌ Wallet creation failed:', response.data.error);
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error('❌ Full error:', error);
        if (error.response) {
            console.error('   Response status:', error.response.status);
            console.error('   Response data:', error.response.data);
        }
        if (error.code) {
            console.error('   Error code:', error.code);
        }
    }
}

// Chạy test
testWalletCreation();
