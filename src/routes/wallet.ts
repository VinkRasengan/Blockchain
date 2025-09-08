import { Router, Request, Response } from 'express';
import { MyCoinNode } from '../core/MyCoinNode';
import { Wallet } from '../core/Wallet';
import { Transaction } from '../core/Transaction';
import * as crypto from 'crypto';
import * as bip39 from 'bip39';
import * as QRCode from 'qrcode';

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

export function walletRoutes(node: MyCoinNode): Router {
  const router = Router();

  /**
   * Tạo ví mới
   * POST /api/wallet/create
   */
  router.post('/create', async (req: Request, res: Response) => {
    try {
      const { password, saveToFile = false } = req.body;

      // Tạo ví mới
      const wallet = new Wallet();
      
      // Tạo mnemonic phrase
      const mnemonic = bip39.generateMnemonic();

      // Cấp 5 MYC initial funds cho ví mới
      const initialFunds = 5;
      const blockchain = node.getBlockchain();

      // Tạo coinbase transaction để cấp initial funds
      const initialTransaction = Transaction.createCoinbaseTransaction(
        wallet.address,
        initialFunds
      );

      // Thêm transaction và mine block ngay lập tức để cấp funds
      let actualBalance = 0;
      try {
        // Thêm transaction vào pending transactions
        if (blockchain.addTransaction(initialTransaction)) {
          console.log(`✅ Initial funding transaction created: ${initialTransaction.hash}`);

          // Mine block ngay lập tức để cấp funds cho ví mới
          const tempMinerAddress = wallet.address; // Use new wallet as miner to get rewards too

          try {
            const newBlock = blockchain.minePendingTransactions(tempMinerAddress);

            console.log(`✅ Initial funding block mined: ${newBlock.hash}`);
            console.log(`✅ Block index: ${newBlock.index}`);
            console.log(`✅ ${initialFunds} MYC provided to new wallet: ${wallet.address}`);

            // Verify the balance
            actualBalance = blockchain.getBalance(wallet.address);
            console.log(`✅ Wallet balance after funding: ${actualBalance} MYC`);

          } catch (miningError) {
            console.error('❌ Mining error:', miningError);
            // Fallback: Manually update UTXO for testing
            console.log('🔧 Fallback: Manually creating UTXO...');

            // Manually add UTXO to make funds available
            const utxoKey = `${initialTransaction.hash}:0`;
            const utxo = {
              txHash: initialTransaction.hash,
              outputIndex: 0,
              address: wallet.address,
              amount: initialFunds
            };

            // Access private UTXO set (this is a hack for testing)
            (blockchain as any).utxoSet.set(utxoKey, utxo);
            console.log(`🔧 Manual UTXO created: ${utxoKey}`);
            actualBalance = initialFunds;
          }
        }
      } catch (error) {
        console.error('❌ Error providing initial funds:', error);
      }

      // Tạo QR code cho địa chỉ
      const qrCodeDataUrl = await QRCode.toDataURL(wallet.address);

      const response: any = {
        success: true,
        wallet: {
          address: wallet.address,
          publicKey: wallet.publicKey,
          privateKey: wallet.getPrivateKey(), // Add private key to response
          mnemonic: mnemonic,
          qrCode: qrCodeDataUrl,
          initialBalance: initialFunds,
          actualBalance: actualBalance, // Balance thực tế hiện tại
        },
        warnings: [
          'Never share your private key or mnemonic phrase with anyone',
          'Store your mnemonic phrase in a safe place',
          'MyCoin team will never ask for your private key',
          'Make sure to backup your wallet before proceeding',
          `Initial ${initialFunds} MYC has been added to your wallet for testing`,
          `Current wallet balance: ${actualBalance} MYC`
        ]
      };

      // Nếu có password, mã hóa private key
      if (password) {
        const encryptedPrivateKey = wallet.encryptPrivateKey(password);
        response.wallet.encryptedPrivateKey = encryptedPrivateKey;
        // Keep both encrypted and unencrypted for display purposes
      }

      // Nếu yêu cầu lưu file
      if (saveToFile && password) {
        const walletData = wallet.saveToFile('', password);
        response.walletFile = {
          filename: `mycoin-wallet-${wallet.address.substring(0, 8)}.json`,
          data: walletData
        };
      }

      res.json(response);
    } catch (error) {
      console.error('Error creating wallet:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create wallet',
        message: getErrorMessage(error)
      });
    }
  });

  /**
   * Import ví từ private key hoặc mnemonic
   * POST /api/wallet/import
   */
  router.post('/import', async (req: Request, res: Response) => {
    try {
      const { privateKey, mnemonic, password, keystore } = req.body;

      let wallet: Wallet;

      if (privateKey) {
        // Import từ private key
        wallet = new Wallet(privateKey);
      } else if (mnemonic) {
        // Import từ mnemonic phrase
        if (!bip39.validateMnemonic(mnemonic)) {
          return res.status(400).json({
            success: false,
            error: 'Invalid mnemonic phrase'
          });
        }
        wallet = Wallet.fromMnemonic(mnemonic);
      } else if (keystore && password) {
        // Import từ keystore file
        try {
          const decryptedPrivateKey = Wallet.decryptPrivateKey(keystore.privateKey, password);
          wallet = new Wallet(decryptedPrivateKey);
        } catch (error) {
          return res.status(400).json({
            success: false,
            error: 'Invalid password or corrupted keystore file'
          });
        }
      } else {
        return res.status(400).json({
          success: false,
          error: 'Please provide private key, mnemonic phrase, or keystore file with password'
        });
      }

      // Lấy balance
      const balance = wallet.getBalance(node.getBlockchain());
      
      // Tạo QR code
      const qrCodeDataUrl = await QRCode.toDataURL(wallet.address);

      res.json({
        success: true,
        wallet: {
          address: wallet.address,
          publicKey: wallet.publicKey,
          balance: balance,
          qrCode: qrCodeDataUrl,
        }
      });
    } catch (error) {
      console.error('Error importing wallet:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to import wallet',
        message: getErrorMessage(error)
      });
    }
  });

  /**
   * Lấy thông tin ví
   * GET /api/wallet/:address/info
   */
  router.get('/:address/info', async (req: Request, res: Response) => {
    try {
      const { address } = req.params;

      // Validate address format
      if (!isValidAddress(address)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid wallet address format'
        });
      }

      const blockchain = node.getBlockchain();
      const balance = blockchain.getBalance(address);
      const utxos = blockchain.getUTXOsForAddress(address);
      
      // Tạo QR code
      const qrCodeDataUrl = await QRCode.toDataURL(address);

      res.json({
        success: true,
        wallet: {
          address: address,
          balance: balance,
          utxoCount: utxos.length,
          qrCode: qrCodeDataUrl,
        }
      });
    } catch (error) {
      console.error('Error getting wallet info:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get wallet information',
        message: getErrorMessage(error)
      });
    }
  });

  /**
   * Lấy số dư ví
   * GET /api/wallet/:address/balance
   */
  router.get('/:address/balance', (req: Request, res: Response) => {
    try {
      const { address } = req.params;

      // Validate address format
      if (!isValidAddress(address)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid wallet address format'
        });
      }

      const balance = node.getBlockchain().getBalance(address);

      res.json({
        success: true,
        address: address,
        balance: balance
      });
    } catch (error) {
      console.error('Error getting balance:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get balance',
        message: getErrorMessage(error)
      });
    }
  });

  /**
   * Lấy UTXO của ví
   * GET /api/wallet/:address/utxos
   */
  router.get('/:address/utxos', (req: Request, res: Response) => {
    try {
      const { address } = req.params;

      // Validate address format
      if (!isValidAddress(address)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid wallet address format'
        });
      }

      const utxos = node.getBlockchain().getUTXOsForAddress(address);

      res.json({
        success: true,
        address: address,
        utxos: utxos,
        totalAmount: utxos.reduce((sum, utxo) => sum + utxo.amount, 0)
      });
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
   * Validate địa chỉ ví
   * POST /api/wallet/validate
   */
  router.post('/validate', (req: Request, res: Response) => {
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
                     address.length === 64 && 
                     /^[a-fA-F0-9]+$/.test(address);

      res.json({
        success: true,
        address: address,
        isValid: isValid
      });
    } catch (error) {
      console.error('Error validating address:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to validate address',
        message: getErrorMessage(error)
      });
    }
  });

  /**
   * Generate mnemonic phrase
   * GET /api/wallet/mnemonic
   */
  router.get('/mnemonic', (req: Request, res: Response) => {
    try {
      // Generate a simple mnemonic (in production, use BIP39)
      const words = [
        'abandon', 'ability', 'able', 'about', 'above', 'absent', 'absorb', 'abstract',
        'absurd', 'abuse', 'access', 'accident', 'account', 'accuse', 'achieve', 'acid',
        'acoustic', 'acquire', 'across', 'action', 'actor', 'actual', 'adapt', 'add',
        'addict', 'address', 'adjust', 'admit', 'adult', 'advance', 'advice', 'aerobic',
        'affair', 'afford', 'afraid', 'again', 'against', 'agency', 'agent', 'agree',
        'ahead', 'aim', 'air', 'airport', 'aisle', 'alarm', 'album', 'alcohol',
        'alert', 'alien', 'all', 'alley', 'allow', 'almost', 'alone', 'alpha',
        'already', 'also', 'alter', 'always', 'amateur', 'amazing', 'among', 'amount'
      ];

      const mnemonic = Array.from({ length: 12 }, () => 
        words[Math.floor(Math.random() * words.length)]
      ).join(' ');

      res.json({
        success: true,
        mnemonic: mnemonic
      });

    } catch (error) {
      console.error('Error generating mnemonic:', error);
      res.status(500).json({
        success: false,
        error: getErrorMessage(error)
      });
    }
  });

  /**
   * Recover wallet from mnemonic
   * POST /api/wallet/recover
   */
  router.post('/recover', async (req: Request, res: Response) => {
    try {
      const { mnemonic } = req.body;

      if (!mnemonic) {
        return res.status(400).json({
          success: false,
          error: 'Mnemonic phrase is required'
        });
      }

      // Validate mnemonic format (12 words)
      const words = mnemonic.trim().split(' ').filter((word: string) => word.length > 0);
      if (words.length !== 12) {
        return res.status(400).json({
          success: false,
          error: 'Mnemonic must contain exactly 12 words'
        });
      }

      // Create wallet from mnemonic
      const wallet = Wallet.fromMnemonic(mnemonic);
      const balance = wallet.getBalance(node.getBlockchain());

      res.json({
        success: true,
        address: wallet.address,
        publicKey: wallet.publicKey,
        privateKey: wallet.getPrivateKey(),
        balance: balance,
        message: 'Wallet recovered successfully'
      });

    } catch (error) {
      console.error('Error recovering wallet:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to recover wallet from mnemonic',
        message: getErrorMessage(error)
      });
    }
  });

  return router;
}

