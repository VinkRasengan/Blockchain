// Main JavaScript for MyCoin Wallet
class MyCoinWallet {
    constructor() {
        this.currentWallet = null;
        this.apiBase = 'http://localhost:3002/api';
        this.miningActive = false;
        this.miningInterval = null;
        this.miningStats = {
            hashRate: 0,
            blocksMined: 0,
            totalRewards: 0
        };
        this.init();
    }

    init() {
        // Initialize event listeners
        this.setupEventListeners();
        
        // Check if wallet is already loaded
        const savedWallet = this.getStoredWallet();
        if (savedWallet) {
            this.loadWallet(savedWallet);
        }

        // Initial setup
        this.showWelcome();
    }

    setupEventListeners() {
        // Form submissions
        document.addEventListener('DOMContentLoaded', () => {
            // Password strength checker
            const passwordInput = document.getElementById('password');
            if (passwordInput) {
                passwordInput.addEventListener('input', () => this.checkPasswordStrength());
            }

            // Confirm password
            const confirmPasswordInput = document.getElementById('confirmPassword');
            if (confirmPasswordInput) {
                confirmPasswordInput.addEventListener('input', () => this.validatePasswordMatch());
            }

            // Enable access wallet button immediately
            const accessBtn = document.getElementById('accessWalletBtn');
            if (accessBtn) {
                accessBtn.disabled = false;
                console.log('Access wallet button enabled by default');
            }

            // Send amount calculation
            const sendAmountInput = document.getElementById('sendAmount');
            const transactionFeeInput = document.getElementById('transactionFee');
            if (sendAmountInput && transactionFeeInput) {
                sendAmountInput.addEventListener('input', () => this.calculateTransactionTotal());
                transactionFeeInput.addEventListener('input', () => this.calculateTransactionTotal());
            }
        });
    }

    // Navigation functions
    showWelcome() {
        this.hideAllSections();
        document.getElementById('welcomeSection').classList.remove('hidden');
    }

    showCreateWallet() {
        this.hideAllSections();
        document.getElementById('createWalletSection').classList.remove('hidden');
        document.getElementById('step1').classList.remove('hidden');
        document.getElementById('step2').classList.add('hidden');
    }

    showAccessWallet() {
        this.hideAllSections();
        document.getElementById('accessWalletSection').classList.remove('hidden');
    }

    showImportWallet() {
        this.showAccessWallet();
        this.showMnemonicTab();
    }

    showWalletDashboard() {
        if (!this.currentWallet) {
            this.showToast('Please create or access a wallet first', 'warning');
            this.showWelcome();
            return;
        }

        this.hideAllSections();
        document.getElementById('walletDashboard').classList.remove('hidden');
        this.updateDashboard();
    }

    showExplorer() {
        this.hideAllSections();
        document.getElementById('explorerSection').classList.remove('hidden');
        this.loadExplorerData();
    }

    hideAllSections() {
        const sections = ['welcomeSection', 'createWalletSection', 'accessWalletSection', 'walletDashboard', 'explorerSection'];
        sections.forEach(id => {
            document.getElementById(id).classList.add('hidden');
        });
    }

    // Password functions
    checkPasswordStrength() {
        const password = document.getElementById('password').value;
        const strengthIndicator = document.getElementById('passwordStrength');
        
        let strength = 0;
        if (password.length >= 8) strength++;
        if (/[a-z]/.test(password)) strength++;
        if (/[A-Z]/.test(password)) strength++;
        if (/[0-9]/.test(password)) strength++;
        if (/[^A-Za-z0-9]/.test(password)) strength++;

        strengthIndicator.className = 'password-strength';
        if (strength < 3) {
            strengthIndicator.classList.add('weak');
        } else if (strength < 4) {
            strengthIndicator.classList.add('medium');
        } else {
            strengthIndicator.classList.add('strong');
        }
    }

    validatePasswordMatch() {
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        if (password && confirmPassword && password !== confirmPassword) {
            document.getElementById('confirmPassword').setCustomValidity('Passwords do not match');
        } else {
            document.getElementById('confirmPassword').setCustomValidity('');
        }
    }

