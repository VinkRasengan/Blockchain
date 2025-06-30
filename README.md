# MyCoin - Desktop Cryptocurrency Wallet

![MyCoin Logo](docs/images/logo.png)

MyCoin is a complete desktop cryptocurrency wallet application with integrated blockchain implementation. Built with Electron and TypeScript, it provides a secure and user-friendly interface for managing your cryptocurrency transactions.

## 🚀 Features

### Wallet Management
- **Create New Wallet**: Generate secure wallets with private keys and mnemonic phrases
- **Load Existing Wallet**: Import wallets using private keys or mnemonic phrases
- **Secure Storage**: Private keys are encrypted with AES-256 encryption
- **Balance Tracking**: Real-time balance updates and transaction monitoring

### Transaction System
- **Send MyCoin**: Transfer coins to other addresses with customizable fees
- **Receive MyCoin**: Generate receiving addresses and QR codes
- **Transaction History**: Complete transaction history with detailed information
- **UTXO Management**: Efficient unspent transaction output handling

### Blockchain Core
- **Proof of Work**: Secure consensus mechanism with adjustable difficulty
- **Mining**: Built-in mining functionality with reward system
- **Block Explorer**: Browse blocks and transactions like Etherscan
- **P2P Network**: Decentralized peer-to-peer networking

### Desktop Application
- **Cross-Platform**: Works on Windows, macOS, and Linux
- **Modern UI**: Clean and intuitive user interface
- **Real-time Updates**: Live blockchain synchronization
- **Offline Capable**: Core wallet functions work offline

## 🛠️ Technology Stack

- **Frontend**: Electron, HTML5, CSS3, JavaScript
- **Backend**: Node.js, TypeScript
- **Blockchain**: Custom implementation with PoW consensus
- **Cryptography**: ECDSA (secp256k1), SHA-256, RIPEMD-160
- **Database**: LevelDB for blockchain storage
- **Networking**: WebSocket for P2P communication

## 📦 Installation

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn package manager

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/mycoin.git
   cd mycoin
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Build the application**
   ```bash
   npm run build
   ```

4. **Start MyCoin**
   ```bash
   npm start
   ```

### Development Mode

For development with hot reload:
```bash
npm run dev
```

## 🎯 Usage Guide

### Creating Your First Wallet

1. Launch MyCoin application
2. Click "Create New Wallet" in the Wallet tab
3. **Important**: Save your mnemonic phrase securely
4. Your wallet address and balance will be displayed

### Sending MyCoin

1. Go to the "Send" tab
2. Enter recipient address and amount
3. Set transaction fee (default: 1 MYC)
4. Enter your private key for signing
5. Click "Send Transaction"

### Mining Blocks

1. Navigate to the "Mining" tab
2. Click "Start Mining" to mine a new block
3. Earn mining rewards (default: 50 MYC per block)
4. Help secure the network

### Connecting to Network

1. Go to the "Network" tab
2. Click "Add Peer" to connect to other nodes
3. Enter peer URL (e.g., `ws://localhost:6002`)
4. Start synchronizing with the network

## 🔧 Configuration

### Default Ports
- **HTTP API**: 3001
- **P2P Network**: 6001

### Mining Settings
- **Block Reward**: 50 MYC
- **Difficulty**: 4 (adjustable)
- **Block Time**: Variable based on network

### Network Configuration
You can connect to other MyCoin nodes by adding their WebSocket URLs in the Network tab.

## 🧪 Testing

Run the test suite:
```bash
npm test
```

Run tests with coverage:
```bash
npm run test:coverage
```

## 📚 API Documentation

### HTTP API Endpoints

#### Blockchain
- `GET /blocks` - Get all blocks
- `GET /block/:hash` - Get block by hash
- `GET /transaction/:hash` - Get transaction by hash
- `GET /stats` - Get blockchain statistics

#### Wallet
- `GET /balance/:address` - Get address balance
- `GET /transactions/:address` - Get transaction history
- `POST /transaction` - Submit new transaction
- `POST /mine` - Mine new block

#### Network
- `GET /peers` - Get connected peers
- `POST /peers` - Connect to new peer

## 🏗️ Architecture

### Core Components

```
src/
├── core/                 # Blockchain core logic
│   ├── Block.ts         # Block structure and mining
│   ├── Blockchain.ts    # Main blockchain class
│   ├── Transaction.ts   # Transaction handling
│   ├── Wallet.ts        # Wallet management
│   ├── P2PNetwork.ts    # Peer-to-peer networking
│   └── MyCoinNode.ts    # Main node implementation
├── wallet/              # Desktop wallet UI
│   ├── index.html       # Main interface
│   ├── styles.css       # Styling
│   └── renderer.js      # Frontend logic
├── tests/               # Test suites
└── main.ts             # Electron main process
```

### Data Flow

1. **Wallet Creation**: Generate keys → Encrypt → Store locally
2. **Transaction**: Create → Sign → Broadcast → Add to mempool
3. **Mining**: Collect transactions → Solve PoW → Add block → Broadcast
4. **Synchronization**: Receive blocks → Validate → Update chain

## 🔐 Security Features

- **Private Key Encryption**: AES-256 encryption with user passphrase
- **Digital Signatures**: ECDSA signatures for transaction authenticity
- **Proof of Work**: Prevents double-spending and ensures consensus
- **Local Storage**: Private keys never leave your device
- **Input Validation**: Comprehensive validation of all inputs

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check the [docs](docs/) folder
- **Issues**: Report bugs on [GitHub Issues](https://github.com/yourusername/mycoin/issues)
- **Discussions**: Join our [GitHub Discussions](https://github.com/yourusername/mycoin/discussions)

## 🎥 Video Tutorial

Watch our comprehensive tutorial: [MyCoin Wallet Tutorial](https://youtu.be/your-video-id)

## 📖 References

- [Bitcoin Whitepaper](https://bitcoin.org/bitcoin.pdf)
- [Ethereum Documentation](https://ethereum.org/developers/)
- [Elliptic Curve Cryptography](https://en.wikipedia.org/wiki/Elliptic-curve_cryptography)
- [Proof of Work Consensus](https://en.wikipedia.org/wiki/Proof_of_work)

## 🏆 Acknowledgments

- Inspired by Bitcoin and Ethereum
- Built with modern web technologies
- Community-driven development

---

**⚠️ Disclaimer**: This is educational software. Do not use for production cryptocurrency transactions without thorough security auditing.
