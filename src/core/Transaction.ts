import * as crypto from 'crypto';
import { ec as EC } from 'elliptic';

const ec = new EC('secp256k1');

export interface TransactionInput {
  txHash: string;
  outputIndex: number;
  signature?: string;
  publicKey?: string;
}

export interface TransactionOutput {
  address: string;
  amount: number;
}

export class Transaction {
  public hash: string;
  public timestamp: number;
  public inputs: TransactionInput[];
  public outputs: TransactionOutput[];
  public fee: number;

  constructor(
    inputs: TransactionInput[],
    outputs: TransactionOutput[],
    fee: number = 0
  ) {
    this.inputs = inputs;
    this.outputs = outputs;
    this.fee = fee;
    this.timestamp = Date.now();
    this.hash = this.calculateHash();
  }

  /**
   * Tính toán hash của giao dịch
   */
  calculateHash(): string {
    const data = JSON.stringify({
      inputs: this.inputs.map(input => ({
        txHash: input.txHash,
        outputIndex: input.outputIndex
      })),
      outputs: this.outputs,
      fee: this.fee,
      timestamp: this.timestamp
    });
    
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Ký giao dịch với private key
   */
  signTransaction(privateKey: string): void {
    const keyPair = ec.keyFromPrivate(privateKey);
    const publicKey = keyPair.getPublic('hex');
    
    // Tạo signature cho từng input
    this.inputs.forEach(input => {
      const dataToSign = this.hash + input.txHash + input.outputIndex;
      const signature = keyPair.sign(dataToSign);
      input.signature = signature.toDER('hex');
      input.publicKey = publicKey;
    });
  }

  /**
   * Xác minh chữ ký của giao dịch
   */
  verifySignature(): boolean {
    for (const input of this.inputs) {
      if (!input.signature || !input.publicKey) {
        return false;
      }

      try {
        const keyPair = ec.keyFromPublic(input.publicKey, 'hex');
        const dataToSign = this.hash + input.txHash + input.outputIndex;
        const isValid = keyPair.verify(dataToSign, input.signature);
        
        if (!isValid) {
          return false;
        }
      } catch (error) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * Tính tổng số tiền đầu vào
   */
  getTotalInputAmount(): number {
    // Trong thực tế, cần tra cứu UTXO để lấy giá trị thực
    // Đây là implementation đơn giản
    return this.outputs.reduce((sum, output) => sum + output.amount, 0) + this.fee;
  }

  /**
   * Tính tổng số tiền đầu ra
   */
  getTotalOutputAmount(): number {
    return this.outputs.reduce((sum, output) => sum + output.amount, 0);
  }

  /**
   * Kiểm tra tính hợp lệ của giao dịch
   */
  isValid(): boolean {
    // Kiểm tra hash
    if (this.hash !== this.calculateHash()) {
      return false;
    }

    // Kiểm tra chữ ký
    if (!this.verifySignature()) {
      return false;
    }

    // Kiểm tra số dư (input >= output + fee)
    const totalInput = this.getTotalInputAmount();
    const totalOutput = this.getTotalOutputAmount();
    
    if (totalInput < totalOutput + this.fee) {
      return false;
    }

    // Kiểm tra số tiền không âm
    for (const output of this.outputs) {
      if (output.amount <= 0) {
        return false;
      }
    }

    return true;
  }

  /**
   * Tạo giao dịch coinbase (thưởng cho miner)
   */
  static createCoinbaseTransaction(minerAddress: string, reward: number): Transaction {
    const coinbaseInput: TransactionInput = {
      txHash: '0'.repeat(64),
      outputIndex: -1
    };

    const coinbaseOutput: TransactionOutput = {
      address: minerAddress,
      amount: reward
    };

    return new Transaction([coinbaseInput], [coinbaseOutput], 0);
  }
}
