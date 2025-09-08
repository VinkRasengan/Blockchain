// Main application controller for MyCoin
class MyCoinApp {
    constructor() {
        this.wallet = null;
        this.explorer = null;
        this.networkMonitor = null;
        this.init();
    }

    init() {
        this.setupGlobalErrorHandling();
        this.initializeComponents();
        this.setupKeyboardShortcuts();
        this.startPeriodicUpdates();
    }

    setupGlobalErrorHandling() {
        window.addEventListener('error', (e) => {
            console.error('Global error:', e.error);
            this.showNotification('An unexpected error occurred', 'error');
        });

        window.addEventListener('unhandledrejection', (e) => {
            console.error('Unhandled promise rejection:', e.reason);
            this.showNotification('Network request failed', 'error');
        });
    }

    initializeComponents() {
        // Components will be initialized by their respective files
        // This method can be used for additional setup
        console.log('MyCoin application initialized');
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + K for search
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                const searchInput = document.getElementById('searchInput');
                if (searchInput && !searchInput.closest('.hidden')) {
                    searchInput.focus();
                }
            }

            // ESC to close modals
            if (e.key === 'Escape') {
                this.closeTopModal();
            }

            // Ctrl/Cmd + Enter to send transaction (when in send modal)
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                const sendModal = document.getElementById('sendTransactionModal');
                if (sendModal && !sendModal.classList.contains('hidden')) {
                    e.preventDefault();
                    confirmSendTransaction();
                }
            }
        });
    }

    closeTopModal() {
        const modals = document.querySelectorAll('.modal:not(.hidden)');
        if (modals.length > 0) {
            const topModal = modals[modals.length - 1];
            topModal.classList.add('hidden');
            topModal.classList.remove('show');
        }
    }

    startPeriodicUpdates() {
        // Update network stats every 30 seconds
        setInterval(() => {
            if (typeof blockExplorer !== 'undefined' && 
                !document.getElementById('explorerSection').classList.contains('hidden')) {
                blockExplorer.loadNetworkStats();
            }
        }, 30000);

        // Update wallet balance every 60 seconds if wallet is loaded
        setInterval(() => {
            if (typeof wallet !== 'undefined' && wallet.currentWallet && 
                !document.getElementById('walletDashboard').classList.contains('hidden')) {
                wallet.refreshBalance();
            }
        }, 60000);

        // Auto-refresh transaction history every 2 minutes
        setInterval(() => {
            if (typeof wallet !== 'undefined' && wallet.currentWallet && 
                !document.getElementById('walletDashboard').classList.contains('hidden')) {
                wallet.loadTransactionHistory();
            }
        }, 120000);
    }

    showNotification(message, type = 'info') {
        if (typeof wallet !== 'undefined' && wallet.showToast) {
            wallet.showToast(message, type);
        } else {
            console.log(`${type.toUpperCase()}: ${message}`);
        }
    }

    // Network connectivity check
    checkNetworkConnection() {
        return fetch('/api/health')
            .then(response => response.ok)
            .catch(() => false);
    }

    // Theme switching
    toggleTheme() {
        const body = document.body;
        const isDark = body.classList.contains('dark-theme');
        
        if (isDark) {
            body.classList.remove('dark-theme');
            localStorage.setItem('theme', 'light');
        } else {
            body.classList.add('dark-theme');
            localStorage.setItem('theme', 'dark');
        }
    }

    // Load saved theme
    loadTheme() {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            document.body.classList.add('dark-theme');
        }
    }

    // Export wallet data
    exportWalletData() {
        if (typeof wallet === 'undefined' || !wallet.currentWallet) {
            this.showNotification('No wallet loaded', 'warning');
            return;
        }

        const walletData = {
            address: wallet.currentWallet.address,
            publicKey: wallet.currentWallet.publicKey,
            // Note: Private key should be encrypted before export
            exportDate: new Date().toISOString()
        };

        const dataStr = JSON.stringify(walletData, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `mycoin-wallet-${wallet.currentWallet.address.substring(0, 8)}.json`;
        link.click();
        
        this.showNotification('Wallet data exported', 'success');
    }

    // Show application info
    showAbout() {
        const modal = this.createInfoModal('About MyCoin', `
            <div class="about-content">
                <div class="logo-section">
                    <i class="fas fa-coins fa-3x" style="color: #667eea; margin-bottom: 1rem;"></i>
                    <h3>MyCoin Wallet</h3>
                    <p>Version 1.0.0</p>
                </div>
                <div class="info-section">
                    <h4>Features</h4>
                    <ul>
                        <li>Create and manage cryptocurrency wallets</li>
                        <li>Send and receive MyCoin transactions</li>
                        <li>Explore blockchain and transaction history</li>
                        <li>Proof of Work and Proof of Stake consensus</li>
                        <li>Secure private key management</li>
                    </ul>
                </div>
                <div class="info-section">
                    <h4>Security</h4>
                    <p>Your private keys are stored locally and encrypted. Never share your private key or mnemonic phrase with anyone.</p>
                </div>
                <div class="info-section">
                    <h4>Support</h4>
                    <p>For support and updates, visit our GitHub repository.</p>
                </div>
            </div>
        `);
        
        document.body.appendChild(modal);
        modal.classList.add('show');
    }

    createInfoModal(title, content) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
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
                    <button class="btn btn-primary" onclick="this.closest('.modal').remove()">Close</button>
                </div>
            </div>
        `;

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });

        return modal;
    }

    // Performance monitoring
    trackPerformance() {
        if ('performance' in window) {
            const navigation = performance.getEntriesByType('navigation')[0];
            console.log('Page load time:', navigation.loadEventEnd - navigation.loadEventStart, 'ms');
        }
    }

    // Memory usage monitoring
    monitorMemoryUsage() {
        if ('memory' in performance) {
            const memInfo = performance.memory;
            console.log('Memory usage:', {
                used: Math.round(memInfo.usedJSHeapSize / 1024 / 1024) + ' MB',
                total: Math.round(memInfo.totalJSHeapSize / 1024 / 1024) + ' MB',
                limit: Math.round(memInfo.jsHeapSizeLimit / 1024 / 1024) + ' MB'
            });
        }
    }

    // Service worker registration for offline support
    registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js')
                .then(registration => {
                    console.log('Service Worker registered:', registration);
                })
                .catch(error => {
                    console.log('Service Worker registration failed:', error);
                });
        }
    }

    // Check for application updates
    checkForUpdates() {
        fetch('/api/version')
            .then(response => response.json())
            .then(data => {
                const currentVersion = '1.0.0';
                if (data.version !== currentVersion) {
                    this.showUpdateNotification(data.version);
                }
            })
            .catch(error => {
                console.log('Update check failed:', error);
            });
    }

    showUpdateNotification(newVersion) {
        const notification = document.createElement('div');
        notification.className = 'update-notification';
        notification.innerHTML = `
            <div class="update-content">
                <i class="fas fa-download"></i>
                <div class="update-text">
                    <h4>Update Available</h4>
                    <p>Version ${newVersion} is now available</p>
                </div>
                <button class="btn btn-primary btn-small" onclick="location.reload()">
                    Update Now
                </button>
                <button class="btn btn-outline btn-small" onclick="this.parentElement.parentElement.remove()">
                    Later
                </button>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Auto-remove after 30 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 30000);
    }

    // Analytics and usage tracking (privacy-focused)
    trackUsage(action, category = 'general') {
        // This would send usage data to analytics service
        // Only if user has opted in
        if (localStorage.getItem('analytics-consent') === 'true') {
            console.log(`Usage: ${category} - ${action}`);
            // Send to analytics service
        }
    }

    // Cleanup function
    cleanup() {
        // Clear any intervals or listeners
        console.log('Application cleanup');
    }
}

