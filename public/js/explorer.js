// Block Explorer functionality for MyCoin
class BlockExplorer {
    constructor() {
        this.apiBase = 'http://localhost:3002/api';
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.searchCache = new Map();
    }

    async loadExplorerData() {
        try {
            await Promise.all([
                this.loadNetworkStats(),
                this.loadLatestBlocks(),
                this.loadLatestTransactions()
            ]);
        } catch (error) {
            console.error('Error loading explorer data:', error);
        }
    }

    async loadNetworkStats() {
        try {
            const response = await fetch(`${this.apiBase}/blockchain/stats`);
            const data = await response.json();

            if (response.ok) {
                document.getElementById('explorerCurrentBlock').textContent = data.totalBlocks || 0;
                document.getElementById('explorerTotalTx').textContent = data.totalTransactions || 0;
                document.getElementById('explorerDifficulty').textContent = data.difficulty || 0;
                document.getElementById('explorerPendingTx').textContent = data.pendingTransactions || 0;
            }
        } catch (error) {
            console.error('Error loading network stats:', error);
        }
    }

    async loadLatestBlocks(limit = 10) {
        try {
            const response = await fetch(`${this.apiBase}/blockchain/blocks?page=1&limit=${limit}`);
            const data = await response.json();

            if (response.ok && data.blocks) {
                this.displayBlocks(data.blocks);
            }
        } catch (error) {
            console.error('Error loading latest blocks:', error);
            this.displayBlocks([]);
        }
    }

    displayBlocks(blocks) {
        const blocksList = document.getElementById('blocksList');
        
        if (!blocks || blocks.length === 0) {
            blocksList.innerHTML = `
                <div class="no-data">
                    <i class="fas fa-cube"></i>
                    <p>No blocks found</p>
                </div>
            `;
            return;
        }

        blocksList.innerHTML = blocks.map(block => this.createBlockItem(block)).join('');
    }

    createBlockItem(block) {
        const timeAgo = this.getTimeAgo(block.timestamp);
        const transactionCount = block.transactions ? block.transactions.length : 0;
        const blockReward = block.transactions && block.transactions[0] && block.transactions[0].outputs 
            ? block.transactions[0].outputs.reduce((sum, output) => sum + output.amount, 0) : 0;

        return `
            <div class="block-item" onclick="showBlockDetails(${block.index})">
                <div class="block-info">
                    <h4>Block #${block.index}</h4>
                    <p>${timeAgo}</p>
                    <p class="block-hash">${this.truncateHash(block.hash)}</p>
                </div>
                <div class="block-stats">
                    <div>${transactionCount} txns</div>
                    <div>Reward: ${blockReward.toFixed(3)} MYC</div>
                </div>
            </div>
        `;
    }

    async loadLatestTransactions(limit = 15) {
        try {
            const response = await fetch(`${this.apiBase}/transactions/latest?limit=${limit}`);
            const data = await response.json();

            if (response.ok && data.transactions) {
                this.displayExplorerTransactions(data.transactions);
            }
        } catch (error) {
            console.error('Error loading latest transactions:', error);
            this.displayExplorerTransactions([]);
        }
    }

    displayExplorerTransactions(transactions) {
        const transactionsList = document.getElementById('explorerTransactionsList');
        
        if (!transactions || transactions.length === 0) {
            transactionsList.innerHTML = `
                <div class="no-data">
                    <i class="fas fa-exchange-alt"></i>
                    <p>No transactions found</p>
                </div>
            `;
            return;
        }

        transactionsList.innerHTML = transactions.map(tx => this.createExplorerTransactionItem(tx)).join('');
    }

    createExplorerTransactionItem(tx) {
        const timeAgo = this.getTimeAgo(tx.timestamp);
        const amount = tx.outputs ? tx.outputs.reduce((sum, output) => sum + output.amount, 0) : 0;
        const fromAddress = tx.inputs && tx.inputs[0] ? this.getAddressFromInput(tx.inputs[0]) : 'Coinbase';
        const toAddress = tx.outputs && tx.outputs[0] ? tx.outputs[0].address : 'Unknown';

        return `
            <div class="explorer-tx-item" onclick="showTransactionDetails('${tx.hash}')">
                <div class="explorer-tx-info">
                    <h4>Transaction</h4>
                    <p>${timeAgo}</p>
                    <p class="tx-hash">${this.truncateHash(tx.hash)}</p>
                    <p class="tx-addresses">
                        From: ${this.truncateAddress(fromAddress)} → 
                        To: ${this.truncateAddress(toAddress)}
                    </p>
                </div>
                <div class="explorer-tx-stats">
                    <div class="tx-amount">${amount.toFixed(3)} MYC</div>
                    <div class="tx-fee">Fee: ${tx.fee} MYC</div>
                </div>
            </div>
        `;
    }

