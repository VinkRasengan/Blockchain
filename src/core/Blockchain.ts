import { Block } from './Block';
import { Transaction, TransactionOutput } from './Transaction';
import { ProofOfStake } from './ProofOfStake';

export interface UTXO {
  txHash: string;
  outputIndex: number;
  address: string;
  amount: number;
}

export enum ConsensusType {
  PROOF_OF_WORK = 'POW',
  PROOF_OF_STAKE = 'POS'
}

export class Blockchain {
  public chain: Block[];
  public difficulty: number;
  public miningReward: number;
  public pendingTransactions: Transaction[];
  private utxoSet: Map<string, UTXO>; // key: txHash:outputIndex
  public consensusType: ConsensusType;
  public proofOfStake: ProofOfStake;

  constructor(consensusType: ConsensusType = ConsensusType.PROOF_OF_WORK) {
    this.chain = [Block.createGenesisBlock()];
    this.difficulty = 4;
    this.miningReward = 50;
    this.pendingTransactions = [];
    this.utxoSet = new Map();
    this.consensusType = consensusType;
    this.proofOfStake = new ProofOfStake(this);

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
   * Đào block mới (PoW)
   */
  minePendingTransactions(miningRewardAddress: string): Block {
    if (this.consensusType === ConsensusType.PROOF_OF_STAKE) {
      throw new Error('Use createBlockPoS for Proof of Stake consensus');
    }

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
   * Tạo block mới sử dụng PoS
   */
  createBlockPoS(validatorAddress?: string): Block | null {
    if (this.consensusType === ConsensusType.PROOF_OF_WORK) {
      throw new Error('Use minePendingTransactions for Proof of Work consensus');
    }

    // Chọn validator nếu không được chỉ định
    const selectedValidator = validatorAddress || this.proofOfStake.selectValidator();

    if (!selectedValidator) {
      console.log('No validators available for block creation');
      return null;
    }

    // Tạo coinbase transaction
    const coinbaseTransaction = Transaction.createCoinbaseTransaction(
      selectedValidator,
      this.miningReward
    );

    // Thêm coinbase transaction vào đầu danh sách
    const transactions = [coinbaseTransaction, ...this.pendingTransactions];

    // Tạo block sử dụng PoS
    const block = this.proofOfStake.createBlock(
      selectedValidator,
      transactions,
      this.getLatestBlock().hash
    );

    if (!block) {
      console.log('Failed to create block with PoS');
      return null;
    }

    // Validate block
    if (!this.proofOfStake.validateBlock(block, selectedValidator)) {
      console.log('Block validation failed');
      return null;
    }

    // Thêm block vào chain
    this.chain.push(block);

    // Cập nhật UTXO set
    this.updateUTXOSet(block);

    // Xóa pending transactions
    this.pendingTransactions = [];

    console.log(`Block ${block.index} created by validator ${selectedValidator}`);
    return block;
  }

  /**
   * Stake coins để trở thành validator
   */
  stakeCoins(address: string, amount: number): boolean {
    if (this.consensusType !== ConsensusType.PROOF_OF_STAKE) {
      throw new Error('Staking is only available in Proof of Stake mode');
    }

    return this.proofOfStake.stake(address, amount);
  }

  /**
   * Unstake coins
   */
  unstakeCoins(address: string, amount: number): boolean {
    if (this.consensusType !== ConsensusType.PROOF_OF_STAKE) {
      throw new Error('Unstaking is only available in Proof of Stake mode');
    }

    return this.proofOfStake.unstake(address, amount);
  }

  /**
   * Chuyển đổi consensus type
   */
  switchConsensusType(newType: ConsensusType): void {
    this.consensusType = newType;
    console.log(`Consensus type switched to ${newType}`);
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
   * Lấy số dư của địa chỉ
   */
  getBalanceOfAddress(address: string): number {
    const utxos = this.getUTXOsForAddress(address);
    return utxos.reduce((balance, utxo) => balance + utxo.amount, 0);
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

  /**
   * Lấy tất cả UTXO
   */
  getAllUTXOs(): UTXO[] {
    return Array.from(this.utxoSet.values());
  }

  /**
   * Tính thời gian mining trung bình
   */
  getAverageBlockTime(): number {
    if (this.chain.length < 2) return 0;

    let totalTime = 0;
    for (let i = 1; i < this.chain.length; i++) {
      totalTime += this.chain[i].timestamp - this.chain[i - 1].timestamp;
    }

    return totalTime / (this.chain.length - 1);
  }

  /**
   * Ước tính thời gian mining block tiếp theo
   */
  getEstimatedMiningTime(): number {
    const averageTime = this.getAverageBlockTime();
    const difficultyMultiplier = Math.pow(2, this.difficulty - 4); // Base difficulty 4
    return averageTime * difficultyMultiplier;
  }

  /**
   * Tính network hash rate (ước tính)
   */
  getNetworkHashRate(): number {
    if (this.chain.length < 2) return 0;

    const recentBlocks = this.chain.slice(-10); // Lấy 10 blocks gần nhất
    let totalTime = 0;
    let totalDifficulty = 0;

    for (let i = 1; i < recentBlocks.length; i++) {
      totalTime += recentBlocks[i].timestamp - recentBlocks[i - 1].timestamp;
      totalDifficulty += recentBlocks[i].difficulty;
    }

    if (totalTime === 0) return 0;

    const averageTime = totalTime / (recentBlocks.length - 1);
    const averageDifficulty = totalDifficulty / (recentBlocks.length - 1);

    // Ước tính hash rate (hashes per second)
    return Math.pow(2, averageDifficulty) / (averageTime / 1000);
  }
}
