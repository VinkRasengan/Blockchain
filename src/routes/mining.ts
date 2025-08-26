import { Router, Request, Response } from 'express';
import { MyCoinNode } from '../core/MyCoinNode';
import { ConsensusType } from '../core/Blockchain';

// Utility function to get error message
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

// Utility function to validate wallet address
function isValidAddress(address: string): boolean {
  if (!address || address.length < 25 || address.length > 40) {
    return false;
  }
  
  // Basic validation for Base58 characters
  const base58Regex = /^[123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]+$/;
  return base58Regex.test(address);
}

export function miningRoutes(node: MyCoinNode): Router {
  const router = Router();

  /**
   * Bắt đầu mining
   * POST /api/mining/start
   */
  router.post('/start', (req: Request, res: Response) => {
    try {
      const { minerAddress } = req.body;

      if (!minerAddress) {
        return res.status(400).json({
          success: false,
          error: 'Miner address is required'
        });
      }

      // Validate miner address
      if (!isValidAddress(minerAddress)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid miner address format'
        });
      }

      const blockchain = node.getBlockchain();
      
      // Kiểm tra có pending transactions không
      if (blockchain.pendingTransactions.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No pending transactions to mine'
        });
      }

      try {
        // Bắt đầu mining
        const newBlock = blockchain.minePendingTransactions(minerAddress);
        
        // Broadcast block mới đến network
        node.getP2PNetwork().broadcastNewBlock(newBlock);

        res.json({
          success: true,
          message: 'Block mined successfully',
          block: {
            index: newBlock.index,
            hash: newBlock.hash,
            previousHash: newBlock.previousHash,
            timestamp: newBlock.timestamp,
            nonce: newBlock.nonce,
            difficulty: newBlock.difficulty,
            transactions: newBlock.transactions.length,
            minerAddress: minerAddress,
            reward: blockchain.miningReward
          }
        });
      } catch (miningError) {
        res.status(500).json({
          success: false,
          error: 'Mining failed',
          message: getErrorMessage(miningError)
        });
      }
    } catch (error) {
      console.error('Error starting mining:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to start mining',
        message: getErrorMessage(error)
      });
    }
  });

  /**
   * Dừng mining
   * POST /api/mining/stop
   */
  router.post('/stop', (req: Request, res: Response) => {
    try {
      // Note: Trong implementation đơn giản này, chúng ta chỉ trả về success
      // Trong thực tế, bạn có thể cần implement mining worker threads
      res.json({
        success: true,
        message: 'Mining stopped successfully'
      });
    } catch (error) {
      console.error('Error stopping mining:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to stop mining',
        message: getErrorMessage(error)
      });
    }
  });

  /**
   * Lấy thông tin mining
   * GET /api/mining/info
   */
  router.get('/info', (req: Request, res: Response) => {
    try {
      const blockchain = node.getBlockchain();

      res.json({
        success: true,
        info: {
          difficulty: blockchain.difficulty,
          miningReward: blockchain.miningReward,
          pendingTransactions: blockchain.pendingTransactions.length,
          estimatedTime: blockchain.getEstimatedMiningTime(),
          networkHashRate: blockchain.getNetworkHashRate(),
          targetBlockTime: 10000, // 10 seconds
          averageBlockTime: blockchain.getAverageBlockTime()
        }
      });
    } catch (error) {
      console.error('Error getting mining info:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get mining information',
        message: getErrorMessage(error)
      });
    }
  });

  /**
   * Lấy trạng thái mining
   * GET /api/mining/status
   */
  router.get('/status', (req: Request, res: Response) => {
    try {
      const blockchain = node.getBlockchain();
      const latestBlock = blockchain.getLatestBlock();

      res.json({
        success: true,
        mining: {
          difficulty: blockchain.difficulty,
          miningReward: blockchain.miningReward,
          pendingTransactions: blockchain.pendingTransactions.length,
          latestBlock: {
            index: latestBlock.index,
            hash: latestBlock.hash,
            timestamp: latestBlock.timestamp,
            nonce: latestBlock.nonce
          },
          estimatedMiningTime: blockchain.getEstimatedMiningTime(),
          networkHashRate: blockchain.getNetworkHashRate()
        }
      });
    } catch (error) {
      console.error('Error getting mining status:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get mining status',
        message: getErrorMessage(error)
      });
    }
  });

  /**
   * Lấy thông tin difficulty
   * GET /api/mining/difficulty
   */
  router.get('/difficulty', (req: Request, res: Response) => {
    try {
      const blockchain = node.getBlockchain();

      res.json({
        success: true,
        difficulty: {
          current: blockchain.difficulty,
          target: '0'.repeat(blockchain.difficulty),
          adjustmentInterval: 10, // blocks
          targetBlockTime: 10000, // 10 seconds in milliseconds
          averageBlockTime: blockchain.getAverageBlockTime()
        }
      });
    } catch (error) {
      console.error('Error getting difficulty:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get difficulty information',
        message: getErrorMessage(error)
      });
    }
  });

  /**
   * Adjust difficulty (admin function)
   * POST /api/mining/difficulty/adjust
   */
  router.post('/difficulty/adjust', (req: Request, res: Response) => {
    try {
      const { newDifficulty } = req.body;

      if (!newDifficulty || newDifficulty < 1 || newDifficulty > 10) {
        return res.status(400).json({
          success: false,
          error: 'Invalid difficulty. Must be between 1 and 10'
        });
      }

      const blockchain = node.getBlockchain();
      const oldDifficulty = blockchain.difficulty;
      blockchain.difficulty = newDifficulty;

      res.json({
        success: true,
        message: 'Difficulty adjusted successfully',
        difficulty: {
          old: oldDifficulty,
          new: newDifficulty
        }
      });
    } catch (error) {
      console.error('Error adjusting difficulty:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to adjust difficulty',
        message: getErrorMessage(error)
      });
    }
  });

  /**
   * Lấy mining statistics
   * GET /api/mining/stats
   */
  router.get('/stats', (req: Request, res: Response) => {
    try {
      const blockchain = node.getBlockchain();
      const stats = blockchain.getStats();

      // Tính toán thêm mining stats
      const totalBlocks = blockchain.chain.length;
      const totalRewards = (totalBlocks - 1) * blockchain.miningReward; // Trừ genesis block
      
      // Tính average mining time
      let totalMiningTime = 0;
      for (let i = 1; i < blockchain.chain.length; i++) {
        totalMiningTime += blockchain.chain[i].timestamp - blockchain.chain[i - 1].timestamp;
      }
      const averageMiningTime = totalBlocks > 1 ? totalMiningTime / (totalBlocks - 1) : 0;

      res.json({
        success: true,
        stats: {
          ...stats,
          mining: {
            totalBlocks: totalBlocks,
            totalRewards: totalRewards,
            averageMiningTime: averageMiningTime,
            difficulty: blockchain.difficulty,
            miningReward: blockchain.miningReward,
            pendingTransactions: blockchain.pendingTransactions.length,
            estimatedNextBlockTime: blockchain.getEstimatedMiningTime()
          }
        }
      });
    } catch (error) {
      console.error('Error getting mining stats:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get mining statistics',
        message: getErrorMessage(error)
      });
    }
  });

  /**
   * Lấy mining history
   * GET /api/mining/history
   */
  router.get('/history', (req: Request, res: Response) => {
    try {
      const { page = 1, limit = 10, minerAddress } = req.query;
      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);

      if (pageNum < 1 || limitNum < 1 || limitNum > 100) {
        return res.status(400).json({
          success: false,
          error: 'Invalid pagination parameters'
        });
      }

      const blockchain = node.getBlockchain();
      let blocks = blockchain.chain.slice(1); // Bỏ genesis block

      // Filter by miner address if provided
      if (minerAddress) {
        blocks = blocks.filter(block => {
          // Tìm coinbase transaction (transaction đầu tiên)
          const coinbaseTx = block.transactions[0];
          return coinbaseTx && coinbaseTx.outputs.some(output => output.address === minerAddress);
        });
      }

      // Sort by newest first
      blocks.reverse();

      // Pagination
      const startIndex = (pageNum - 1) * limitNum;
      const endIndex = startIndex + limitNum;
      const paginatedBlocks = blocks.slice(startIndex, endIndex);

      const formattedBlocks = paginatedBlocks.map(block => {
        const coinbaseTx = block.transactions[0];
        const minerAddr = coinbaseTx ? coinbaseTx.outputs[0]?.address : 'Unknown';
        const reward = coinbaseTx ? coinbaseTx.outputs[0]?.amount : 0;

        return {
          index: block.index,
          hash: block.hash,
          timestamp: block.timestamp,
          nonce: block.nonce,
          difficulty: block.difficulty,
          transactions: block.transactions.length,
          minerAddress: minerAddr,
          reward: reward,
          miningTime: block.index > 0 ? 
            block.timestamp - blockchain.chain[block.index - 1].timestamp : 0
        };
      });

      res.json({
        success: true,
        blocks: formattedBlocks,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: blocks.length,
          totalPages: Math.ceil(blocks.length / limitNum)
        }
      });
    } catch (error) {
      console.error('Error getting mining history:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get mining history',
        message: getErrorMessage(error)
      });
    }
  });

  /**
   * Stake coins để trở thành validator (PoS)
   * POST /api/mining/stake
   */
  router.post('/stake', (req: Request, res: Response) => {
    try {
      const { address, amount } = req.body;

      if (!address || !amount) {
        return res.status(400).json({
          success: false,
          error: 'Address and amount are required'
        });
      }

      if (!isValidAddress(address)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid address format'
        });
      }

      if (amount <= 0) {
        return res.status(400).json({
          success: false,
          error: 'Amount must be greater than 0'
        });
      }

      const blockchain = node.getBlockchain();

      if (blockchain.consensusType !== ConsensusType.PROOF_OF_STAKE) {
        return res.status(400).json({
          success: false,
          error: 'Staking is only available in Proof of Stake mode'
        });
      }

      const success = blockchain.stakeCoins(address, amount);

      if (success) {
        res.json({
          success: true,
          message: 'Coins staked successfully',
          stake: {
            address,
            amount,
            timestamp: Date.now()
          }
        });
      } else {
        res.status(400).json({
          success: false,
          error: 'Failed to stake coins'
        });
      }
    } catch (error) {
      console.error('Error staking coins:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to stake coins',
        message: getErrorMessage(error)
      });
    }
  });

  /**
   * Unstake coins (PoS)
   * POST /api/mining/unstake
   */
  router.post('/unstake', (req: Request, res: Response) => {
    try {
      const { address, amount } = req.body;

      if (!address || !amount) {
        return res.status(400).json({
          success: false,
          error: 'Address and amount are required'
        });
      }

      if (!isValidAddress(address)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid address format'
        });
      }

      if (amount <= 0) {
        return res.status(400).json({
          success: false,
          error: 'Amount must be greater than 0'
        });
      }

      const blockchain = node.getBlockchain();

      if (blockchain.consensusType !== ConsensusType.PROOF_OF_STAKE) {
        return res.status(400).json({
          success: false,
          error: 'Unstaking is only available in Proof of Stake mode'
        });
      }

      const success = blockchain.unstakeCoins(address, amount);

      if (success) {
        res.json({
          success: true,
          message: 'Coins unstaked successfully',
          unstake: {
            address,
            amount,
            timestamp: Date.now()
          }
        });
      } else {
        res.status(400).json({
          success: false,
          error: 'Failed to unstake coins'
        });
      }
    } catch (error) {
      console.error('Error unstaking coins:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to unstake coins',
        message: getErrorMessage(error)
      });
    }
  });

  /**
   * Tạo block sử dụng PoS
   * POST /api/mining/create-block-pos
   */
  router.post('/create-block-pos', (req: Request, res: Response) => {
    try {
      const { validatorAddress } = req.body;

      const blockchain = node.getBlockchain();

      if (blockchain.consensusType !== ConsensusType.PROOF_OF_STAKE) {
        return res.status(400).json({
          success: false,
          error: 'PoS block creation is only available in Proof of Stake mode'
        });
      }

      if (blockchain.pendingTransactions.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No pending transactions to include in block'
        });
      }

      const newBlock = blockchain.createBlockPoS(validatorAddress);

      if (newBlock) {
        // Broadcast block mới đến network
        node.getP2PNetwork().broadcastNewBlock(newBlock);

        res.json({
          success: true,
          message: 'Block created successfully using PoS',
          block: {
            index: newBlock.index,
            hash: newBlock.hash,
            previousHash: newBlock.previousHash,
            timestamp: newBlock.timestamp,
            transactions: newBlock.transactions.length,
            validatorAddress: validatorAddress
          }
        });
      } else {
        res.status(400).json({
          success: false,
          error: 'Failed to create block using PoS'
        });
      }
    } catch (error) {
      console.error('Error creating PoS block:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create PoS block',
        message: getErrorMessage(error)
      });
    }
  });

  /**
   * Lấy thông tin validators (PoS)
   * GET /api/mining/validators
   */
  router.get('/validators', (req: Request, res: Response) => {
    try {
      const blockchain = node.getBlockchain();

      if (blockchain.consensusType !== ConsensusType.PROOF_OF_STAKE) {
        return res.status(400).json({
          success: false,
          error: 'Validators are only available in Proof of Stake mode'
        });
      }

      const validators = blockchain.proofOfStake.getAllValidators();
      const stakes = blockchain.proofOfStake.getAllStakes();
      const posStats = blockchain.proofOfStake.getStats();

      res.json({
        success: true,
        validators: validators,
        stakes: stakes,
        stats: posStats
      });
    } catch (error) {
      console.error('Error getting validators:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get validators information',
        message: getErrorMessage(error)
      });
    }
  });

  /**
   * Chuyển đổi consensus type
   * POST /api/mining/consensus/switch
   */
  router.post('/consensus/switch', (req: Request, res: Response) => {
    try {
      const { consensusType } = req.body;

      if (!consensusType || !Object.values(ConsensusType).includes(consensusType)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid consensus type. Must be POW or POS'
        });
      }

      const blockchain = node.getBlockchain();
      const oldType = blockchain.consensusType;

      blockchain.switchConsensusType(consensusType);

      res.json({
        success: true,
        message: 'Consensus type switched successfully',
        consensus: {
          old: oldType,
          new: consensusType
        }
      });
    } catch (error) {
      console.error('Error switching consensus type:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to switch consensus type',
        message: getErrorMessage(error)
      });
    }
  });

  return router;
}

