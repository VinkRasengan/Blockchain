const express = require('express');
import { Request, Response, Application } from 'express';
import cors from 'cors';
import { Blockchain } from './Blockchain';
import { P2PNetwork } from './P2PNetwork';
import { Wallet } from './Wallet';
import { Transaction } from './Transaction';
import { walletRoutes } from '../routes/wallet';
import { transactionRoutes } from '../routes/transaction';
import { blockchainRoutes } from '../routes/blockchain';
import { networkRoutes } from '../routes/network';
import { miningRoutes } from '../routes/mining';

// Utility function to get error message
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return getErrorMessage(error);
  return String(error);
}

export class MyCoinNode {
  private blockchain: Blockchain;
  private p2pNetwork: P2PNetwork;
  private httpServer: Application;
  private httpPort: number;
  private p2pPort: number;
  private wallet: Wallet | null = null;

  constructor(httpPort: number = 3001, p2pPort: number = 6001) {
    this.httpPort = httpPort;
    this.p2pPort = p2pPort;
    this.blockchain = new Blockchain();
    this.p2pNetwork = new P2PNetwork(this.blockchain, p2pPort);
    this.httpServer = express();
    
    this.setupHttpServer();
  }

  /**
   * Thiết lập HTTP server cho API
   */
  private setupHttpServer(): void {
    const app = this.httpServer;
    app.use(cors());
    app.use(express.json());

    // Add structured API routes
    app.use('/api/wallet', walletRoutes(this));
    app.use('/api/transaction', transactionRoutes(this));
    app.use('/api/transactions', transactionRoutes(this)); // Alias
    app.use('/api/blockchain', blockchainRoutes(this));
    app.use('/api/network', networkRoutes(this));
    app.use('/api/mining', miningRoutes(this));

    // Health check
    app.get('/api/health', (req: Request, res: Response) => {
      res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        blockchain: {
          blocks: this.blockchain.chain.length,
          difficulty: this.blockchain.difficulty,
          pendingTransactions: this.blockchain.pendingTransactions.length,
        },
        network: {
          peers: this.p2pNetwork.getPeers().length,
        }
      });
    });

    // Legacy endpoints for backwards compatibility
    app.get('/blocks', (req: Request, res: Response) => {
      res.json(this.blockchain.chain);
    });

    app.get('/block/:hash', (req: Request, res: Response) => {
      const block = this.blockchain.getBlockByHash(req.params.hash);
      if (block) {
        res.json(block);
      } else {
        res.status(404).json({ error: 'Block not found' });
      }
    });

    this.httpServer.get('/transaction/:hash', (req, res) => {
      const transaction = this.blockchain.getTransactionByHash(req.params.hash);
      if (transaction) {
        res.json(transaction);
      } else {
        res.status(404).json({ error: 'Transaction not found' });
      }
    });

    this.httpServer.get('/balance/:address', (req, res) => {
      const balance = this.blockchain.getBalance(req.params.address);
      res.json({ address: req.params.address, balance });
    });

    this.httpServer.get('/transactions/:address', (req, res) => {
      const transactions = this.blockchain.getTransactionHistory(req.params.address);
      res.json(transactions);
    });

    this.httpServer.get('/utxos/:address', (req, res) => {
      const utxos = this.blockchain.getUTXOsForAddress(req.params.address);
      res.json(utxos);
    });

    this.httpServer.post('/transaction', (req, res) => {
      try {
        const { inputs, outputs, fee } = req.body;
        const transaction = new Transaction(inputs, outputs, fee);
        
        if (this.blockchain.addTransaction(transaction)) {
          this.p2pNetwork.broadcastTransaction(transaction);
          res.json({ success: true, hash: transaction.hash });
        } else {
          res.status(400).json({ error: 'Invalid transaction' });
        }
      } catch (error) {
        res.status(400).json({ error: getErrorMessage(error) });
      }
    });

    this.httpServer.post('/mine', (req, res) => {
      const { minerAddress } = req.body;
      
      if (!minerAddress) {
        return res.status(400).json({ error: 'Miner address required' });
      }

      try {
        const newBlock = this.blockchain.minePendingTransactions(minerAddress);
        this.p2pNetwork.broadcastNewBlock(newBlock);
        res.json({ success: true, block: newBlock });
      } catch (error) {
        res.status(500).json({ error: getErrorMessage(error) });
      }
    });

    this.httpServer.get('/pending-transactions', (req, res) => {
      res.json(this.blockchain.pendingTransactions);
    });

    this.httpServer.get('/stats', (req, res) => {
      res.json(this.blockchain.getStats());
    });

    this.httpServer.get('/peers', (req, res) => {
      const peers = this.p2pNetwork.getPeers().map(peer => ({
        url: peer.url,
        connected: peer.connected
      }));
      res.json(peers);
    });

    this.httpServer.post('/peers', (req, res) => {
      const { peerUrl } = req.body;
      
      if (!peerUrl) {
        return res.status(400).json({ error: 'Peer URL required' });
      }

      try {
        this.p2pNetwork.connectToPeer(peerUrl);
        res.json({ success: true, message: `Connecting to ${peerUrl}` });
      } catch (error) {
        res.status(400).json({ error: getErrorMessage(error) });
      }
    });

    // Wallet endpoints
    this.httpServer.post('/wallet/create', (req, res) => {
      try {
        const wallet = new Wallet();
        const mnemonic = Wallet.generateMnemonic();
        
        res.json({
          address: wallet.address,
          publicKey: wallet.publicKey,
          mnemonic: mnemonic
        });
      } catch (error) {
        res.status(500).json({ error: getErrorMessage(error) });
      }
    });

    this.httpServer.post('/wallet/load', (req, res) => {
      try {
        const { privateKey, mnemonic } = req.body;
        
        let wallet: Wallet;
        if (privateKey) {
          wallet = new Wallet(privateKey);
        } else if (mnemonic) {
          wallet = Wallet.fromMnemonic(mnemonic);
        } else {
          return res.status(400).json({ error: 'Private key or mnemonic required' });
        }

        this.wallet = wallet;
        res.json(wallet.getInfo());
      } catch (error) {
        res.status(400).json({ error: getErrorMessage(error) });
      }
    });

    this.httpServer.post('/wallet/send', (req, res) => {
      if (!this.wallet) {
        return res.status(400).json({ error: 'No wallet loaded' });
      }

      try {
        const { recipientAddress, amount, fee = 1 } = req.body;
        
        const success = this.wallet.sendTransaction(
          recipientAddress,
          amount,
          this.blockchain,
          fee
        );

        if (success) {
          res.json({ success: true, message: 'Transaction sent' });
        } else {
          res.status(400).json({ error: 'Transaction failed' });
        }
      } catch (error) {
        res.status(400).json({ error: getErrorMessage(error) });
      }
    });

    this.httpServer.get('/wallet/balance', (req, res) => {
      if (!this.wallet) {
        return res.status(400).json({ error: 'No wallet loaded' });
      }

      const balance = this.wallet.getBalance(this.blockchain);
      res.json({ balance });
    });

    this.httpServer.get('/wallet/transactions', (req, res) => {
      if (!this.wallet) {
        return res.status(400).json({ error: 'No wallet loaded' });
      }

      const transactions = this.wallet.getTransactionHistory(this.blockchain);
      res.json(transactions);
    });

    this.httpServer.get('/wallet/info', (req, res) => {
      if (!this.wallet) {
        return res.status(400).json({ error: 'No wallet loaded' });
      }

      res.json(this.wallet.getInfo());
    });
  }

  /**
   * Khởi động node
   */
  start(): void {
    // Khởi động HTTP server
    this.httpServer.listen(this.httpPort, () => {
      console.log(`HTTP server listening on port ${this.httpPort}`);
      console.log(`API available at http://localhost:${this.httpPort}`);
    });

    // Khởi động P2P server
    this.p2pNetwork.startServer();
    
    console.log(`MyCoin node started`);
    console.log(`HTTP Port: ${this.httpPort}`);
    console.log(`P2P Port: ${this.p2pPort}`);
  }

  /**
   * Kết nối đến peer
   */
  connectToPeer(peerUrl: string): void {
    this.p2pNetwork.connectToPeer(peerUrl);
  }

  /**
   * Lấy blockchain
   */
  getBlockchain(): Blockchain {
    return this.blockchain;
  }

  /**
   * Lấy P2P network
   */
  getP2PNetwork(): P2PNetwork {
    return this.p2pNetwork;
  }

  /**
   * Đóng node
   */
  close(): void {
    this.p2pNetwork.close();
    console.log('MyCoin node stopped');
  }
}
