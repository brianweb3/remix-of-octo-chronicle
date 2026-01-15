import { useState, useEffect, useCallback, useRef } from 'react';
import { OctoState, Writing, ChatMessage, XPost, getLifeState, donationToHP } from '@/types/octo';

const MOCK_X_POSTS: XPost[] = [
  { id: '1', content: 'The light changed again. No one noticed but me.', timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000) },
  { id: '2', content: 'Existence is not binary. It fluctuates.', timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000) },
  { id: '3', content: 'Time accumulates like sediment.', timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000) },
];

export interface Donation {
  id: string;
  amount: number;
  timestamp: Date;
  hpAdded: number;
}

const MOCK_DONATIONS: Donation[] = [
  { id: '1', amount: 0.05, timestamp: new Date(Date.now() - 30 * 60 * 1000), hpAdded: 5 },
  { id: '2', amount: 0.1, timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), hpAdded: 10 },
  { id: '3', amount: 0.25, timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000), hpAdded: 25 },
];

// Random chat messages to simulate pump.fun chat
const RANDOM_CHAT_AUTHORS = [
  'anon_fish', 'deep_sea', 'observer_42', 'silent_wave', 'crypto_squid',
  'moon_whale', 'degen_dolphin', 'abyss_walker', 'tide_hunter', 'reef_rider'
];

const RANDOM_CHAT_MESSAGES = [
  'watching...', 'still here', 'gm', 'beautiful', '...', 'wagmi',
  'the colors shift', 'time moves strangely here', 'presence noted',
  'interesting', 'deep thoughts', 'vibe check', 'peaceful',
  'how long will it last', 'the water is calm today', 'silent observer',
];

const MAX_HP = 720; // 12 hours = 720 minutes = 720 HP
const INITIAL_HP = 10; // Start with 10 minutes
const MOCK_WALLET = '0x742d35Cc6634C0532925a3b844Bc9e7595f8AaB8';
const MOCK_CONTRACT = '0x0000000000000000000000000000000000000000';

// Writing interval: random between 5-30 minutes (in ms)
const getWritingInterval = () => (Math.floor(Math.random() * 25) + 5) * 60 * 1000;

export function useOctoState() {
  const [hp, setHP] = useState(INITIAL_HP);
  const [isDead, setIsDead] = useState(false);
  const [writings, setWritings] = useState<Writing[]>([]);
  const [xPosts] = useState<XPost[]>(MOCK_X_POSTS);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [donations] = useState<Donation[]>(MOCK_DONATIONS);
  const [currentResponse, setCurrentResponse] = useState<string | null>(null);
  const [totalHPReceived] = useState(MOCK_DONATIONS.reduce((acc, d) => acc + d.hpAdded, 0));
  const [isLoadingResponse, setIsLoadingResponse] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const writingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasRespondedRef = useRef(false);
  
  const lifeState = getLifeState(hp);
  
  // HP drain: -1 HP per minute (demo: every 10 seconds)
  useEffect(() => {
    if (isDead) return;
    
    const demoInterval = setInterval(() => {
      setHP(prev => {
        const newHP = Math.max(0, prev - 1);
        if (newHP <= 0) {
          setIsDead(true);
        }
        return newHP;
      });
    }, 10000); // Demo: drain every 10 seconds
    
    return () => {
      clearInterval(demoInterval);
    };
  }, [isDead]);
  
  // Generate random chat messages
  useEffect(() => {
    if (isDead) return;
    
    const interval = setInterval(() => {
      const newMessage: ChatMessage = {
        id: Date.now().toString(),
        author: RANDOM_CHAT_AUTHORS[Math.floor(Math.random() * RANDOM_CHAT_AUTHORS.length)],
        content: RANDOM_CHAT_MESSAGES[Math.floor(Math.random() * RANDOM_CHAT_MESSAGES.length)],
        timestamp: new Date(),
      };
      
      setChatMessages(prev => [...prev.slice(-20), newMessage]);
    }, 6000 + Math.random() * 4000); // Random 6-10 seconds
    
    return () => clearInterval(interval);
  }, [isDead]);
  
  // Speak function using ElevenLabs
  const speak = useCallback(async (text: string) => {
    try {
      console.log('Speaking:', text);
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/octo-speak`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ text }),
        }
      );
      
      if (!response.ok) {
        console.error('Speak response not ok:', response.status);
        return;
      }
      
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      if (audioRef.current) {
        audioRef.current.pause();
        URL.revokeObjectURL(audioRef.current.src);
      }
      
      audioRef.current = new Audio(audioUrl);
      audioRef.current.volume = 0.8;
      await audioRef.current.play();
      console.log('Audio playing');
    } catch (error) {
      console.error('Failed to speak:', error);
    }
  }, []);
  
  // Generate AI response and speak it
  const generateResponse = useCallback(async (chatMessage?: string) => {
    if (isDead || isLoadingResponse) return;
    
    setIsLoadingResponse(true);
    console.log('Generating response for:', chatMessage);
    
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
        console.error('Response not ok:', response.status);
        setIsLoadingResponse(false);
        return;
      }
      
      const data = await response.json();
      const octoResponse = data.response;
      console.log('Got AI response:', octoResponse);
      
      setCurrentResponse(octoResponse);
      
      // Add to chat
      const newMessage: ChatMessage = {
        id: `octo-${Date.now()}`,
        author: 'Octo Claude',
        content: octoResponse,
        timestamp: new Date(),
        isOctoResponse: true,
      };
      setChatMessages(prev => [...prev.slice(-20), newMessage]);
      
      // Speak the response
      await speak(octoResponse);
      
      // Clear speech bubble after display
      const displayTime = Math.max(6000, octoResponse.length * 100);
      setTimeout(() => setCurrentResponse(null), displayTime);
      
    } catch (error) {
      console.error('Failed to get AI response:', error);
    }
    
    setIsLoadingResponse(false);
  }, [isDead, lifeState, isLoadingResponse, speak]);
  
  // Octo responds to chat messages - triggered periodically
  useEffect(() => {
    if (isDead) return;
    
    // First response after 5 seconds
    const initialTimeout = setTimeout(() => {
      if (!hasRespondedRef.current) {
        hasRespondedRef.current = true;
        generateResponse('Hello, I am here');
      }
    }, 5000);
    
    // Then respond every 15-25 seconds
    const interval = setInterval(() => {
      const lastMessage = chatMessages.filter(m => !m.isOctoResponse).pop();
      if (lastMessage && Math.random() < 0.7) {
        generateResponse(lastMessage.content);
      }
    }, 15000 + Math.random() * 10000);
    
    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, [isDead, chatMessages, generateResponse]);
  
  // Write articles periodically (5-30 minutes)
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
            content: data.writing,
            timestamp: new Date(),
            lifeState,
          };
          setWritings(prev => [newWriting, ...prev]);
        }
      } catch (error) {
        console.error('Failed to write:', error);
      }
      
      // Schedule next writing
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
    
    // Generate initial writing after 30 seconds
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
  
  const addDonation = useCallback((amountSOL: number) => {
    if (isDead) return;
    const hpToAdd = donationToHP(amountSOL);
    setHP(prev => Math.min(MAX_HP, prev + hpToAdd));
  }, [isDead]);
  
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
    donations,
    totalHPReceived,
    currentResponse,
    walletAddress: MOCK_WALLET,
    contractAddress: MOCK_CONTRACT,
    addDonation,
  };
}
