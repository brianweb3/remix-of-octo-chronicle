import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useRef } from 'react';

interface SpeechBubbleProps {
  message: string | null;
  isMuted?: boolean;
  onSpeakingChange?: (speaking: boolean) => void;
}

export function SpeechBubble({ message, isMuted = false, onSpeakingChange }: SpeechBubbleProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastSpokenMessage = useRef<string | null>(null);

  // Speak message when it changes
  useEffect(() => {
    if (!message || message === lastSpokenMessage.current || isMuted) return;
    
    lastSpokenMessage.current = message;
    speakMessage(message);
  }, [message, isMuted]);

  // Stop audio when muted
  useEffect(() => {
    if (isMuted && audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
      onSpeakingChange?.(false);
    }
  }, [isMuted, onSpeakingChange]);

  const speakMessage = async (text: string) => {
    try {
      onSpeakingChange?.(true);
      
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      
      if (!supabaseUrl || !supabaseKey) {
        console.log('[SpeechBubble] No Supabase config for TTS');
        onSpeakingChange?.(false);
        return;
      }

      const response = await fetch(`${supabaseUrl}/functions/v1/octo-tts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        console.error('[SpeechBubble] TTS failed:', response.status);
        onSpeakingChange?.(false);
        return;
      }

      const data = await response.json();
      
      if (data.audioContent) {
        // Stop any existing audio
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current = null;
        }
        
        // Play new audio
        const audio = new Audio(`data:audio/mpeg;base64,${data.audioContent}`);
        audioRef.current = audio;
        
        audio.onended = () => onSpeakingChange?.(false);
        audio.onerror = () => onSpeakingChange?.(false);
        
        await audio.play();
      }
    } catch (error) {
      console.error('[SpeechBubble] TTS error:', error);
      onSpeakingChange?.(false);
    }
  };

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
