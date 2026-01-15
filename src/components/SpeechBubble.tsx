import { motion, AnimatePresence } from 'framer-motion';

interface SpeechBubbleProps {
  message: string | null;
}

export function SpeechBubble({ message }: SpeechBubbleProps) {
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.9 }}
          transition={{ duration: 0.3 }}
          className="absolute top-4 left-1/2 -translate-x-1/2 z-20 max-w-xs"
        >
          <div className="bg-card border border-border/50 p-3 relative">
            <TypewriterText text={message} />
            {/* Sharp speech bubble pointer */}
            <div 
              className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0"
              style={{
                borderLeft: '8px solid transparent',
                borderRight: '8px solid transparent',
                borderTop: '8px solid hsl(var(--border) / 0.5)',
              }}
            />
            <div 
              className="absolute -bottom-[6px] left-1/2 -translate-x-1/2 w-0 h-0"
              style={{
                borderLeft: '6px solid transparent',
                borderRight: '6px solid transparent',
                borderTop: '6px solid hsl(var(--card))',
              }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function TypewriterText({ text }: { text: string }) {
  return (
    <motion.span 
      className="text-sm text-foreground-light/90 font-mono"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {text.split('').map((char, index) => (
        <motion.span
          key={index}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: index * 0.03 }}
        >
          {char}
        </motion.span>
      ))}
    </motion.span>
  );
}
