import { Block } from './Block';
import { Transaction, TransactionOutput } from './Transaction';
import { ProofOfStake } from './ProofOfStake';
import * as fs from 'fs';
import * as path from 'path';

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
  public chain: Block[] = [];
  public difficulty: number;
  public miningReward: number;
  public pendingTransactions: Transaction[];
  private utxoSet: Map<string, UTXO>; // key: txHash:outputIndex
  public consensusType: ConsensusType;
  public proofOfStake: ProofOfStake;

  constructor(consensusType: ConsensusType = ConsensusType.PROOF_OF_WORK) {
    this.consensusType = consensusType;
    this.difficulty = 4;
    this.miningReward = 50;
    this.pendingTransactions = [];
    this.utxoSet = new Map();
    this.proofOfStake = new ProofOfStake(this);

    // Thử tải dữ liệu từ file system trước
    if (!this.loadFromFile()) {
      // Nếu không có dữ liệu, khởi tạo với genesis block
      this.chain = [Block.createGenesisBlock()];
      // Khởi tạo UTXO set từ genesis block
      this.updateUTXOSet(this.chain[0]);
      console.log('Initialized new blockchain with genesis block');
    }
  }

  /**
   * Lấy block cuối cùng
   */
  getLatestBlock(): Block {
    if (this.chain.length === 0) {
      throw new Error('Blockchain is empty - no genesis block found');
    }
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
    
    // Lưu giao dịch vào file system
    this.saveTransactionToFile(transaction);
    
    return true;
  }

  /**
   * Xác minh giao dịch (kiểm tra UTXO)
   */
  verifyTransaction(transaction: Transaction): boolean {
    let totalInput = 0;

    // Check if this is a coinbase transaction
    if (transaction.inputs.length === 1 && 
        transaction.inputs[0].txHash === '0'.repeat(64) && 
        transaction.inputs[0].outputIndex === -1) {
      // Coinbase transaction - always valid as it creates new coins
      return true;
    }

    for (const input of transaction.inputs) {
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

    // Lưu blockchain vào file system
    this.saveToFile();

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

    // Lưu blockchain vào file system
    this.saveToFile();

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
      totalUTXOs: this.utxoSet.size,
      consensusType: this.consensusType
    };
  }

  /**
   * Lấy ProofOfStake instance
   */
  getProofOfStake(): ProofOfStake {
    return this.proofOfStake;
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

  /**
   * Lưu giao dịch vào file system
   */
  private saveTransactionToFile(transaction: Transaction): void {
    const transactionsDir = path.join(process.cwd(), 'data', 'transactions');
    
    if (!fs.existsSync(transactionsDir)) {
      fs.mkdirSync(transactionsDir, { recursive: true });
    }

    const fileName = `tx-${transaction.hash}.json`;
    const filePath = path.join(transactionsDir, fileName);

    try {
      const transactionData = {
        hash: transaction.hash,
        timestamp: transaction.timestamp,
        inputs: transaction.inputs,
        outputs: transaction.outputs,
        fee: transaction.fee,
        savedAt: Date.now()
      };

      fs.writeFileSync(filePath, JSON.stringify(transactionData, null, 2));
      console.log(`Transaction saved: ${fileName}`);
    } catch (error) {
      console.error('Error saving transaction to file:', error);
    }
  }

  /**
   * Lưu blockchain vào file system
   */
  saveToFile(): void {
    const blockchainDir = path.join(process.cwd(), 'data');
    
    if (!fs.existsSync(blockchainDir)) {
      fs.mkdirSync(blockchainDir, { recursive: true });
    }

    try {
      // Lưu blockchain data
      const blockchainData = {
        chain: this.chain,
        difficulty: this.difficulty,
        miningReward: this.miningReward,
        consensusType: this.consensusType,
        savedAt: Date.now()
      };

      const blockchainFile = path.join(blockchainDir, 'blockchain.json');
      fs.writeFileSync(blockchainFile, JSON.stringify(blockchainData, null, 2));

      // Lưu UTXO set
      const utxoArray = Array.from(this.utxoSet.entries());
      const utxoFile = path.join(blockchainDir, 'utxo.json');
      fs.writeFileSync(utxoFile, JSON.stringify(utxoArray, null, 2));

      console.log('Blockchain data saved to file system');
    } catch (error) {
      console.error('Error saving blockchain to file:', error);
    }
  }

  /**
   * Tải blockchain từ file system
   */
  loadFromFile(): boolean {
    const blockchainFile = path.join(process.cwd(), 'data', 'blockchain.json');
    const utxoFile = path.join(process.cwd(), 'data', 'utxo.json');
    let loaded = false;

    try {
      if (fs.existsSync(blockchainFile)) {
        const blockchainData = JSON.parse(fs.readFileSync(blockchainFile, 'utf8') as string);
        
        this.chain = blockchainData.chain;
        this.difficulty = blockchainData.difficulty;
        this.miningReward = blockchainData.miningReward;
        this.consensusType = blockchainData.consensusType;
        loaded = true;

        console.log(`Loaded blockchain with ${this.chain.length} blocks`);
      }

      if (fs.existsSync(utxoFile)) {
        const utxoArray = JSON.parse(fs.readFileSync(utxoFile, 'utf8') as string);
        this.utxoSet = new Map(utxoArray);
        
        console.log(`Loaded ${this.utxoSet.size} UTXOs`);
      }

      return loaded; // Chỉ return true nếu thực sự load được blockchain
    } catch (error) {
      console.error('Error loading blockchain from file:', error);
      return false;
    }
  }
}