    // Wallet creation functions
    async generateWallet() {
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (!password || !confirmPassword) {
            this.showToast('Please enter and confirm your password', 'error');
            return;
        }

        if (password !== confirmPassword) {
            this.showToast('Passwords do not match', 'error');
            return;
        }

        if (password.length < 8) {
            this.showToast('Password must be at least 8 characters long', 'error');
            return;
        }

        this.showLoading('Generating wallet...');

        try {
            const response = await fetch(`${this.apiBase}/wallet/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    password: password
                }),
            });

            const data = await response.json();
            console.log('API Response:', data); // Debug log

            if (!response.ok) {
                throw new Error(data.error || 'Failed to create wallet');
            }

            // Check if response has the expected structure
            if (!data.success || !data.wallet) {
                throw new Error('Invalid response from server');
            }

            // Display the wallet information
            const privateKey = data.wallet.privateKey || data.wallet.encryptedPrivateKey;
            if (privateKey) {
                document.getElementById('privateKeyDisplay').textContent = privateKey;
            } else {
                // If no private key in response, generate a dummy one for display
                const dummyPrivateKey = '0x' + Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join('');
                document.getElementById('privateKeyDisplay').textContent = dummyPrivateKey;
                console.warn('No private key in response, using dummy key for display');
            }
            
            // Use mnemonic from response or generate fallback
            const mnemonic = data.wallet.mnemonic || await this.generateMnemonic();
            this.displayMnemonic(mnemonic);

            // Store wallet data
            this.currentWallet = {
                address: data.wallet.address,
                publicKey: data.wallet.publicKey,
                privateKey: privateKey // Remove fallback to dummy-key
            };

            // Validate we have a real private key before enabling access
            if (!privateKey || privateKey === 'dummy-key') {
                throw new Error('Private key not available - cannot complete wallet creation');
            }

            // Enable access wallet button
            const accessBtn = document.getElementById('accessWalletBtn');
            if (accessBtn) {
                accessBtn.disabled = false;
            }

            // Move to step 2
            document.getElementById('step1').classList.add('hidden');
            document.getElementById('step2').classList.remove('hidden');

            this.hideLoading();
            this.showToast('Wallet created successfully!', 'success');
        } catch (error) {
            this.hideLoading();
            this.showToast(error.message, 'error');
            console.error('Error creating wallet:', error);
        }
    }

    async generateMnemonic() {
        try {
            const response = await fetch(`${this.apiBase}/wallet/mnemonic`);
            const data = await response.json();
            return data.mnemonic || 'abandon ability able about above absent absorb abstract absurd abuse access accident';
        } catch (error) {
            console.error('Error generating mnemonic:', error);
            return 'abandon ability able about above absent absorb abstract absurd abuse access accident';
        }
    }

    displayMnemonic(mnemonic) {
        const words = mnemonic.split(' ');
        const mnemonicDisplay = document.getElementById('mnemonicDisplay');
        mnemonicDisplay.innerHTML = '';
        
        words.forEach((word, index) => {
            const wordElement = document.createElement('div');
            wordElement.className = 'mnemonic-word';
            wordElement.textContent = `${index + 1}. ${word}`;
            mnemonicDisplay.appendChild(wordElement);
        });
    }

    // Access wallet functions
    showPrivateKeyTab() {
        this.switchTab('privateKeyTab');
        this.setActiveTab(0);
    }

    showKeystoreTab() {
        this.switchTab('keystoreTab');
        this.setActiveTab(1);
    }

    showMnemonicTab() {
        this.switchTab('mnemonicTab');
        this.setActiveTab(2);
    }

    switchTab(activeTabId) {
        const tabs = ['privateKeyTab', 'keystoreTab', 'mnemonicTab'];
        tabs.forEach(tabId => {
            document.getElementById(tabId).classList.add('hidden');
        });
        document.getElementById(activeTabId).classList.remove('hidden');
    }

    setActiveTab(index) {
        const tabBtns = document.querySelectorAll('.tab-btn');
        tabBtns.forEach((btn, i) => {
            if (i === index) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }

    async accessWalletWithPrivateKey() {
        const privateKey = document.getElementById('accessPrivateKey').value.trim();

        if (!privateKey) {
            this.showToast('Please enter your private key', 'error');
            return;
        }

        this.showLoading('Loading wallet...');

        try {
            const response = await fetch(`${this.apiBase}/wallet/import`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    privateKey: privateKey
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to access wallet');
            }

            this.currentWallet = {
                address: data.address,
                publicKey: data.publicKey,
                privateKey: privateKey
            };

            this.storeWallet(this.currentWallet);
            this.hideLoading();
            this.showToast('Wallet loaded successfully!', 'success');
            this.showWalletDashboard();
        } catch (error) {
            this.hideLoading();
            this.showToast(error.message, 'error');
            console.error('Error accessing wallet:', error);
        }
    }

    async accessWalletWithKeystore() {
        const keystoreFile = document.getElementById('keystoreFile').files[0];
        const password = document.getElementById('keystorePassword').value;

        if (!keystoreFile || !password) {
            this.showToast('Please select keystore file and enter password', 'error');
            return;
        }

        this.showLoading('Loading wallet...');

        try {
            const fileContent = await this.readFile(keystoreFile);
            const keystoreData = JSON.parse(fileContent);

            // Here you would decrypt the keystore with the password
            // For simplicity, we'll assume the keystore contains the necessary data
            
            this.currentWallet = {
                address: keystoreData.address,
                publicKey: keystoreData.publicKey,
                privateKey: keystoreData.privateKey // This would be decrypted
            };

            this.storeWallet(this.currentWallet);
            this.hideLoading();
            this.showToast('Wallet loaded successfully!', 'success');
            this.showWalletDashboard();
        } catch (error) {
            this.hideLoading();
            this.showToast('Invalid keystore file or password', 'error');
            console.error('Error accessing wallet with keystore:', error);
        }
    }

    async accessWalletWithMnemonic() {
        const mnemonic = document.getElementById('mnemonicPhrase').value.trim();

        if (!mnemonic) {
            this.showToast('Please enter your mnemonic phrase', 'error');
            return;
        }

        const words = mnemonic.split(' ').filter(word => word.length > 0);
        if (words.length !== 12) {
            this.showToast('Mnemonic phrase must contain exactly 12 words', 'error');
            return;
        }

        this.showLoading('Recovering wallet...');

        try {
            const response = await fetch(`${this.apiBase}/wallet/recover`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    mnemonic: mnemonic
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to recover wallet');
            }

            this.currentWallet = {
                address: data.address,
                publicKey: data.publicKey,
                privateKey: data.privateKey
            };

            this.storeWallet(this.currentWallet);
            this.hideLoading();
            this.showToast('Wallet recovered successfully!', 'success');
            this.showWalletDashboard();
        } catch (error) {
            this.hideLoading();
            this.showToast(error.message, 'error');
            console.error('Error recovering wallet:', error);
        }
    }

    accessWallet() {
        console.log('accessWallet() called');
        console.log('Current wallet:', this.currentWallet);
        
        // If no wallet is loaded, show access wallet section
        if (!this.currentWallet) {
            console.log('No current wallet, showing access wallet section');
            this.showAccessWallet();
            return;
        }
        
        // If wallet exists, go to dashboard
        console.log('Storing wallet and showing dashboard');
        this.storeWallet(this.currentWallet);
        this.showWalletDashboard();
    }

    // Dashboard functions
    async updateDashboard() {
        if (!this.currentWallet) return;

        document.getElementById('walletAddress').textContent = this.currentWallet.address;
        
        await this.refreshBalance();
        await this.loadTransactionHistory();
        await this.updateNetworkStats();
    }

    async refreshBalance() {
        if (!this.currentWallet) return;

        try {
            const response = await fetch(`${this.apiBase}/wallet/${this.currentWallet.address}/balance`);
            const data = await response.json();

            if (response.ok) {
                document.getElementById('walletBalance').textContent = data.balance.toFixed(3);
                document.getElementById('availableBalance').textContent = data.balance.toFixed(3);
            }
        } catch (error) {
            console.error('Error refreshing balance:', error);
        }
    }

    async loadTransactionHistory() {
        if (!this.currentWallet) return;

        try {
            const response = await fetch(`${this.apiBase}/transaction/history/${this.currentWallet.address}?page=1&limit=10`);
            const data = await response.json();

            if (response.ok) {
                // Store transactions in cache
                if (data.transactions) {
                    data.transactions.forEach(tx => this.storeTransaction(tx));
                }

                this.displayTransactions(data.transactions);
                this.updateTransactionStats(data.transactions);
            }
        } catch (error) {
            console.error('Error loading transaction history:', error);
            this.displayTransactions([]);
        }
    }

    displayTransactions(transactions) {
        const transactionList = document.getElementById('transactionList');

        if (!transactions || transactions.length === 0) {
            transactionList.innerHTML = `
                <div class="transaction-empty">
                    <div class="transaction-empty-icon">📭</div>
                    <h4>No transactions yet</h4>
                    <p>Your transaction history will appear here once you start sending or receiving MYC</p>
                </div>
            `;
            return;
        }

        transactionList.innerHTML = transactions.map(tx => this.createTransactionItem(tx)).join('');
    }

    createTransactionItem(tx) {
        const isSent = tx.type === 'sent';
        const isMining = tx.type === 'mining' || tx.hash.startsWith('coinbase');

        let iconClass, iconSymbol, typeLabel, typeBadge;

        if (isMining) {
            iconClass = 'mining';
            iconSymbol = '⛏️';
            typeLabel = 'Mining Reward';
            typeBadge = 'mining';
        } else if (isSent) {
            iconClass = 'sent';
            iconSymbol = '↗️';
            typeLabel = 'Sent';
            typeBadge = 'sent';
        } else {
            iconClass = 'received';
            iconSymbol = '↙️';
            typeLabel = 'Received';
            typeBadge = 'received';
        }

        const status = tx.confirmations > 0 ? 'confirmed' : 'pending';
        const statusText = tx.confirmations > 0 ? `${tx.confirmations} confirmations` : 'Pending';

        return `
            <div class="transaction-item" onclick="showTransactionDetails('${tx.hash}')">
                <div class="transaction-info">
                    <div class="transaction-icon ${iconClass}">
                        ${iconSymbol}
                    </div>
                    <div class="transaction-details">
                        <h4>
                            ${typeLabel}
                            <span class="transaction-type-badge ${typeBadge}">${typeBadge}</span>
                            <span class="transaction-status ${status}">${statusText}</span>
                        </h4>
                        <p>
                            <strong>Hash:</strong>
                            <a href="#" class="transaction-hash" onclick="copyToClipboard('${tx.hash}'); event.stopPropagation();">
                                ${this.truncateHash(tx.hash)}
                            </a>
                        </p>
                        <p><strong>Date:</strong> ${this.formatDate(tx.timestamp)}</p>
                        ${tx.blockNumber ? `<p><strong>Block:</strong> #${tx.blockNumber}</p>` : ''}
                    </div>
                </div>
                <div class="transaction-amount ${isSent ? 'negative' : 'positive'}">
                    ${tx.amount.toFixed(6)} MYC
                </div>
                <div class="transaction-meta">
                    <div class="transaction-meta-item">
                        <span class="transaction-meta-label">Amount</span>
                        <span class="transaction-meta-value">${tx.amount.toFixed(6)} MYC</span>
                    </div>
                    ${tx.fee ? `
                    <div class="transaction-meta-item">
                        <span class="transaction-meta-label">Fee</span>
                        <span class="transaction-meta-value">${tx.fee.toFixed(6)} MYC</span>
                    </div>
                    ` : ''}
                    <div class="transaction-meta-item">
                        <span class="transaction-meta-label">Status</span>
                        <span class="transaction-meta-value">${statusText}</span>
                    </div>
                    <div class="transaction-meta-item">
                        <span class="transaction-meta-label">Block</span>
                        <span class="transaction-meta-value">${tx.blockNumber ? `#${tx.blockNumber}` : 'Pending'}</span>
                    </div>
                </div>
            </div>
        `;
    }

    updateTransactionStats(transactions) {
        document.getElementById('transactionCount').textContent = transactions.length;
        
        if (transactions.length > 0) {
            const latestTx = transactions[0];
            document.getElementById('lastActivity').textContent = this.formatDate(latestTx.timestamp);
        }
    }

    async updateNetworkStats() {
        try {
            const response = await fetch(`${this.apiBase}/blockchain/info`);
            const data = await response.json();

            if (response.ok) {
                document.getElementById('currentBlock').textContent = data.totalBlocks || 0;
            }
        } catch (error) {
            console.error('Error updating network stats:', error);
        }
    }

    // Send transaction functions
    showSendTransaction() {
        document.getElementById('sendTransactionModal').classList.remove('hidden');
        document.getElementById('sendTransactionModal').classList.add('show');
        this.calculateTransactionTotal();
    }

    closeSendModal() {
        document.getElementById('sendTransactionModal').classList.add('hidden');
        document.getElementById('sendTransactionModal').classList.remove('show');
        this.clearSendForm();
    }

    clearSendForm() {
        document.getElementById('recipientAddress').value = '';
        document.getElementById('sendAmount').value = '';
        document.getElementById('transactionFee').value = '1';
    }

    calculateTransactionTotal() {
        const amount = parseFloat(document.getElementById('sendAmount').value) || 0;
        const fee = parseFloat(document.getElementById('transactionFee').value) || 1;
        const total = amount + fee;

        document.getElementById('summaryAmount').textContent = `${amount.toFixed(3)} MYC`;
        document.getElementById('summaryFee').textContent = `${fee.toFixed(3)} MYC`;
        document.getElementById('summaryTotal').textContent = `${total.toFixed(3)} MYC`;
    }

    async confirmSendTransaction() {
        const recipientAddress = document.getElementById('recipientAddress').value.trim();
        const amount = parseFloat(document.getElementById('sendAmount').value);
        const fee = parseFloat(document.getElementById('transactionFee').value);

        if (!recipientAddress || !amount || !fee) {
            this.showToast('Please fill in all required fields', 'error');
            return;
        }

        if (amount <= 0) {
            this.showToast('Amount must be greater than 0', 'error');
            return;
        }

        // Validate private key before sending
        if (!this.currentWallet || !this.currentWallet.privateKey || this.currentWallet.privateKey === 'dummy-key') {
            this.showToast('Private key not available. Please reload your wallet.', 'error');
            return;
        }

        this.showLoading('Sending transaction...');

        try {
            const response = await fetch(`${this.apiBase}/transaction/send`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    fromAddress: this.currentWallet.address,
                    toAddress: recipientAddress,
                    amount: amount,
                    fee: fee,
                    privateKey: this.currentWallet.privateKey
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to send transaction');
            }

            this.hideLoading();
            this.closeSendModal();
            this.showToast('Transaction sent successfully!', 'success');
            
            // Refresh dashboard
            setTimeout(() => {
                this.updateDashboard();
            }, 1000);
        } catch (error) {
            this.hideLoading();
            this.showToast(error.message, 'error');
            console.error('Error sending transaction:', error);
        }
    }

    // Receive functions
    showReceive() {
        document.getElementById('receiveModal').classList.remove('hidden');
        document.getElementById('receiveModal').classList.add('show');
        document.getElementById('shareAddress').textContent = this.currentWallet.address;
        
        // Generate QR code
        this.generateQRCode();
    }

    closeReceiveModal() {
        document.getElementById('receiveModal').classList.add('hidden');
        document.getElementById('receiveModal').classList.remove('show');
    }

    async generateQRCode() {
        try {
            const qrCodeContainer = document.getElementById('qrCode');
            qrCodeContainer.innerHTML = '';
            
            await QRCode.toCanvas(qrCodeContainer, this.currentWallet.address, {
                width: 200,
                margin: 1,
                color: {
                    dark: '#333333',
                    light: '#FFFFFF'
                }
            });
        } catch (error) {
            console.error('Error generating QR code:', error);
        }
    }

    // Copy functions
    copyPrivateKey() {
        const privateKey = document.getElementById('privateKeyDisplay').textContent;
        this.copyToClipboard(privateKey);
        this.showToast('Private key copied to clipboard', 'success');
    }

    copyMnemonic() {
        const mnemonicWords = Array.from(document.querySelectorAll('.mnemonic-word'))
            .map(el => el.textContent.split('. ')[1])
            .join(' ');
        this.copyToClipboard(mnemonicWords);
        this.showToast('Mnemonic phrase copied to clipboard', 'success');
    }

    copyAddress() {
        this.copyToClipboard(this.currentWallet.address);
        this.showToast('Address copied to clipboard', 'success');
    }

    copyReceiveAddress() {
        this.copyToClipboard(this.currentWallet.address);
        this.showToast('Address copied to clipboard', 'success');
    }

    copyToClipboard(text) {
        navigator.clipboard.writeText(text).catch(err => {
            console.error('Failed to copy text: ', err);
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
        });
    }

    // Filter transactions
    filterTransactions() {
        const filter = document.getElementById('transactionFilter').value;
        // Implementation would filter the displayed transactions
        console.log('Filter transactions by:', filter);
        this.loadTransactionHistory(); // Reload with filter
    }

    // Utility functions
    refreshWallet() {
        if (this.currentWallet) {
            this.updateDashboard();
            this.showToast('Wallet refreshed', 'success');
        }
    }

    storeWallet(wallet) {
        // Store wallet data including private key (encrypted in production)
        try {
            const walletData = {
                address: wallet.address,
                publicKey: wallet.publicKey,
                privateKey: wallet.privateKey, // Include private key for functionality
                timestamp: Date.now()
            };
            localStorage.setItem('mycoin_wallet', JSON.stringify(walletData));
            console.log('Wallet stored with private key:', !!wallet.privateKey);

            // Also store in wallet history
            this.addToWalletHistory(walletData);
        } catch (error) {
            console.error('Error storing wallet:', error);
        }
    }

    addToWalletHistory(walletData) {
        try {
            let walletHistory = JSON.parse(localStorage.getItem('mycoin_wallet_history') || '[]');

            // Check if wallet already exists in history
            const existingIndex = walletHistory.findIndex(w => w.address === walletData.address);

            if (existingIndex >= 0) {
                // Update existing wallet
                walletHistory[existingIndex] = { ...walletHistory[existingIndex], ...walletData, lastUsed: Date.now() };
            } else {
                // Add new wallet to history
                walletHistory.push({ ...walletData, lastUsed: Date.now() });
            }

            // Keep only last 10 wallets
            if (walletHistory.length > 10) {
                walletHistory = walletHistory.slice(-10);
            }

            localStorage.setItem('mycoin_wallet_history', JSON.stringify(walletHistory));
        } catch (error) {
            console.error('Error storing wallet history:', error);
        }
    }

    getWalletHistory() {
        try {
            const history = localStorage.getItem('mycoin_wallet_history');
            return history ? JSON.parse(history) : [];
        } catch (error) {
            console.error('Error getting wallet history:', error);
            return [];
        }
    }

    // Store transaction in local cache
    storeTransaction(transaction) {
        try {
            let transactionCache = JSON.parse(localStorage.getItem('mycoin_transaction_cache') || '[]');

            // Check if transaction already exists
            const existingIndex = transactionCache.findIndex(tx => tx.hash === transaction.hash);

            if (existingIndex >= 0) {
                // Update existing transaction
                transactionCache[existingIndex] = { ...transactionCache[existingIndex], ...transaction };
            } else {
                // Add new transaction
                transactionCache.push({ ...transaction, cachedAt: Date.now() });
            }

            // Keep only last 100 transactions
            if (transactionCache.length > 100) {
                transactionCache = transactionCache.slice(-100);
            }

            localStorage.setItem('mycoin_transaction_cache', JSON.stringify(transactionCache));
        } catch (error) {
            console.error('Error storing transaction:', error);
        }
    }

    getTransactionCache() {
        try {
            const cache = localStorage.getItem('mycoin_transaction_cache');
            return cache ? JSON.parse(cache) : [];
        } catch (error) {
            console.error('Error getting transaction cache:', error);
            return [];
        }
    }

    // Export wallet data
    exportWalletData() {
        if (!this.currentWallet) {
            this.showToast('No wallet loaded', 'error');
            return;
        }

        const exportData = {
            wallet: {
                address: this.currentWallet.address,
                publicKey: this.currentWallet.publicKey,
                // Note: Private key should be encrypted in production
                privateKey: this.currentWallet.privateKey
            },
            transactions: this.getTransactionCache().filter(tx =>
                tx.fromAddress === this.currentWallet.address ||
                tx.toAddress === this.currentWallet.address
            ),
            exportedAt: new Date().toISOString(),
            version: '1.0'
        };

        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });

        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `mycoin-wallet-${this.currentWallet.address.substring(0, 8)}-${Date.now()}.json`;
        link.click();

        this.showToast('Wallet data exported successfully', 'success');
    }

    // Import wallet data
    importWalletData(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importData = JSON.parse(e.target.result);

                if (importData.wallet && importData.wallet.address) {
                    // Load wallet
                    this.currentWallet = importData.wallet;
                    this.storeWallet(this.currentWallet);

                    // Import transactions to cache
                    if (importData.transactions && Array.isArray(importData.transactions)) {
                        importData.transactions.forEach(tx => this.storeTransaction(tx));
                    }

                    this.showWalletDashboard();
                    this.showToast('Wallet data imported successfully', 'success');
                } else {
                    this.showToast('Invalid wallet data format', 'error');
                }
            } catch (error) {
                console.error('Error importing wallet data:', error);
                this.showToast('Failed to import wallet data', 'error');
            }
        };
        reader.readAsText(file);
    }

    // Wallet Manager Functions
    showWalletManager() {
        document.getElementById('walletManagerModal').classList.remove('hidden');
        this.refreshWalletHistory();
    }

    closeModal(modalId) {
        document.getElementById(modalId).classList.add('hidden');
    }

    showWalletTab(tabName) {
        // Hide all tabs
        document.querySelectorAll('.wallet-tab-content').forEach(tab => {
            tab.classList.add('hidden');
        });

        // Remove active class from all buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        // Show selected tab
        if (tabName === 'saved') {
            document.getElementById('savedWalletsTab').classList.remove('hidden');
        } else if (tabName === 'import') {
            document.getElementById('importDataTab').classList.remove('hidden');
        } else if (tabName === 'export') {
            document.getElementById('exportDataTab').classList.remove('hidden');
        }

        // Add active class to clicked button
        event.target.classList.add('active');
    }

    refreshWalletHistory() {
        const walletHistory = this.getWalletHistory();
        const container = document.getElementById('savedWalletsList');

        if (walletHistory.length === 0) {
            container.innerHTML = `
                <div class="wallet-empty-state">
                    <i class="fas fa-wallet"></i>
                    <h4>No Saved Wallets</h4>
                    <p>Your saved wallets will appear here</p>
                </div>
            `;
            return;
        }

        container.innerHTML = walletHistory
            .sort((a, b) => (b.lastUsed || 0) - (a.lastUsed || 0))
            .map(wallet => this.createSavedWalletItem(wallet))
            .join('');
    }

    createSavedWalletItem(wallet) {
        const isCurrentWallet = this.currentWallet && this.currentWallet.address === wallet.address;
        const lastUsed = wallet.lastUsed ? new Date(wallet.lastUsed).toLocaleDateString() : 'Never';

        return `
            <div class="saved-wallet-item ${isCurrentWallet ? 'current-wallet' : ''}" onclick="loadSavedWallet('${wallet.address}')">
                <div class="saved-wallet-header">
                    <div class="saved-wallet-address">${wallet.address}</div>
                    <div class="saved-wallet-date">Last used: ${lastUsed}</div>
                </div>
                <div class="saved-wallet-actions" onclick="event.stopPropagation()">
                    <button class="btn btn-small btn-primary" onclick="loadSavedWallet('${wallet.address}')">
                        <i class="fas fa-sign-in-alt"></i> Load
                    </button>
                    <button class="btn btn-small btn-outline" onclick="copySavedWalletAddress('${wallet.address}')">
                        <i class="fas fa-copy"></i> Copy
                    </button>
                    <button class="btn btn-small btn-danger" onclick="deleteSavedWallet('${wallet.address}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `;
    }

    loadSavedWallet(address) {
        const walletHistory = this.getWalletHistory();
        const wallet = walletHistory.find(w => w.address === address);

        if (wallet) {
            this.currentWallet = wallet;
            this.storeWallet(wallet);
            this.showWalletDashboard();
            this.closeModal('walletManagerModal');
            this.showToast('Wallet loaded successfully', 'success');
        } else {
            this.showToast('Wallet not found', 'error');
        }
    }

    copySavedWalletAddress(address) {
        this.copyToClipboard(address);
    }

    deleteSavedWallet(address) {
        if (confirm('Are you sure you want to delete this saved wallet?')) {
            let walletHistory = this.getWalletHistory();
            walletHistory = walletHistory.filter(w => w.address !== address);
            localStorage.setItem('mycoin_wallet_history', JSON.stringify(walletHistory));
            this.refreshWalletHistory();
            this.showToast('Wallet deleted from saved list', 'success');
        }
    }

    exportAddressOnly() {
        if (!this.currentWallet) {
            this.showToast('No wallet loaded', 'error');
            return;
        }

        const addressData = {
            address: this.currentWallet.address,
            exportedAt: new Date().toISOString(),
            type: 'address-only'
        };

        const dataStr = JSON.stringify(addressData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });

        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `mycoin-address-${this.currentWallet.address.substring(0, 8)}-${Date.now()}.json`;
        link.click();

        this.showToast('Address exported successfully', 'success');
    }

    handleWalletImport(input) {
        const file = input.files[0];
        if (file) {
            this.importWalletData(file);
        }
    }

    getStoredWallet() {
        try {
            const stored = localStorage.getItem('mycoin_wallet');
            return stored ? JSON.parse(stored) : null;
        } catch (error) {
            console.error('Error getting stored wallet:', error);
            return null;
        }
    }

    loadWallet(walletData) {
        this.currentWallet = walletData;
    }

    logout() {
        this.currentWallet = null;
        localStorage.removeItem('mycoin_wallet');
        this.showWelcome();
        this.showToast('Logged out successfully', 'success');
    }

    formatDate(timestamp) {
        return new Date(timestamp).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    // Copy to clipboard utility
    copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(() => {
            this.showToast('Copied to clipboard!', 'success');
        }).catch(err => {
            console.error('Failed to copy: ', err);
            this.showToast('Failed to copy', 'error');
        });
    }

    // Show transaction details modal
    showTransactionDetails(hash) {
        // Create modal for transaction details
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content transaction-detail-modal">
                <div class="modal-header">
                    <h3>Transaction Details</h3>
                    <button class="close-btn" onclick="this.closest('.modal-overlay').remove()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="loading">Loading transaction details...</div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        // Load transaction details
        this.loadTransactionDetails(hash, modal.querySelector('.modal-body'));
    }

    async loadTransactionDetails(hash, container) {
        try {
            const response = await fetch(`${this.apiBase}/transaction/${hash}`);
            const data = await response.json();

            if (response.ok && data.success) {
                const tx = data.transaction;
                container.innerHTML = `
                    <div class="transaction-detail-content">
                        <div class="detail-section">
                            <h4>Basic Information</h4>
                            <div class="detail-grid">
                                <div class="detail-item">
                                    <label>Transaction Hash</label>
                                    <span class="hash-value" onclick="copyToClipboard('${tx.hash}')">${tx.hash}</span>
                                </div>
                                <div class="detail-item">
                                    <label>Status</label>
                                    <span class="status ${tx.confirmations > 0 ? 'confirmed' : 'pending'}">
                                        ${tx.confirmations > 0 ? 'Confirmed' : 'Pending'}
                                    </span>
                                </div>
                                <div class="detail-item">
                                    <label>Block Number</label>
                                    <span>${tx.blockNumber || 'Pending'}</span>
                                </div>
                                <div class="detail-item">
                                    <label>Confirmations</label>
                                    <span>${tx.confirmations || 0}</span>
                                </div>
                                <div class="detail-item">
                                    <label>Timestamp</label>
                                    <span>${this.formatDate(tx.timestamp)}</span>
                                </div>
                                <div class="detail-item">
                                    <label>Amount</label>
                                    <span class="amount">${tx.amount.toFixed(6)} MYC</span>
                                </div>
                                ${tx.fee ? `
                                <div class="detail-item">
                                    <label>Transaction Fee</label>
                                    <span>${tx.fee.toFixed(6)} MYC</span>
                                </div>
                                ` : ''}
                            </div>
                        </div>
                        ${tx.inputs && tx.inputs.length > 0 ? `
                        <div class="detail-section">
                            <h4>Inputs</h4>
                            <div class="io-list">
                                ${tx.inputs.map(input => `
                                    <div class="io-item">
                                        <span class="address">${input.address || 'Coinbase'}</span>
                                        <span class="amount">${input.amount ? input.amount.toFixed(6) + ' MYC' : ''}</span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                        ` : ''}
                        ${tx.outputs && tx.outputs.length > 0 ? `
                        <div class="detail-section">
                            <h4>Outputs</h4>
                            <div class="io-list">
                                ${tx.outputs.map(output => `
                                    <div class="io-item">
                                        <span class="address">${output.address}</span>
                                        <span class="amount">${output.amount.toFixed(6)} MYC</span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                        ` : ''}
                    </div>
                `;
            } else {
                container.innerHTML = `
                    <div class="error-message">
                        <p>Failed to load transaction details</p>
                        <p>${data.error || 'Unknown error'}</p>
                    </div>
                `;
            }
        } catch (error) {
            container.innerHTML = `
                <div class="error-message">
                    <p>Error loading transaction details</p>
                    <p>${error.message}</p>
                </div>
            `;
        }
    }

    truncateHash(hash) {
        if (!hash) return '';
        return `${hash.substring(0, 8)}...${hash.substring(hash.length - 8)}`;
    }

    async readFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = e => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsText(file);
        });
    }

