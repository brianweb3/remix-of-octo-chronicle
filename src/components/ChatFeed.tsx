import { motion, AnimatePresence } from 'framer-motion';
import { ChatMessage } from '@/types/octo';

interface ChatFeedProps {
  messages: ChatMessage[];
}

export function ChatFeed({ messages }: ChatFeedProps) {
  return (
    <div className="glass-panel h-full flex flex-col overflow-hidden">
      {/* Header with Pumpfun branding - no rounded corners */}
      <div className="p-4 border-b border-border/30 flex items-center gap-2">
        <div className="w-1.5 h-1.5 bg-alive" />
        <h3 className="text-sm font-medium text-primary-light uppercase tracking-wider">
          Live Chat
        </h3>
        <span className="text-xs text-primary/60 font-mono">pump.fun</span>
      </div>
      
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
        <AnimatePresence mode="popLayout">
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className={`p-3 border border-border/20 ${
                message.isOctoResponse 
                  ? 'bg-primary/10 border-primary/30' 
                  : 'bg-secondary/40'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`text-xs font-medium font-mono ${
                  message.isOctoResponse ? 'text-primary' : 'text-primary/70'
                }`}>
                  {message.author}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatTime(message.timestamp)}
                </span>
              </div>
              <p className={`text-sm leading-relaxed ${
                message.isOctoResponse 
                  ? 'text-foreground-light italic' 
                  : 'text-foreground-light/90'
              }`}>
                {message.content}
              </p>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {messages.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm">
            Waiting for messages...
          </div>
        )}
      </div>
      
      {/* Footer */}
      <div className="p-3 border-t border-border/20 text-center">
        <span className="text-xs text-muted-foreground font-mono">
          pump.fun
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
