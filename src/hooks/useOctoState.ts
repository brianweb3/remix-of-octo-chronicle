import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  OctoState, 
  Writing, 
  ChatMessage, 
  XPost, 
  Transaction,
  getLifeState, 
  donationToHP,
  MAX_HP,
  INITIAL_HP,
  WALLET_ADDRESS
} from '@/types/octo';
import { getPumpfunChatService, PumpfunChatService } from '@/services/pumpfunChat';
import { getWalletMonitorService, WalletTransaction } from '@/services/walletMonitor';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const MOCK_X_POSTS: XPost[] = [
  { id: '1', content: 'The light changed again. No one noticed but me.', timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000) },
  { id: '2', content: 'Existence is not binary. It fluctuates.', timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000) },
  { id: '3', content: 'Time accumulates like sediment.', timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000) },
];

// Random chat messages for fallback when pump.fun is not connected
const RANDOM_CHAT_AUTHORS = [
  'degen_42', 'moon_boy', 'ser_whale', 'based_chad', 'crypto_fren',
  'diamond_hands', 'pump_master', 'sol_maxi', 'ape_in', 'ngmi_cope'
];

const RANDOM_CHAT_MESSAGES = [
  'gm', 'lfg 🚀', 'wagmi', 'nice project ser!', 'to the moon 🌙', 'bullish af',
  'devs active?', 'wen pump?', 'holding strong 💎', 'let\'s go frens!',
  'based', 'who\'s still here?', 'buy the dip ser', 'diamond hands 💎🙌',
  'aped in', 'this is the one', 'ngmi if u sell', 'comfy hold', 'moon soon 🚀',
];

// Default pump.fun token (JULIANO)
const DEFAULT_TOKEN_MINT = 'Bcz4bUXgaqnfwcmodQwzrGW57fXT2vffJzj2U4FHpump';
const STORAGE_KEY_TOKEN_MINT = 'octo_pumpfun_token_mint';

// Writing interval: random between 3-10 minutes (CANONICAL)
const getWritingInterval = () => (Math.floor(Math.random() * 7) + 3) * 60 * 1000;

