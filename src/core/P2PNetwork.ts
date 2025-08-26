import WebSocket, { WebSocketServer } from 'ws';
import { Block } from './Block';
import { Transaction } from './Transaction';
import { Blockchain } from './Blockchain';
import { IncomingMessage } from 'http';

export enum MessageType {
  QUERY_LATEST = 'QUERY_LATEST',
  QUERY_ALL = 'QUERY_ALL',
  RESPONSE_BLOCKCHAIN = 'RESPONSE_BLOCKCHAIN',
  QUERY_TRANSACTION_POOL = 'QUERY_TRANSACTION_POOL',
  RESPONSE_TRANSACTION_POOL = 'RESPONSE_TRANSACTION_POOL',
  NEW_TRANSACTION = 'NEW_TRANSACTION',
  NEW_BLOCK = 'NEW_BLOCK'
}

export interface Message {
  type: MessageType;
  data: any;
}

export interface Peer {
  socket: WebSocket;
  url: string;
  connected: boolean;
  readyState?: number;
  lastSeen?: number;
  connectionTime?: number;
}

export class P2PNetwork {
  private peers: Peer[] = [];
  private server: WebSocketServer | null = null;
  private blockchain: Blockchain;
  private port: number;

  constructor(blockchain: Blockchain, port: number = 6001) {
    this.blockchain = blockchain;
    this.port = port;
  }

  /**
   * Khởi động P2P server
   */
  startServer(): void {
    this.server = new WebSocketServer({ port: this.port });
    
    this.server.on('connection', (socket: WebSocket, request: IncomingMessage) => {
      const url = `ws://${request.socket.remoteAddress}:${request.socket.remotePort}`;
      console.log(`New peer connected: ${url}`);
      
      this.initConnection(socket, url);
    });

    console.log(`P2P server started on port ${this.port}`);
  }

  /**
   * Kết nối đến peer khác
   */
  connectToPeer(peerUrl: string): void {
    try {
      const socket = new WebSocket(peerUrl);
      
      socket.on('open', () => {
        console.log(`Connected to peer: ${peerUrl}`);
        this.initConnection(socket, peerUrl);
        this.queryChainLengthMsg();
      });

      socket.on('error', (error) => {
        console.log(`Connection failed to peer ${peerUrl}: ${error.message}`);
      });
    } catch (error) {
      console.log(`Failed to connect to peer ${peerUrl}: ${error}`);
    }
  }

  /**
   * Khởi tạo kết nối với peer
   */
  private initConnection(socket: WebSocket, url: string): void {
    const peer: Peer = {
      socket,
      url,
      connected: true,
      readyState: socket.readyState,
      connectionTime: Date.now()
    };

    this.peers.push(peer);

    socket.on('message', (data: string) => {
      try {
        const message: Message = JSON.parse(data);
        peer.lastSeen = Date.now();
        peer.readyState = socket.readyState;
        this.handleMessage(peer, message);
      } catch (error) {
        console.log(`Invalid message from ${url}: ${error}`);
      }
    });

    socket.on('close', () => {
      console.log(`Peer disconnected: ${url}`);
      peer.connected = false;
      peer.readyState = socket.readyState;
      this.peers = this.peers.filter(p => p !== peer);
    });

    socket.on('error', (error) => {
      console.log(`Peer error ${url}: ${error}`);
      peer.connected = false;
      peer.readyState = socket.readyState;
    });
  }

  /**
   * Xử lý message từ peer
   */
  private handleMessage(peer: Peer, message: Message): void {
    console.log(`Received message ${message.type} from ${peer.url}`);

    switch (message.type) {
      case MessageType.QUERY_LATEST:
        this.sendMessage(peer, {
          type: MessageType.RESPONSE_BLOCKCHAIN,
          data: [this.blockchain.getLatestBlock()]
        });
        break;

      case MessageType.QUERY_ALL:
        this.sendMessage(peer, {
          type: MessageType.RESPONSE_BLOCKCHAIN,
          data: this.blockchain.chain
        });
        break;

      case MessageType.RESPONSE_BLOCKCHAIN:
        this.handleBlockchainResponse(message.data);
        break;

      case MessageType.QUERY_TRANSACTION_POOL:
        this.sendMessage(peer, {
          type: MessageType.RESPONSE_TRANSACTION_POOL,
          data: this.blockchain.pendingTransactions
        });
        break;

      case MessageType.RESPONSE_TRANSACTION_POOL:
        this.handleTransactionPoolResponse(message.data);
        break;

      case MessageType.NEW_TRANSACTION:
        this.handleNewTransaction(message.data);
        break;

      case MessageType.NEW_BLOCK:
        this.handleNewBlock(message.data);
        break;

      default:
        console.log(`Unknown message type: ${message.type}`);
    }
  }

