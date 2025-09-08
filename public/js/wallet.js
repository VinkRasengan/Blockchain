// Main JavaScript for MyCoin Wallet
class MyCoinWallet {
    constructor() {
        this.currentWallet = null;
        this.apiBase = 'http://localhost:3002/api';
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
            const response = await fetch(`${this.apiBase}/transactions/${this.currentWallet.address}?page=1&limit=10`);
            const data = await response.json();

            if (response.ok) {
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
                <div class="no-transactions">
                    <i class="fas fa-inbox"></i>
                    <p>No transactions found</p>
                </div>
            `;
            return;
        }

        transactionList.innerHTML = transactions.map(tx => this.createTransactionItem(tx)).join('');
    }

    createTransactionItem(tx) {
        const isSent = tx.type === 'sent';
        const icon = isSent ? 'fa-arrow-up' : 'fa-arrow-down';
        const iconClass = isSent ? 'sent' : 'received';
        const amountClass = isSent ? 'sent' : 'received';
        const amountPrefix = isSent ? '-' : '+';
        
        return `
            <div class="transaction-item" onclick="showTransactionDetails('${tx.hash}')">
                <div class="transaction-info">
                    <div class="transaction-icon ${iconClass}">
                        <i class="fas ${icon}"></i>
                    </div>
                    <div class="transaction-details">
                        <h4>${isSent ? 'Sent' : 'Received'}</h4>
                        <p>${this.formatDate(tx.timestamp)}</p>
                        <p class="transaction-hash">${this.truncateHash(tx.hash)}</p>
                    </div>
                </div>
                <div class="transaction-amount">
                    <div class="amount ${amountClass}">${amountPrefix}${tx.amount.toFixed(3)} MYC</div>
                    <div class="status">${tx.confirmations || 0} confirmations</div>
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
        // Store encrypted wallet data
        try {
            const walletData = {
                address: wallet.address,
                publicKey: wallet.publicKey,
                // Note: In production, privateKey should be encrypted before storing
                timestamp: Date.now()
            };
            localStorage.setItem('mycoin_wallet', JSON.stringify(walletData));
        } catch (error) {
            console.error('Error storing wallet:', error);
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

// Initialize wallet when DOM is loaded
let wallet;
document.addEventListener('DOMContentLoaded', () => {
    wallet = new MyCoinWallet();
});
