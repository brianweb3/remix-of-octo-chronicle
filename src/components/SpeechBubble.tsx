import { motion, AnimatePresence } from 'framer-motion';

interface SpeechBubbleProps {
  message: string | null;
}

export function SpeechBubble({ message }: SpeechBubbleProps) {
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, x: 10, scale: 0.9 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 10, scale: 0.9 }}
          transition={{ duration: 0.3 }}
          className="relative z-20 max-w-xs"
        >
          {/* Speech bubble */}
          <div className="relative bg-card border border-border/50 p-4 shadow-lg rounded-lg">
            {/* Bubble content */}
            <TypewriterText text={message} />
            
            {/* Pointer pointing left to octopus */}
            <div 
              className="absolute top-6 -left-3"
              style={{
                width: 0,
                height: 0,
                borderTop: '10px solid transparent',
                borderBottom: '10px solid transparent',
                borderRight: '12px solid hsl(var(--border) / 0.5)',
              }}
            />
            <div 
              className="absolute top-[25px] -left-[10px]"
              style={{
                width: 0,
                height: 0,
                borderTop: '9px solid transparent',
                borderBottom: '9px solid transparent',
                borderRight: '10px solid hsl(var(--card))',
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
