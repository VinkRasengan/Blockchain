# MyCoin Web Wallet - Frontend Desktop Application

Ứng dụng ví điện tử MyCoin với giao diện web tương tự MyEtherWallet và block explorer như Etherscan.

## 🌟 Tính năng chính

### 1. Quản lý Ví (Wallet Management)
- ✅ **Tạo ví mới** với private key và mnemonic phrase
- ✅ **Truy cập ví** qua private key, keystore file, hoặc mnemonic
- ✅ **Bảo mật cao** với mã hóa private key
- ✅ **QR Code** để chia sẻ địa chỉ ví
- ✅ **Backup và restore** ví an toàn

### 2. Giao dịch (Transactions)
- ✅ **Gửi coin** với xác thực đầy đủ
- ✅ **Xem lịch sử giao dịch** chi tiết
- ✅ **Theo dõi trạng thái** giao dịch real-time
- ✅ **Phí giao dịch** có thể tùy chỉnh
- ✅ **Balance tracking** tự động

### 3. Block Explorer (Tương tự Etherscan)
- ✅ **Tìm kiếm** block, transaction, address
- ✅ **Thống kê mạng** real-time
- ✅ **Danh sách block** và transaction mới nhất
- ✅ **Chi tiết đầy đủ** mỗi block và transaction
- ✅ **Network statistics** và monitoring

### 4. Consensus Algorithms
- ✅ **Proof of Work (PoW)** mining
- ✅ **Proof of Stake (PoS)** validation
- ✅ **Hybrid consensus** support
- ✅ **Mining rewards** và staking

## 🚀 Cách sử dụng

### Bước 1: Cài đặt và khởi động

```bash
# Clone repository
git clone <repository-url>
cd Blockchain

# Cài đặt dependencies
npm install

# Build ứng dụng
npm run build

# Khởi động web server
start-web.bat
# Hoặc
node dist/server.js
```

### Bước 2: Truy cập Web Interface

Mở trình duyệt và truy cập:
- **Web Wallet**: http://localhost:8080
- **API Documentation**: http://localhost:8080/api
- **Health Check**: http://localhost:8080/health

### Bước 3: Tạo ví mới

1. Chọn **"Create New Wallet"**
2. Nhập **password mạnh** (tối thiểu 8 ký tự)
3. Lưu **Private Key** và **Mnemonic Phrase** an toàn
4. Xác nhận đã backup và click **"Access My Wallet"**

### Bước 4: Sử dụng các tính năng

#### Gửi coin:
1. Click **"Send"** trong dashboard
2. Nhập địa chỉ người nhận
3. Nhập số lượng coin
4. Đặt phí giao dịch (mặc định: 1 MYC)
5. Xác nhận và gửi

#### Xem lịch sử:
- Lịch sử giao dịch hiển thị tự động trong dashboard
- Filter theo loại: All/Sent/Received
- Click vào giao dịch để xem chi tiết

#### Block Explorer:
1. Click **"Explorer"** trong header
2. Tìm kiếm theo:
   - Block number (ví dụ: 123)
   - Transaction hash
   - Wallet address
3. Xem thống kê mạng và block mới nhất

## 📱 Giao diện người dùng

### Trang chủ (tương tự MyEtherWallet)
- **Clean design** với gradient background
- **Card-based layout** cho các tùy chọn
- **Responsive design** cho mọi thiết bị
- **Modern UI/UX** với animations mượt mà

### Dashboard ví
- **Balance display** nổi bật
- **Quick actions**: Send/Receive
- **Transaction history** với pagination
- **Network stats** real-time
- **QR Code** cho receive payments

### Block Explorer (tương tự Etherscan)
- **Search bar** mạnh mẽ
- **Network statistics** dashboard
- **Latest blocks** và transactions
- **Detailed views** cho mọi thành phần
- **Interactive navigation**

## 🔧 API Endpoints

### Wallet Management
```
POST   /api/wallet/create       # Tạo ví mới
POST   /api/wallet/import       # Import ví
POST   /api/wallet/recover      # Recover từ mnemonic
GET    /api/wallet/mnemonic     # Generate mnemonic
GET    /api/wallet/:address/balance # Xem số dư
```

