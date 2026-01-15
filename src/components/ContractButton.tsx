import { motion } from 'framer-motion';
import { Copy } from 'lucide-react';
import { useState } from 'react';

interface ContractButtonProps {
  address: string;
}

export function ContractButton({ address }: ContractButtonProps) {
  const [copied, setCopied] = useState(false);
  const truncatedAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  return (
    <motion.button
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1 }}
      onClick={copyToClipboard}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/60 border border-border/30 backdrop-blur-sm hover:bg-secondary/80 hover:border-primary/40 transition-all group"
    >
      <span className="text-xs text-muted-foreground uppercase tracking-wide">CA</span>
      <span className="text-xs font-mono text-foreground-light/70 group-hover:text-foreground-light transition-colors">
        {truncatedAddress}
      </span>
      <Copy className={`w-3 h-3 transition-colors ${copied ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'}`} />
      {copied && (
        <motion.span
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0 }}
          className="text-xs text-primary"
        >
          copied!
        </motion.span>
      )}
    </motion.button>
  );
}
