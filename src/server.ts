const express = require('express');
import { Request, Response, NextFunction, Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { MyCoinNode } from './core/MyCoinNode';
import { walletRoutes } from './routes/wallet';
import { transactionRoutes } from './routes/transaction';
import { blockchainRoutes } from './routes/blockchain';
import { networkRoutes } from './routes/network';
import { miningRoutes } from './routes/mining';

export class MyCoinWebServer {
  private app: Application;
  private node: MyCoinNode;
  private port: number;

  constructor(port: number = 3000) {
    this.port = port;
    this.app = express();
    this.node = new MyCoinNode(3002, 6001); // API port và P2P port
    
    this.setupMiddleware();
    this.setupRoutes();
    this.setupStaticFiles();
  }

  /**
   * Thiết lập middleware
   */
  private setupMiddleware(): void {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com", "https://fonts.googleapis.com"],
          scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
          scriptSrcAttr: ["'unsafe-inline'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'", "ws:", "wss:", "http:", "https:"],
          fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com", "data:"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"],
        },
      },
    }));

    // CORS configuration
    this.app.use(cors());

    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
      message: 'Too many requests from this IP, please try again later.',
    });
    this.app.use('/api/', limiter);

    // Stricter rate limiting for sensitive endpoints
    const strictLimiter = rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 10,
      message: 'Too many sensitive requests, please try again later.',
    });
    this.app.use('/api/wallet/create', strictLimiter);
    this.app.use('/api/transaction/send', strictLimiter);

    // Body parsing middleware
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Request logging
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
      next();
    });
  }

  /**
   * Thiết lập routes
   */
  private setupRoutes(): void {
    // Health check
    this.app.get('/health', (req: Request, res: Response) => {
      res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        blockchain: {
          blocks: this.node.getBlockchain().chain.length,
          difficulty: this.node.getBlockchain().difficulty,
          pendingTransactions: this.node.getBlockchain().pendingTransactions.length,
        },
        network: {
          peers: this.node.getP2PNetwork().getPeers().length,
        }
      });
    });

    // API Health check
    this.app.get('/api/health', (req: Request, res: Response) => {
      res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        blockchain: {
          blocks: this.node.getBlockchain().chain.length,
          difficulty: this.node.getBlockchain().difficulty,
          pendingTransactions: this.node.getBlockchain().pendingTransactions.length,
        },
        network: {
          peers: this.node.getP2PNetwork().getPeers().length,
        }
      });
    });

    // API routes
    this.app.use('/api/wallet', walletRoutes(this.node));
    this.app.use('/api/transaction', transactionRoutes(this.node));
    this.app.use('/api/blockchain', blockchainRoutes(this.node));
    this.app.use('/api/network', networkRoutes(this.node));
    this.app.use('/api/mining', miningRoutes(this.node));

    // Error handling middleware
    this.app.use((err: any, req: Request, res: Response, next: NextFunction) => {
      console.error('Error:', err);
      res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? (err as Error).message : 'Something went wrong'
      });
    });

    // 404 handler for API routes
    this.app.use('/api/*', (req: Request, res: Response) => {
      res.status(404).json({ error: 'API endpoint not found' });
    });
  }

  /**
   * Thiết lập static files
   */
  private setupStaticFiles(): void {
    // Serve static files from public directory
    this.app.use(express.static(path.join(__dirname, '../public')));

    // Serve the main application
    this.app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, '../public/index.html'));
    });
  }

  /**
   * Khởi động server
   */
  public start(): void {
    // Start the blockchain node
    this.node.start();

    // Start the web server
    this.app.listen(this.port, () => {
      console.log(`🚀 MyCoin Web Server started on port ${this.port}`);
      console.log(`📱 Web Interface: http://localhost:${this.port}`);
      console.log(`🔗 API Endpoint: http://localhost:${this.port}/api`);
      console.log(`⛏️  Blockchain API: http://localhost:3002`);
      console.log(`🌐 P2P Network: ws://localhost:6001`);
    });
  }

  /**
   * Lấy blockchain node
   */
  public getNode(): MyCoinNode {
    return this.node;
  }

  /**
   * Lấy Express app
   */
  public getApp(): Application {
    return this.app;
  }
}

// Start server if this file is run directly
if (require.main === module) {
  const server = new MyCoinWebServer(8080);
  server.start();

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    process.exit(0);
  });

  process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    process.exit(0);
  });
}

export default MyCoinWebServer;