// Initialize application
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new MyCoinApp();
    app.loadTheme();
    app.trackPerformance();
    
    // Check for updates every 10 minutes
    setInterval(() => {
        app.checkForUpdates();
    }, 600000);
    
    // Monitor memory usage in development
    if (window.location.hostname === 'localhost') {
        setInterval(() => {
            app.monitorMemoryUsage();
        }, 60000);
    }
});

// Handle page unload
window.addEventListener('beforeunload', () => {
    if (app) {
        app.cleanup();
    }
});

// Global functions for utility features
function toggleTheme() {
    if (app) {
        app.toggleTheme();
    }
}

function exportWallet() {
    if (app) {
        app.exportWalletData();
    }
}

function showAbout() {
    if (app) {
        app.showAbout();
    }
}

// Browser feature detection
function checkBrowserSupport() {
    const features = {
        localStorage: typeof(Storage) !== "undefined",
        fetch: typeof fetch !== "undefined",
        crypto: typeof crypto !== "undefined",
        webgl: !!window.WebGLRenderingContext
    };

    const unsupported = Object.entries(features)
        .filter(([key, value]) => !value)
        .map(([key]) => key);

    if (unsupported.length > 0) {
        console.warn('Unsupported browser features:', unsupported);
        if (app) {
            app.showNotification(
                'Some features may not work properly in this browser', 
                'warning'
            );
        }
    }

    return unsupported.length === 0;
}

// Check browser support on load
document.addEventListener('DOMContentLoaded', checkBrowserSupport);

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MyCoinApp;
}
