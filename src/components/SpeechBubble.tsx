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
          className="absolute top-8 left-1/2 -translate-x-1/2 z-20 max-w-sm"
        >
          {/* Cloud-like speech bubble */}
          <div className="relative bg-card border border-border/50 p-4 shadow-lg">
            {/* Bubble content */}
            <TypewriterText text={message} />
            
            {/* Sharp pointer pointing down to octopus */}
            <div 
              className="absolute -bottom-3 left-1/2 -translate-x-1/2"
              style={{
                width: 0,
                height: 0,
                borderLeft: '12px solid transparent',
                borderRight: '12px solid transparent',
                borderTop: '12px solid hsl(var(--border) / 0.5)',
              }}
            />
            <div 
              className="absolute -bottom-[10px] left-1/2 -translate-x-1/2"
              style={{
                width: 0,
                height: 0,
                borderLeft: '10px solid transparent',
                borderRight: '10px solid transparent',
                borderTop: '10px solid hsl(var(--card))',
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
    <motion.p 
      className="text-sm text-foreground-light/90 font-mono leading-relaxed"
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
    </motion.p>
  );
}
