import * as crypto from 'crypto';
import { Transaction } from './Transaction';

export class Block {
  public index: number;
  public timestamp: number;
  public transactions: Transaction[];
  public previousHash: string;
  public nonce: number;
  public hash: string;
  public merkleRoot: string;
  public difficulty: number;

  constructor(
    index: number,
    transactions: Transaction[],
    previousHash: string,
    difficulty: number = 4
  ) {
    this.index = index;
    this.timestamp = Date.now();
    this.transactions = transactions;
    this.previousHash = previousHash;
    this.difficulty = difficulty;
    this.nonce = 0;
    this.merkleRoot = this.calculateMerkleRoot();
    this.hash = this.calculateHash();
  }

  /**
   * Tính toán hash của block
   */
  calculateHash(): string {
    const data = this.index + 
                 this.timestamp + 
                 this.previousHash + 
                 this.merkleRoot + 
                 this.nonce + 
                 this.difficulty;
    
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Tính toán Merkle Root từ các giao dịch
   */
  calculateMerkleRoot(): string {
    if (this.transactions.length === 0) {
      return '';
    }

    let hashes = this.transactions.map(tx => tx.hash);

    while (hashes.length > 1) {
      const newHashes: string[] = [];
      
      for (let i = 0; i < hashes.length; i += 2) {
        const left = hashes[i];
        const right = i + 1 < hashes.length ? hashes[i + 1] : left;
        const combined = left + right;
        const hash = crypto.createHash('sha256').update(combined).digest('hex');
        newHashes.push(hash);
      }
      
      hashes = newHashes;
    }

    return hashes[0];
  }

  /**
   * Đào block (Proof of Work)
   */
  mineBlock(): void {
    const target = '0'.repeat(this.difficulty);
    
    console.log(`Mining block ${this.index}...`);
    const startTime = Date.now();
    
    while (this.hash.substring(0, this.difficulty) !== target) {
      this.nonce++;
      this.hash = this.calculateHash();
      
      // Log progress mỗi 100000 lần thử
      if (this.nonce % 100000 === 0) {
        console.log(`Nonce: ${this.nonce}, Hash: ${this.hash}`);
      }
    }
    
    const endTime = Date.now();
    console.log(`Block ${this.index} mined in ${endTime - startTime}ms`);
    console.log(`Hash: ${this.hash}`);
    console.log(`Nonce: ${this.nonce}`);
  }

  /**
   * Kiểm tra tính hợp lệ của block
   */
  isValid(previousBlock?: Block): boolean {
    // Kiểm tra hash hiện tại
    if (this.hash !== this.calculateHash()) {
      console.log('Invalid hash');
      return false;
    }

    // Kiểm tra Merkle Root
    if (this.merkleRoot !== this.calculateMerkleRoot()) {
      console.log('Invalid Merkle Root');
      return false;
    }

    // Kiểm tra Proof of Work
    const target = '0'.repeat(this.difficulty);
    if (this.hash.substring(0, this.difficulty) !== target) {
      console.log('Invalid Proof of Work');
      return false;
    }

    // Kiểm tra liên kết với block trước
    if (previousBlock && this.previousHash !== previousBlock.hash) {
      console.log('Invalid previous hash');
      return false;
    }

    // Kiểm tra index
    if (previousBlock && this.index !== previousBlock.index + 1) {
      console.log('Invalid index');
      return false;
    }

    // Kiểm tra timestamp
    if (previousBlock && this.timestamp <= previousBlock.timestamp) {
      console.log('Invalid timestamp');
      return false;
    }

    // Kiểm tra tất cả giao dịch
    for (const transaction of this.transactions) {
      if (!transaction.isValid()) {
        console.log('Invalid transaction found');
        return false;
      }
    }

    return true;
  }

  /**
   * Tạo Genesis Block
   */
  static createGenesisBlock(): Block {
    const genesisTransaction = Transaction.createCoinbaseTransaction(
      'genesis-address',
      50
    );
    
    const genesisBlock = new Block(0, [genesisTransaction], '0', 4);
    genesisBlock.mineBlock();
    
    return genesisBlock;
  }

  /**
   * Lấy thông tin tóm tắt của block
   */
  getSummary() {
    return {
      index: this.index,
      hash: this.hash,
      previousHash: this.previousHash,
      timestamp: this.timestamp,
      transactionCount: this.transactions.length,
      nonce: this.nonce,
      difficulty: this.difficulty
    };
  }
}
