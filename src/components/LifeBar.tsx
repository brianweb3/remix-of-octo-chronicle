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
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 left-0 right-0 z-[100] bg-background/95 backdrop-blur-sm border-b border-border/40"
    >
      <div className="max-w-screen-xl mx-auto px-4 py-2">
        {/* HP bar container */}
        <div className="h-3 bg-secondary/80 overflow-hidden mb-1">
          <motion.div
            className={`h-full ${getBarColor()} transition-colors duration-500`}
            initial={{ width: 0 }}
            animate={{ width: isDead ? 0 : `${percentage}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
        
        {/* HP info */}
        <div className="flex items-center justify-between">
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
      </div>
    </motion.div>
  );
}
