import { motion } from 'framer-motion';

interface WalletDisplayProps {
  address: string;
}

export function WalletDisplay({ address }: WalletDisplayProps) {
  const truncatedAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(address);
  };
  
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1 }}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/60 border border-border/30 backdrop-blur-sm"
    >
      <div className="w-2 h-2 rounded-full bg-primary animate-pulse-soft" />
      <button
        onClick={copyToClipboard}
        className="text-xs font-mono text-foreground-light/70 hover:text-foreground-light transition-colors"
        title="Click to copy"
      >
        {truncatedAddress}
      </button>
    </motion.div>
  );
}
