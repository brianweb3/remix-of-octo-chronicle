import { WALLET_ADDRESS, HELIUS_RPC, donationToHP } from '@/types/octo';

export interface WalletTransaction {
  signature: string;
  amountSol: number;
  hpAdded: number;
  from: string;
  timestamp: Date;
}

export interface WalletMonitorConfig {
  onTransaction: (tx: WalletTransaction) => void;
  onBalanceChange: (balanceSol: number) => void;
  onError?: (error: string) => void;
}

// Extract API key from Helius RPC URL
const HELIUS_API_KEY = HELIUS_RPC.split('api-key=')[1] || '';

export class WalletMonitorService {
  private config: WalletMonitorConfig | null = null;
  private ws: WebSocket | null = null;
  private pollInterval: NodeJS.Timeout | null = null;
  private lastSignature: string | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;

  async start(config: WalletMonitorConfig) {
    this.config = config;
    this.reconnectAttempts = 0;
    
    // Fetch initial balance
    await this.fetchBalance();
    
    // Try WebSocket first, fall back to polling
    this.connectWebSocket();
    
    // Also start polling as backup (every 15 seconds)
    this.startPolling();
  }

  private async fetchBalance() {
    try {
      const response = await fetch(HELIUS_RPC, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'getBalance',
          params: [WALLET_ADDRESS],
        }),
      });

      const data = await response.json();
      if (data.result?.value !== undefined) {
        const balanceSol = data.result.value / 1e9; // lamports to SOL
        console.log('[WalletMonitor] Balance:', balanceSol, 'SOL');
        this.config?.onBalanceChange(balanceSol);
      }
    } catch (e) {
      console.error('[WalletMonitor] Failed to fetch balance:', e);
    }
  }

  private async fetchRecentTransactions() {
    try {
      const response = await fetch(HELIUS_RPC, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'getSignaturesForAddress',
          params: [
            WALLET_ADDRESS,
            { limit: 10 },
          ],
        }),
      });

      const data = await response.json();
      const signatures = data.result || [];
      
      console.log('[WalletMonitor] Found', signatures.length, 'signatures, last known:', this.lastSignature?.slice(0, 10));
      
      if (signatures.length > 0) {
        // Check for new transactions
        const latestSig = signatures[0].signature;
        
        if (this.lastSignature === null) {
          // First run - just store the latest signature, don't process old ones
          console.log('[WalletMonitor] Initial load, setting last sig:', latestSig.slice(0, 10));
          this.lastSignature = latestSig;
        } else if (latestSig !== this.lastSignature) {
          // New transaction detected, fetch details
          console.log('[WalletMonitor] NEW TRANSACTION DETECTED!');
          const newSigs = [];
          for (const sig of signatures) {
            if (sig.signature === this.lastSignature) break;
            newSigs.push(sig.signature);
          }
          
          console.log('[WalletMonitor] Processing', newSigs.length, 'new transactions');
          
          // Process new transactions
          for (const sig of newSigs.reverse()) {
            await this.processTransaction(sig);
          }
          
          this.lastSignature = latestSig;
        }
      }
    } catch (e) {
      console.error('[WalletMonitor] Failed to fetch transactions:', e);
    }
  }

  private async processTransaction(signature: string) {
    try {
      console.log('[WalletMonitor] Processing tx:', signature.slice(0, 20));
      
      const response = await fetch(HELIUS_RPC, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'getTransaction',
          params: [signature, { encoding: 'jsonParsed', maxSupportedTransactionVersion: 0 }],
        }),
      });

      const data = await response.json();
      const tx = data.result;
      
      if (!tx) {
        console.log('[WalletMonitor] No tx data for:', signature.slice(0, 20));
        return;
      }

      // Find SOL transfer to our wallet
      const preBalances = tx.meta?.preBalances || [];
      const postBalances = tx.meta?.postBalances || [];
      const accountKeys = tx.transaction?.message?.accountKeys || [];
      
      console.log('[WalletMonitor] TX has', accountKeys.length, 'accounts');
      
      // Find our wallet's index
      let walletIndex = -1;
      for (let i = 0; i < accountKeys.length; i++) {
        const key = typeof accountKeys[i] === 'string' ? accountKeys[i] : accountKeys[i]?.pubkey;
        if (key === WALLET_ADDRESS) {
          walletIndex = i;
          break;
        }
      }
      
      if (walletIndex === -1) {
        console.log('[WalletMonitor] Our wallet not found in tx');
        return;
      }
      
      // Calculate received amount
      const preBalance = preBalances[walletIndex] || 0;
      const postBalance = postBalances[walletIndex] || 0;
      const diffLamports = postBalance - preBalance;
      
      console.log('[WalletMonitor] Balance diff:', diffLamports, 'lamports (', diffLamports / 1e9, 'SOL)');
      
      if (diffLamports > 0) {
        const amountSol = diffLamports / 1e9;
        const hpAdded = donationToHP(amountSol);
        
        // Find sender (first signer that's not us)
        let from = 'unknown';
        for (let i = 0; i < accountKeys.length; i++) {
          const key = typeof accountKeys[i] === 'string' ? accountKeys[i] : accountKeys[i]?.pubkey;
          if (key !== WALLET_ADDRESS && i === 0) {
            from = key;
            break;
          }
        }
        
        const transaction: WalletTransaction = {
          signature,
          amountSol,
          hpAdded,
          from,
          timestamp: new Date((tx.blockTime || Date.now() / 1000) * 1000),
        };
        
        console.log('[WalletMonitor] 💰 NEW DONATION:', amountSol, 'SOL, +', hpAdded, 'HP from', from.slice(0, 10));
        this.config?.onTransaction(transaction);
        
        // Update balance
        await this.fetchBalance();
      } else {
        console.log('[WalletMonitor] Not an incoming transfer (diff <= 0)');
      }
    } catch (e) {
      console.error('[WalletMonitor] Failed to process transaction:', e);
    }
  }

  private connectWebSocket() {
    try {
      // Helius WebSocket for account changes
      const wsUrl = `wss://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`;
      
      console.log('[WalletMonitor] Connecting WebSocket...');
      
      this.ws = new WebSocket(wsUrl);
      
      this.ws.onopen = () => {
        console.log('[WalletMonitor] WebSocket connected');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        
        // Subscribe to account changes
        const subscribeMsg = {
          jsonrpc: '2.0',
          id: 1,
          method: 'accountSubscribe',
          params: [
            WALLET_ADDRESS,
            { encoding: 'jsonParsed', commitment: 'confirmed' },
          ],
        };
        
        this.ws?.send(JSON.stringify(subscribeMsg));
      };
      
      this.ws.onmessage = async (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.method === 'accountNotification') {
            console.log('[WalletMonitor] Account change detected');
            // Fetch new balance and check for new transactions
            await this.fetchBalance();
            await this.fetchRecentTransactions();
          }
        } catch (e) {
          console.error('[WalletMonitor] Failed to parse WS message:', e);
        }
      };
      
      this.ws.onerror = (error) => {
        console.error('[WalletMonitor] WebSocket error:', error);
        this.isConnected = false;
      };
      
      this.ws.onclose = () => {
        console.log('[WalletMonitor] WebSocket closed');
        this.isConnected = false;
        this.attemptReconnect();
      };
      
    } catch (e) {
      console.error('[WalletMonitor] Failed to connect WebSocket:', e);
      this.attemptReconnect();
    }
  }

  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
      console.log(`[WalletMonitor] Reconnecting in ${delay}ms...`);
      setTimeout(() => this.connectWebSocket(), delay);
    }
  }

  private startPolling() {
    // Poll every 5 seconds for faster detection
    this.pollInterval = setInterval(async () => {
      console.log('[WalletMonitor] Polling...');
      await this.fetchBalance();
      await this.fetchRecentTransactions();
    }, 5000);
    
    // Initial fetch
    this.fetchRecentTransactions();
  }

  stop() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    
    this.isConnected = false;
    this.config = null;
    
    console.log('[WalletMonitor] Stopped');
  }
}

// Singleton instance
let monitorService: WalletMonitorService | null = null;

export function getWalletMonitorService(): WalletMonitorService {
  if (!monitorService) {
    monitorService = new WalletMonitorService();
  }
  return monitorService;
}
