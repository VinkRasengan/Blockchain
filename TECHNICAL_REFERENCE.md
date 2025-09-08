# MyCoin - Tài liệu Tham khảo Kỹ thuật

## 📋 Mục lục
1. [Kiến trúc Hệ thống](#kiến-trúc-hệ-thống)
2. [Blockchain Core](#blockchain-core)
3. [Consensus Algorithms](#consensus-algorithms)
4. [Cryptography](#cryptography)
5. [API Reference](#api-reference)
6. [Database Schema](#database-schema)
7. [Network Protocol](#network-protocol)
8. [Performance](#performance)

## 🏗️ Kiến trúc Hệ thống

### Tổng quan
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Blockchain    │
│   (Web UI)      │◄──►│   (Express)     │◄──►│   (Core)        │
│                 │    │                 │    │                 │
│ - HTML/CSS/JS   │    │ - RESTful API   │    │ - PoW/PoS       │
│ - QR Code       │    │ - WebSocket     │    │ - P2P Network   │
│ - Responsive    │    │ - Security      │    │ - UTXO Model    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Components

#### Frontend Layer
- **Technology**: HTML5, CSS3, Vanilla JavaScript
- **Features**: Responsive design, QR code generation, real-time updates
- **Files**: `public/index.html`, `public/css/styles.css`, `public/js/*.js`

#### Backend Layer
- **Technology**: Node.js, Express.js, TypeScript
- **Features**: RESTful API, WebSocket, Security middleware
- **Files**: `src/server.ts`, `src/routes/*.ts`

#### Blockchain Layer
- **Technology**: Custom implementation với TypeScript
- **Features**: PoW/PoS consensus, P2P network, UTXO management
- **Files**: `src/core/*.ts`

## ⛓️ Blockchain Core

### Block Structure
```typescript
interface Block {
  index: number;           // Block number
  timestamp: number;       // Creation time
  transactions: Transaction[];  // List of transactions
  previousHash: string;    // Hash of previous block
  nonce: number;          // Proof of Work nonce
  hash: string;           // Block hash
  merkleRoot: string;     // Merkle root of transactions
  difficulty: number;     // Mining difficulty
}
```

### Transaction Structure
```typescript
interface Transaction {
  hash: string;                    // Transaction hash
  timestamp: number;               // Creation time
  inputs: TransactionInput[];      // Input UTXOs
  outputs: TransactionOutput[];    // Output UTXOs
  fee: number;                    // Transaction fee
}

interface TransactionInput {
  txHash: string;         // Previous transaction hash
  outputIndex: number;    // Output index in previous transaction
  signature?: string;     // Digital signature
}

interface TransactionOutput {
  address: string;        // Recipient address
  amount: number;         // Amount to transfer
}
```

### UTXO Model
- **Unspent Transaction Outputs**: Mô hình quản lý balance
- **Benefits**: Parallel processing, better privacy, simpler validation
- **Storage**: LevelDB với key-value pairs

## 🔐 Consensus Algorithms

### Proof of Work (PoW)
```typescript
class ProofOfWork {
  private difficulty: number = 4;
  
  mine(block: Block): Block {
    const target = "0".repeat(this.difficulty);
    
    while (!block.hash.startsWith(target)) {
      block.nonce++;
      block.hash = this.calculateHash(block);
    }
    
    return block;
  }
}
```

**Characteristics**:
- SHA-256 hashing algorithm
- Dynamic difficulty adjustment
- Average block time: ~10 seconds
- Energy intensive but secure

### Proof of Stake (PoS)
```typescript
class ProofOfStake {
  selectValidator(validators: Validator[]): Validator {
    const totalStake = validators.reduce((sum, v) => sum + v.stake, 0);
    const random = Math.random() * totalStake;
    
    let currentStake = 0;
    for (const validator of validators) {
      currentStake += validator.stake;
      if (random <= currentStake) {
        return validator;
      }
    }
  }
}
```

**Characteristics**:
- Energy efficient
- Stake-based selection
- Faster block times
- Economic security model

## 🔒 Cryptography

### Digital Signatures
- **Algorithm**: ECDSA (Elliptic Curve Digital Signature Algorithm)
- **Curve**: secp256k1 (same as Bitcoin)
- **Library**: elliptic.js

```typescript
// Signing process
const signature = keyPair.sign(transactionHash);

// Verification process
const isValid = keyPair.verify(transactionHash, signature);
```

### Hash Functions
- **Block Hashing**: SHA-256
- **Merkle Tree**: SHA-256
- **Address Generation**: SHA-256 + RIPEMD-160

### Wallet Encryption
```typescript
// AES-256-GCM encryption
const cipher = crypto.createCipher('aes-256-gcm', derivedKey);
const encrypted = cipher.update(privateKey, 'utf8', 'hex') + cipher.final('hex');

// Key derivation with scrypt
const derivedKey = crypto.scryptSync(password, salt, 32);
```

## 📡 API Reference

### Base URL
- **Development**: `http://localhost:8080/api`
- **Blockchain API**: `http://localhost:3002/api`

### Authentication
- Currently no authentication required for read operations
- Write operations require valid signatures

### Response Format
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional message",
  "error": "Error message if success=false"
}
```

### Error Codes
- `400`: Bad Request - Invalid input
- `404`: Not Found - Resource not found
- `500`: Internal Server Error - Server error
- `429`: Too Many Requests - Rate limited

### Rate Limiting
- **Default**: 100 requests per 15 minutes per IP
- **Burst**: 10 requests per second
- **Headers**: `X-RateLimit-*` trong response

## 💾 Database Schema

### LevelDB Structure
```
blockchain/
├── blocks/           # Block data
│   ├── 0            # Genesis block
│   ├── 1            # Block 1
│   └── ...
├── transactions/     # Transaction data
│   ├── {hash}       # Transaction by hash
│   └── ...
├── utxos/           # UTXO set
│   ├── {txHash}:{index}  # UTXO key
│   └── ...
└── metadata/        # Blockchain metadata
    ├── height       # Current height
    ├── difficulty   # Current difficulty
    └── ...
```

### Wallet Storage
```
data/wallets/
├── {address}.json   # Encrypted wallet files
└── ...
```

## 🌐 Network Protocol

### P2P Communication
- **Protocol**: WebSocket
- **Port**: 6001 (default)
- **Message Format**: JSON

### Message Types
```typescript
interface P2PMessage {
  type: 'BLOCK' | 'TRANSACTION' | 'PEER_REQUEST' | 'PEER_RESPONSE';
  data: any;
  timestamp: number;
}
```

### Network Discovery
- **Bootstrap Nodes**: Hardcoded initial peers
- **Peer Exchange**: Peers share known peers
- **Connection Limit**: Maximum 10 active connections

## ⚡ Performance

### Benchmarks
- **Transaction Throughput**: ~100 TPS
- **Block Time**: 10 seconds (adjustable)
- **Memory Usage**: ~50MB for 1000 blocks
- **Storage**: ~1KB per transaction

### Optimization Strategies
1. **UTXO Caching**: In-memory UTXO set
2. **Parallel Validation**: Multi-threaded transaction validation
3. **Bloom Filters**: Fast transaction lookup
4. **Compression**: Block data compression

### Scalability Considerations
- **Sharding**: Planned for future versions
- **Layer 2**: Lightning-style payment channels
- **State Channels**: Off-chain transactions

## 🔧 Configuration

### Environment Variables
```bash
NODE_ENV=development          # Environment mode
HTTP_PORT=8080               # Web server port
BLOCKCHAIN_PORT=3002         # Blockchain API port
P2P_PORT=6001               # P2P network port
MINING_REWARD=50            # Block reward
DIFFICULTY=4                # Initial difficulty
```

### Config Files
- `tsconfig.json`: TypeScript configuration
- `jest.config.js`: Testing configuration
- `package.json`: Dependencies and scripts

## 🧪 Testing

### Test Structure
```
src/tests/
├── unit/            # Unit tests
├── integration/     # Integration tests
└── e2e/            # End-to-end tests
```

### Test Commands
```bash
npm test                    # Run all tests
npm run test:watch         # Watch mode
npm run test:coverage      # Coverage report
```

### Mock Data
- **Genesis Block**: Predefined first block
- **Test Wallets**: Pre-generated test wallets
- **Sample Transactions**: Valid test transactions

## 📊 Monitoring

### Health Checks
```bash
# System health
GET /health

# Blockchain health
GET /api/blockchain/stats
```

### Metrics
- Block height
- Transaction count
- Network peers
- Memory usage
- Response times

### Logging
- **Level**: INFO, WARN, ERROR, DEBUG
- **Format**: JSON structured logs
- **Rotation**: Daily log rotation

---

**📝 Note**: This is a technical reference for developers. For user guide, see `USAGE_GUIDE.md`.
