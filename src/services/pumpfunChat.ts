import { ChatMessage } from '@/types/octo';

// Pump.fun Chat Service using Supabase Edge Function proxy
// Direct WebSocket to pump.fun is blocked by Cloudflare, so we use polling

export interface PumpfunMessage {
  user: string;
  message: string;
  timestamp: number;
  signature?: string;
  mint?: string;
}

export interface PumpfunChatConfig {
  tokenMint: string;
  onMessage: (message: ChatMessage) => void;
  onConnectionChange: (connected: boolean) => void;
  onError?: (error: string) => void;
}

export class PumpfunChatService {
  private config: PumpfunChatConfig | null = null;
  private pollInterval: NodeJS.Timeout | null = null;
  private isPolling = false;
  private lastMessageTimestamp = 0;
  private seenMessageIds = new Set<string>();
  private hasReceivedRealMessages = false;
  
  async connect(config: PumpfunChatConfig) {
    this.config = config;
    this.seenMessageIds.clear();
    this.lastMessageTimestamp = 0;
    this.hasReceivedRealMessages = false;
    
    console.log('[PumpfunChat] Starting polling for token:', config.tokenMint);
    
    // Initial fetch
    const gotMessages = await this.fetchMessages();
    
    // Start polling every 5 seconds
    this.pollInterval = setInterval(() => {
      this.fetchMessages();
    }, 5000);
    
    this.isPolling = true;
    // Only mark as connected if we got real messages
    this.config.onConnectionChange(this.hasReceivedRealMessages);
  }
  
  private async fetchMessages(): Promise<boolean> {
    if (!this.config) return false;
    
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      
      if (!supabaseUrl || !supabaseKey) {
        console.log('[PumpfunChat] Missing Supabase config, using demo mode');
        return false;
      }
      
      const response = await fetch(
        `${supabaseUrl}/functions/v1/pumpfun-chat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseKey}`,
          },
          body: JSON.stringify({
            tokenMint: this.config.tokenMint,
          }),
        }
      );
      
      if (!response.ok) {
        console.log('[PumpfunChat] Failed to fetch:', response.status);
        return false;
      }
      
      const data = await response.json();
      const messages: PumpfunMessage[] = data.messages || [];
      
      // Only consider it connected if we got real messages from 'live' source
      const gotRealMessages = data.source === 'live' && messages.length > 0;
      
      if (gotRealMessages) {
        this.hasReceivedRealMessages = true;
        this.config.onConnectionChange(true);
      }
      
      console.log(`[PumpfunChat] Got ${messages.length} messages from ${data.source}`);
      
      // Process new messages
      for (const msg of messages) {
        const messageId = `${msg.user}-${msg.timestamp}-${msg.message.slice(0, 20)}`;
        
        if (!this.seenMessageIds.has(messageId)) {
          this.seenMessageIds.add(messageId);
          this.handleChatMessage(msg);
        }
      }
      
      // Keep seen messages set from growing too large
      if (this.seenMessageIds.size > 200) {
        const arr = Array.from(this.seenMessageIds);
        this.seenMessageIds = new Set(arr.slice(-100));
      }
      
      return gotRealMessages;
      
    } catch (error) {
      console.error('[PumpfunChat] Fetch error:', error);
      this.config?.onError?.('Failed to fetch messages');
      return false;
    }
  }
  
  private handleChatMessage(data: PumpfunMessage) {
    if (!this.config) return;
    
    // Truncate wallet address for display
    const displayUser = data.user?.slice(0, 6) + '...' + data.user?.slice(-4) || 'anon';
    
    const chatMessage: ChatMessage = {
      id: `pf-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      author: displayUser,
      content: data.message || '',
      timestamp: new Date(data.timestamp || Date.now()),
    };
    
    this.config.onMessage(chatMessage);
  }
  
  disconnect() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    
    this.isPolling = false;
    this.config?.onConnectionChange(false);
    this.config = null;
    this.seenMessageIds.clear();
    
    console.log('[PumpfunChat] Disconnected');
  }
  
  isConnected(): boolean {
    return this.isPolling;
  }
  
  changeRoom(newTokenMint: string) {
    if (this.config) {
      this.disconnect();
      this.connect({ ...this.config, tokenMint: newTokenMint });
    }
  }
}

// Singleton instance
let chatService: PumpfunChatService | null = null;

export function getPumpfunChatService(): PumpfunChatService {
  if (!chatService) {
    chatService = new PumpfunChatService();
  }
  return chatService;
}
