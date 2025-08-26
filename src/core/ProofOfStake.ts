import { Block } from './Block';
import { Transaction } from './Transaction';
import { Blockchain } from './Blockchain';

export interface Validator {
  address: string;
  stake: number;
  lastBlockTime: number;
  isActive: boolean;
}

export interface StakeInfo {
  address: string;
  amount: number;
  timestamp: number;
  lockPeriod: number; // in milliseconds
}

export class ProofOfStake {
  private validators: Map<string, Validator>;
  private stakes: Map<string, StakeInfo>;
  private minimumStake: number;
  private lockPeriod: number; // 24 hours in milliseconds
  private blockchain: Blockchain;

  constructor(blockchain: Blockchain) {
    this.validators = new Map();
    this.stakes = new Map();
    this.minimumStake = 100; // Minimum 100 MYC to become validator
    this.lockPeriod = 24 * 60 * 60 * 1000; // 24 hours
    this.blockchain = blockchain;
  }

  /**
   * Stake coins to become a validator
   */
  stake(address: string, amount: number): boolean {
    try {
      // Check if address has enough balance
      const balance = this.blockchain.getBalanceOfAddress(address);
      if (balance < amount) {
        throw new Error('Insufficient balance for staking');
      }

      if (amount < this.minimumStake) {
        throw new Error(`Minimum stake amount is ${this.minimumStake} MYC`);
      }

      // Create or update stake
      const existingStake = this.stakes.get(address);
      const totalStake = existingStake ? existingStake.amount + amount : amount;

      const stakeInfo: StakeInfo = {
        address,
        amount: totalStake,
        timestamp: Date.now(),
        lockPeriod: this.lockPeriod
      };

      this.stakes.set(address, stakeInfo);

      // Add or update validator
      const validator: Validator = {
        address,
        stake: totalStake,
        lastBlockTime: 0,
        isActive: true
      };

      this.validators.set(address, validator);

      console.log(`Address ${address} staked ${amount} MYC. Total stake: ${totalStake} MYC`);
      return true;
    } catch (error) {
      console.error('Staking error:', error);
      return false;
    }
  }

  /**
   * Unstake coins (with lock period check)
   */
  unstake(address: string, amount: number): boolean {
    try {
      const stakeInfo = this.stakes.get(address);
      if (!stakeInfo) {
        throw new Error('No stake found for this address');
      }

      // Check lock period
      const timeSinceStake = Date.now() - stakeInfo.timestamp;
      if (timeSinceStake < stakeInfo.lockPeriod) {
        const remainingTime = Math.ceil((stakeInfo.lockPeriod - timeSinceStake) / (60 * 60 * 1000));
        throw new Error(`Stake is locked for ${remainingTime} more hours`);
      }

      if (amount > stakeInfo.amount) {
        throw new Error('Cannot unstake more than staked amount');
      }

      // Update stake
      const newStakeAmount = stakeInfo.amount - amount;
      
      if (newStakeAmount < this.minimumStake) {
        // Remove validator if stake falls below minimum
        this.stakes.delete(address);
        this.validators.delete(address);
        console.log(`Address ${address} removed from validators (stake below minimum)`);
      } else {
        // Update stake and validator
        stakeInfo.amount = newStakeAmount;
        this.stakes.set(address, stakeInfo);
        
        const validator = this.validators.get(address);
        if (validator) {
          validator.stake = newStakeAmount;
          this.validators.set(address, validator);
        }
      }

      console.log(`Address ${address} unstaked ${amount} MYC`);
      return true;
    } catch (error) {
      console.error('Unstaking error:', error);
      return false;
    }
  }

  /**
   * Select validator for next block using weighted random selection
   */
  selectValidator(): string | null {
    const activeValidators = Array.from(this.validators.values()).filter(v => v.isActive);
    
    if (activeValidators.length === 0) {
      return null;
    }

    // Calculate total stake
    const totalStake = activeValidators.reduce((sum, validator) => sum + validator.stake, 0);
    
    // Weighted random selection
    let randomValue = Math.random() * totalStake;
    
    for (const validator of activeValidators) {
      randomValue -= validator.stake;
      if (randomValue <= 0) {
        return validator.address;
      }
    }

    // Fallback to first validator
    return activeValidators[0].address;
  }

