const { ipcRenderer } = require("electron");

// Global state
let currentWallet = null;
let currentTab = "dashboard";

// Initialize app
document.addEventListener("DOMContentLoaded", () => {
  initializeApp();
  setupEventListeners();
  updateDashboard();
});

// Initialize application
function initializeApp() {
  // Setup navigation
  const navItems = document.querySelectorAll(".nav-item");
  navItems.forEach((item) => {
    item.addEventListener("click", () => {
      const tabName = item.getAttribute("data-tab");
      showTab(tabName);
    });
  });

  // Setup form submissions
  const sendForm = document.getElementById("sendForm");
  if (sendForm) {
    sendForm.addEventListener("submit", handleSendTransaction);
  }

  // Update network status
  updateNetworkStatus();

  // Start periodic updates
  setInterval(updateDashboard, 5000); // Update every 5 seconds
}

// Setup event listeners
function setupEventListeners() {
  // Menu events from main process
  ipcRenderer.on("menu-new-wallet", createNewWallet);
  ipcRenderer.on("menu-load-wallet", showLoadWalletModal);
  ipcRenderer.on("menu-send-transaction", () => showTab("send"));
  ipcRenderer.on("menu-receive", () => showTab("receive"));
  ipcRenderer.on("menu-transaction-history", () => showTab("history"));
  ipcRenderer.on("menu-connect-peer", showConnectPeerModal);
  ipcRenderer.on("menu-view-peers", () => showTab("network"));
  ipcRenderer.on("menu-mine-block", showMineBlockModal);
  ipcRenderer.on("menu-about", showAboutModal);
}

// Tab navigation
function showTab(tabName) {
  // Update navigation
  const navItems = document.querySelectorAll(".nav-item");
  navItems.forEach((item) => {
    item.classList.remove("active");
    if (item.getAttribute("data-tab") === tabName) {
      item.classList.add("active");
    }
  });

  // Update content
  const tabContents = document.querySelectorAll(".tab-content");
  tabContents.forEach((content) => {
    content.classList.remove("active");
  });

  const targetTab = document.getElementById(tabName);
  if (targetTab) {
    targetTab.classList.add("active");
    currentTab = tabName;

    // Load tab-specific data
    loadTabData(tabName);
  }
}

// Load data for specific tab
async function loadTabData(tabName) {
  switch (tabName) {
    case "dashboard":
      await updateDashboard();
      break;
    case "wallet":
      await updateWalletInfo();
      break;
    case "send":
      await updateAvailableBalance();
      break;
    case "history":
      await loadTransactionHistory();
      break;
    case "network":
      await loadNetworkInfo();
      break;
  }
}

// Update dashboard
async function updateDashboard() {
  try {
    // Get blockchain stats
    const statsResult = await ipcRenderer.invoke("get-blockchain-stats");
    if (statsResult.success) {
      const stats = statsResult.data;
      document.getElementById("totalBlocks").textContent = stats.totalBlocks;
      document.getElementById("totalTransactions").textContent =
        stats.totalTransactions;
    }

    // Get peers count
    const peersResult = await ipcRenderer.invoke("get-peers");
    if (peersResult.success) {
      document.getElementById("connectedPeers").textContent =
        peersResult.data.length;
    }

    // Update balance if wallet is loaded
    if (currentWallet) {
      await updateBalance();
    }

    // Load recent transactions
    await loadRecentTransactions();
  } catch (error) {
    console.error("Error updating dashboard:", error);
  }
}

// Update network status
function updateNetworkStatus() {
  const statusIndicator = document.getElementById("networkStatus");
  const statusText = document.getElementById("networkText");

  // For now, assume connected - in real app, check actual network status
  statusIndicator.classList.add("connected");
  statusText.textContent = "Connected";
}

// Create new wallet
async function createNewWallet() {
  try {
    const result = await ipcRenderer.invoke("create-wallet");
    if (result.success) {
      const walletData = result.data;
      currentWallet = walletData;

      // Show wallet creation success modal
      showWalletCreatedModal(walletData);

      // Update UI
      await updateWalletInfo();
      showTab("wallet");
    } else {
      showError("Failed to create wallet: " + result.error);
    }
  } catch (error) {
    showError("Error creating wallet: " + error.message);
  }
}

