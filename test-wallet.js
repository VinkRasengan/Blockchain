const { Wallet } = require('./dist/core/Wallet');

console.log('Testing wallet generation...');

try {
    const wallet = new Wallet();
    console.log('✅ Wallet created successfully');
    console.log('Address:', wallet.address);
    console.log('Public Key:', wallet.publicKey);
    console.log('Private Key:', wallet.getPrivateKey());
} catch (error) {
    console.error('❌ Error creating wallet:', error);
}
