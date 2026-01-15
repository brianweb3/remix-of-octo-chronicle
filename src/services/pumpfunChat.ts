import { ChatMessage } from '@/types/octo';

// Pump.fun Chat Service using Supabase Edge Function proxy
// Direct WebSocket to pump.fun is blocked by Cloudflare, so we use polling

export interface PumpfunMessage {
  id: string;
  user: string;
  message: string;
  timestamp: number;
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
    
    // Start polling every 3 seconds
    this.pollInterval = setInterval(() => {
      this.fetchMessages();
    }, 3000);
    
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
      
      console.log(`[PumpfunChat] Got ${messages.length} messages, source: ${data.source}`);
      
      // Mark as connected if we got any messages
      if (messages.length > 0) {
        this.hasReceivedRealMessages = true;
        this.config.onConnectionChange(true);
      }
      
      // Process new messages (newest first, so reverse to show oldest first)
      const sortedMessages = [...messages].sort((a, b) => a.timestamp - b.timestamp);
      
      for (const msg of sortedMessages) {
        const messageId = msg.id || `${msg.user}-${msg.timestamp}`;
        
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
      
      return messages.length > 0;
      
    } catch (error) {
      console.error('[PumpfunChat] Fetch error:', error);
      this.config?.onError?.('Failed to fetch messages');
      return false;
    }
  }
  
  private handleChatMessage(data: PumpfunMessage) {
    if (!this.config) return;
    
    // Truncate wallet address for display
    const user = data.user || 'anon';
    const displayUser = user.length > 10 
      ? user.slice(0, 6) + '...' + user.slice(-4) 
      : user;
    
    const chatMessage: ChatMessage = {
      id: data.id || `pf-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      author: displayUser,
      content: data.message || '',
      timestamp: new Date(data.timestamp || Date.now()),
    };
    
    console.log(`[PumpfunChat] New message from ${displayUser}: ${data.message?.slice(0, 50)}`);
    
    this.config.onMessage(chatMessage);
  }
  
  disconnect() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    
    this.isPolling = false;
    
    // Save callback reference before nulling config
    const onConnectionChange = this.config?.onConnectionChange;
    this.config = null;
    this.seenMessageIds.clear();
    
    // Call after nulling to avoid race conditions
    if (onConnectionChange) {
      onConnectionChange(false);
    }
    
    console.log('[PumpfunChat] Disconnected');
  }
  
  isConnected(): boolean {
    return this.isPolling;
  }
  
  changeRoom(newTokenMint: string) {
    if (this.config) {
      // Save config before disconnect nulls it
      const savedConfig = { ...this.config };
      this.disconnect();
      this.connect({ ...savedConfig, tokenMint: newTokenMint });
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
