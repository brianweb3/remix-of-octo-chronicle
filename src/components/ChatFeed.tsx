import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChatMessage } from '@/types/octo';
import { Wifi, WifiOff, Settings } from 'lucide-react';

interface ChatFeedProps {
  messages: ChatMessage[];
  highlightedMessageId?: string | null;
  pumpfunTokenMint?: string;
  isPumpfunConnected?: boolean;
  onSetPumpfunToken?: (token: string) => void;
}

export function ChatFeed({ 
  messages, 
  highlightedMessageId,
  pumpfunTokenMint = '',
  isPumpfunConnected = false,
  onSetPumpfunToken,
}: ChatFeedProps) {
  const [showSettings, setShowSettings] = useState(false);
  const [tokenInput, setTokenInput] = useState(pumpfunTokenMint);
  
  // Sync tokenInput with pumpfunTokenMint prop
  useEffect(() => {
    if (pumpfunTokenMint) {
      setTokenInput(pumpfunTokenMint);
    }
  }, [pumpfunTokenMint]);

  const handleConnect = () => {
    if (tokenInput && onSetPumpfunToken) {
      onSetPumpfunToken(tokenInput);
      setShowSettings(false);
    }
  };

  const handleDisconnect = () => {
    if (onSetPumpfunToken) {
      onSetPumpfunToken('');
      setTokenInput('');
    }
  };

  return (
    <div className="glass-panel h-full flex flex-col overflow-hidden">
      {/* Header with Pumpfun branding */}
      <div className="p-4 border-b border-border/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isPumpfunConnected ? (
            <Wifi className="w-4 h-4 text-alive" />
          ) : (
            <WifiOff className="w-4 h-4 text-muted-foreground" />
          )}
          <h3 className="text-sm font-medium text-primary-light uppercase tracking-wider">
            {isPumpfunConnected ? 'Live Chat' : 'Demo Chat'}
          </h3>
          <span className="text-xs text-primary/60 font-mono">pump.fun</span>
        </div>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="p-1.5 hover:bg-primary/10 rounded transition-colors"
          title="Connection settings"
        >
          <Settings className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {/* Settings panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-b border-border/30 overflow-hidden"
          >
            <div className="p-3 space-y-2 bg-secondary/20">
              <label className="text-xs text-muted-foreground block">
                pump.fun token mint address:
              </label>
              <input
                type="text"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder="Enter token mint address..."
                className="w-full px-2 py-1.5 text-xs font-mono bg-background/50 border border-border/30 rounded focus:outline-none focus:border-primary/50"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleConnect}
                  disabled={!tokenInput}
                  className="flex-1 px-3 py-1.5 text-xs bg-primary/20 hover:bg-primary/30 border border-primary/30 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isPumpfunConnected ? 'Switch' : 'Connect'}
                </button>
                {isPumpfunConnected && (
                  <button
                    onClick={handleDisconnect}
                    className="px-3 py-1.5 text-xs bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded transition-colors"
                  >
                    Disconnect
                  </button>
                )}
              </div>
              {isPumpfunConnected && pumpfunTokenMint && (
                <p className="text-[10px] text-alive font-mono truncate">
                  ✓ Connected to: {pumpfunTokenMint.slice(0, 8)}...{pumpfunTokenMint.slice(-6)}
                </p>
              )}
              {!isPumpfunConnected && !pumpfunTokenMint && (
                <p className="text-[10px] text-muted-foreground">
                  Without token, demo chat is shown
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
        <AnimatePresence mode="popLayout">
          {messages.map((message) => {
            const isHighlighted = message.id === highlightedMessageId;
            
            return (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ 
                  opacity: 1, 
                  y: 0,
                  scale: isHighlighted ? 1.02 : 1,
                }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className={`p-3 border transition-all duration-300 ${
                  message.isOctoResponse 
                    ? 'bg-primary/10 border-primary/30' 
                    : isHighlighted
                      ? 'bg-amber-500/20 border-amber-500/50 ring-2 ring-amber-500/30'
                      : 'bg-secondary/40 border-border/20'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium font-mono ${
                      message.isOctoResponse ? 'text-primary' : isHighlighted ? 'text-amber-400' : 'text-primary/70'
                    }`}>
                      {message.author}
                    </span>
                    {isHighlighted && (
                      <motion.span
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-[10px] text-amber-400 uppercase tracking-wider"
                      >
                        ← replying
                      </motion.span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatTime(message.timestamp)}
                  </span>
                </div>
                <p className={`text-sm leading-relaxed ${
                  message.isOctoResponse 
                    ? 'text-foreground-light' 
                    : 'text-foreground-light/90'
                }`}>
                  {message.content}
                </p>
              </motion.div>
            );
          })}
        </AnimatePresence>
        
        {messages.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm">
            Waiting for messages...
          </div>
        )}
      </div>
      
      {/* Footer */}
      <div className="p-3 border-t border-border/20 flex items-center justify-between">
        <span className="text-xs text-muted-foreground font-mono">
          pump.fun
        </span>
        <span className={`text-[10px] ${isPumpfunConnected ? 'text-alive' : 'text-muted-foreground'}`}>
          {isPumpfunConnected ? '● LIVE' : '○ DEMO'}
        </span>
      </div>
    </div>
  );
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
}
