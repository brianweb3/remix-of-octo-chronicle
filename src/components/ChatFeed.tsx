import { motion, AnimatePresence } from 'framer-motion';
import { ChatMessage } from '@/types/octo';
import { Wifi } from 'lucide-react';

interface ChatFeedProps {
  messages: ChatMessage[];
  highlightedMessageId?: string | null;
}

export function ChatFeed({ 
  messages, 
  highlightedMessageId,
}: ChatFeedProps) {
  return (
    <div className="glass-panel h-full flex flex-col overflow-hidden">
      {/* Header with Pumpfun branding */}
      <div className="p-4 border-b border-border/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wifi className="w-4 h-4 text-alive" />
          <h3 className="text-sm font-medium text-primary-light uppercase tracking-wider">
            Live Chat
          </h3>
          <span className="text-xs text-primary/60 font-mono">pump.fun</span>
        </div>
      </div>
      
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
        <span className="text-[10px] text-alive">
          ● LIVE
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