  /**
   * Validate block using PoS rules
   */
  validateBlock(block: Block, validatorAddress: string): boolean {
    try {
      // Check if validator exists and is active
      const validator = this.validators.get(validatorAddress);
      if (!validator || !validator.isActive) {
        console.log('Invalid validator or validator not active');
        return false;
      }

      // Check if validator has sufficient stake
      if (validator.stake < this.minimumStake) {
        console.log('Validator stake below minimum');
        return false;
      }

      // Check time constraints (prevent validator from creating blocks too frequently)
      const timeSinceLastBlock = block.timestamp - validator.lastBlockTime;
      const minimumInterval = 10000; // 10 seconds minimum between blocks from same validator
      
      if (timeSinceLastBlock < minimumInterval) {
        console.log('Validator creating blocks too frequently');
        return false;
      }

      // Validate block structure and transactions
      if (!this.validateBlockStructure(block)) {
        console.log('Invalid block structure');
        return false;
      }

      return true;
    } catch (error) {
      console.error('Block validation error:', error);
      return false;
    }
  }

  /**
   * Validate block structure
   */
  private validateBlockStructure(block: Block): boolean {
    // Check if block has valid hash
    if (!block.hash || block.hash.length !== 64) {
      return false;
    }

    // Check if block has transactions
    if (!block.transactions || block.transactions.length === 0) {
      return false;
    }

    // Check if first transaction is coinbase
    const coinbaseTx = block.transactions[0];
    if (!coinbaseTx.inputs || coinbaseTx.inputs.length !== 1 || coinbaseTx.inputs[0].txHash !== '0'.repeat(64)) {
      return false;
    }

    return true;
  }

  /**
   * Create block using PoS (no mining required)
   */
  createBlock(validatorAddress: string, transactions: Transaction[], previousHash: string): Block | null {
    try {
      const validator = this.validators.get(validatorAddress);
      if (!validator || !validator.isActive) {
        throw new Error('Invalid validator');
      }

      // Create block without mining (PoS doesn't require computational work)
      const block = new Block(
        this.blockchain.chain.length,
        transactions,
        previousHash,
        1 // PoS uses difficulty 1 (no mining)
      );

      // Set timestamp
      block.timestamp = Date.now();
      
      // Calculate hash without mining
      block.hash = block.calculateHash();

      // Update validator's last block time
      validator.lastBlockTime = block.timestamp;
      this.validators.set(validatorAddress, validator);

      return block;
    } catch (error) {
      console.error('Block creation error:', error);
      return null;
    }
  }

  /**
   * Get validator information
   */
  getValidator(address: string): Validator | undefined {
    return this.validators.get(address);
  }

  /**
   * Get stake information
   */
  getStake(address: string): StakeInfo | undefined {
    return this.stakes.get(address);
  }

  /**
   * Get all validators
   */
  getAllValidators(): Validator[] {
    return Array.from(this.validators.values());
  }

  /**
   * Get all stakes
   */
  getAllStakes(): StakeInfo[] {
    return Array.from(this.stakes.values());
  }

  /**
   * Get PoS statistics
   */
  getStats() {
    const validators = this.getAllValidators();
    const stakes = this.getAllStakes();
    const totalStake = stakes.reduce((sum, stake) => sum + stake.amount, 0);
    const activeValidators = validators.filter(v => v.isActive);

    return {
      totalValidators: validators.length,
      activeValidators: activeValidators.length,
      totalStake,
      minimumStake: this.minimumStake,
      lockPeriod: this.lockPeriod,
      averageStake: validators.length > 0 ? totalStake / validators.length : 0
    };
  }

  /**
   * Slash validator for malicious behavior
   */
  slashValidator(address: string, slashAmount: number): boolean {
    try {
      const validator = this.validators.get(address);
      const stake = this.stakes.get(address);
      
      if (!validator || !stake) {
        return false;
      }

      // Reduce stake
      const newStakeAmount = Math.max(0, stake.amount - slashAmount);
      
      if (newStakeAmount < this.minimumStake) {
        // Remove validator
        this.validators.delete(address);
        this.stakes.delete(address);
        console.log(`Validator ${address} slashed and removed`);
      } else {
        // Update stake
        stake.amount = newStakeAmount;
        validator.stake = newStakeAmount;
        this.stakes.set(address, stake);
        this.validators.set(address, validator);
        console.log(`Validator ${address} slashed ${slashAmount} MYC`);
      }

      return true;
    } catch (error) {
      console.error('Slashing error:', error);
      return false;
    }
  }
}
