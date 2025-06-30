# MyCoin API Documentation

## Overview

MyCoin provides a RESTful HTTP API for interacting with the blockchain and wallet functionality. The API runs on port 3001 by default.

Base URL: `http://localhost:3001`

## Authentication

Currently, the API does not require authentication for read operations. Write operations (transactions, mining) require valid signatures or private keys.

## Blockchain Endpoints

### Get All Blocks

```http
GET /blocks
```

Returns the complete blockchain.

**Response:**
```json
[
  {
    "index": 0,
    "timestamp": 1640995200000,
    "transactions": [...],
    "previousHash": "0",
    "nonce": 12345,
    "hash": "000abc123...",
    "merkleRoot": "def456...",
    "difficulty": 4
  }
]
```

### Get Block by Hash

```http
GET /block/:hash
```

**Parameters:**
- `hash` (string): Block hash

**Response:**
```json
{
  "index": 1,
  "timestamp": 1640995260000,
  "transactions": [...],
  "previousHash": "000abc123...",
  "nonce": 67890,
  "hash": "000def456...",
  "merkleRoot": "ghi789...",
  "difficulty": 4
}
```

**Error Response:**
```json
{
  "error": "Block not found"
}
```

### Get Transaction by Hash

```http
GET /transaction/:hash
```

**Parameters:**
- `hash` (string): Transaction hash

**Response:**
```json
{
  "hash": "abc123def456...",
  "timestamp": 1640995200000,
  "inputs": [
    {
      "txHash": "prev_tx_hash",
      "outputIndex": 0,
      "signature": "signature_data",
      "publicKey": "public_key_data"
    }
  ],
  "outputs": [
    {
      "address": "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
      "amount": 50
    }
  ],
  "fee": 1
}
```

### Get Blockchain Statistics

```http
GET /stats
```

**Response:**
```json
{
  "totalBlocks": 10,
  "totalTransactions": 25,
  "difficulty": 4,
  "miningReward": 50,
  "pendingTransactions": 3,
  "totalUTXOs": 15
}
```

## Wallet Endpoints

### Get Address Balance

```http
GET /balance/:address
```

**Parameters:**
- `address` (string): Wallet address

**Response:**
```json
{
  "address": "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
  "balance": 150.5
}
```

### Get Transaction History

```http
GET /transactions/:address
```

**Parameters:**
- `address` (string): Wallet address

**Response:**
```json
[
  {
    "hash": "abc123...",
    "timestamp": 1640995200000,
    "inputs": [...],
    "outputs": [...],
    "fee": 1
  }
]
```

### Get UTXOs for Address

```http
GET /utxos/:address
```

**Parameters:**
- `address` (string): Wallet address

**Response:**
```json
[
  {
    "txHash": "abc123...",
    "outputIndex": 0,
    "address": "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
    "amount": 50
  }
]
```

### Submit Transaction

```http
POST /transaction
```

**Request Body:**
```json
{
  "inputs": [
    {
      "txHash": "prev_tx_hash",
      "outputIndex": 0,
      "signature": "signature_data",
      "publicKey": "public_key_data"
    }
  ],
  "outputs": [
    {
      "address": "recipient_address",
      "amount": 25
    },
    {
      "address": "change_address",
      "amount": 24
    }
  ],
  "fee": 1
}
```

**Response:**
```json
{
  "success": true,
  "hash": "new_transaction_hash"
}
```

**Error Response:**
```json
{
  "error": "Invalid transaction"
}
```

### Mine Block

```http
POST /mine
```

**Request Body:**
```json
{
  "minerAddress": "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"
}
```

**Response:**
```json
{
  "success": true,
  "block": {
    "index": 5,
    "timestamp": 1640995500000,
    "transactions": [...],
    "previousHash": "000abc123...",
    "nonce": 123456,
    "hash": "000def456...",
    "merkleRoot": "ghi789...",
    "difficulty": 4
  }
}
```

### Get Pending Transactions

```http
GET /pending-transactions
```

**Response:**
```json
[
  {
    "hash": "pending_tx_hash",
    "timestamp": 1640995400000,
    "inputs": [...],
    "outputs": [...],
    "fee": 1
  }
]
```

