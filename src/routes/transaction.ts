import { Router, Request, Response } from 'express';
import { MyCoinNode } from '../core/MyCoinNode';
import { Wallet } from '../core/Wallet';
import { Transaction } from '../core/Transaction';

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

export function transactionRoutes(node: MyCoinNode): Router {
  const router = Router();

  /**
   * Gửi giao dịch
   * POST /api/transaction/send
   */
  router.post('/send', (req: Request, res: Response) => {
    try {
      const { 
        fromAddress, 
        toAddress, 
        amount, 
        fee = 1, 
        privateKey 
      } = req.body;

      // Validation
      if (!fromAddress || !toAddress || !amount || !privateKey) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: fromAddress, toAddress, amount, privateKey'
        });
      }

      if (amount <= 0) {
        return res.status(400).json({
          success: false,
          error: 'Amount must be greater than 0'
        });
      }

      if (fee < 0) {
        return res.status(400).json({
          success: false,
          error: 'Fee cannot be negative'
        });
      }

      // Validate addresses
      if (!isValidAddress(fromAddress) || !isValidAddress(toAddress)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid address format'
        });
      }

      // Tạo wallet từ private key
      const wallet = new Wallet(privateKey);
      
      // Kiểm tra địa chỉ gửi có khớp với private key không
      if (wallet.address !== fromAddress) {
        return res.status(400).json({
          success: false,
          error: 'Private key does not match sender address'
        });
      }

      // Kiểm tra số dư
      const balance = wallet.getBalance(node.getBlockchain());
      if (balance < amount + fee) {
        return res.status(400).json({
          success: false,
          error: `Insufficient balance. Available: ${balance}, Required: ${amount + fee}`
        });
      }

      // Tạo và gửi giao dịch
      const success = wallet.sendTransaction(
        toAddress,
        amount,
        node.getBlockchain(),
        fee
      );

      if (success) {
        // Lấy giao dịch vừa tạo (giao dịch cuối cùng trong pending)
        const pendingTransactions = node.getBlockchain().pendingTransactions;
        const transaction = pendingTransactions[pendingTransactions.length - 1];

        res.json({
          success: true,
          message: 'Transaction sent successfully',
          transaction: {
            hash: transaction.hash,
            from: fromAddress,
            to: toAddress,
            amount: amount,
            fee: fee,
            timestamp: transaction.timestamp,
            status: 'pending'
          }
        });
      } else {
        res.status(400).json({
          success: false,
          error: 'Failed to create transaction'
        });
      }
    } catch (error) {
      console.error('Error sending transaction:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to send transaction',
        message: getErrorMessage(error)
      });
    }
  });

  /**
   * Lấy chi tiết giao dịch
   * GET /api/transaction/:hash
   */
  router.get('/:hash', (req: Request, res: Response) => {
    try {
      const { hash } = req.params;

      if (!hash) {
        return res.status(400).json({
          success: false,
          error: 'Transaction hash is required'
        });
      }

      const blockchain = node.getBlockchain();
      
      // Tìm trong pending transactions
      const pendingTx = blockchain.pendingTransactions.find(tx => tx.hash === hash);
      if (pendingTx) {
        return res.json({
          success: true,
          transaction: {
            hash: pendingTx.hash,
            inputs: pendingTx.inputs,
            outputs: pendingTx.outputs,
            fee: pendingTx.fee,
            timestamp: pendingTx.timestamp,
            status: 'pending',
            confirmations: 0,
            blockNumber: null
          }
        });
      }

      // Tìm trong blockchain
      for (let i = blockchain.chain.length - 1; i >= 0; i--) {
        const block = blockchain.chain[i];
        const transaction = block.transactions.find(tx => tx.hash === hash);
        
        if (transaction) {
          const confirmations = blockchain.chain.length - i;
          return res.json({
            success: true,
            transaction: {
              hash: transaction.hash,
              inputs: transaction.inputs,
              outputs: transaction.outputs,
              fee: transaction.fee,
              timestamp: transaction.timestamp,
              status: 'confirmed',
              confirmations: confirmations,
              blockNumber: block.index,
              blockHash: block.hash
            }
          });
        }
      }

      res.status(404).json({
        success: false,
        error: 'Transaction not found'
      });
    } catch (error) {
      console.error('Error getting transaction:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get transaction',
        message: getErrorMessage(error)
      });
    }
  });

  /**
   * Lấy lịch sử giao dịch của địa chỉ
   * GET /api/transaction/history/:address
   */
  router.get('/history/:address', (req: Request, res: Response) => {
    try {
      const { address } = req.params;
      const { page = 1, limit = 10, type = 'all' } = req.query;

      if (!isValidAddress(address)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid address format'
        });
      }

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      
      if (pageNum < 1 || limitNum < 1 || limitNum > 100) {
        return res.status(400).json({
          success: false,
          error: 'Invalid pagination parameters'
        });
      }

      const blockchain = node.getBlockchain();
      const transactions: any[] = [];

      // Lấy từ pending transactions
      blockchain.pendingTransactions.forEach(tx => {
        const isInvolved = tx.inputs.some(input => {
          // Cần tìm UTXO để biết address của input
          const utxo = blockchain.getUTXOsForAddress(address).find(u => 
            u.txHash === input.txHash && u.outputIndex === input.outputIndex
          );
          return utxo !== undefined;
        }) || tx.outputs.some(output => output.address === address);

        if (isInvolved) {
          const txType = tx.outputs.some(output => output.address === address) ? 'received' : 'sent';
          
          if (type === 'all' || type === txType) {
            transactions.push({
              hash: tx.hash,
              type: txType,
              amount: tx.outputs
                .filter(output => output.address === address)
                .reduce((sum, output) => sum + output.amount, 0),
              fee: tx.fee,
              timestamp: tx.timestamp,
              status: 'pending',
              confirmations: 0,
              blockNumber: null
            });
          }
        }
      });

      // Lấy từ blockchain
      for (let i = blockchain.chain.length - 1; i >= 0; i--) {
        const block = blockchain.chain[i];
        
        block.transactions.forEach(tx => {
          const isInvolved = tx.inputs.some(input => {
            const utxo = blockchain.getUTXOsForAddress(address).find(u => 
              u.txHash === input.txHash && u.outputIndex === input.outputIndex
            );
            return utxo !== undefined;
          }) || tx.outputs.some(output => output.address === address);

          if (isInvolved) {
            const txType = tx.outputs.some(output => output.address === address) ? 'received' : 'sent';
            
            if (type === 'all' || type === txType) {
              const confirmations = blockchain.chain.length - i;
              transactions.push({
                hash: tx.hash,
                type: txType,
                amount: tx.outputs
                  .filter(output => output.address === address)
                  .reduce((sum, output) => sum + output.amount, 0),
                fee: tx.fee,
                timestamp: tx.timestamp,
                status: 'confirmed',
                confirmations: confirmations,
                blockNumber: block.index,
                blockHash: block.hash
              });
            }
          }
        });
      }

      // Sort by timestamp (newest first)
      transactions.sort((a, b) => b.timestamp - a.timestamp);

      // Pagination
      const startIndex = (pageNum - 1) * limitNum;
      const endIndex = startIndex + limitNum;
      const paginatedTransactions = transactions.slice(startIndex, endIndex);

      res.json({
        success: true,
        address: address,
        transactions: paginatedTransactions,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: transactions.length,
          totalPages: Math.ceil(transactions.length / limitNum)
        }
      });
    } catch (error) {
      console.error('Error getting transaction history:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get transaction history',
        message: getErrorMessage(error)
      });
    }
  });

  /**
   * Lấy danh sách pending transactions
   * GET /api/transaction/pending
   */
  router.get('/pending', (req: Request, res: Response) => {
    try {
      const pendingTransactions = node.getBlockchain().pendingTransactions;

      const formattedTransactions = pendingTransactions.map(tx => ({
        hash: tx.hash,
        inputs: tx.inputs,
        outputs: tx.outputs,
        fee: tx.fee,
        timestamp: tx.timestamp,
        status: 'pending'
      }));

      res.json({
        success: true,
        transactions: formattedTransactions,
        count: formattedTransactions.length
      });
    } catch (error) {
      console.error('Error getting pending transactions:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get pending transactions',
        message: getErrorMessage(error)
      });
    }
  });

  /**
   * Lấy danh sách giao dịch mới nhất
   * GET /api/transactions/latest
   */
  router.get('/latest', (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 15;
      const blockchain = node.getBlockchain();
      
      const allTransactions: any[] = [];

      // Get from pending transactions first
      blockchain.pendingTransactions.forEach(tx => {
        allTransactions.push({
          hash: tx.hash,
          timestamp: tx.timestamp,
          inputs: tx.inputs,
          outputs: tx.outputs,
          fee: tx.fee,
          status: 'pending',
          confirmations: 0,
          blockIndex: null
        });
      });

      // Then get from confirmed blocks (reverse order for latest first)
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
              status: 'confirmed',
              confirmations: blockchain.chain.length - block.index,
              blockIndex: block.index
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
   * Lấy danh sách transactions của một address
   * GET /api/transactions/:address
   */
  router.get('/:address', (req: Request, res: Response) => {
    try {
      const { address } = req.params;
      const { page = '1', limit = '10' } = req.query;

      // Validate address
      if (!isValidAddress(address)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid wallet address format'
        });
      }

      const blockchain = node.getBlockchain();
      
      // Get transaction history for the address
      const transactions = blockchain.getTransactionHistory(address);
      
      // Pagination
      const pageNum = Math.max(1, parseInt(page as string, 10));
      const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10)));
      const startIndex = (pageNum - 1) * limitNum;
      const endIndex = startIndex + limitNum;
      
      const paginatedTransactions = transactions.slice(startIndex, endIndex);
      
      res.json({
        success: true,
        address: address,
        transactions: paginatedTransactions,
        pagination: {
          currentPage: pageNum,
          totalTransactions: transactions.length,
          totalPages: Math.ceil(transactions.length / limitNum),
          limit: limitNum
        }
      });

    } catch (error) {
      console.error('Error getting transactions for address:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get transactions for address',
        message: getErrorMessage(error)
      });
    }
  });

  return router;
}

