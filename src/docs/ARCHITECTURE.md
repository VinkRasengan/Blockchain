# MyCoin Architecture Documentation

## Overview

MyCoin is a desktop cryptocurrency application built with Electron and TypeScript, featuring a complete blockchain implementation with Proof of Work consensus mechanism.

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    MyCoin Desktop App                        │
├─────────────────────────────────────────────────────────────┤
│  Frontend (Electron Renderer)                              │
│  ├── HTML/CSS/JS Interface                                 │
│  ├── Wallet Management UI                                  │
│  ├── Transaction Forms                                     │
│  └── Network Status Display                               │
├─────────────────────────────────────────────────────────────┤
│  Backend (Electron Main + Node.js)                        │
│  ├── MyCoinNode (HTTP API Server)                         │
│  ├── Blockchain Core                                      │
│  ├── P2P Network Layer                                    │
│  └── Wallet Management                                    │
├─────────────────────────────────────────────────────────────┤
│  Storage Layer                                             │
│  ├── LevelDB (Blockchain Data)                           │
│  ├── Encrypted Wallet Files                              │
│  └── Configuration Files                                 │
└─────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. Blockchain Core (`src/core/`)

#### Block.ts
- **Purpose**: Defines block structure and mining logic
- **Key Features**:
  - Merkle tree calculation
  - Proof of Work mining
  - Block validation
  - Genesis block creation

#### Blockchain.ts
- **Purpose**: Main blockchain management
- **Key Features**:
  - Chain validation
  - UTXO management
  - Transaction pool
  - Balance calculation
  - Block explorer functionality

#### Transaction.ts
- **Purpose**: Transaction handling and validation
- **Key Features**:
  - ECDSA digital signatures
  - Input/Output management
  - Transaction validation
  - Coinbase transactions

#### Wallet.ts
- **Purpose**: Wallet management and cryptography
- **Key Features**:
  - Key pair generation
  - Address derivation
  - Private key encryption
  - Transaction creation and signing

#### P2PNetwork.ts
- **Purpose**: Peer-to-peer networking
- **Key Features**:
  - WebSocket-based communication
  - Blockchain synchronization
  - Transaction broadcasting
  - Peer discovery and management

#### MyCoinNode.ts
- **Purpose**: Main node orchestration
- **Key Features**:
  - HTTP API server
  - Component integration
  - IPC communication with frontend

### 2. Desktop Wallet (`src/wallet/`)

#### index.html
- Main application interface
- Tab-based navigation
- Modal dialogs
- Responsive design

#### styles.css
- Modern CSS styling
- Gradient backgrounds
- Card-based layouts
- Responsive breakpoints

#### renderer.js
- Frontend application logic
- IPC communication with main process
- UI state management
- Event handling

### 3. Main Process (`src/main.ts`)

- Electron main process
- Window management
- IPC handlers
- Menu system
- Node lifecycle management

## Data Flow

### 1. Wallet Creation Flow
```
User Input → Generate Keys → Encrypt Private Key → Save to File → Update UI
```

### 2. Transaction Flow
```
Create TX → Sign with Private Key → Add to Mempool → Broadcast to Peers → Mine Block → Update Chain
```

### 3. Mining Flow
```
Collect Pending TXs → Create Block → Solve PoW → Validate Block → Add to Chain → Broadcast
```

### 4. P2P Synchronization Flow
```
Connect to Peer → Query Chain Length → Request Missing Blocks → Validate → Update Local Chain
```

## Security Model

### Cryptographic Components

1. **ECDSA (secp256k1)**
   - Key pair generation
   - Transaction signing
   - Signature verification

2. **SHA-256**
   - Block hashing
   - Merkle tree construction
   - Proof of Work

3. **RIPEMD-160**
   - Address generation
   - Public key hashing

4. **AES-256**
   - Private key encryption
   - Wallet file protection

### Security Measures

1. **Private Key Protection**
   - Never transmitted over network
   - Encrypted at rest
   - User-controlled passphrases

2. **Transaction Validation**
   - Digital signature verification
   - Double-spend prevention
   - Balance validation

3. **Network Security**
   - Proof of Work consensus
   - Block validation
   - Peer verification

## Database Schema

### UTXO Set Structure
```typescript
interface UTXO {
  txHash: string;      // Transaction hash
  outputIndex: number; // Output index in transaction
  address: string;     // Owner address
  amount: number;      // Coin amount
}
```

### Block Structure
```typescript
interface Block {
  index: number;           // Block number
  timestamp: number;       // Creation time
  transactions: Transaction[]; // Block transactions
  previousHash: string;    // Previous block hash
  nonce: number;          // Proof of Work nonce
  hash: string;           // Block hash
  merkleRoot: string;     // Merkle tree root
  difficulty: number;     // Mining difficulty
}
```

### Transaction Structure
```typescript
interface Transaction {
  hash: string;           // Transaction hash
  timestamp: number;      // Creation time
  inputs: TransactionInput[];  // Input references
  outputs: TransactionOutput[]; // Output destinations
  fee: number;           // Transaction fee
}
```

## API Endpoints

### Blockchain API
- `GET /blocks` - Get all blocks
- `GET /block/:hash` - Get specific block
- `GET /transaction/:hash` - Get specific transaction
- `GET /stats` - Get blockchain statistics

### Wallet API
- `GET /balance/:address` - Get address balance
- `GET /transactions/:address` - Get transaction history
- `POST /transaction` - Submit new transaction
- `POST /mine` - Mine new block

### Network API
- `GET /peers` - Get connected peers
- `POST /peers` - Connect to new peer

## Configuration

### Default Settings
- **HTTP Port**: 3001
- **P2P Port**: 6001
- **Mining Reward**: 50 MYC
- **Block Difficulty**: 4
- **Transaction Fee**: 1 MYC

### Customization
Settings can be modified in the node configuration or through environment variables.

## Performance Considerations

### Optimization Strategies

1. **UTXO Indexing**
   - Fast balance lookups
   - Efficient transaction validation
   - Memory-optimized storage

2. **Block Validation**
   - Parallel transaction verification
   - Cached validation results
   - Incremental updates

3. **P2P Networking**
   - Connection pooling
   - Message batching
   - Bandwidth optimization

### Scalability Limits

- **Transaction Throughput**: ~10 TPS (limited by PoW)
- **Block Size**: No hard limit (memory constrained)
- **Network Peers**: ~50 concurrent connections
- **Blockchain Size**: Limited by disk space

## Future Enhancements

### Planned Features

1. **Proof of Stake**
   - Alternative consensus mechanism
   - Energy efficiency
   - Faster block times

2. **Smart Contracts**
   - Programmable transactions
   - Decentralized applications
   - Virtual machine integration

3. **Mobile Wallet**
   - React Native implementation
   - Cross-platform compatibility
   - Simplified interface

4. **Advanced Features**
   - Multi-signature wallets
   - Hardware wallet support
   - Lightning Network integration

## Testing Strategy

### Unit Tests
- Core component testing
- Cryptographic function validation
- Edge case handling

### Integration Tests
- End-to-end transaction flow
- P2P network simulation
- Blockchain synchronization

### Security Tests
- Cryptographic security audit
- Network attack simulation
- Wallet security validation

This architecture provides a solid foundation for a production-ready cryptocurrency system while maintaining educational clarity and extensibility.
