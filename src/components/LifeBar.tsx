import { motion } from 'framer-motion';
import { OctoState } from '@/types/octo';

interface LifeBarProps {
  state: OctoState;
}

export function LifeBar({ state }: LifeBarProps) {
  const { hp, maxHP, lifeState, isDead } = state;
  const percentage = Math.min(100, (hp / maxHP) * 100);
  
  // Format HP and minutes display
  const formattedHP = hp.toLocaleString();
  const minutesText = hp === 1 ? 'minute' : 'minutes';
  
  // Color based on life state - more visible colors
  const getBarColor = () => {
    switch (lifeState) {
      case 'alive':
        return 'bg-emerald-500';
      case 'starving':
        return 'bg-amber-500';
      case 'dying':
        return 'bg-red-500';
      case 'dead':
        return 'bg-gray-500';
    }
  };
  
  const getTextColor = () => {
    switch (lifeState) {
      case 'alive':
        return 'text-emerald-400';
      case 'starving':
        return 'text-amber-400';
      case 'dying':
        return 'text-red-400';
      case 'dead':
        return 'text-gray-400';
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-md mx-auto"
    >
      {/* HP info header */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-3">
          <span className={`text-sm font-bold ${getTextColor()} font-mono`}>
            HP: {formattedHP}
          </span>
          <span className="text-xs text-foreground-light/60">
            {hp} {minutesText} remaining
          </span>
        </div>
        
        <span className={`text-xs uppercase tracking-widest font-mono ${getTextColor()}`}>
          {lifeState}
        </span>
      </div>
      
      {/* HP bar container */}
      <div className="h-4 bg-secondary/80 overflow-hidden border border-border/40">
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
