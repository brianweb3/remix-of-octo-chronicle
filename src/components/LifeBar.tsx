import { motion } from 'framer-motion';
import { OctoState } from '@/types/octo';

interface LifeBarProps {
  state: OctoState;
}

export function LifeBar({ state }: LifeBarProps) {
  const { remainingSeconds, maxSeconds, lifeState } = state;
  const percentage = Math.min(100, (remainingSeconds / maxSeconds) * 100);
  
  // Color based on life state - gradual, not alarming
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
  
  const getGlowColor = () => {
    switch (lifeState) {
      case 'alive':
        return 'shadow-[0_0_20px_hsl(185_55%_55%/0.4)]';
      case 'starving':
        return 'shadow-[0_0_15px_hsl(45_80%_55%/0.3)]';
      case 'dying':
        return 'shadow-[0_0_10px_hsl(0_60%_50%/0.2)]';
      case 'dead':
        return '';
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scaleX: 0 }}
      animate={{ opacity: 1, scaleX: 1 }}
      transition={{ delay: 0.5, duration: 0.8 }}
      className="w-full max-w-xs"
    >
      {/* Life bar container */}
      <div className="h-1.5 bg-secondary/40 rounded-full overflow-hidden backdrop-blur-sm">
        <motion.div
          className={`h-full rounded-full ${getBarColor()} ${getGlowColor()} transition-colors duration-1000`}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
    </motion.div>
  );
}
