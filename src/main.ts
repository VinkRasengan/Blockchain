import { app, BrowserWindow, ipcMain, Menu } from 'electron';
import * as path from 'path';
import { MyCoinNode } from './core/MyCoinNode';
import { Wallet } from './core/Wallet';

class MyCoinApp {
  private mainWindow: BrowserWindow | null = null;
  private node: MyCoinNode;

  constructor() {
    // Khởi tạo node với port mặc định
    this.node = new MyCoinNode(3001, 6001);
    this.setupElectron();
    this.setupIPC();
  }

  private setupElectron(): void {
    // Đảm bảo chỉ có một instance
    const gotTheLock = app.requestSingleInstanceLock();
    
    if (!gotTheLock) {
      app.quit();
      return;
    }

    app.on('second-instance', () => {
      if (this.mainWindow) {
        if (this.mainWindow.isMinimized()) this.mainWindow.restore();
        this.mainWindow.focus();
      }
    });

    app.whenReady().then(() => {
      this.createWindow();
      this.startNode();
    });

    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        this.node.close();
        app.quit();
      }
    });

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        this.createWindow();
      }
    });
  }

  private createWindow(): void {
    this.mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
        enableRemoteModule: true
      },
      icon: path.join(__dirname, '../assets/icon.png'),
      title: 'MyCoin Wallet'
    });

    // Load the wallet UI
    this.mainWindow.loadFile(path.join(__dirname, '../wallet/index.html'));

    // Open DevTools in development
    if (process.env.NODE_ENV === 'development') {
      this.mainWindow.webContents.openDevTools();
    }

    // Setup menu
    this.setupMenu();
  }

  private setupMenu(): void {
    const template: any[] = [
      {
        label: 'File',
        submenu: [
          {
            label: 'New Wallet',
            accelerator: 'CmdOrCtrl+N',
            click: () => {
              this.mainWindow?.webContents.send('menu-new-wallet');
            }
          },
          {
            label: 'Load Wallet',
            accelerator: 'CmdOrCtrl+O',
            click: () => {
              this.mainWindow?.webContents.send('menu-load-wallet');
            }
          },
          { type: 'separator' },
          {
            label: 'Exit',
            accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
            click: () => {
              app.quit();
            }
          }
        ]
      },
      {
        label: 'Wallet',
        submenu: [
          {
            label: 'Send MyCoin',
            accelerator: 'CmdOrCtrl+S',
            click: () => {
              this.mainWindow?.webContents.send('menu-send-transaction');
            }
          },
          {
            label: 'Receive MyCoin',
            accelerator: 'CmdOrCtrl+R',
            click: () => {
              this.mainWindow?.webContents.send('menu-receive');
            }
          },
          {
            label: 'Transaction History',
            accelerator: 'CmdOrCtrl+H',
            click: () => {
              this.mainWindow?.webContents.send('menu-transaction-history');
            }
          }
        ]
      },
      {
        label: 'Network',
        submenu: [
          {
            label: 'Connect to Peer',
            click: () => {
              this.mainWindow?.webContents.send('menu-connect-peer');
            }
          },
          {
            label: 'View Peers',
            click: () => {
              this.mainWindow?.webContents.send('menu-view-peers');
            }
          },
          {
            label: 'Mine Block',
            click: () => {
              this.mainWindow?.webContents.send('menu-mine-block');
            }
          }
        ]
      },
      {
        label: 'Help',
        submenu: [
          {
            label: 'About MyCoin',
            click: () => {
              this.mainWindow?.webContents.send('menu-about');
            }
          }
        ]
      }
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
  }

  private setupIPC(): void {
    // Wallet operations
    ipcMain.handle('create-wallet', async () => {
      try {
        const wallet = new Wallet();
        const mnemonic = Wallet.generateMnemonic();
        
        return {
          success: true,
          data: {
            address: wallet.address,
            publicKey: wallet.publicKey,
            mnemonic: mnemonic
          }
        };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle('load-wallet', async (event, { privateKey, mnemonic }) => {
      try {
        let wallet: Wallet;
        if (privateKey) {
          wallet = new Wallet(privateKey);
        } else if (mnemonic) {
          wallet = Wallet.fromMnemonic(mnemonic);
        } else {
          throw new Error('Private key or mnemonic required');
        }

        return {
          success: true,
          data: wallet.getInfo()
        };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    // Blockchain operations
    ipcMain.handle('get-balance', async (event, address) => {
      try {
        const balance = this.node.getBlockchain().getBalance(address);
        return { success: true, data: balance };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle('get-transaction-history', async (event, address) => {
      try {
        const transactions = this.node.getBlockchain().getTransactionHistory(address);
        return { success: true, data: transactions };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle('send-transaction', async (event, { recipientAddress, amount, fee, privateKey }) => {
      try {
        const wallet = new Wallet(privateKey);
        const success = wallet.sendTransaction(recipientAddress, amount, this.node.getBlockchain(), fee);
        
        if (success) {
          return { success: true, message: 'Transaction sent successfully' };
        } else {
          return { success: false, error: 'Transaction failed' };
        }
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle('mine-block', async (event, minerAddress) => {
      try {
        const newBlock = this.node.getBlockchain().minePendingTransactions(minerAddress);
        this.node.getP2PNetwork().broadcastNewBlock(newBlock);
        return { success: true, data: newBlock };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle('get-blockchain-stats', async () => {
      try {
        const stats = this.node.getBlockchain().getStats();
        return { success: true, data: stats };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle('get-peers', async () => {
      try {
        const peers = this.node.getP2PNetwork().getPeers();
        return { success: true, data: peers };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle('connect-to-peer', async (event, peerUrl) => {
      try {
        this.node.connectToPeer(peerUrl);
        return { success: true, message: `Connecting to ${peerUrl}` };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });
  }

  private startNode(): void {
    this.node.start();
    console.log('MyCoin node started successfully');
  }
}

// Khởi tạo ứng dụng
new MyCoinApp();