### Transactions
```
POST   /api/transaction/send    # Gửi giao dịch
GET    /api/transaction/:hash   # Chi tiết giao dịch
GET    /api/transactions/:address # Lịch sử giao dịch
GET    /api/transactions/latest # Giao dịch mới nhất
```

### Blockchain Explorer
```
GET    /api/blockchain/info     # Thông tin blockchain
GET    /api/blockchain/stats    # Thống kê mạng
GET    /api/blockchain/blocks   # Danh sách blocks
GET    /api/blockchain/search   # Tìm kiếm
GET    /api/blockchain/transactions/latest # TX mới nhất
```

## 🔐 Bảo mật

### Client-side Security
- **Private keys** được mã hóa trước khi lưu
- **Session management** an toàn
- **Input validation** nghiêm ngặt
- **XSS protection** và CSRF tokens

### Server-side Security
- **Rate limiting** cho API calls
- **Helmet.js** security headers
- **CORS** configuration
- **Input sanitization**

### Best Practices
- ⚠️ **Không bao giờ** chia sẻ private key
- 🔒 **Backup** mnemonic phrase an toàn
- 🔄 **Kiểm tra** địa chỉ trước khi gửi
- 💾 **Lưu trữ** wallet file ở nơi an toàn

## 🎥 Video Demo

### Hướng dẫn sử dụng:
1. **Tạo ví mới**: Demo quá trình tạo và backup
2. **Gửi giao dịch**: Hướng dẫn gửi coin an toàn
3. **Explorer**: Cách tìm kiếm và xem thông tin
4. **Security**: Best practices bảo mật

*Video sẽ được tạo và upload lên repository*

## 🏗️ Kiến trúc hệ thống

```
Frontend (Web Interface)
├── HTML5 + CSS3 + JavaScript
├── Responsive Design
├── QR Code Generation
└── Real-time Updates

Backend (Node.js + Express)
├── RESTful API
├── WebSocket Support
├── Security Middleware
└── Error Handling

Blockchain Core
├── Transaction Processing
├── Block Mining (PoW/PoS)
├── P2P Network
└── UTXO Management
```

## 🚧 Development

### Cấu trúc thư mục:
```
public/              # Frontend files
├── index.html      # Main HTML file
├── css/styles.css  # Stylesheet
└── js/            # JavaScript modules
    ├── wallet.js  # Wallet functionality
    ├── explorer.js # Block explorer
    └── main.js    # Main application

src/               # Backend TypeScript
├── core/          # Blockchain core
├── routes/        # API routes
└── server.ts      # Main server file
```

### Build commands:
```bash
npm run build      # Compile TypeScript
npm run dev        # Development mode
npm run test       # Run tests
npm start          # Production start
```

## 📚 Tài liệu tham khảo

### External Libraries:
- **Express.js**: Web server framework
- **Elliptic**: Cryptographic functions
- **QR Code**: QR code generation
- **Chart.js**: Statistics visualization

### Blockchain Concepts:
- **UTXO Model**: Unspent Transaction Outputs
- **Digital Signatures**: ECDSA signing
- **Merkle Trees**: Block verification
- **Consensus Algorithms**: PoW & PoS

## 📝 Changelog

### Version 1.0.0 (Current)
- ✅ Web wallet interface
- ✅ Block explorer
- ✅ Transaction management  
- ✅ Mining support
- ✅ P2P network
- ✅ API documentation

### Planned Features:
- 🔄 Multi-signature wallets
- 📊 Advanced analytics
- 🌐 Mobile responsive
- 🔗 Hardware wallet support

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines:

1. Fork repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## 📞 Support

Nếu gặp vấn đề:
- 📧 Email: support@mycoin.dev
- 💬 GitHub Issues: [Link to issues]
- 📖 Documentation: [Link to docs]

## 📄 License

MIT License - xem file [LICENSE](LICENSE) để biết chi tiết.

---

**MyCoin Team** - Building the future of decentralized finance! 🚀
