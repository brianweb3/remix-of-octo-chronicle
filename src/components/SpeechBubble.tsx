import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { Play } from 'lucide-react';

interface SpeechBubbleProps {
  message: string | null;
  isMuted?: boolean;
  onSpeakingChange?: (speaking: boolean) => void;
}

// Track if user has interacted with the page
let userHasInteracted = false;

export function SpeechBubble({ message, isMuted = false, onSpeakingChange }: SpeechBubbleProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastSpokenMessage = useRef<string | null>(null);
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Track user interaction
  useEffect(() => {
    const handleInteraction = () => {
      userHasInteracted = true;
      // If we have pending message, speak it
      if (pendingMessage) {
        speakWithBrowserTTS(pendingMessage);
        setPendingMessage(null);
      }
    };

    window.addEventListener('click', handleInteraction, { once: true });
    window.addEventListener('keydown', handleInteraction, { once: true });
    window.addEventListener('touchstart', handleInteraction, { once: true });

    return () => {
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
    };
  }, [pendingMessage]);

  // Speak message when it changes
  useEffect(() => {
    if (!message || message === lastSpokenMessage.current || isMuted) return;
    
    lastSpokenMessage.current = message;
    
    if (userHasInteracted) {
      speakWithBrowserTTS(message);
    } else {
      setPendingMessage(message);
    }
  }, [message, isMuted]);

  // Stop speech when muted
  useEffect(() => {
    if (isMuted) {
      window.speechSynthesis?.cancel();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      onSpeakingChange?.(false);
    }
  }, [isMuted, onSpeakingChange]);

  // Use browser's free Web Speech API
  const speakWithBrowserTTS = (text: string) => {
    if (!window.speechSynthesis) {
      console.log('[SpeechBubble] Web Speech API not supported');
      return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Try to get a good voice
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => 
      v.lang.startsWith('en') && (v.name.includes('Male') || v.name.includes('Daniel') || v.name.includes('David'))
    ) || voices.find(v => v.lang.startsWith('en')) || voices[0];
    
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }
    
    utterance.rate = 1.0;
    utterance.pitch = 0.9;
    
    utterance.onstart = () => {
      onSpeakingChange?.(true);
      setPendingMessage(null);
    };
    
    utterance.onend = () => {
      onSpeakingChange?.(false);
    };
    
    utterance.onerror = () => {
      onSpeakingChange?.(false);
    };

    window.speechSynthesis.speak(utterance);
  };

  const handlePlayClick = () => {
    userHasInteracted = true;
    if (pendingMessage) {
      speakWithBrowserTTS(pendingMessage);
    } else if (message) {
      speakWithBrowserTTS(message);
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
            {/* Play button if waiting for interaction */}
            {pendingMessage && !isMuted && (
              <button
                onClick={handlePlayClick}
                className="absolute -top-2 -right-2 w-8 h-8 bg-emerald-500 hover:bg-emerald-400 rounded-full flex items-center justify-center shadow-lg transition-colors z-10"
                title="Click to play voice"
              >
                <Play className="w-4 h-4 text-white fill-white" />
              </button>
            )}
            
            {/* Loading indicator */}
            {isLoading && !isMuted && (
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-card border border-border rounded-full flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            
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