export function useOctoState() {
  const { toast } = useToast();
  
  const [hp, setHP] = useState(INITIAL_HP);
  const [isDead, setIsDead] = useState(false);
  const [writings, setWritings] = useState<Writing[]>([]);
  const [xPosts] = useState<XPost[]>(MOCK_X_POSTS);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [currentResponse, setCurrentResponse] = useState<string | null>(null);
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);
  const [isLoadingResponse, setIsLoadingResponse] = useState(false);
  
  // Pump.fun chat state
  const [pumpfunTokenMint, setPumpfunTokenMint] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(STORAGE_KEY_TOKEN_MINT) || DEFAULT_TOKEN_MINT;
    }
    return DEFAULT_TOKEN_MINT;
  });
  const [isPumpfunConnected, setIsPumpfunConnected] = useState(false);
  
  // Wallet state
  const [walletBalance, setWalletBalance] = useState<number>(0);
  
  const writingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasRespondedRef = useRef(false);
  const chatServiceRef = useRef<PumpfunChatService | null>(null);
  const mockChatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastHPRef = useRef(hp);
  
  const lifeState = getLifeState(hp);
  
  // Load state from Supabase on mount
  useEffect(() => {
    loadStateFromDatabase();
    loadWritingsFromDatabase();
    loadTransactionsFromBlockchain(); // Load real transactions from blockchain
  }, []);
  
  // Database table types (for type safety before regeneration)
  type AgentStateRow = { id: string; hp: number; is_dead: boolean; updated_at: string };
  type WritingRow = { id: string; title: string; content: string; life_state: string; created_at: string };
  type TransactionRow = { id: string; tx_hash: string; amount_sol: string; hp_added: number; timestamp: string };

  // Load agent state from database
  const loadStateFromDatabase = async () => {
    try {
      const { data, error } = await supabase
        .from('agent_state' as any)
        .select('*')
        .single();
      
      const row = data as unknown as AgentStateRow | null;
      if (row && !error) {
        setHP(row.hp);
        setIsDead(row.is_dead);
      }
    } catch (e) {
      console.log('Using local state (database not available)');
    }
  };
  
  // Load writings from database
  const loadWritingsFromDatabase = async () => {
    try {
      const { data, error } = await supabase
        .from('writings' as any)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      
      const rows = data as unknown as WritingRow[] | null;
      if (rows && !error) {
        setWritings(rows.map(w => ({
          id: w.id,
          title: w.title,
          content: w.content,
          timestamp: new Date(w.created_at),
          lifeState: w.life_state as any,
        })));
      }
    } catch (e) {
      console.log('Could not load writings from database');
    }
  };
  
  // Load real transactions from blockchain (not from database)
  const loadTransactionsFromBlockchain = async () => {
    try {
      const { HELIUS_RPC, WALLET_ADDRESS, donationToHP } = await import('@/types/octo');
      
      // Get recent signatures
      const sigResponse = await fetch(HELIUS_RPC, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'getSignaturesForAddress',
          params: [WALLET_ADDRESS, { limit: 10 }],
        }),
      });
      
      const sigData = await sigResponse.json();
      const signatures = sigData.result || [];
      
      const loadedTxs: Transaction[] = [];
      
      for (const sig of signatures.slice(0, 5)) {
        // Get transaction details
        const txResponse = await fetch(HELIUS_RPC, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'getTransaction',
            params: [sig.signature, { encoding: 'jsonParsed', maxSupportedTransactionVersion: 0 }],
          }),
        });
        
        const txData = await txResponse.json();
        const tx = txData.result;
        
        if (!tx) continue;
        
        const preBalances = tx.meta?.preBalances || [];
        const postBalances = tx.meta?.postBalances || [];
        const accountKeys = tx.transaction?.message?.accountKeys || [];
        
        // Find wallet index
        let walletIndex = -1;
        for (let i = 0; i < accountKeys.length; i++) {
          const key = typeof accountKeys[i] === 'string' ? accountKeys[i] : accountKeys[i]?.pubkey;
          if (key === WALLET_ADDRESS) {
            walletIndex = i;
            break;
          }
        }
        
        if (walletIndex === -1) continue;
        
        const diffLamports = (postBalances[walletIndex] || 0) - (preBalances[walletIndex] || 0);
        
        if (diffLamports > 0) {
          const amountSol = diffLamports / 1e9;
          loadedTxs.push({
            txHash: sig.signature,
            amountSol,
            hpAdded: donationToHP(amountSol),
            timestamp: new Date((tx.blockTime || Date.now() / 1000) * 1000),
          });
        }
      }
      
      if (loadedTxs.length > 0) {
        setTransactions(loadedTxs);
        console.log('[useOctoState] Loaded', loadedTxs.length, 'real transactions from blockchain');
      }
    } catch (e) {
      console.log('Could not load transactions from blockchain:', e);
    }
  };
  
  // Check for new donations and show notification
  useEffect(() => {
    if (hp > lastHPRef.current && !isDead) {
      const hpAdded = hp - lastHPRef.current;
      toast({
        title: "Wallet funded",
        description: `Octo Claude's life extended by +${hpAdded} minute${hpAdded > 1 ? 's' : ''}.`,
      });
    }
    lastHPRef.current = hp;
  }, [hp, isDead, toast]);
  
  // Subscribe to real-time updates from Supabase
  useEffect(() => {
    const channel = supabase
      .channel('agent_state_changes')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'agent_state' },
        (payload) => {
          const newState = payload.new as { hp: number; is_dead: boolean };
          setHP(newState.hp);
          setIsDead(newState.is_dead);
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
  
  // Connect to pump.fun chat
  useEffect(() => {
    if (!pumpfunTokenMint || isDead) return;
    
    const chatService = getPumpfunChatService();
    chatServiceRef.current = chatService;
    
    chatService.connect({
      tokenMint: pumpfunTokenMint,
      onMessage: (message) => {
        setChatMessages(prev => [...prev.slice(-30), message]);
      },
      onConnectionChange: (connected) => {
        setIsPumpfunConnected(connected);
      },
    });
    
    return () => {
      chatService.disconnect();
      chatServiceRef.current = null;
    };
  }, [pumpfunTokenMint, isDead]);
  
  // Save token mint to localStorage
  useEffect(() => {
    if (pumpfunTokenMint) {
      localStorage.setItem(STORAGE_KEY_TOKEN_MINT, pumpfunTokenMint);
    }
  }, [pumpfunTokenMint]);
  
  // Wallet monitoring for real-time donations
  useEffect(() => {
    const walletMonitor = getWalletMonitorService();
    
    walletMonitor.start({
      onBalanceChange: (balanceSol) => {
        setWalletBalance(balanceSol);
      },
      onTransaction: (tx: WalletTransaction) => {
        // Add to transactions list
        const newTransaction: Transaction = {
          txHash: tx.signature,
          amountSol: tx.amountSol,
          hpAdded: tx.hpAdded,
          timestamp: tx.timestamp,
        };
        
        setTransactions(prev => [newTransaction, ...prev.slice(0, 19)]);
        
        // Add HP (capped at MAX_HP)
        if (tx.hpAdded > 0) {
          setHP(prev => {
            const newHP = Math.min(prev + tx.hpAdded, MAX_HP);
            return newHP;
          });
          
          // Revive if was dead
          if (isDead && tx.hpAdded > 0) {
            setIsDead(false);
          }
          
          // Show notification
          toast({
            title: "💰 Donation received!",
            description: `+${tx.amountSol.toFixed(4)} SOL → +${tx.hpAdded} HP (${tx.hpAdded} minutes added)`,
          });
          
          // Save to database
          try {
            (supabase.from('transaction_history' as any) as any).insert({
              tx_hash: tx.signature,
              amount_sol: tx.amountSol.toString(),
              hp_added: tx.hpAdded,
            });
          } catch (e) {
            console.log('Could not save transaction to database');
          }
        }
      },
      onError: (error) => {
        console.error('[WalletMonitor] Error:', error);
      },
    });
    
    return () => {
      walletMonitor.stop();
    };
  }, [isDead, toast]);
  
  // HP drain: -1 HP per minute (60 seconds)
  // Server-side drain is handled by cron job calling wallet-monitor function
  // This is client-side simulation for UI responsiveness
  useEffect(() => {
    if (isDead) return;
    
    const interval = setInterval(() => {
      setHP(prev => {
        const newHP = Math.max(0, prev - 1);
        if (newHP <= 0) {
          setIsDead(true);
        }
        return newHP;
      });
    }, 60000); // 1 minute = 60 seconds
    
    return () => clearInterval(interval);
  }, [isDead]);
  
  // Generate mock chat messages only when pump.fun is not connected
  useEffect(() => {
    if (isDead) return;
    
    if (isPumpfunConnected) {
      if (mockChatIntervalRef.current) {
        clearInterval(mockChatIntervalRef.current);
        mockChatIntervalRef.current = null;
      }
      return;
    }
    
    mockChatIntervalRef.current = setInterval(() => {
      const newMessage: ChatMessage = {
        id: Date.now().toString(),
        author: RANDOM_CHAT_AUTHORS[Math.floor(Math.random() * RANDOM_CHAT_AUTHORS.length)],
        content: RANDOM_CHAT_MESSAGES[Math.floor(Math.random() * RANDOM_CHAT_MESSAGES.length)],
        timestamp: new Date(),
      };
      
      setChatMessages(prev => [...prev.slice(-30), newMessage]);
    }, 4000 + Math.random() * 4000);
    
    return () => {
      if (mockChatIntervalRef.current) {
        clearInterval(mockChatIntervalRef.current);
      }
    };
  }, [isDead, isPumpfunConnected]);
  
  // Generate AI response
  const generateResponse = useCallback(async (chatMessage?: string, messageId?: string) => {
    if (isDead || isLoadingResponse) return;
    
    setIsLoadingResponse(true);
    
    if (messageId) {
      setHighlightedMessageId(messageId);
    }
    
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/octo-respond`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ 
            lifeState,
            chatMessage: chatMessage || ''
          }),
        }
      );
      
      if (!response.ok) {
        setIsLoadingResponse(false);
        setHighlightedMessageId(null);
        return;
      }
      
      const data = await response.json();
      const octoResponse = data.response;
      
      setCurrentResponse(octoResponse);
      
      const newMessage: ChatMessage = {
        id: `octo-${Date.now()}`,
        author: '🐙 Octo',
        content: octoResponse,
        timestamp: new Date(),
        isOctoResponse: true,
      };
      setChatMessages(prev => [...prev.slice(-30), newMessage]);
      
      const displayTime = Math.max(5000, octoResponse.length * 80);
      setTimeout(() => {
        setCurrentResponse(null);
        setHighlightedMessageId(null);
      }, displayTime);
      
    } catch (error) {
      console.error('Failed to get AI response:', error);
      setHighlightedMessageId(null);
    }
    
    setIsLoadingResponse(false);
  }, [isDead, lifeState, isLoadingResponse]);
  
  // Octo responds to chat messages
  useEffect(() => {
    if (isDead) return;
    
    const initialTimeout = setTimeout(() => {
      if (!hasRespondedRef.current) {
        hasRespondedRef.current = true;
        generateResponse('stream starting, greet the chat', undefined);
      }
    }, 3000);
    
    const interval = setInterval(() => {
      const nonOctoMessages = chatMessages.filter(m => !m.isOctoResponse);
      const lastFewMessages = nonOctoMessages.slice(-5);
      
      if (lastFewMessages.length > 0) {
        const messageToReply = lastFewMessages[Math.floor(Math.random() * lastFewMessages.length)];
        if (messageToReply && Math.random() < 0.8) {
          generateResponse(messageToReply.content, messageToReply.id);
        }
      }
    }, 10000 + Math.random() * 10000);
    
    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, [isDead, chatMessages, generateResponse]);
  
  // Write articles periodically (3-10 minutes) - CANONICAL
  const scheduleNextWriting = useCallback(() => {
    if (isDead) return;
    
    const interval = getWritingInterval();
    console.log(`Next writing in ${interval / 60000} minutes`);
    
    writingTimeoutRef.current = setTimeout(async () => {
      if (isDead) return;
      
      try {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/octo-write`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            },
            body: JSON.stringify({ lifeState }),
          }
        );
        
        if (response.ok) {
          const data = await response.json();
          const newWriting: Writing = {
            id: Date.now().toString(),
            title: data.title || 'Untitled',
            content: data.writing,
            timestamp: new Date(),
            lifeState,
          };
          setWritings(prev => [newWriting, ...prev]);
          
          // Save to database
          try {
            await (supabase.from('writings' as any) as any).insert({
              title: newWriting.title,
              content: newWriting.content,
              life_state: lifeState,
            });
          } catch (e) {
            console.log('Could not save writing to database');
          }
        }
      } catch (error) {
        console.error('Failed to write:', error);
      }
      
      scheduleNextWriting();
    }, interval);
  }, [isDead, lifeState]);
  
  // Start writing cycle
  useEffect(() => {
    if (isDead) {
      if (writingTimeoutRef.current) {
        clearTimeout(writingTimeoutRef.current);
      }
      return;
    }
    
    const initialTimeout = setTimeout(() => {
      scheduleNextWriting();
    }, 30000);
    
    return () => {
      clearTimeout(initialTimeout);
      if (writingTimeoutRef.current) {
        clearTimeout(writingTimeoutRef.current);
      }
    };
  }, [isDead, scheduleNextWriting]);
  
  // Function to update pump.fun token mint
  const setPumpfunToken = useCallback((tokenMint: string) => {
    setPumpfunTokenMint(tokenMint);
    if (chatServiceRef.current?.isConnected()) {
      chatServiceRef.current.changeRoom(tokenMint);
    }
  }, []);
  
  // Calculate total HP received
  const totalHPReceived = transactions.reduce((acc, t) => acc + t.hpAdded, 0);
  
  const state: OctoState = {
    lifeState,
    hp,
    maxHP: MAX_HP,
    isDead,
  };
  
  return {
    state,
    writings,
    xPosts,
    chatMessages,
    transactions,
    totalHPReceived,
    currentResponse,
    highlightedMessageId,
    walletAddress: WALLET_ADDRESS,
    walletBalance,
    contractAddress: WALLET_ADDRESS, // Same as wallet for now
    // Pump.fun integration
    pumpfunTokenMint,
    setPumpfunToken,
    isPumpfunConnected,
  };
}