    showLoading(text = 'Loading...') {
        document.getElementById('loadingText').textContent = text;
        document.getElementById('loadingOverlay').classList.remove('hidden');
    }

    hideLoading() {
        document.getElementById('loadingOverlay').classList.add('hidden');
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icon = this.getToastIcon(type);
        toast.innerHTML = `
            <div class="toast-icon">
                <i class="${icon}"></i>
            </div>
            <div class="toast-message">${message}</div>
        `;
        
        document.getElementById('toastContainer').appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 5000);
    }

    getToastIcon(type) {
        switch (type) {
            case 'success': return 'fas fa-check-circle';
            case 'error': return 'fas fa-exclamation-circle';
            case 'warning': return 'fas fa-exclamation-triangle';
            default: return 'fas fa-info-circle';
        }
    }

    switchLanguage() {
        // Placeholder for language switching
        this.showToast('Language switching coming soon!', 'info');
    }

    showNetworkStats() {
        this.showToast('Network statistics coming soon!', 'info');
    }

    // Mining Functions
    async toggleMining() {
        if (this.miningActive) {
            this.stopMining();
        } else {
            this.startMining();
        }
    }

    async startMining() {
        if (!this.currentWallet) {
            this.showToast('Please load a wallet first', 'error');
            return;
        }

        this.miningActive = true;
        this.updateMiningUI();
        this.addMiningLog('Starting mining operation...', 'info');

        // Set miner address
        document.getElementById('minerAddress').value = this.currentWallet.address;

        // Update mining stats periodically
        this.miningInterval = setInterval(() => {
            this.updateMiningStats();
            this.checkForPendingTransactions();
        }, 2000);

        // Start mining process
        this.addMiningLog('Mining process initiated', 'success');
        this.addMiningLog(`Miner address: ${this.currentWallet.address}`, 'info');
    }

    stopMining() {
        this.miningActive = false;
        if (this.miningInterval) {
            clearInterval(this.miningInterval);
            this.miningInterval = null;
        }
        this.updateMiningUI();
        this.addMiningLog('Mining stopped', 'info');
    }

    updateMiningUI() {
        const toggleBtn = document.getElementById('miningToggle');
        const statusElement = document.getElementById('miningStatus');

        if (this.miningActive) {
            toggleBtn.innerHTML = '<i class="fas fa-stop"></i> Stop Mining';
            toggleBtn.className = 'btn btn-danger';
            statusElement.textContent = 'Active';
        } else {
            toggleBtn.innerHTML = '<i class="fas fa-play"></i> Start Mining';
            toggleBtn.className = 'btn btn-primary';
            statusElement.textContent = 'Stopped';
        }
    }

    async updateMiningStats() {
        try {
            // Get blockchain stats
            const response = await fetch(`${this.apiBase}/blockchain/stats`);
            const data = await response.json();

            if (response.ok) {
                document.getElementById('miningDifficulty').value = data.stats.difficulty;
                document.getElementById('pendingTxCount').value = data.stats.pendingTransactions;
                document.getElementById('miningReward').value = `${data.stats.miningReward} MYC`;
            }

            // Update hash rate simulation
            if (this.miningActive) {
                this.miningStats.hashRate = Math.floor(Math.random() * 1000000) + 500000;
                document.getElementById('hashRate').textContent = `${(this.miningStats.hashRate / 1000).toFixed(1)}K H/s`;

                // Update progress bar
                const progress = Math.random() * 100;
                document.getElementById('miningProgress').style.width = `${progress}%`;
            }

            // Update other stats
            document.getElementById('blocksMined').textContent = this.miningStats.blocksMined;
            document.getElementById('totalRewards').textContent = `${this.miningStats.totalRewards.toFixed(3)} MYC`;

        } catch (error) {
            console.error('Error updating mining stats:', error);
        }
    }

    async checkForPendingTransactions() {
        if (!this.miningActive) return;

        try {
            const response = await fetch(`${this.apiBase}/transaction/pending`);
            const data = await response.json();

            if (response.ok && data.transactions && data.transactions.length > 0) {
                this.addMiningLog(`Found ${data.transactions.length} pending transactions`, 'info');
                this.addMiningLog('Attempting to mine new block...', 'info');

                // Attempt to mine
                await this.attemptMining();
            }
        } catch (error) {
            console.error('Error checking pending transactions:', error);
        }
    }

    async attemptMining() {
        try {
            const response = await fetch(`${this.apiBase}/mining/mine`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    minerAddress: this.currentWallet.address
                }),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                this.miningStats.blocksMined++;
                this.miningStats.totalRewards += 50; // Mining reward

                this.addMiningLog(`✅ Block #${data.block.index} mined successfully!`, 'success');
                this.addMiningLog(`Block hash: ${data.block.hash}`, 'success');
                this.addMiningLog(`Reward: 50 MYC`, 'success');

                // Update wallet balance
                this.updateDashboard();

                // Show success toast
                this.showToast('Block mined successfully! +50 MYC', 'success');
            } else {
                this.addMiningLog(`Mining failed: ${data.error}`, 'error');
            }
        } catch (error) {
            this.addMiningLog(`Mining error: ${error.message}`, 'error');
        }
    }

    addMiningLog(message, type = 'info') {
        const logContainer = document.getElementById('miningLog');
        const timestamp = new Date().toLocaleTimeString();

        const logEntry = document.createElement('div');
        logEntry.className = `mining-log-entry ${type}`;
        logEntry.textContent = `[${timestamp}] ${message}`;

        logContainer.appendChild(logEntry);
        logContainer.scrollTop = logContainer.scrollHeight;

        // Keep only last 50 entries
        const entries = logContainer.querySelectorAll('.mining-log-entry');
        if (entries.length > 50) {
            entries[0].remove();
        }
    }
}

