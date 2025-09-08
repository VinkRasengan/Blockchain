import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { ec as EC } from 'elliptic';
import { Transaction, TransactionInput, TransactionOutput } from './Transaction';
import { Blockchain, UTXO } from './Blockchain';

const ec = new EC('secp256k1');

export interface WalletData {
  address: string;
  publicKey: string;
  privateKey: string; // Encrypted
  createdAt: number;
}

export class Wallet {
  private keyPair: any;
  public address: string;
  public publicKey: string;
  private privateKey: string;

  constructor(privateKey?: string) {
    if (privateKey) {
      this.keyPair = ec.keyFromPrivate(privateKey);
      this.privateKey = privateKey;
    } else {
      this.keyPair = ec.genKeyPair();
      this.privateKey = this.keyPair.getPrivate('hex');
    }
    
    this.publicKey = this.keyPair.getPublic('hex');
    this.address = this.generateAddress();
  }

  /**
   * Tạo địa chỉ ví từ public key
   */
  private generateAddress(): string {
    const publicKeyHash = crypto
      .createHash('sha256')
      .update(this.publicKey)
      .digest();
    
    const ripemdHash = crypto
      .createHash('ripemd160')
      .update(publicKeyHash)
      .digest();
    
    // Thêm version byte (0x00 cho mainnet)
    const versionedHash = Buffer.concat([Buffer.from([0x00]), ripemdHash]);
    
    // Tính checksum
    const checksum = crypto
      .createHash('sha256')
      .update(crypto.createHash('sha256').update(versionedHash).digest())
      .digest()
      .slice(0, 4);
    
    // Kết hợp và encode base58
    const fullHash = Buffer.concat([versionedHash, checksum]);
    return this.base58Encode(fullHash);
  }

  /**
   * Base58 encoding (simplified version)
   */
  private base58Encode(buffer: Buffer): string {
    const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    let result = '';
    let num = BigInt('0x' + buffer.toString('hex'));
    
    while (num > 0) {
      const remainder = num % 58n;
      result = alphabet[Number(remainder)] + result;
      num = num / 58n;
    }
    
    // Add leading zeros
    for (let i = 0; i < buffer.length && buffer[i] === 0; i++) {
      result = '1' + result;
    }
    
    return result;
  }

  /**
   * Lấy private key (sử dụng cẩn thận)
   */
  getPrivateKey(): string {
    return this.privateKey;
  }
  encryptPrivateKey(passphrase: string): string {
    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync(passphrase, 'salt', 32);
    const iv = crypto.randomBytes(16);

    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(this.privateKey, 'hex', 'hex');
    encrypted += cipher.final('hex');

    // Prepend IV to encrypted data
    return iv.toString('hex') + ':' + encrypted;
  }

  /**
   * Giải mã private key với passphrase
   */
  static decryptPrivateKey(encryptedPrivateKey: string, passphrase: string): string {
    try {
      const algorithm = 'aes-256-cbc';
      const key = crypto.scryptSync(passphrase, 'salt', 32);

      // Extract IV and encrypted data
      const parts = encryptedPrivateKey.split(':');
      if (parts.length !== 2) {
        // Fallback for old format (without IV)
        const decipher = crypto.createDecipher('aes-256-cbc', passphrase);
        let decrypted = decipher.update(encryptedPrivateKey, 'hex', 'hex');
        decrypted += decipher.final('hex');
        return decrypted;
      }

      const iv = Buffer.from(parts[0], 'hex');
      const encryptedData = parts[1];

      const decipher = crypto.createDecipheriv(algorithm, key, iv);
      let decrypted = decipher.update(encryptedData, 'hex', 'hex');
      decrypted += decipher.final('hex');
      return decrypted;
    } catch (error) {
      throw new Error('Invalid passphrase');
    }
  }

  /**
   * Lưu ví vào file (encrypted)
   */
  saveToFile(filePath: string, passphrase: string): WalletData {
    const walletData: WalletData = {
      address: this.address,
      publicKey: this.publicKey,
      privateKey: this.encryptPrivateKey(passphrase),
      createdAt: Date.now()
    };

    // Tạo thư mục wallets nếu chưa tồn tại
    const walletsDir = path.join(process.cwd(), 'data', 'wallets');
    if (!fs.existsSync(walletsDir)) {
      fs.mkdirSync(walletsDir, { recursive: true });
    }

    // Tạo tên file nếu không được cung cấp
    const fileName = filePath || `wallet-${this.address.substring(0, 8)}-${Date.now()}.json`;
    const fullPath = path.join(walletsDir, fileName);

    try {
      fs.writeFileSync(fullPath, JSON.stringify(walletData, null, 2));
      console.log(`Wallet saved to: ${fullPath}`);
    } catch (error) {
      console.error('Error saving wallet to file:', error);
      throw new Error('Failed to save wallet to file system');
    }

    return walletData;
  }

