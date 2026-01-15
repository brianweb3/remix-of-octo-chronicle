import { motion } from 'framer-motion';
import { OctoState } from '@/types/octo';

interface LifeBarProps {
  state: OctoState;
}

export function LifeBar({ state }: LifeBarProps) {
  const { remainingSeconds, maxSeconds, lifeState } = state;
  const percentage = Math.min(100, (remainingSeconds / maxSeconds) * 100);
  
  // XP value display (1 second = 1 XP for simplicity)
  const xpValue = Math.floor(remainingSeconds);
  const formattedXP = xpValue.toLocaleString();
  
  // Color based on life state - muted, not alarming
  const getBarColor = () => {
    switch (lifeState) {
      case 'alive':
        return 'bg-alive';
      case 'starving':
        return 'bg-starving';
      case 'dying':
        return 'bg-dying';
      case 'dead':
        return 'bg-dead';
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scaleX: 0 }}
      animate={{ opacity: 1, scaleX: 1 }}
      transition={{ delay: 0.5, duration: 0.8 }}
      className="w-full max-w-xs"
    >
      {/* XP Label */}
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] text-foreground-light/40 uppercase tracking-widest font-mono">
          XP
        </span>
        <span className="text-xs text-foreground-light/60 font-mono">
          {formattedXP}
        </span>
      </div>
      
      {/* Life bar container - sharp edges, no rounded corners */}
      <div className="h-2 bg-secondary/60 overflow-hidden">
        <motion.div
          className={`h-full ${getBarColor()} transition-colors duration-1000`}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
    </motion.div>
  );
}
