# Hướng dẫn Sử dụng MyCoin - Chi tiết

## 📋 Mục lục
1. [Khởi động Hệ thống](#khởi-động-hệ-thống)
2. [Tạo Ví Mới](#tạo-ví-mới)
3. [Truy cập Ví Hiện có](#truy-cập-ví-hiện-có)
4. [Gửi Giao dịch](#gửi-giao-dịch)
5. [Khám phá Blockchain](#khám-phá-blockchain)
6. [Mining](#mining)
7. [Bảo mật](#bảo-mật)
8. [Troubleshooting](#troubleshooting)

## 🚀 Khởi động Hệ thống

### Bước 1: Cài đặt Dependencies
```bash
npm install
```

### Bước 2: Build Project
```bash
npm run build
```

### Bước 3: Khởi động Server
```bash
npm start
```

Sau khi khởi động thành công, bạn sẽ thấy:
```
🚀 MyCoin Web Server started on port 8080
📱 Web Interface: http://localhost:8080
🔗 API Endpoint: http://localhost:8080/api
⛏️  Blockchain API: http://localhost:3002
🌐 P2P Network: ws://localhost:6001
```

### Bước 4: Truy cập Web Interface
Mở trình duyệt và truy cập: http://localhost:8080

## 💼 Tạo Ví Mới

### Bước 1: Chọn "Create New Wallet"
- Click vào card "Create New Wallet" trên trang chủ

### Bước 2: Đặt Mật khẩu
- Nhập mật khẩu mạnh (ít nhất 8 ký tự, có chữ hoa, chữ thường, số)
- Xác nhận mật khẩu
- Hệ thống sẽ hiển thị độ mạnh mật khẩu

### Bước 3: Tạo Ví
- Click "Generate Wallet"
- Hệ thống sẽ tạo:
  - Private Key (64 ký tự hex)
  - Mnemonic Phrase (12 từ)
  - Public Address
  - QR Code

### Bước 4: Backup Thông tin
⚠️ **QUAN TRỌNG**: Lưu thông tin sau một cách an toàn:
- **Private Key**: Cần để truy cập ví
- **Mnemonic Phrase**: Để khôi phục ví
- **Keystore File**: Nếu chọn lưu với mật khẩu

### Bước 5: Nhận Initial Funds
- Ví mới sẽ tự động nhận 5 MYC để test
- Kiểm tra balance trong dashboard

## 🔑 Truy cập Ví Hiện có

### Phương pháp 1: Private Key
1. Chọn "Access My Wallet"
2. Chọn tab "Private Key"
3. Nhập private key (64 ký tự hex)
4. Click "Access Wallet"

### Phương pháp 2: Mnemonic Phrase
1. Chọn tab "Mnemonic"
2. Nhập 12 từ mnemonic phrase
3. Click "Access Wallet"

### Phương pháp 3: Keystore File
1. Chọn tab "Keystore File"
2. Upload file .json
3. Nhập mật khẩu keystore
4. Click "Access Wallet"

## 💸 Gửi Giao dịch

### Bước 1: Mở Send Modal
- Trong dashboard ví, click nút "Send"

### Bước 2: Nhập Thông tin
- **Recipient Address**: Địa chỉ ví người nhận
- **Amount**: Số lượng MYC muốn gửi
- **Transaction Fee**: Phí giao dịch (mặc định 1 MYC)

### Bước 3: Kiểm tra Summary
- Hệ thống hiển thị tổng kết:
  - Amount: Số tiền gửi
  - Fee: Phí giao dịch
  - Total: Tổng cộng

### Bước 4: Xác nhận Giao dịch
- Click "Send Transaction"
- Giao dịch sẽ được ký và broadcast
- Theo dõi trạng thái trong Transaction History

## 🔍 Khám phá Blockchain

### Truy cập Block Explorer
- Click "Explorer" trong menu chính

### Tìm kiếm
Bạn có thể tìm kiếm theo:
- **Transaction Hash**: Hash giao dịch (64 ký tự)
- **Block Number**: Số thứ tự block
- **Address**: Địa chỉ ví

### Xem Thống kê Mạng
Explorer hiển thị:
- Current Block: Block hiện tại
- Total Transactions: Tổng số giao dịch
- Network Difficulty: Độ khó mining
- Pending Transactions: Giao dịch chờ xử lý

### Xem Latest Blocks
- Danh sách blocks mới nhất
- Click vào block để xem chi tiết
- Xem tất cả transactions trong block

### Xem Latest Transactions
- Danh sách giao dịch mới nhất
- Click để xem chi tiết giao dịch
- Thông tin inputs/outputs

## ⛏️ Mining

### Mining qua API
```bash
curl -X POST http://localhost:3002/api/mining/mine \
  -H "Content-Type: application/json" \
  -d '{"minerAddress": "YOUR_WALLET_ADDRESS"}'
```

### Mining Rewards
- Mỗi block được mine thành công nhận 50 MYC
- Phí giao dịch trong block cũng thuộc về miner

### Proof of Work vs Proof of Stake
- **PoW**: Sử dụng computational power
- **PoS**: Sử dụng stake amount (đang phát triển)

## 🔒 Bảo mật

### Best Practices
1. **Không bao giờ chia sẻ Private Key**
2. **Backup Mnemonic Phrase** ở nơi an toàn
3. **Sử dụng mật khẩu mạnh** cho keystore
4. **Kiểm tra địa chỉ** trước khi gửi
5. **Không truy cập** từ máy tính công cộng

### Mã hóa
- Private keys được mã hóa AES-256-GCM
- Mnemonic phrases tuân theo BIP39 standard
- Giao dịch được ký bằng ECDSA

### Network Security
- CORS protection
- Rate limiting
- Input validation
- HTTPS support (production)

## 🔧 Troubleshooting

### Lỗi thường gặp

#### 1. "Insufficient balance"
- **Nguyên nhân**: Không đủ MYC để gửi
- **Giải pháp**: Kiểm tra balance, giảm amount hoặc fee

#### 2. "Invalid private key"
- **Nguyên nhân**: Private key không đúng format
- **Giải pháp**: Kiểm tra private key (64 ký tự hex)

#### 3. "Transaction failed"
- **Nguyên nhân**: Lỗi network hoặc validation
- **Giải pháp**: Thử lại sau vài phút

#### 4. "Wallet not found"
- **Nguyên nhân**: Địa chỉ ví không tồn tại
- **Giải pháp**: Kiểm tra địa chỉ, tạo ví mới nếu cần

### Debug Mode
```bash
# Chạy với debug logs
DEBUG=* npm start
```

### Kiểm tra API Health
```bash
curl http://localhost:8080/health
curl http://localhost:3002/api/blockchain/stats
```

### Reset Blockchain Data
```bash
# Xóa data để reset (cẩn thận!)
rm -rf data/
npm start
```

## 📞 Hỗ trợ

### Log Files
- Server logs: Console output
- Error logs: Trong terminal

### API Testing
Sử dụng Postman hoặc curl để test API endpoints

### Community Support
- GitHub Issues: [Report bugs](https://github.com/VinkRasengan/Blockchain/issues)
- Documentation: Xem các file .md trong project

---

**💡 Tip**: Luôn backup wallet information trước khi thực hiện bất kỳ thao tác nào!