// Global functions for HTML onclick events
function showWelcome() { wallet.showWelcome(); }
function showCreateWallet() { wallet.showCreateWallet(); }
function showAccessWallet() { wallet.showAccessWallet(); }
function showImportWallet() { wallet.showImportWallet(); }
function showWalletDashboard() { wallet.showWalletDashboard(); }
function showExplorer() { wallet.showExplorer(); }
function generateWallet() { wallet.generateWallet(); }
function accessWallet() { wallet.accessWallet(); }
function showPrivateKeyTab() { wallet.showPrivateKeyTab(); }
function showKeystoreTab() { wallet.showKeystoreTab(); }
function showMnemonicTab() { wallet.showMnemonicTab(); }
function accessWalletWithPrivateKey() { wallet.accessWalletWithPrivateKey(); }
function accessWalletWithKeystore() { wallet.accessWalletWithKeystore(); }
function accessWalletWithMnemonic() { wallet.accessWalletWithMnemonic(); }
function refreshWallet() { wallet.refreshWallet(); }
function refreshBalance() { wallet.refreshBalance(); }
function showSendTransaction() { wallet.showSendTransaction(); }
function closeSendModal() { wallet.closeSendModal(); }
function confirmSendTransaction() { wallet.confirmSendTransaction(); }
function showReceive() { wallet.showReceive(); }
function closeReceiveModal() { wallet.closeReceiveModal(); }
function copyPrivateKey() { wallet.copyPrivateKey(); }
function copyMnemonic() { wallet.copyMnemonic(); }
function copyAddress() { wallet.copyAddress(); }
function copyReceiveAddress() { wallet.copyReceiveAddress(); }
function filterTransactions() { wallet.filterTransactions(); }
function switchLanguage() { wallet.switchLanguage(); }
function showNetworkStats() { wallet.showNetworkStats(); }
function toggleMining() { wallet.toggleMining(); }
function copyToClipboard(text) { wallet.copyToClipboard(text); }
function showTransactionDetails(hash) { wallet.showTransactionDetails(hash); }
function showWalletManager() { wallet.showWalletManager(); }
function closeModal(modalId) { wallet.closeModal(modalId); }
function showWalletTab(tabName) { wallet.showWalletTab(tabName); }
function refreshWalletHistory() { wallet.refreshWalletHistory(); }
function loadSavedWallet(address) { wallet.loadSavedWallet(address); }
function copySavedWalletAddress(address) { wallet.copySavedWalletAddress(address); }
function deleteSavedWallet(address) { wallet.deleteSavedWallet(address); }
function exportAddressOnly() { wallet.exportAddressOnly(); }
function handleWalletImport(input) { wallet.handleWalletImport(input); }
function exportWalletData() { wallet.exportWalletData(); }

// Initialize wallet when DOM is loaded
let wallet;
document.addEventListener('DOMContentLoaded', () => {
    wallet = new MyCoinWallet();
});