    async performSearch() {
        const searchInput = document.getElementById('searchInput');
        const query = searchInput.value.trim();

        if (!query) {
            this.showToast('Please enter a search query', 'warning');
            return;
        }

        // Check cache first
        if (this.searchCache.has(query)) {
            const result = this.searchCache.get(query);
            this.displaySearchResult(result);
            return;
        }

        this.showLoading('Searching...');

        try {
            const searchResult = await this.executeSearch(query);
            this.searchCache.set(query, searchResult);
            this.displaySearchResult(searchResult);
        } catch (error) {
            console.error('Search error:', error);
            this.showToast('Search failed. Please try again.', 'error');
        } finally {
            this.hideLoading();
        }
    }

    async executeSearch(query) {
        // Determine search type based on query format
        const searchType = this.determineSearchType(query);
        
        switch (searchType) {
            case 'block':
                return await this.searchBlock(query);
            case 'transaction':
                return await this.searchTransaction(query);
            case 'address':
                return await this.searchAddress(query);
            default:
                return await this.performGeneralSearch(query);
        }
    }

    determineSearchType(query) {
        // Block number (numeric)
        if (/^\d+$/.test(query)) {
            return 'block';
        }
        
        // Transaction hash (64 character hex)
        if (/^[a-fA-F0-9]{64}$/.test(query)) {
            return 'transaction';
        }
        
        // Address (starts with typical address prefix)
        if (query.length >= 26 && query.length <= 35) {
            return 'address';
        }
        
        return 'general';
    }

    async searchBlock(blockNumber) {
        const response = await fetch(`${this.apiBase}/blockchain/block/${blockNumber}`);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Block not found');
        }
        
