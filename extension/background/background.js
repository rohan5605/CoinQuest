// CoinQuestWallet — Background Service Worker
const API = 'http://localhost:5000/api';

// On install
chrome.runtime.onInstalled.addListener(() => {
  chrome.action.setBadgeText({ text: '' });
  // Poll every 10 seconds for pending txs
  chrome.alarms.create('pollPending', { periodInMinutes: 0.17 }); // ~10s
});

// Alarm polling
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'pollPending') await checkPending();
});

async function checkPending() {
  try {
    const result = await chrome.storage.local.get(['cq_wallet_address']);
    const address = result['cq_wallet_address'];
    if (!address) return;

    const res = await fetch(`${API}/wallet/${address}/transactions`);
    const data = await res.json();
    if (!data.success) return;

    const pending = data.transactions.filter(t => t.status === 'pending');

    if (pending.length > 0) {
      chrome.action.setBadgeText({ text: pending.length.toString() });
      chrome.action.setBadgeBackgroundColor({ color: '#EF4444' });
    } else {
      chrome.action.setBadgeText({ text: '' });
    }
  } catch (e) {
    chrome.action.setBadgeText({ text: '' });
  }
}

// Listen for messages from website (via chrome.runtime.sendMessage)
chrome.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {
  if (message.type === 'NEW_PENDING_TX') {
    // Store the address in case not already stored
    if (message.address) {
      chrome.storage.local.set({ 'cq_wallet_address': message.address });
    }
    // Update badge immediately
    checkPending();
    // Forward message to popup if it's open
    chrome.runtime.sendMessage(message).catch(() => {});
    sendResponse({ success: true });
  }

  if (message.type === 'WALLET_CONNECTED') {
    if (message.address) {
      chrome.storage.local.set({ 'cq_wallet_address': message.address });
    }
    checkPending();
    chrome.runtime.sendMessage(message).catch(() => {});
    sendResponse({ success: true });
  }
  return true;
});

// Internal messages (from popup)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'REFRESH') {
    checkPending();
    sendResponse({ success: true });
  }
  return true;
});