// Show wallet created modal
function showWalletCreatedModal(walletData) {
  const modal = document.createElement("div");
  modal.className = "modal active";
  modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Wallet Created Successfully!</h3>
            </div>
            <div class="modal-body">
                <div class="wallet-created-info">
                    <div class="info-row">
                        <span class="info-label">Address:</span>
                        <span class="info-value">${walletData.address}</span>
                        <button class="btn-copy" onclick="copyToClipboard('${walletData.address}')">
                            <i class="fas fa-copy"></i>
                        </button>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Mnemonic Phrase:</span>
                        <span class="info-value">${walletData.mnemonic}</span>
                        <button class="btn-copy" onclick="copyToClipboard('${walletData.mnemonic}')">
                            <i class="fas fa-copy"></i>
                        </button>
                    </div>
                    <div class="warning">
                        <i class="fas fa-exclamation-triangle"></i>
                        <p><strong>Important:</strong> Save your mnemonic phrase in a secure location. You'll need it to recover your wallet.</p>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-primary" onclick="closeWalletCreatedModal()">I've Saved It</button>
            </div>
        </div>
    `;

  document.body.appendChild(modal);
}

// Close wallet created modal
function closeWalletCreatedModal() {
  const modal = document.querySelector(".modal.active");
  if (modal) {
    modal.remove();
  }
}

// Show load wallet modal
function showLoadWalletModal() {
  const modal = document.getElementById("loadWalletModal");
  modal.classList.add("active");
}

// Close modal
function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  modal.classList.remove("active");
}

// Switch load method
function switchLoadMethod(method) {
  const buttons = document.querySelectorAll(".tab-btn");
  const methods = document.querySelectorAll(".load-method");

  buttons.forEach((btn) => btn.classList.remove("active"));
  methods.forEach((method) => method.classList.remove("active"));

  document
    .querySelector(`[onclick="switchLoadMethod('${method}')"]`)
    .classList.add("active");
  document.getElementById(method + "Method").classList.add("active");
}

// Load wallet
async function loadWallet() {
  try {
    const privateKeyMethod = document.getElementById("privateKeyMethod");

    let privateKey = "";
    let mnemonic = "";

    if (privateKeyMethod.classList.contains("active")) {
      privateKey = document.getElementById("loadPrivateKey").value.trim();
    } else {
      mnemonic = document.getElementById("loadMnemonic").value.trim();
    }

    if (!privateKey && !mnemonic) {
      showError("Please enter a private key or mnemonic phrase");
      return;
    }

    const result = await ipcRenderer.invoke("load-wallet", {
      privateKey,
      mnemonic,
    });
    if (result.success) {
      currentWallet = result.data;
      closeModal("loadWalletModal");
      await updateWalletInfo();
      showTab("wallet");
      showSuccess("Wallet loaded successfully!");
    } else {
      showError("Failed to load wallet: " + result.error);
    }
  } catch (error) {
    showError("Error loading wallet: " + error.message);
  }
}

// Update wallet info
async function updateWalletInfo() {
  const walletInfo = document.getElementById("currentWalletInfo");

  if (currentWallet) {
    document.getElementById("walletAddress").textContent =
      currentWallet.address;
    document.getElementById("walletPublicKey").textContent =
      currentWallet.publicKey;

    // Update receive address
    const receiveAddress = document.getElementById("receiveAddress");
    if (receiveAddress) {
      receiveAddress.value = currentWallet.address;
    }

    // Update balance
    await updateBalance();

    walletInfo.classList.add("visible");
  } else {
    walletInfo.classList.remove("visible");
  }
}

// Update balance
async function updateBalance() {
  if (!currentWallet) return;

  try {
    const result = await ipcRenderer.invoke(
      "get-balance",
      currentWallet.address
    );
    if (result.success) {
      const balance = result.data;
      document.getElementById("totalBalance").textContent = `${balance.toFixed(
        2
      )} MYC`;
      document.getElementById("walletBalance").textContent = `${balance.toFixed(
        2
      )} MYC`;
      document.getElementById(
        "availableBalance"
      ).textContent = `${balance.toFixed(2)} MYC`;
    }
  } catch (error) {
    console.error("Error updating balance:", error);
  }
}

// Update available balance for send form
async function updateAvailableBalance() {
  await updateBalance();
}

// Handle send transaction
async function handleSendTransaction(event) {
  event.preventDefault();

  if (!currentWallet) {
    showError("No wallet loaded");
    return;
  }

  const recipientAddress = document
    .getElementById("recipientAddress")
    .value.trim();
  const amount = parseFloat(document.getElementById("sendAmount").value);
  const fee = parseFloat(document.getElementById("transactionFee").value);
  const privateKey = document.getElementById("senderPrivateKey").value.trim();

  if (!recipientAddress || !amount || !fee || !privateKey) {
    showError("Please fill in all fields");
    return;
  }

  if (amount <= 0 || fee <= 0) {
    showError("Amount and fee must be positive");
    return;
  }

  try {
    const result = await ipcRenderer.invoke("send-transaction", {
      recipientAddress,
      amount,
      fee,
      privateKey,
    });

    if (result.success) {
      showSuccess("Transaction sent successfully!");
      document.getElementById("sendForm").reset();
      await updateBalance();
    } else {
      showError("Transaction failed: " + result.error);
    }
  } catch (error) {
    showError("Error sending transaction: " + error.message);
  }
}

// Load recent transactions
async function loadRecentTransactions() {
  if (!currentWallet) {
    document.getElementById("recentTransactionsList").innerHTML = `
            <div class="no-transactions">
                <i class="fas fa-inbox"></i>
                <p>No wallet loaded</p>
            </div>
        `;
    return;
  }

  try {
    const result = await ipcRenderer.invoke(
      "get-transaction-history",
      currentWallet.address
    );
    if (result.success) {
      const transactions = result.data.slice(0, 5); // Show only recent 5
      displayTransactions(transactions, "recentTransactionsList");
    }
  } catch (error) {
    console.error("Error loading recent transactions:", error);
  }
}

// Load transaction history
async function loadTransactionHistory() {
  if (!currentWallet) {
    showError("No wallet loaded");
    return;
  }

  try {
    const result = await ipcRenderer.invoke(
      "get-transaction-history",
      currentWallet.address
    );
    if (result.success) {
      displayTransactions(result.data, "transactionHistoryList");
    }
  } catch (error) {
    showError("Error loading transaction history: " + error.message);
  }
}

// Display transactions
function displayTransactions(transactions, containerId) {
  const container = document.getElementById(containerId);

  if (transactions.length === 0) {
    container.innerHTML = `
            <div class="no-transactions">
                <i class="fas fa-inbox"></i>
                <p>No transactions yet</p>
            </div>
        `;
    return;
  }

  const transactionHTML = transactions
    .map((tx) => {
      const isReceived = tx.outputs.some(
        (output) => output.address === currentWallet.address
      );
      const isSent =
        tx.inputs.some((input) => {
          // This is simplified - in real implementation, need to check UTXO ownership
          return true; // Assume sent if not coinbase
        }) && tx.inputs[0].txHash !== "0".repeat(64);

      let amount = 0;
      let type = "Unknown";
      let amountClass = "";

      if (tx.inputs[0].txHash === "0".repeat(64)) {
        // Coinbase transaction
        type = "Mining Reward";
        amount =
          tx.outputs.find((output) => output.address === currentWallet.address)
            ?.amount || 0;
        amountClass = "positive";
      } else if (isReceived && !isSent) {
        type = "Received";
        amount =
          tx.outputs.find((output) => output.address === currentWallet.address)
            ?.amount || 0;
        amountClass = "positive";
      } else if (isSent) {
        type = "Sent";
        amount = tx.outputs.reduce(
          (sum, output) =>
            output.address !== currentWallet.address
              ? sum + output.amount
              : sum,
          0
        );
        amountClass = "negative";
      }

      return `
            <div class="transaction-item">
                <div class="transaction-info">
                    <div class="transaction-hash">${tx.hash.substring(
                      0,
                      16
                    )}...</div>
                    <div class="transaction-type">${type}</div>
                    <div class="transaction-date">${new Date(
                      tx.timestamp
                    ).toLocaleString()}</div>
                </div>
                <div class="transaction-amount ${amountClass}">
                    ${amountClass === "negative" ? "-" : "+"}${amount.toFixed(
        2
      )} MYC
                </div>
            </div>
        `;
    })
    .join("");

  container.innerHTML = transactionHTML;
}

// Load network info
async function loadNetworkInfo() {
  try {
    const result = await ipcRenderer.invoke("get-peers");
    if (result.success) {
      displayPeers(result.data);
    }
  } catch (error) {
    showError("Error loading network info: " + error.message);
  }
}

// Display peers
function displayPeers(peers) {
  const container = document.getElementById("peersList");

  if (peers.length === 0) {
    container.innerHTML = `
            <div class="no-peers">
                <i class="fas fa-network-wired"></i>
                <p>No peers connected</p>
            </div>
        `;
    return;
  }

  const peersHTML = peers
    .map(
      (peer) => `
        <div class="peer-item">
            <div class="peer-info">
                <div class="peer-url">${peer.url}</div>
                <div class="peer-status ${
                  peer.connected ? "connected" : "disconnected"
                }">
                    ${peer.connected ? "Connected" : "Disconnected"}
                </div>
            </div>
        </div>
    `
    )
    .join("");

  container.innerHTML = peersHTML;
}

// Copy to clipboard
function copyToClipboard(text) {
  if (typeof text !== "string") {
    // If text is an element ID, get the text content
    const element = document.getElementById(text);
    text = element ? element.textContent : text;
  }

  navigator.clipboard
    .writeText(text)
    .then(() => {
      showSuccess("Copied to clipboard!");
    })
    .catch((err) => {
      console.error("Failed to copy: ", err);
      showError("Failed to copy to clipboard");
    });
}

// Show success message
function showSuccess(message) {
  showNotification(message, "success");
}

// Show error message
function showError(message) {
  showNotification(message, "error");
}

// Show notification
function showNotification(message, type = "info") {
  const notification = document.createElement("div");
  notification.className = `notification ${type}`;

  // Get icon based on type
  let iconClass = "fa-info-circle";
  if (type === "success") {
    iconClass = "fa-check-circle";
  } else if (type === "error") {
    iconClass = "fa-exclamation-circle";
  }

  notification.innerHTML = `
        <div class="notification-content">
            <i class="fas ${iconClass}"></i>
            <span>${message}</span>
        </div>
        <button class="notification-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;

  document.body.appendChild(notification);

  // Auto remove after 5 seconds
  setTimeout(() => {
    if (notification.parentElement) {
      notification.remove();
    }
  }, 5000);
}

