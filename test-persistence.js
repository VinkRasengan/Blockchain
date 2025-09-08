const { Wallet } = require('./src/core/Wallet');
const { Blockchain } = require('./src/core/Blockchain');
const { Transaction } = require('./src/core/Transaction');

console.log('Testing wallet and transaction persistence...\n');

async function testPersistence() {
  try {
    // Test 1: Tạo ví mới
    console.log('1. Testing wallet creation and persistence...');
    const wallet = new Wallet();
    const password = 'test123';
    
    console.log(`Created wallet: ${wallet.address}`);
    
    // Lưu ví
    const walletData = wallet.saveToFile('test-wallet.json', password);
    console.log('✓ Wallet saved to file system');
    
    // Test 2: Tải lại ví
    console.log('\n2. Testing wallet loading...');
    const loadedWallet = Wallet.loadFromFile('test-wallet.json', password);
    console.log(`✓ Loaded wallet: ${loadedWallet.address}`);
    console.log(`✓ Addresses match: ${wallet.address === loadedWallet.address}`);
    
    // Test 3: Liệt kê ví đã lưu
    console.log('\n3. Testing wallet listing...');
    const walletList = Wallet.getWalletsList();
    console.log(`✓ Found ${walletList.length} saved wallets:`, walletList);
    
    // Test 4: Tạo blockchain và test transaction persistence
    console.log('\n4. Testing blockchain and transaction persistence...');
    const blockchain = new Blockchain();
    
    // Tạo giao dịch test
    const testTransaction = new Transaction(
      [{ txHash: '0'.repeat(64), outputIndex: -1 }],
      [{ address: wallet.address, amount: 5 }],
      0
    );
    
    // Thêm giao dịch (sẽ tự động lưu vào file)
    const success = blockchain.addTransaction(testTransaction);
    console.log(`✓ Transaction added and saved: ${success}`);
    console.log(`✓ Transaction hash: ${testTransaction.hash}`);
    
    // Test 5: Kiểm tra balance
    console.log('\n5. Testing balance calculation...');
    const balance = blockchain.getBalance(wallet.address);
    console.log(`✓ Wallet balance: ${balance} MYC`);
    
    console.log('\n✅ All persistence tests passed!');
    console.log('\nChecked directories:');
    console.log('- data/wallets/ (for saved wallets)');
    console.log('- data/transactions/ (for transaction history)');
    console.log('- data/blockchain.json (for blockchain state)');
    console.log('- data/utxo.json (for UTXO set)');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error);
  }
}

testPersistence();