  /**
   * Tải ví từ file
   */
  static loadFromFile(walletData: WalletData, passphrase: string): Wallet;
  static loadFromFile(filePath: string, passphrase: string): Wallet;
  static loadFromFile(dataOrPath: WalletData | string, passphrase: string): Wallet {
    let walletData: WalletData;

    if (typeof dataOrPath === 'string') {
      // Load from file path
      const fullPath = path.isAbsolute(dataOrPath) 
        ? dataOrPath 
        : path.join(process.cwd(), 'data', 'wallets', dataOrPath);
      
      try {
        const fileContent = fs.readFileSync(fullPath, 'utf8') as string;
        walletData = JSON.parse(fileContent);
      } catch (error) {
        console.error('Error loading wallet from file:', error);
        throw new Error('Failed to load wallet from file system');
      }
    } else {
      // Load from wallet data object
      walletData = dataOrPath;
    }

    const privateKey = Wallet.decryptPrivateKey(walletData.privateKey, passphrase);
    return new Wallet(privateKey);
  }

  /**
   * Lấy số dư từ blockchain
   */
  getBalance(blockchain: Blockchain): number {
    return blockchain.getBalance(this.address);
  }

  /**
   * Tạo giao dịch
   */
  createTransaction(
    recipientAddress: string,
    amount: number,
    blockchain: Blockchain,
    fee: number = 1
  ): Transaction | null {
    const balance = this.getBalance(blockchain);
    
    if (balance < amount + fee) {
      console.log('Insufficient balance');
      return null;
    }

    // Lấy UTXO của ví
    const utxos = blockchain.getUTXOsForAddress(this.address);
    
    // Chọn UTXO để sử dụng (simple strategy: sử dụng tất cả)
    let totalInput = 0;
    const inputs: TransactionInput[] = [];
    
    for (const utxo of utxos) {
      inputs.push({
        txHash: utxo.txHash,
        outputIndex: utxo.outputIndex
      });
      totalInput += utxo.amount;
      
      if (totalInput >= amount + fee) {
        break;
      }
    }

    // Tạo outputs
    const outputs: TransactionOutput[] = [
      {
        address: recipientAddress,
        amount: amount
      }
    ];

    // Thêm change output nếu cần
    const change = totalInput - amount - fee;
    if (change > 0) {
      outputs.push({
        address: this.address,
        amount: change
      });
    }

    // Tạo giao dịch
    const transaction = new Transaction(inputs, outputs, fee);
    
    // Ký giao dịch
    transaction.signTransaction(this.privateKey);
    
    return transaction;
  }

  /**
   * Gửi giao dịch
   */
  sendTransaction(
    recipientAddress: string,
    amount: number,
    blockchain: Blockchain,
    fee: number = 1
  ): boolean {
    const transaction = this.createTransaction(recipientAddress, amount, blockchain, fee);
    
    if (!transaction) {
      return false;
    }

    return blockchain.addTransaction(transaction);
  }

  /**
   * Lấy lịch sử giao dịch
   */
  getTransactionHistory(blockchain: Blockchain): Transaction[] {
    return blockchain.getTransactionHistory(this.address);
  }

  /**
   * Tạo ví mới với mnemonic (simplified)
   */
  static generateMnemonic(): string {
    const words = [
      'abandon', 'ability', 'able', 'about', 'above', 'absent', 'absorb', 'abstract',
      'absurd', 'abuse', 'access', 'accident', 'account', 'accuse', 'achieve', 'acid',
      'acoustic', 'acquire', 'across', 'act', 'action', 'actor', 'actress', 'actual'
    ];
    
    const mnemonic = [];
    for (let i = 0; i < 12; i++) {
      const randomIndex = Math.floor(Math.random() * words.length);
      mnemonic.push(words[randomIndex]);
    }
    
    return mnemonic.join(' ');
  }

  /**
   * Tạo ví từ mnemonic
   */
  static fromMnemonic(mnemonic: string): Wallet {
    // Simplified implementation - trong thực tế sẽ sử dụng BIP39
    const seed = crypto.createHash('sha256').update(mnemonic).digest('hex');
    return new Wallet(seed);
  }

  /**
   * Lấy thông tin ví
   */
  getInfo() {
    return {
      address: this.address,
      publicKey: this.publicKey,
      // Không trả về private key vì lý do bảo mật
    };
  }

  /**
   * Lấy danh sách các ví đã lưu
   */
  static getWalletsList(): string[] {
    const walletsDir = path.join(process.cwd(), 'data', 'wallets');
    
    if (!fs.existsSync(walletsDir)) {
      return [];
    }

    try {
      const files = fs.readdirSync(walletsDir);
      return files.filter(file => file.endsWith('.json'));
    } catch (error) {
      console.error('Error listing wallets:', error);
      return [];
    }
  }
}