// Show connect peer modal
function showConnectPeerModal() {
  const modal = document.createElement("div");
  modal.className = "modal active";
  modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Connect to Peer</h3>
                <button class="modal-close" onclick="this.closest('.modal').remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label for="peerUrl">Peer URL</label>
                    <input type="text" id="peerUrl" placeholder="ws://localhost:6002" required>
                    <small>Enter the WebSocket URL of the peer (e.g., ws://localhost:6002)</small>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="this.closest('.modal').remove()">Cancel</button>
                <button class="btn btn-primary" onclick="connectToPeer()">Connect</button>
            </div>
        </div>
    `;

  document.body.appendChild(modal);
}

// Connect to peer
async function connectToPeer() {
  const peerUrl = document.getElementById("peerUrl").value.trim();

  if (!peerUrl) {
    showError("Please enter a peer URL");
    return;
  }

  try {
    const result = await ipcRenderer.invoke("connect-to-peer", peerUrl);
    if (result.success) {
      showSuccess(result.message);
      document.querySelector(".modal.active").remove();
      await loadNetworkInfo();
    } else {
      showError("Failed to connect: " + result.error);
    }
  } catch (error) {
    showError("Error connecting to peer: " + error.message);
  }
}

// Show mine block modal
function showMineBlockModal() {
  if (!currentWallet) {
    showError("Please load a wallet first");
    return;
  }

  const modal = document.createElement("div");
  modal.className = "modal active";
  modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Mine Block</h3>
                <button class="modal-close" onclick="this.closest('.modal').remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <p>Mining a new block will process all pending transactions and reward you with MyCoin.</p>
                <div class="form-group">
                    <label for="minerAddress">Miner Address</label>
                    <input type="text" id="minerAddress" value="${currentWallet.address}" readonly>
                </div>
                <div class="mining-info">
                    <p><strong>Note:</strong> Mining may take some time depending on the difficulty.</p>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="this.closest('.modal').remove()">Cancel</button>
                <button class="btn btn-primary" onclick="mineBlock()">Start Mining</button>
            </div>
        </div>
    `;

  document.body.appendChild(modal);
}

// Mine block
async function mineBlock() {
  const minerAddress = document.getElementById("minerAddress").value;
  const modal = document.querySelector(".modal.active");
  const mineButton = modal.querySelector(".btn-primary");

  // Show loading state
  mineButton.innerHTML = '<div class="loading"></div> Mining...';
  mineButton.disabled = true;

  try {
    const result = await ipcRenderer.invoke("mine-block", minerAddress);
    if (result.success) {
      showSuccess("Block mined successfully! You earned mining rewards.");
      modal.remove();
      await updateDashboard();
    } else {
      showError("Mining failed: " + result.error);
      mineButton.innerHTML = "Start Mining";
      mineButton.disabled = false;
    }
  } catch (error) {
    showError("Error mining block: " + error.message);
    mineButton.innerHTML = "Start Mining";
    mineButton.disabled = false;
  }
}

// Show about modal
function showAboutModal() {
  const modal = document.createElement("div");
  modal.className = "modal active";
  modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>About MyCoin</h3>
                <button class="modal-close" onclick="this.closest('.modal').remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <div class="about-content">
                    <div class="about-logo">
                        <i class="fas fa-coins"></i>
                        <h2>MyCoin Wallet</h2>
                        <p>Version 1.0.0</p>
                    </div>
                    <div class="about-description">
                        <p>MyCoin is a desktop cryptocurrency wallet with integrated blockchain implementation.</p>
                        <p>Features:</p>
                        <ul>
                            <li>Create and manage wallets</li>
                            <li>Send and receive MyCoin</li>
                            <li>View transaction history</li>
                            <li>Mine blocks with Proof of Work</li>
                            <li>P2P networking</li>
                        </ul>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-primary" onclick="this.closest('.modal').remove()">Close</button>
            </div>
        </div>
    `;

  document.body.appendChild(modal);
}
