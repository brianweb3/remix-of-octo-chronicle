import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

interface SpeechBubbleProps {
  message: string | null;
}

export function SpeechBubble({ message }: SpeechBubbleProps) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastSpokenMessage = useRef<string | null>(null);

  // Speak message when it changes
  useEffect(() => {
    if (!message || message === lastSpokenMessage.current || isMuted) return;
    
    lastSpokenMessage.current = message;
    speakMessage(message);
  }, [message, isMuted]);

  const speakMessage = async (text: string) => {
    try {
      setIsSpeaking(true);
      
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      
      if (!supabaseUrl || !supabaseKey) {
        console.log('[SpeechBubble] No Supabase config for TTS');
        setIsSpeaking(false);
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
        setIsSpeaking(false);
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
        
        audio.onended = () => setIsSpeaking(false);
        audio.onerror = () => setIsSpeaking(false);
        
        await audio.play();
      }
    } catch (error) {
      console.error('[SpeechBubble] TTS error:', error);
      setIsSpeaking(false);
    }
  };

  const toggleMute = () => {
    if (audioRef.current && !isMuted) {
      audioRef.current.pause();
      setIsSpeaking(false);
    }
    setIsMuted(!isMuted);
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
            {/* Mute button */}
            <button
              onClick={toggleMute}
              className="absolute top-2 right-2 p-1 rounded-full hover:bg-white/10 transition-colors"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? (
                <VolumeX className="w-3 h-3 text-foreground-light/40" />
              ) : (
                <Volume2 
                  className={`w-3 h-3 ${isSpeaking ? 'text-emerald-400 animate-pulse' : 'text-foreground-light/40'}`} 
                />
              )}
            </button>
            
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
      className="text-sm text-foreground-light/90 font-mono leading-relaxed pr-6"
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
