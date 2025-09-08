# MyCoin - Hệ thống Tiền điện tử Hoàn chỉnh

![MyCoin Logo](https://img.shields.io/badge/MyCoin-Blockchain-blue?style=for-the-badge&logo=bitcoin)
![Version](https://img.shields.io/badge/version-1.0.0-green?style=for-the-badge)
![License](https://img.shields.io/badge/license-MIT-yellow?style=for-the-badge)

## 🌟 Tổng quan

MyCoin là một hệ thống tiền điện tử hoàn chỉnh được xây dựng từ đầu, bao gồm:

- **Blockchain Core**: Hệ thống blockchain với thuật toán Proof of Work và Proof of Stake
- **Web Wallet**: Giao diện ví điện tử tương tự MyEtherWallet
- **Block Explorer**: Trình khám phá blockchain giống Etherscan
- **P2P Network**: Mạng ngang hàng để đồng bộ dữ liệu
- **RESTful API**: API đầy đủ cho tất cả chức năng

## 🚀 Tính năng chính

### 💼 Quản lý Ví (Wallet Management)
- ✅ **Tạo ví mới** với private key và mnemonic phrase (12 từ)
- ✅ **Truy cập ví** qua private key, keystore file, hoặc mnemonic
- ✅ **Bảo mật cao** với mã hóa AES-256-GCM
- ✅ **QR Code** để chia sẻ địa chỉ ví
- ✅ **Backup và restore** ví an toàn
- ✅ **Quản lý nhiều ví** với danh sách ví đã lưu

### 💸 Giao dịch (Transactions)
- ✅ **Gửi coin** với xác thực chữ ký số ECDSA
- ✅ **Xem lịch sử giao dịch** chi tiết với phân trang
- ✅ **Theo dõi trạng thái** giao dịch real-time
- ✅ **Phí giao dịch** có thể tùy chỉnh
- ✅ **UTXO Management** tự động
- ✅ **Balance tracking** chính xác

### 🔍 Block Explorer (Tương tự Etherscan)
- ✅ **Tìm kiếm** theo hash, địa chỉ, block number
- ✅ **Xem chi tiết block** với tất cả transactions
- ✅ **Lịch sử giao dịch** của địa chỉ
- ✅ **Thống kê mạng** real-time
- ✅ **Latest blocks** và transactions
- ✅ **Network difficulty** và mining stats

### ⛏️ Mining & Consensus
- ✅ **Proof of Work (PoW)** với SHA-256
- ✅ **Proof of Stake (PoS)** cho tiết kiệm năng lượng
- ✅ **Dynamic difficulty adjustment**
- ✅ **Mining rewards** tự động
- ✅ **Block validation** đầy đủ

### 🌐 Network & API
- ✅ **P2P Network** với WebSocket
- ✅ **RESTful API** hoàn chỉnh
- ✅ **Real-time updates** qua WebSocket
- ✅ **CORS support** cho web applications
- ✅ **Rate limiting** và security middleware

## 🛠️ Cài đặt và Chạy

### Yêu cầu hệ thống
- Node.js >= 18.0.0
- npm >= 8.0.0
- Git

### Cài đặt
```bash
# Clone repository
git clone https://github.com/VinkRasengan/Blockchain.git
cd Blockchain

# Cài đặt dependencies
npm install

# Build project
npm run build

# Chạy server
npm start
```

### Chạy Development Mode
```bash
# Chạy với auto-reload
npm run dev
```

### Truy cập ứng dụng
- **Web Interface**: http://localhost:8080
- **API Endpoint**: http://localhost:8080/api
- **Blockchain API**: http://localhost:3002
- **P2P Network**: ws://localhost:6001

## 🧪 Testing

### Chạy test tự động
```bash
node test-pos.js
```

Test suite sẽ kiểm tra:
- ✅ **Blockchain statistics** và network stats
- ✅ **Wallet creation** với tự động cấp 5 MYC
- ✅ **Transaction sending** và mining
- ✅ **Balance verification** và transaction history
- ✅ **Proof of Work** consensus mechanism
- ⚠️ **Proof of Stake** features (có sẵn khi chuyển sang PoS mode)

### Test thủ công
```bash
# Test tạo ví
curl -X POST http://localhost:3002/api/wallet/create \
  -H "Content-Type: application/json" \
  -d '{"password":"test123"}'

# Test blockchain stats
curl http://localhost:3002/api/blockchain/stats

# Test network stats
curl http://localhost:3002/api/blockchain/network-stats
```

## 📱 Hướng dẫn sử dụng

### 1. Tạo Ví Mới
1. Truy cập http://localhost:8080
2. Chọn "Create New Wallet"
3. Đặt mật khẩu mạnh
4. Lưu private key và mnemonic phrase an toàn
5. Ví sẽ được cấp 5 MYC ban đầu để test

### 2. Truy cập Ví Hiện có
1. Chọn "Access My Wallet"
2. Nhập private key, keystore file, hoặc mnemonic
3. Xem balance và lịch sử giao dịch

### 3. Gửi Giao dịch
1. Trong dashboard ví, click "Send"
2. Nhập địa chỉ người nhận
3. Nhập số lượng MYC
4. Xác nhận giao dịch
5. Theo dõi trạng thái trong lịch sử

### 4. Khám phá Blockchain
1. Click "Explorer" trong menu
2. Tìm kiếm theo hash, địa chỉ, hoặc block
3. Xem chi tiết blocks và transactions
4. Theo dõi thống kê mạng

## 🏗️ Kiến trúc hệ thống

```
MyCoin Architecture
├── Frontend (Web Interface)
│   ├── HTML5 + CSS3 + JavaScript
│   ├── Responsive Design
│   ├── QR Code Generation
│   └── Real-time Updates
│
├── Backend (Node.js + Express)
│   ├── RESTful API
│   ├── WebSocket Support
│   ├── Security Middleware
│   └── Error Handling
│
├── Blockchain Core
│   ├── Transaction Processing
│   ├── Block Mining (PoW/PoS)
│   ├── P2P Network
│   ├── UTXO Management
│   └── Consensus Algorithms
│
└── Data Layer
    ├── LevelDB Storage
    ├── Blockchain Data
    ├── UTXO Set
    └── Wallet Files
```

## 📚 API Documentation

### Blockchain Endpoints
```
GET  /api/blockchain/blocks     - Lấy tất cả blocks
GET  /api/blockchain/block/:id  - Lấy chi tiết block
GET  /api/blockchain/stats      - Thống kê blockchain
POST /api/blockchain/search     - Tìm kiếm blockchain
```

### Wallet Endpoints
```
POST /api/wallet/create         - Tạo ví mới
POST /api/wallet/import         - Import ví
GET  /api/wallet/:address/info  - Thông tin ví
GET  /api/wallet/:address/balance - Số dư ví
POST /api/wallet/validate       - Validate địa chỉ
```

### Transaction Endpoints
```
POST /api/transaction/send      - Gửi giao dịch
GET  /api/transaction/:hash     - Chi tiết giao dịch
GET  /api/transaction/history/:address - Lịch sử giao dịch
GET  /api/transaction/latest    - Giao dịch mới nhất
```

### Mining Endpoints
```
POST /api/mining/mine           - Mine block mới
GET  /api/mining/stats          - Thống kê mining
GET  /api/mining/difficulty     - Độ khó hiện tại
```

## 🔒 Bảo mật

### Wallet Security
- **Private Key Encryption**: AES-256-GCM với scrypt key derivation
- **Mnemonic Generation**: BIP39 standard với entropy cao
- **Secure Storage**: Private keys không bao giờ được lưu plain text
- **Client-side Signing**: Giao dịch được ký trên client

### Network Security
- **HTTPS Support**: SSL/TLS encryption
- **CORS Protection**: Configured cho web security
- **Rate Limiting**: Chống spam và DDoS
- **Input Validation**: Validate tất cả input data

### Blockchain Security
- **Digital Signatures**: ECDSA với secp256k1 curve
- **Hash Functions**: SHA-256 cho block hashing
- **Merkle Trees**: Đảm bảo tính toàn vẹn transactions
- **Consensus Validation**: Kiểm tra đầy đủ blocks và transactions

## 🧪 Testing

```bash
# Chạy tất cả tests
npm test

# Chạy tests với coverage
npm run test:coverage

# Chạy tests trong watch mode
npm run test:watch

# Lint code
npm run lint
npm run lint:fix
```

## 📊 Performance

### Blockchain Performance
- **Block Time**: ~10 giây (có thể điều chỉnh)
- **Transaction Throughput**: ~100 TPS
- **Storage**: LevelDB cho hiệu suất cao
- **Memory Usage**: Optimized UTXO management

### Web Performance
- **Load Time**: < 2 giây
- **API Response**: < 100ms average
- **Real-time Updates**: WebSocket với low latency
- **Mobile Responsive**: Tối ưu cho mọi thiết bị

## 🤝 Đóng góp

1. Fork repository
2. Tạo feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Tạo Pull Request

## 📄 License

Dự án này được phân phối dưới MIT License. Xem `LICENSE` file để biết thêm chi tiết.

## 👥 Tác giả

- **MyCoin Team** - *Initial work* - [VinkRasengan](https://github.com/VinkRasengan)

## 🙏 Acknowledgments

- Bitcoin và Ethereum cho inspiration
- MyEtherWallet cho UI/UX reference
- Etherscan cho block explorer design
- Node.js và Express.js community
- Elliptic.js cho cryptographic functions

## 📞 Liên hệ

- GitHub: [VinkRasengan](https://github.com/VinkRasengan)
- Repository: [Blockchain](https://github.com/VinkRasengan/Blockchain)
- Issues: [Bug Reports](https://github.com/VinkRasengan/Blockchain/issues)

---

**⚠️ Lưu ý**: Đây là dự án giáo dục. Không sử dụng cho production mà không có security audit đầy đủ.