        return { type: 'block', data: data.block };
    }

    async searchTransaction(txHash) {
        const response = await fetch(`${this.apiBase}/transaction/${txHash}`);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Transaction not found');
        }
        
        return { type: 'transaction', data: data.transaction };
    }

    async searchAddress(address) {
        const response = await fetch(`${this.apiBase}/address/${address}`);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Address not found');
        }
        
        return { type: 'address', data: data };
    }

    async performGeneralSearch(query) {
        // Try multiple endpoints
        const searches = [
            this.searchBlock(query).catch(() => null),
            this.searchTransaction(query).catch(() => null),
            this.searchAddress(query).catch(() => null)
        ];
        
        const results = await Promise.all(searches);
        const validResults = results.filter(result => result !== null);
        
        if (validResults.length === 0) {
            throw new Error('No results found');
        }
        
        return validResults[0];
    }

    displaySearchResult(result) {
        switch (result.type) {
            case 'block':
                this.showBlockDetails(result.data);
                break;
            case 'transaction':
                this.showTransactionDetails(result.data);
                break;
            case 'address':
                this.showAddressDetails(result.data);
                break;
        }
    }

    showBlockDetails(block) {
        const modal = this.createModal('Block Details', this.generateBlockDetailsHTML(block));
        document.body.appendChild(modal);
        modal.classList.add('show');
    }

    generateBlockDetailsHTML(block) {
        const transactions = block.transactions || [];
        const totalValue = transactions.reduce((sum, tx) => {
            return sum + (tx.outputs ? tx.outputs.reduce((s, output) => s + output.amount, 0) : 0);
        }, 0);

        return `
            <div class="details-content">
                <div class="detail-section">
                    <h4>Block Information</h4>
                    <div class="detail-grid">
                        <div class="detail-item">
                            <label>Block Number:</label>
                            <span>${block.index}</span>
                        </div>
                        <div class="detail-item">
                            <label>Block Hash:</label>
                            <span class="hash-value">${block.hash}</span>
                        </div>
                        <div class="detail-item">
                            <label>Previous Hash:</label>
                            <span class="hash-value">${block.previousHash}</span>
                        </div>
                        <div class="detail-item">
                            <label>Merkle Root:</label>
                            <span class="hash-value">${block.merkleRoot || 'N/A'}</span>
                        </div>
                        <div class="detail-item">
                            <label>Timestamp:</label>
                            <span>${new Date(block.timestamp).toLocaleString()}</span>
                        </div>
                        <div class="detail-item">
                            <label>Difficulty:</label>
                            <span>${block.difficulty}</span>
                        </div>
                        <div class="detail-item">
                            <label>Nonce:</label>
                            <span>${block.nonce}</span>
                        </div>
                        <div class="detail-item">
                            <label>Transactions:</label>
                            <span>${transactions.length}</span>
                        </div>
                        <div class="detail-item">
                            <label>Total Value:</label>
                            <span>${totalValue.toFixed(3)} MYC</span>
                        </div>
                    </div>
                </div>
                
                <div class="detail-section">
                    <h4>Transactions (${transactions.length})</h4>
                    <div class="transaction-list-modal">
                        ${transactions.map(tx => this.generateTransactionSummary(tx)).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    showTransactionDetails(transaction) {
        const modal = this.createModal('Transaction Details', this.generateTransactionDetailsHTML(transaction));
        document.body.appendChild(modal);
        modal.classList.add('show');
    }

    generateTransactionDetailsHTML(tx) {
        const totalInput = tx.inputs ? tx.inputs.reduce((sum, input) => sum + (input.amount || 0), 0) : 0;
        const totalOutput = tx.outputs ? tx.outputs.reduce((sum, output) => sum + output.amount, 0) : 0;

        return `
            <div class="details-content">
                <div class="detail-section">
                    <h4>Transaction Information</h4>
                    <div class="detail-grid">
                        <div class="detail-item">
                            <label>Transaction Hash:</label>
                            <span class="hash-value">${tx.hash}</span>
                        </div>
                        <div class="detail-item">
                            <label>Timestamp:</label>
                            <span>${new Date(tx.timestamp).toLocaleString()}</span>
                        </div>
                        <div class="detail-item">
                            <label>Fee:</label>
                            <span>${tx.fee} MYC</span>
                        </div>
                        <div class="detail-item">
                            <label>Total Input:</label>
                            <span>${totalInput.toFixed(3)} MYC</span>
                        </div>
                        <div class="detail-item">
                            <label>Total Output:</label>
                            <span>${totalOutput.toFixed(3)} MYC</span>
                        </div>
                        <div class="detail-item">
                            <label>Status:</label>
                            <span class="status-confirmed">Confirmed</span>
                        </div>
                    </div>
                </div>
                
                <div class="detail-section">
                    <h4>Inputs (${tx.inputs ? tx.inputs.length : 0})</h4>
                    <div class="input-output-list">
                        ${this.generateInputsList(tx.inputs || [])}
                    </div>
                </div>
                
                <div class="detail-section">
                    <h4>Outputs (${tx.outputs ? tx.outputs.length : 0})</h4>
                    <div class="input-output-list">
                        ${this.generateOutputsList(tx.outputs || [])}
                    </div>
                </div>
            </div>
        `;
    }

    generateInputsList(inputs) {
        if (!inputs.length) {
            return '<div class="no-data-small">No inputs (Coinbase transaction)</div>';
        }

        return inputs.map(input => `
            <div class="input-output-item">
                <div class="address-hash">
                    <span class="label">Previous TX:</span>
                    <span class="hash-value">${input.txHash}</span>
                </div>
                <div class="amount-info">
                    <span class="label">Output Index:</span>
                    <span class="value">${input.outputIndex}</span>
                </div>
            </div>
        `).join('');
    }

    generateOutputsList(outputs) {
        if (!outputs.length) {
            return '<div class="no-data-small">No outputs</div>';
        }

        return outputs.map((output, index) => `
            <div class="input-output-item">
                <div class="address-hash">
                    <span class="label">Address:</span>
                    <span class="address-value" onclick="searchAddress('${output.address}')">${output.address}</span>
                </div>
                <div class="amount-info">
                    <span class="label">Amount:</span>
                    <span class="value">${output.amount.toFixed(3)} MYC</span>
                </div>
            </div>
        `).join('');
    }

    generateTransactionSummary(tx) {
        const amount = tx.outputs ? tx.outputs.reduce((sum, output) => sum + output.amount, 0) : 0;
        return `
            <div class="tx-summary" onclick="showTransactionDetails('${tx.hash}')">
                <span class="tx-hash">${this.truncateHash(tx.hash)}</span>
                <span class="tx-amount">${amount.toFixed(3)} MYC</span>
                <span class="tx-fee">${tx.fee} MYC</span>
            </div>
        `;
    }

    showAddressDetails(addressData) {
        const modal = this.createModal('Address Details', this.generateAddressDetailsHTML(addressData));
        document.body.appendChild(modal);
        modal.classList.add('show');
    }

    generateAddressDetailsHTML(data) {
        return `
            <div class="details-content">
                <div class="detail-section">
                    <h4>Address Information</h4>
                    <div class="detail-grid">
                        <div class="detail-item">
                            <label>Address:</label>
                            <span class="address-value">${data.address}</span>
                        </div>
                        <div class="detail-item">
                            <label>Balance:</label>
                            <span>${data.balance ? data.balance.toFixed(3) : '0.000'} MYC</span>
                        </div>
                        <div class="detail-item">
                            <label>Transaction Count:</label>
                            <span>${data.transactionCount || 0}</span>
                        </div>
                        <div class="detail-item">
                            <label>Total Sent:</label>
                            <span>${data.totalSent ? data.totalSent.toFixed(3) : '0.000'} MYC</span>
                        </div>
                        <div class="detail-item">
                            <label>Total Received:</label>
                            <span>${data.totalReceived ? data.totalReceived.toFixed(3) : '0.000'} MYC</span>
                        </div>
                    </div>
                </div>
                
                <div class="detail-section">
                    <h4>Recent Transactions</h4>
                    <div class="transaction-list-modal">
                        ${data.transactions ? data.transactions.map(tx => this.generateTransactionSummary(tx)).join('') : '<div class="no-data-small">No transactions found</div>'}
                    </div>
                </div>
            </div>
        `;
    }

    createModal(title, content) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content modal-large">
                <div class="modal-header">
                    <h3>${title}</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    ${content}
                </div>
                <div class="modal-footer">
                    <button class="btn btn-outline" onclick="this.closest('.modal').remove()">Close</button>
                </div>
            </div>
        `;

        // Close modal when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });

        return modal;
    }

    // Utility functions
    getTimeAgo(timestamp) {
        const now = Date.now();
        const diff = now - timestamp;
        
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);
        
        if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
        if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
        return 'Just now';
    }

    truncateHash(hash) {
        if (!hash) return 'N/A';
        return `${hash.substring(0, 10)}...${hash.substring(hash.length - 10)}`;
    }

    truncateAddress(address) {
        if (!address || address === 'Coinbase') return address;
        return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
    }

    getAddressFromInput(input) {
        // This would need to look up the address from the UTXO
        // For now, return a placeholder
        return 'Unknown';
    }

    showLoading(message) {
        if (typeof wallet !== 'undefined' && wallet.showLoading) {
            wallet.showLoading(message);
        }
    }

    hideLoading() {
        if (typeof wallet !== 'undefined' && wallet.hideLoading) {
            wallet.hideLoading();
        }
    }

    showToast(message, type) {
        if (typeof wallet !== 'undefined' && wallet.showToast) {
            wallet.showToast(message, type);
        }
    }
}

// Global functions for HTML onclick events
function performSearch() { 
    if (typeof blockExplorer !== 'undefined') {
        blockExplorer.performSearch(); 
    }
}

function showBlockDetails(blockNumber) { 
    if (typeof blockExplorer !== 'undefined') {
        blockExplorer.searchBlock(blockNumber).then(result => {
            blockExplorer.showBlockDetails(result.data);
        }).catch(error => {
            console.error('Error showing block details:', error);
            if (typeof wallet !== 'undefined') {
                wallet.showToast('Block not found', 'error');
            }
        });
    }
}

function showTransactionDetails(txHash) { 
    if (typeof blockExplorer !== 'undefined') {
        blockExplorer.searchTransaction(txHash).then(result => {
            blockExplorer.showTransactionDetails(result.data);
        }).catch(error => {
            console.error('Error showing transaction details:', error);
            if (typeof wallet !== 'undefined') {
                wallet.showToast('Transaction not found', 'error');
            }
        });
    }
}

function searchAddress(address) {
    if (typeof blockExplorer !== 'undefined') {
        document.getElementById('searchInput').value = address;
        blockExplorer.performSearch();
    }
}

// Initialize explorer when needed
let blockExplorer;
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        blockExplorer = new BlockExplorer();
    });
}
