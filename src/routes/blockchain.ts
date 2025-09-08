import { Router, Request, Response } from 'express';
import { MyCoinNode } from '../core/MyCoinNode';

// Utility function to get error message
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

export function blockchainRoutes(node: MyCoinNode): Router {
  const router = Router();

  /**
   * Lấy thông tin blockchain
   * GET /api/blockchain/info
   */
  router.get('/info', (req: Request, res: Response) => {
    try {
      const blockchain = node.getBlockchain();
      
      if (blockchain.chain.length === 0) {
        return res.json({
          success: true,
          blockchain: {
            totalBlocks: 0,
            latestBlock: null,
            difficulty: blockchain.difficulty,
            miningReward: blockchain.miningReward,
            pendingTransactions: blockchain.pendingTransactions.length
          }
        });
      }

      const latestBlock = blockchain.getLatestBlock();

      res.json({
        success: true,
        blockchain: {
          totalBlocks: blockchain.chain.length,
          latestBlock: {
            index: latestBlock.index,
            hash: latestBlock.hash,
            timestamp: latestBlock.timestamp,
            transactions: latestBlock.transactions.length
          },
          difficulty: blockchain.difficulty,
          miningReward: blockchain.miningReward,
          pendingTransactions: blockchain.pendingTransactions.length
        }
      });
    } catch (error) {
      console.error('Error getting blockchain info:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get blockchain information',
        message: getErrorMessage(error)
      });
    }
  });

  /**
   * Lấy thống kê blockchain
   * GET /api/blockchain/stats
   */
  router.get('/stats', (req: Request, res: Response) => {
    try {
      const blockchain = node.getBlockchain();
      const stats = blockchain.getStats();

      res.json({
        success: true,
        stats: stats
      });
    } catch (error) {
      console.error('Error getting blockchain stats:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get blockchain statistics',
        message: getErrorMessage(error)
      });
    }
  });

  /**
   * Lấy danh sách blocks
   * GET /api/blockchain/blocks
   */
  router.get('/blocks', (req: Request, res: Response) => {
    try {
      const { page = 1, limit = 10 } = req.query;
      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);

      if (pageNum < 1 || limitNum < 1 || limitNum > 100) {
        return res.status(400).json({
          success: false,
          error: 'Invalid pagination parameters'
        });
      }

      const blockchain = node.getBlockchain();
      const totalBlocks = blockchain.chain.length;

      // Lấy blocks theo thứ tự mới nhất trước
      const startIndex = Math.max(0, totalBlocks - (pageNum * limitNum));
      const endIndex = Math.max(0, totalBlocks - ((pageNum - 1) * limitNum));
      
      const blocks = blockchain.chain
        .slice(startIndex, endIndex)
        .reverse()
        .map(block => ({
          index: block.index,
          hash: block.hash,
          previousHash: block.previousHash,
          timestamp: block.timestamp,
          transactions: block.transactions.length,
          nonce: block.nonce,
          difficulty: block.difficulty
        }));

      res.json({
        success: true,
        blocks: blocks,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: totalBlocks,
          totalPages: Math.ceil(totalBlocks / limitNum)
        }
      });
    } catch (error) {
      console.error('Error getting blocks:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get blocks',
        message: getErrorMessage(error)
      });
    }
  });

  /**
   * Lấy chi tiết block
   * GET /api/blockchain/block/:identifier
   */
  router.get('/block/:identifier', (req: Request, res: Response) => {
    try {
      const { identifier } = req.params;
      const blockchain = node.getBlockchain();

      let block;

      // Tìm theo index hoặc hash
      if (/^\d+$/.test(identifier)) {
        // Tìm theo index
        const index = parseInt(identifier);
        block = blockchain.chain.find(b => b.index === index);
      } else {
        // Tìm theo hash
        block = blockchain.chain.find(b => b.hash === identifier);
      }

      if (!block) {
        return res.status(404).json({
          success: false,
          error: 'Block not found'
        });
      }

      // Format transactions
      const formattedTransactions = block.transactions.map(tx => ({
        hash: tx.hash,
        inputs: tx.inputs,
        outputs: tx.outputs,
        fee: tx.fee,
        timestamp: tx.timestamp
      }));

      res.json({
        success: true,
        block: {
          index: block.index,
          hash: block.hash,
          previousHash: block.previousHash,
          timestamp: block.timestamp,
          nonce: block.nonce,
          difficulty: block.difficulty,
          transactions: formattedTransactions,
          transactionCount: formattedTransactions.length
        }
      });
    } catch (error) {
      console.error('Error getting block:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get block',
        message: getErrorMessage(error)
      });
    }
  });

  /**
   * Validate blockchain
   * GET /api/blockchain/validate
   */
  router.get('/validate', (req: Request, res: Response) => {
    try {
      const blockchain = node.getBlockchain();
      const isValid = blockchain.isChainValid();

      res.json({
        success: true,
        isValid: isValid,
        message: isValid ? 'Blockchain is valid' : 'Blockchain is invalid'
      });
    } catch (error) {
      console.error('Error validating blockchain:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to validate blockchain',
        message: getErrorMessage(error)
      });
    }
  });

  /**
   * Lấy UTXO set
   * GET /api/blockchain/utxos
   */
  router.get('/utxos', (req: Request, res: Response) => {
    try {
      const { address } = req.query;
      const blockchain = node.getBlockchain();

      if (address) {
        // Lấy UTXO của một địa chỉ cụ thể
        const utxos = blockchain.getUTXOsForAddress(address as string);
        res.json({
          success: true,
          address: address,
          utxos: utxos,
          totalAmount: utxos.reduce((sum, utxo) => sum + utxo.amount, 0)
        });
      } else {
        // Lấy toàn bộ UTXO set (có thể rất lớn)
        const allUTXOs = blockchain.getAllUTXOs();
        res.json({
          success: true,
          utxos: allUTXOs,
          totalCount: allUTXOs.length,
          totalAmount: allUTXOs.reduce((sum, utxo) => sum + utxo.amount, 0)
        });
      }
    } catch (error) {
      console.error('Error getting UTXOs:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get UTXOs',
        message: getErrorMessage(error)
      });
    }
  });

  /**
   * Lấy thông tin difficulty
   * GET /api/blockchain/difficulty
   */
  router.get('/difficulty', (req: Request, res: Response) => {
    try {
      const blockchain = node.getBlockchain();

      res.json({
        success: true,
        difficulty: blockchain.difficulty,
        miningReward: blockchain.miningReward,
        targetBlockTime: 10000, // 10 seconds in milliseconds
        averageBlockTime: blockchain.getAverageBlockTime()
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
   * Lấy danh sách giao dịch mới nhất
   * GET /api/blockchain/transactions/latest
   */
  router.get('/transactions/latest', (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const blockchain = node.getBlockchain();
      
      const allTransactions: any[] = [];

      // Collect all transactions from blocks (reverse order for latest first)
      for (let i = blockchain.chain.length - 1; i >= 0 && allTransactions.length < limit; i--) {
        const block = blockchain.chain[i];
        for (const tx of block.transactions) {
          if (allTransactions.length < limit) {
            allTransactions.push({
              hash: tx.hash,
              timestamp: tx.timestamp,
              inputs: tx.inputs,
              outputs: tx.outputs,
              fee: tx.fee,
              blockIndex: block.index,
              confirmations: blockchain.chain.length - block.index
            });
          }
        }
      }

      res.json({
        success: true,
        transactions: allTransactions.slice(0, limit)
      });
    } catch (error) {
      console.error('Error getting latest transactions:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get latest transactions',
        message: getErrorMessage(error)
      });
    }
  });

  /**
   * Search trong blockchain
   * GET /api/blockchain/search
   */
  router.get('/search', (req: Request, res: Response) => {
    try {
      const query = req.query.q as string;
      
      if (!query) {
        return res.status(400).json({
          success: false,
          error: 'Search query is required'
        });
      }

      const blockchain = node.getBlockchain();
      const results: any[] = [];

      // Search by block index
      if (/^\d+$/.test(query)) {
        const blockIndex = parseInt(query);
        const block = blockchain.chain.find(b => b.index === blockIndex);
        if (block) {
          results.push({
            type: 'block',
            data: {
              index: block.index,
              hash: block.hash,
              timestamp: block.timestamp,
              transactions: block.transactions.length
            }
          });
        }
      }

      // Search by hash (block or transaction)
      if (query.length === 64) {
        // Check for block hash
        const block = blockchain.chain.find(b => b.hash === query);
        if (block) {
          results.push({
            type: 'block',
            data: block
          });
        }

        // Check for transaction hash
        const transaction = blockchain.getTransactionByHash(query);
        if (transaction) {
          results.push({
            type: 'transaction',
            data: transaction
          });
        }
      }

      // Search by address
      if (query.length >= 26 && query.length <= 35) {
        const balance = blockchain.getBalance(query);
        const transactions = blockchain.getTransactionHistory(query);
        
        results.push({
          type: 'address',
          data: {
            address: query,
            balance: balance,
            transactionCount: transactions.length,
            transactions: transactions.slice(0, 10)
          }
        });
      }

      res.json({
        success: true,
        query: query,
        results: results
      });

    } catch (error) {
      console.error('Error searching blockchain:', error);
      res.status(500).json({
        success: false,
        error: 'Search failed',
        message: getErrorMessage(error)
      });
    }
  });

  /**
   * Lấy thống kê chi tiết của mạng
   * GET /api/blockchain/network-stats
   */
  router.get('/network-stats', (req: Request, res: Response) => {
    try {
      const blockchain = node.getBlockchain();
      const p2pNetwork = node.getP2PNetwork();

      // Tính toán thống kê chi tiết
      const blocks = blockchain.chain;
      const totalTransactions = blocks.reduce((sum, block) => sum + block.transactions.length, 0);
      const avgBlockTime = blocks.length > 1 ?
        (blocks[blocks.length - 1].timestamp - blocks[1].timestamp) / (blocks.length - 1) / 1000 : 0;

      // Thống kê giao dịch theo thời gian
      const last24Hours = Date.now() - (24 * 60 * 60 * 1000);
      const recentBlocks = blocks.filter(block => block.timestamp > last24Hours);
      const recentTransactions = recentBlocks.reduce((sum, block) => sum + block.transactions.length, 0);

      const stats = {
        blockchain: {
          totalBlocks: blocks.length,
          totalTransactions: totalTransactions,
          difficulty: blockchain.difficulty,
          miningReward: blockchain.miningReward,
          pendingTransactions: blockchain.pendingTransactions.length,
          avgBlockTime: Math.round(avgBlockTime),
          last24hBlocks: recentBlocks.length,
          last24hTransactions: recentTransactions
        },
        network: {
          connectedPeers: p2pNetwork.getPeers().length,
          networkHashrate: blockchain.difficulty * Math.pow(2, 32) / avgBlockTime,
          nodeUptime: process.uptime()
        },
        performance: {
          memoryUsage: process.memoryUsage(),
          cpuUsage: process.cpuUsage()
        }
      };

      res.json({
        success: true,
        stats: stats,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to get network statistics',
        message: getErrorMessage(error)
      });
    }
  });

  /**
   * Lấy lịch sử blocks gần đây
   * GET /api/blockchain/recent-blocks
   */
  router.get('/recent-blocks', (req: Request, res: Response) => {
    try {
      const { limit = 10 } = req.query;
      const blockchain = node.getBlockchain();

      const recentBlocks = blockchain.chain
        .slice(-Number(limit))
        .reverse()
        .map(block => ({
          index: block.index,
          hash: block.hash,
          timestamp: block.timestamp,
          transactionCount: block.transactions.length,
          difficulty: block.difficulty,
          nonce: block.nonce,
          size: JSON.stringify(block).length
        }));

      res.json({
        success: true,
        blocks: recentBlocks,
        total: blockchain.chain.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to get recent blocks',
        message: getErrorMessage(error)
      });
    }
  });

  /**
   * Validate địa chỉ ví
   * POST /api/blockchain/validate-address
   */
  router.post('/validate-address', (req: Request, res: Response) => {
    try {
      const { address } = req.body;

      if (!address) {
        return res.status(400).json({
          success: false,
          error: 'Address is required'
        });
      }

      // Basic validation - trong thực tế sẽ có validation phức tạp hơn
      const isValid = typeof address === 'string' &&
                     address.length >= 26 &&
                     address.length <= 35 &&
                     /^[123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]+$/.test(address);

      const blockchain = node.getBlockchain();
      const balance = isValid ? blockchain.getBalance(address) : 0;
      const hasTransactions = isValid ? blockchain.getTransactionHistory(address).length > 0 : false;

      res.json({
        success: true,
        address: address,
        isValid: isValid,
        balance: balance,
        hasTransactions: hasTransactions
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to validate address',
        message: getErrorMessage(error)
      });
    }
  });

  return router;
}
