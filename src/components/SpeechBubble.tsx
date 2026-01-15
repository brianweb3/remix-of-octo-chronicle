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
  const [pendingAudio, setPendingAudio] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Track user interaction
  useEffect(() => {
    const handleInteraction = () => {
      userHasInteracted = true;
      // If we have pending audio, play it
      if (pendingAudio) {
        playAudio(pendingAudio);
        setPendingAudio(null);
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
  }, [pendingAudio]);

  // Speak message when it changes
  useEffect(() => {
    if (!message || message === lastSpokenMessage.current || isMuted) return;
    
    lastSpokenMessage.current = message;
    generateSpeech(message);
  }, [message, isMuted]);

  // Stop audio when muted
  useEffect(() => {
    if (isMuted && audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
      onSpeakingChange?.(false);
    }
  }, [isMuted, onSpeakingChange]);

  const playAudio = async (audioContent: string) => {
    try {
      // Stop any existing audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      
      onSpeakingChange?.(true);
      
      const audio = new Audio(`data:audio/mpeg;base64,${audioContent}`);
      audioRef.current = audio;
      
      audio.onended = () => {
        onSpeakingChange?.(false);
        setPendingAudio(null);
      };
      audio.onerror = (e) => {
        console.error('[SpeechBubble] Audio error:', e);
        onSpeakingChange?.(false);
        setPendingAudio(null);
      };
      
      await audio.play();
      setPendingAudio(null);
    } catch (error: unknown) {
      const err = error as Error;
      if (err.name === 'NotAllowedError') {
        console.log('[SpeechBubble] Autoplay blocked, waiting for user interaction');
        setPendingAudio(audioContent);
        onSpeakingChange?.(false);
      } else {
        console.error('[SpeechBubble] Play error:', error);
        onSpeakingChange?.(false);
      }
    }
  };

  const generateSpeech = async (text: string) => {
    try {
      setIsLoading(true);
      
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      
      if (!supabaseUrl || !supabaseKey) {
        console.log('[SpeechBubble] No Supabase config for TTS');
        setIsLoading(false);
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

      setIsLoading(false);

      if (!response.ok) {
        console.error('[SpeechBubble] TTS failed:', response.status);
        return;
      }

      const data = await response.json();
      
      if (data.audioContent) {
        if (userHasInteracted) {
          await playAudio(data.audioContent);
        } else {
          // Store for later when user interacts
          setPendingAudio(data.audioContent);
          console.log('[SpeechBubble] Audio ready, waiting for user interaction');
        }
      }
    } catch (error) {
      console.error('[SpeechBubble] TTS error:', error);
      setIsLoading(false);
    }
  };

  const handlePlayClick = () => {
    userHasInteracted = true;
    if (pendingAudio) {
      playAudio(pendingAudio);
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
            {/* Play button if audio is pending */}
            {pendingAudio && !isMuted && (
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
