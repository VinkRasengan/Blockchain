import { Block } from './Block';
import { Transaction, TransactionOutput } from './Transaction';

export interface UTXO {
  txHash: string;
  outputIndex: number;
  address: string;
  amount: number;
}

export class Blockchain {
  public chain: Block[];
  public difficulty: number;
  public miningReward: number;
  public pendingTransactions: Transaction[];
  private utxoSet: Map<string, UTXO>; // key: txHash:outputIndex

  constructor() {
    this.chain = [Block.createGenesisBlock()];
    this.difficulty = 4;
    this.miningReward = 50;
    this.pendingTransactions = [];
    this.utxoSet = new Map();
    
    // Khởi tạo UTXO set từ genesis block
    this.updateUTXOSet(this.chain[0]);
  }

  /**
   * Lấy block cuối cùng
   */
  getLatestBlock(): Block {
    return this.chain[this.chain.length - 1];
  }

  /**
   * Thêm giao dịch vào pending pool
   */
  addTransaction(transaction: Transaction): boolean {
    if (!transaction.isValid()) {
      console.log('Invalid transaction');
      return false;
    }

    // Kiểm tra double spending
    if (!this.verifyTransaction(transaction)) {
      console.log('Transaction verification failed');
      return false;
    }

    this.pendingTransactions.push(transaction);
    return true;
  }

  /**
   * Xác minh giao dịch (kiểm tra UTXO)
   */
  verifyTransaction(transaction: Transaction): boolean {
    let totalInput = 0;

    for (const input of transaction.inputs) {
      // Skip coinbase transaction
      if (input.txHash === '0'.repeat(64)) {
        continue;
      }

      const utxoKey = `${input.txHash}:${input.outputIndex}`;
      const utxo = this.utxoSet.get(utxoKey);

      if (!utxo) {
        console.log(`UTXO not found: ${utxoKey}`);
        return false;
      }

      totalInput += utxo.amount;
    }

    const totalOutput = transaction.getTotalOutputAmount();
    
    return totalInput >= totalOutput + transaction.fee;
  }

  /**
   * Đào block mới
   */
  minePendingTransactions(miningRewardAddress: string): Block {
    // Tạo coinbase transaction
    const coinbaseTransaction = Transaction.createCoinbaseTransaction(
      miningRewardAddress,
      this.miningReward
    );

    // Thêm coinbase transaction vào đầu danh sách
    const transactions = [coinbaseTransaction, ...this.pendingTransactions];

    // Tạo block mới
    const block = new Block(
      this.getLatestBlock().index + 1,
      transactions,
      this.getLatestBlock().hash,
      this.difficulty
    );

    // Đào block
    block.mineBlock();

    // Thêm block vào chain
    this.chain.push(block);

    // Cập nhật UTXO set
    this.updateUTXOSet(block);

    // Xóa pending transactions
    this.pendingTransactions = [];

    return block;
  }

  /**
   * Cập nhật UTXO set sau khi thêm block mới
   */
  private updateUTXOSet(block: Block): void {
    for (const transaction of block.transactions) {
      // Xóa UTXO đã được sử dụng (inputs)
      for (const input of transaction.inputs) {
        if (input.txHash !== '0'.repeat(64)) {
          const utxoKey = `${input.txHash}:${input.outputIndex}`;
          this.utxoSet.delete(utxoKey);
        }
      }

      // Thêm UTXO mới (outputs)
      transaction.outputs.forEach((output, index) => {
        const utxoKey = `${transaction.hash}:${index}`;
        this.utxoSet.set(utxoKey, {
          txHash: transaction.hash,
          outputIndex: index,
          address: output.address,
          amount: output.amount
        });
      });
    }
  }

  /**
   * Lấy số dư của một địa chỉ
   */
  getBalance(address: string): number {
    let balance = 0;

    for (const utxo of this.utxoSet.values()) {
      if (utxo.address === address) {
        balance += utxo.amount;
      }
    }

    return balance;
  }

  /**
   * Lấy UTXO của một địa chỉ
   */
  getUTXOsForAddress(address: string): UTXO[] {
    const utxos: UTXO[] = [];

    for (const utxo of this.utxoSet.values()) {
      if (utxo.address === address) {
        utxos.push(utxo);
      }
    }

    return utxos;
  }

  /**
   * Lấy lịch sử giao dịch của một địa chỉ
   */
  getTransactionHistory(address: string): Transaction[] {
    const transactions: Transaction[] = [];

    for (const block of this.chain) {
      for (const transaction of block.transactions) {
        // Kiểm tra trong inputs
        const hasInput = transaction.inputs.some(input => {
          const utxoKey = `${input.txHash}:${input.outputIndex}`;
          const utxo = this.utxoSet.get(utxoKey);
          return utxo && utxo.address === address;
        });

        // Kiểm tra trong outputs
        const hasOutput = transaction.outputs.some(output => 
          output.address === address
        );

        if (hasInput || hasOutput) {
          transactions.push(transaction);
        }
      }
    }

    return transactions;
  }

  /**
   * Kiểm tra tính hợp lệ của toàn bộ blockchain
   */
  isChainValid(): boolean {
    for (let i = 1; i < this.chain.length; i++) {
      const currentBlock = this.chain[i];
      const previousBlock = this.chain[i - 1];

      if (!currentBlock.isValid(previousBlock)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Lấy block theo hash
   */
  getBlockByHash(hash: string): Block | undefined {
    return this.chain.find(block => block.hash === hash);
  }

  /**
   * Lấy block theo index
   */
  getBlockByIndex(index: number): Block | undefined {
    return this.chain[index];
  }

  /**
   * Lấy giao dịch theo hash
   */
  getTransactionByHash(hash: string): Transaction | undefined {
    for (const block of this.chain) {
      const transaction = block.transactions.find(tx => tx.hash === hash);
      if (transaction) {
        return transaction;
      }
    }
    return undefined;
  }

  /**
   * Lấy thống kê blockchain
   */
  getStats() {
    return {
      totalBlocks: this.chain.length,
      totalTransactions: this.chain.reduce((sum, block) => sum + block.transactions.length, 0),
      difficulty: this.difficulty,
      miningReward: this.miningReward,
      pendingTransactions: this.pendingTransactions.length,
      totalUTXOs: this.utxoSet.size
    };
  }
}
