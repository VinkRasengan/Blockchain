import { Blockchain } from '../core/Blockchain';
import { Transaction, TransactionInput, TransactionOutput } from '../core/Transaction';
import { Wallet } from '../core/Wallet';

describe('Blockchain', () => {
  let blockchain: Blockchain;
  let wallet1: Wallet;
  let wallet2: Wallet;

  beforeEach(() => {
    blockchain = new Blockchain();
    wallet1 = new Wallet();
    wallet2 = new Wallet();
  });

  test('should create genesis block', () => {
    expect(blockchain.chain.length).toBe(1);
    expect(blockchain.chain[0].index).toBe(0);
    expect(blockchain.chain[0].previousHash).toBe('0');
  });

  test('should validate blockchain', () => {
    expect(blockchain.isChainValid()).toBe(true);
  });

  test('should mine pending transactions', () => {
    // Create a transaction
    const transaction = new Transaction(
      [{ txHash: '0'.repeat(64), outputIndex: -1 }],
      [{ address: wallet1.address, amount: 10 }],
      0
    );

    blockchain.addTransaction(transaction);
    
    const initialLength = blockchain.chain.length;
    blockchain.minePendingTransactions(wallet2.address);
    
    expect(blockchain.chain.length).toBe(initialLength + 1);
    expect(blockchain.pendingTransactions.length).toBe(0);
  });

  test('should calculate balance correctly', () => {
    // Mine a block to give wallet2 some coins
    blockchain.minePendingTransactions(wallet2.address);
    
    const balance = blockchain.getBalance(wallet2.address);
    expect(balance).toBe(50); // Mining reward
  });

  test('should get transaction history', () => {
    // Mine a block
    blockchain.minePendingTransactions(wallet1.address);
    
    const history = blockchain.getTransactionHistory(wallet1.address);
    expect(history.length).toBeGreaterThan(0);
  });

  test('should reject invalid transactions', () => {
    // Create invalid transaction (no inputs)
    const invalidTransaction = new Transaction([], [{ address: wallet1.address, amount: 100 }], 1);
    
    const result = blockchain.addTransaction(invalidTransaction);
    expect(result).toBe(false);
  });

  test('should get blockchain stats', () => {
    const stats = blockchain.getStats();
    
    expect(stats).toHaveProperty('totalBlocks');
    expect(stats).toHaveProperty('totalTransactions');
    expect(stats).toHaveProperty('difficulty');
    expect(stats).toHaveProperty('miningReward');
    expect(stats).toHaveProperty('pendingTransactions');
    expect(stats).toHaveProperty('totalUTXOs');
  });

  test('should find block by hash', () => {
    const genesisBlock = blockchain.chain[0];
    const foundBlock = blockchain.getBlockByHash(genesisBlock.hash);
    
    expect(foundBlock).toBeDefined();
    expect(foundBlock?.hash).toBe(genesisBlock.hash);
  });

  test('should find block by index', () => {
    const genesisBlock = blockchain.getBlockByIndex(0);
    
    expect(genesisBlock).toBeDefined();
    expect(genesisBlock?.index).toBe(0);
  });

  test('should handle UTXO correctly', () => {
    // Mine a block to create UTXO
    blockchain.minePendingTransactions(wallet1.address);
    
    const utxos = blockchain.getUTXOsForAddress(wallet1.address);
    expect(utxos.length).toBeGreaterThan(0);
    
    const totalUTXO = utxos.reduce((sum, utxo) => sum + utxo.amount, 0);
    const balance = blockchain.getBalance(wallet1.address);
    expect(totalUTXO).toBe(balance);
  });
});
