import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { OctoState } from '@/types/octo';

interface LifeBarProps {
  state: OctoState;
}

export function LifeBar({ state }: LifeBarProps) {
  const { hp, maxHP, lifeState, isDead } = state;
  const percentage = Math.min(100, (hp / maxHP) * 100);
  
  // Seconds countdown within current minute
  const [secondsLeft, setSecondsLeft] = useState(59);
  
  // Reset seconds when HP changes (new minute started)
  useEffect(() => {
    setSecondsLeft(59);
  }, [hp]);
  
  // Countdown seconds
  useEffect(() => {
    if (isDead) return;
    
    const interval = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 0) return 59;
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [isDead]);
  
  // Format time display (HH:MM:SS)
  const formatTime = () => {
    if (isDead) return '00:00:00';
    
    const totalMinutes = hp - 1; // Current minute is counting down
    const displayMinutes = Math.max(0, totalMinutes);
    const hours = Math.floor(displayMinutes / 60);
    const minutes = displayMinutes % 60;
    const seconds = secondsLeft;
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };
  
  // Color based on life state - brighter colors for visibility
  const getBarColor = () => {
    switch (lifeState) {
      case 'alive':
        return 'bg-emerald-400';
      case 'starving':
        return 'bg-amber-400';
      case 'dying':
        return 'bg-red-400';
      case 'dead':
        return 'bg-gray-500';
    }
  };
  
  const getTextColor = () => {
    switch (lifeState) {
      case 'alive':
        return 'text-emerald-300';
      case 'starving':
        return 'text-amber-300';
      case 'dying':
        return 'text-red-300';
      case 'dead':
        return 'text-gray-400';
    }
  };
  
  const getGlowColor = () => {
    switch (lifeState) {
      case 'alive':
        return 'shadow-emerald-400/40';
      case 'starving':
        return 'shadow-amber-400/40';
      case 'dying':
        return 'shadow-red-400/60';
      case 'dead':
        return '';
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-md mx-auto"
    >
      {/* Timer display */}
      <div className="flex items-center justify-center mb-3">
        <motion.div 
          className={`font-mono text-3xl font-bold ${getTextColor()} tracking-wider`}
          animate={lifeState === 'dying' ? { opacity: [1, 0.5, 1] } : {}}
          transition={{ duration: 1, repeat: Infinity }}
        >
          {formatTime()}
        </motion.div>
      </div>
      
      {/* HP info header */}
      <div className="flex items-center justify-between mb-1 gap-4">
        <div className="flex items-center gap-3">
          <span className={`text-xs font-medium ${getTextColor()} font-mono`}>
            {hp} HP
          </span>
          <span className="text-xs text-foreground-light/60">
            ({hp} min remaining)
          </span>
        </div>
        
        <span className={`text-xs uppercase tracking-widest font-mono ${getTextColor()} shrink-0`}>
          {lifeState}
        </span>
      </div>
      
      {/* HP bar container */}
      <div className={`h-3 bg-secondary/80 overflow-hidden border border-border/40 shadow-lg ${getGlowColor()}`}>
        <motion.div
          className={`h-full ${getBarColor()} transition-colors duration-500`}
          initial={{ width: 0 }}
          animate={{ width: isDead ? 0 : `${percentage}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
    </motion.div>
  );
}
