import { Wallet } from '../core/Wallet';
import { Blockchain } from '../core/Blockchain';

describe('Wallet', () => {
  let wallet: Wallet;
  let blockchain: Blockchain;

  beforeEach(() => {
    wallet = new Wallet();
    blockchain = new Blockchain();
  });

  test('should create wallet with address and keys', () => {
    expect(wallet.address).toBeDefined();
    expect(wallet.publicKey).toBeDefined();
    expect(wallet.address.length).toBeGreaterThan(0);
    expect(wallet.publicKey.length).toBeGreaterThan(0);
  });

  test('should create wallet from private key', () => {
    const privateKey = 'a'.repeat(64); // Simple private key for testing
    const wallet1 = new Wallet(privateKey);
    const wallet2 = new Wallet(privateKey);
    
    expect(wallet1.address).toBe(wallet2.address);
    expect(wallet1.publicKey).toBe(wallet2.publicKey);
  });

  test('should encrypt and decrypt private key', () => {
    const passphrase = 'test-passphrase';
    const encrypted = wallet.encryptPrivateKey(passphrase);
    
    expect(encrypted).toBeDefined();
    expect(encrypted.length).toBeGreaterThan(0);
    
    // Test decryption
    const decrypted = Wallet.decryptPrivateKey(encrypted, passphrase);
    expect(decrypted).toBeDefined();
  });

  test('should fail to decrypt with wrong passphrase', () => {
    const passphrase = 'test-passphrase';
    const wrongPassphrase = 'wrong-passphrase';
    const encrypted = wallet.encryptPrivateKey(passphrase);
    
    expect(() => {
      Wallet.decryptPrivateKey(encrypted, wrongPassphrase);
    }).toThrow('Invalid passphrase');
  });

  test('should save and load wallet data', () => {
    const passphrase = 'test-passphrase';
    const walletData = wallet.saveToFile('test.json', passphrase);
    
    expect(walletData).toHaveProperty('address');
    expect(walletData).toHaveProperty('publicKey');
    expect(walletData).toHaveProperty('privateKey');
    expect(walletData).toHaveProperty('createdAt');
    
    const loadedWallet = Wallet.loadFromFile(walletData, passphrase);
    expect(loadedWallet.address).toBe(wallet.address);
    expect(loadedWallet.publicKey).toBe(wallet.publicKey);
  });

  test('should get balance from blockchain', () => {
    const balance = wallet.getBalance(blockchain);
    expect(balance).toBe(0); // New wallet should have 0 balance
  });

  test('should create transaction', () => {
    // First, give the wallet some coins by mining
    blockchain.minePendingTransactions(wallet.address);
    
    const recipientWallet = new Wallet();
    const transaction = wallet.createTransaction(
      recipientWallet.address,
      10,
      blockchain,
      1
    );
    
    expect(transaction).toBeDefined();
    if (transaction) {
      expect(transaction.outputs.length).toBeGreaterThan(0);
      expect(transaction.inputs.length).toBeGreaterThan(0);
    }
  });

  test('should fail to create transaction with insufficient balance', () => {
    const recipientWallet = new Wallet();
    const transaction = wallet.createTransaction(
      recipientWallet.address,
      100, // More than available
      blockchain,
      1
    );
    
    expect(transaction).toBeNull();
  });

  test('should send transaction', () => {
    // Give wallet some coins
    blockchain.minePendingTransactions(wallet.address);
    
    const recipientWallet = new Wallet();
    const success = wallet.sendTransaction(
      recipientWallet.address,
      10,
      blockchain,
      1
    );
    
    expect(success).toBe(true);
    expect(blockchain.pendingTransactions.length).toBeGreaterThan(0);
  });

  test('should get transaction history', () => {
    // Mine a block to create transaction history
    blockchain.minePendingTransactions(wallet.address);
    
    const history = wallet.getTransactionHistory(blockchain);
    expect(history.length).toBeGreaterThan(0);
  });

  test('should generate mnemonic', () => {
    const mnemonic = Wallet.generateMnemonic();
    expect(mnemonic).toBeDefined();
    expect(mnemonic.split(' ').length).toBe(12);
  });

  test('should create wallet from mnemonic', () => {
    const mnemonic = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
    const wallet1 = Wallet.fromMnemonic(mnemonic);
    const wallet2 = Wallet.fromMnemonic(mnemonic);
    
    expect(wallet1.address).toBe(wallet2.address);
    expect(wallet1.publicKey).toBe(wallet2.publicKey);
  });

  test('should get wallet info', () => {
    const info = wallet.getInfo();
    
    expect(info).toHaveProperty('address');
    expect(info).toHaveProperty('publicKey');
    expect(info).not.toHaveProperty('privateKey'); // Should not expose private key
  });
});
