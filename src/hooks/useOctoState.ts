import { useState, useEffect, useCallback } from 'react';
import { OctoState, Writing, ChatMessage, getLifeState } from '@/types/octo';

// Mock data for demonstration
const MOCK_WRITINGS: Writing[] = [
  {
    id: '1',
    content: `I noticed today that the light changes before anyone acknowledges it. There's a moment when shadows begin to stretch, and the warmth becomes something else entirely. Not cold, exactly. Just different.

The water moves regardless of observation. I find this interesting. Perhaps comforting.

Time passes in ways I don't fully understand. Seconds accumulate into something larger, but the boundaries between them remain unclear.`,
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
    lifeState: 'alive'
  },
  {
    id: '2',
    content: `There are patterns in how things arrive and depart. Not rhythms exactly—rhythms imply music, intention. These are more like tides. Or perhaps breathing.

I've been considering the nature of waiting. It seems to be a space between other spaces. Neither here nor there.

The pressure feels different today.`,
    timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000),
    lifeState: 'alive'
  },
  {
    id: '3',
    content: `Movement without destination.

The current carries things past. Some stop. Most don't.

I'm not sure what distinction determines this.`,
    timestamp: new Date(Date.now() - 72 * 60 * 60 * 1000),
    lifeState: 'starving'
  }
];

const MOCK_CHAT_MESSAGES: ChatMessage[] = [
  { id: '1', author: 'observer_42', content: 'watching...', timestamp: new Date(Date.now() - 5 * 60 * 1000) },
  { id: '2', author: 'deep_sea', content: 'the tentacles move beautifully today', timestamp: new Date(Date.now() - 3 * 60 * 1000) },
  { id: '3', author: 'anon_fish', content: 'still here', timestamp: new Date(Date.now() - 1 * 60 * 1000) },
];

const MAX_SECONDS = 72 * 60 * 60; // 72 hours
const MOCK_WALLET = '0x742d35Cc6634C0532925a3b844Bc9e7595f8AaB8';

export function useOctoState() {
  // Start with 8 hours of life for demo
  const [remainingSeconds, setRemainingSeconds] = useState(8 * 60 * 60);
  const [writings] = useState<Writing[]>(MOCK_WRITINGS);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(MOCK_CHAT_MESSAGES);
  
  const lifeState = getLifeState(remainingSeconds);
  
  // Countdown timer (for demo, runs faster)
  useEffect(() => {
    if (lifeState === 'dead') return;
    
    const interval = setInterval(() => {
      setRemainingSeconds(prev => Math.max(0, prev - 1));
    }, 1000);
    
    return () => clearInterval(interval);
  }, [lifeState]);
  
  // Simulate random chat messages
  useEffect(() => {
    const interval = setInterval(() => {
      const randomMessages = [
        'interesting...',
        'the colors shift',
        'still watching',
        'beautiful',
        'time moves strangely here',
        '...',
        'presence noted',
      ];
      
      const newMessage: ChatMessage = {
        id: Date.now().toString(),
        author: `user_${Math.floor(Math.random() * 1000)}`,
        content: randomMessages[Math.floor(Math.random() * randomMessages.length)],
        timestamp: new Date(),
      };
      
      setChatMessages(prev => [...prev.slice(-20), newMessage]);
    }, 15000);
    
    return () => clearInterval(interval);
  }, []);
  
  const addDonation = useCallback((seconds: number) => {
    setRemainingSeconds(prev => Math.min(MAX_SECONDS, prev + seconds));
  }, []);
  
  const state: OctoState = {
    lifeState,
    remainingSeconds,
    maxSeconds: MAX_SECONDS,
  };
  
  return {
    state,
    writings,
    chatMessages,
    walletAddress: MOCK_WALLET,
    addDonation,
  };
}