  /**
   * Xử lý phản hồi blockchain
   */
  private handleBlockchainResponse(receivedBlocks: any[]): void {
    if (receivedBlocks.length === 0) {
      console.log('Received empty blockchain');
      return;
    }

    const latestBlockReceived = receivedBlocks[receivedBlocks.length - 1];
    const latestBlockHeld = this.blockchain.getLatestBlock();

    if (latestBlockReceived.index > latestBlockHeld.index) {
      console.log('Blockchain possibly behind. We got: ' + 
                  latestBlockHeld.index + ' Peer got: ' + latestBlockReceived.index);

      if (latestBlockHeld.hash === latestBlockReceived.previousHash) {
        // Chỉ cần thêm block mới
        console.log('We can append the received block to our chain');
        const newBlock = this.createBlockFromData(latestBlockReceived);
        if (newBlock.isValid(latestBlockHeld)) {
          this.blockchain.chain.push(newBlock);
          this.broadcastLatest();
        }
      } else if (receivedBlocks.length === 1) {
        // Cần query toàn bộ chain
        console.log('We have to query the chain from our peer');
        this.broadcast({
          type: MessageType.QUERY_ALL,
          data: null
        });
      } else {
        // Thay thế chain nếu hợp lệ và dài hơn
        console.log('Received blockchain is longer than current blockchain');
        this.replaceChain(receivedBlocks);
      }
    } else {
      console.log('Received blockchain is not longer than current blockchain. Do nothing');
    }
  }

  /**
   * Thay thế chain hiện tại
   */
  private replaceChain(newBlocks: any[]): void {
    const newBlockchain = new Blockchain();
    newBlockchain.chain = newBlocks.map(blockData => this.createBlockFromData(blockData));

    if (newBlockchain.isChainValid() && newBlocks.length > this.blockchain.chain.length) {
      console.log('Received blockchain is valid. Replacing current blockchain with received blockchain');
      this.blockchain.chain = newBlockchain.chain;
      this.broadcastLatest();
    } else {
      console.log('Received blockchain invalid');
    }
  }

  /**
   * Tạo Block object từ data
   */
  private createBlockFromData(blockData: any): Block {
    const block = new Block(
      blockData.index,
      blockData.transactions,
      blockData.previousHash,
      blockData.difficulty
    );
    
    block.timestamp = blockData.timestamp;
    block.nonce = blockData.nonce;
    block.hash = blockData.hash;
    block.merkleRoot = blockData.merkleRoot;
    
    return block;
  }

  /**
   * Xử lý giao dịch mới
   */
  private handleNewTransaction(transactionData: any): void {
    const transaction = new Transaction(
      transactionData.inputs,
      transactionData.outputs,
      transactionData.fee
    );
    
    transaction.hash = transactionData.hash;
    transaction.timestamp = transactionData.timestamp;

    if (this.blockchain.addTransaction(transaction)) {
      console.log('New transaction added to pool');
    }
  }

  /**
   * Xử lý block mới
   */
  private handleNewBlock(blockData: any): void {
    const newBlock = this.createBlockFromData(blockData);
    const latestBlock = this.blockchain.getLatestBlock();

    if (newBlock.isValid(latestBlock)) {
      this.blockchain.chain.push(newBlock);
      console.log('New block added to blockchain');
    }
  }

  /**
   * Xử lý phản hồi transaction pool
   */
  private handleTransactionPoolResponse(transactions: any[]): void {
    transactions.forEach(txData => {
      this.handleNewTransaction(txData);
    });
  }

  /**
   * Gửi message đến peer
   */
  private sendMessage(peer: Peer, message: Message): void {
    if (peer.connected && peer.socket.readyState === WebSocket.OPEN) {
      peer.socket.send(JSON.stringify(message));
    }
  }

  /**
   * Broadcast message đến tất cả peers
   */
  broadcast(message: Message): void {
    this.peers.forEach(peer => {
      this.sendMessage(peer, message);
    });
  }

  /**
   * Broadcast block mới nhất
   */
  broadcastLatest(): void {
    this.broadcast({
      type: MessageType.RESPONSE_BLOCKCHAIN,
      data: [this.blockchain.getLatestBlock()]
    });
  }

  /**
   * Broadcast giao dịch mới
   */
  broadcastTransaction(transaction: Transaction): void {
    this.broadcast({
      type: MessageType.NEW_TRANSACTION,
      data: transaction
    });
  }

  /**
   * Broadcast block mới
   */
  broadcastNewBlock(block: Block): void {
    this.broadcast({
      type: MessageType.NEW_BLOCK,
      data: block
    });
  }

  /**
   * Query chain length
   */
  queryChainLengthMsg(): void {
    this.broadcast({
      type: MessageType.QUERY_LATEST,
      data: null
    });
  }

  /**
   * Query transaction pool
   */
  queryTransactionPoolMsg(): void {
    this.broadcast({
      type: MessageType.QUERY_TRANSACTION_POOL,
      data: null
    });
  }

  /**
   * Lấy danh sách peers
   */
  getPeers(): Peer[] {
    return this.peers;
  }

  /**
   * Lấy node ID
   */
  getNodeId(): string {
    return `node-${this.port}-${Date.now()}`;
  }

  /**
   * Ngắt kết nối với peer
   */
  disconnectPeer(peerUrl: string): boolean {
    const peerIndex = this.peers.findIndex(peer => peer.url === peerUrl);

    if (peerIndex !== -1) {
      const peer = this.peers[peerIndex];
      if (peer.socket.readyState === WebSocket.OPEN) {
        peer.socket.close();
      }
      peer.connected = false;
      return true;
    }

    return false;
  }

  /**
   * Đóng tất cả kết nối
   */
  close(): void {
    this.peers.forEach(peer => {
      if (peer.socket.readyState === WebSocket.OPEN) {
        peer.socket.close();
      }
    });

    if (this.server) {
      this.server.close();
    }
  }
}