## Network Endpoints

### Get Connected Peers

```http
GET /peers
```

**Response:**
```json
[
  {
    "url": "ws://192.168.1.100:6001",
    "connected": true
  },
  {
    "url": "ws://192.168.1.101:6001",
    "connected": false
  }
]
```

### Connect to Peer

```http
POST /peers
```

**Request Body:**
```json
{
  "peerUrl": "ws://192.168.1.102:6001"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Connecting to ws://192.168.1.102:6001"
}
```

## Wallet Management Endpoints

### Create New Wallet

```http
POST /wallet/create
```

**Response:**
```json
{
  "address": "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
  "publicKey": "04a1b2c3d4...",
  "mnemonic": "abandon ability able about above absent absorb abstract absurd abuse access accident"
}
```

### Load Wallet

```http
POST /wallet/load
```

**Request Body (Private Key):**
```json
{
  "privateKey": "a1b2c3d4e5f6..."
}
```

**Request Body (Mnemonic):**
```json
{
  "mnemonic": "abandon ability able about above absent absorb abstract absurd abuse access accident"
}
```

**Response:**
```json
{
  "address": "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
  "publicKey": "04a1b2c3d4..."
}
```

### Send Transaction

```http
POST /wallet/send
```

**Request Body:**
```json
{
  "recipientAddress": "1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2",
  "amount": 25.5,
  "fee": 1
}
```

**Response:**
```json
{
  "success": true,
  "message": "Transaction sent"
}
```

### Get Wallet Balance

```http
GET /wallet/balance
```

**Response:**
```json
{
  "balance": 150.5
}
```

### Get Wallet Transactions

```http
GET /wallet/transactions
```

**Response:**
```json
[
  {
    "hash": "abc123...",
    "timestamp": 1640995200000,
    "inputs": [...],
    "outputs": [...],
    "fee": 1
  }
]
```

### Get Wallet Info

```http
GET /wallet/info
```

**Response:**
```json
{
  "address": "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
  "publicKey": "04a1b2c3d4..."
}
```

## Error Handling

All endpoints return appropriate HTTP status codes:

- `200` - Success
- `400` - Bad Request (invalid parameters)
- `404` - Not Found (resource doesn't exist)
- `500` - Internal Server Error

Error responses include a descriptive message:

```json
{
  "error": "Description of the error"
}
```

## Rate Limiting

Currently, no rate limiting is implemented. In production, consider implementing rate limiting for security.

## WebSocket API (P2P)

The P2P network uses WebSocket connections on port 6001. Messages follow this format:

```json
{
  "type": "MESSAGE_TYPE",
  "data": { ... }
}
```

### Message Types

- `QUERY_LATEST` - Request latest block
- `QUERY_ALL` - Request entire blockchain
- `RESPONSE_BLOCKCHAIN` - Blockchain data response
- `NEW_TRANSACTION` - Broadcast new transaction
- `NEW_BLOCK` - Broadcast new block
- `QUERY_TRANSACTION_POOL` - Request pending transactions
- `RESPONSE_TRANSACTION_POOL` - Pending transactions response

## SDK Usage Examples

### JavaScript/Node.js

```javascript
const axios = require('axios');

// Get blockchain stats
const stats = await axios.get('http://localhost:3001/stats');
console.log(stats.data);

// Get balance
const balance = await axios.get('http://localhost:3001/balance/1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa');
console.log(balance.data);

// Submit transaction
const tx = await axios.post('http://localhost:3001/transaction', {
  inputs: [...],
  outputs: [...],
  fee: 1
});
console.log(tx.data);
```

### Python

```python
import requests

# Get blockchain stats
response = requests.get('http://localhost:3001/stats')
stats = response.json()
print(stats)

# Get balance
response = requests.get('http://localhost:3001/balance/1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa')
balance = response.json()
print(balance)
```

### cURL

```bash
# Get blockchain stats
curl http://localhost:3001/stats

# Get balance
curl http://localhost:3001/balance/1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa

# Submit transaction
curl -X POST http://localhost:3001/transaction \
  -H "Content-Type: application/json" \
  -d '{"inputs":[...],"outputs":[...],"fee":1}'
```
