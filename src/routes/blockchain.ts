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

  return router;
}
