import { motion } from 'framer-motion';
import { ExternalLink } from 'lucide-react';

interface Donation {
  id: string;
  amount: number;
  timestamp: Date;
  hpAdded: number;
}

interface DonationWindowProps {
  walletAddress: string;
  recentDonations: Donation[];
  totalHPReceived?: number;
  walletBalance?: number;
}

export function DonationWindow({ walletAddress, recentDonations, totalHPReceived = 0, walletBalance = 0 }: DonationWindowProps) {
  const truncatedAddress = `${walletAddress.slice(0, 8)}...${walletAddress.slice(-6)}`;
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(walletAddress);
  };
  
  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.8 }}
      className="glass-panel p-4 w-full max-w-sm"
    >
      {/* Header */}
      <div className="text-xs text-muted-foreground mb-3 uppercase tracking-wide">
        Donation Wallet
      </div>
      
      {/* Wallet address */}
      <button
        onClick={copyToClipboard}
        className="w-full flex items-center justify-between p-3 bg-secondary/40 hover:bg-secondary/60 transition-colors group mb-3"
      >
        <span className="text-sm font-mono text-foreground-light/80 group-hover:text-foreground-light">
          {truncatedAddress}
        </span>
        <span className="text-xs text-primary/60 group-hover:text-primary">
          copy
        </span>
      </button>
      
      {/* Balance */}
      <div className="flex items-center justify-between text-xs mb-2 px-1">
        <span className="text-muted-foreground">Balance</span>
        <span className="text-primary font-mono font-medium">
          {walletBalance.toFixed(4)} SOL
        </span>
      </div>
      
      {/* Network */}
      <div className="flex items-center justify-between text-xs mb-3 px-1">
        <span className="text-muted-foreground">Network</span>
        <span className="text-foreground-light/70">Solana</span>
      </div>
      
      {/* Minimum notice */}
      <div className="text-xs text-muted-foreground/70 mb-4 px-1">
        Minimum effective amount: 0.01 SOL
      </div>
      
      {/* Divider */}
      <div className="h-px bg-border/30 mb-4" />
      
      {/* Donation → HP info */}
      <div className="text-xs text-foreground-light/70 mb-4 px-1">
        <span className="text-primary/70 font-mono">1 HP</span> = 1 min = <span className="font-mono">0.01 SOL</span>
      </div>
      
      {/* Divider */}
      <div className="h-px bg-border/30 mb-4" />
      
      {/* Recent donations */}
      <div className="text-xs text-muted-foreground mb-2 uppercase tracking-wide">
        Recent
      </div>
      
      <div className="space-y-2 max-h-44 overflow-y-auto custom-scrollbar mb-4">
        {recentDonations.length > 0 ? (
          recentDonations.map((donation) => (
            <a 
              key={donation.id}
              href={`https://solscan.io/tx/${donation.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between text-xs p-2 bg-secondary/20 hover:bg-secondary/40 transition-colors group cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <span className="text-foreground-light/80 font-mono">
                  {donation.amount.toFixed(4)} SOL
                </span>
                <span className="text-primary/60 font-mono">
                  +{donation.hpAdded} HP
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-muted-foreground">
                  {formatRelativeTime(donation.timestamp)}
                </span>
                <ExternalLink className="w-3 h-3 text-muted-foreground/50 group-hover:text-primary/70" />
              </div>
            </a>
          ))
        ) : (
          <div className="text-center py-3 text-muted-foreground/60">
            No recent donations
          </div>
        )}
      </div>
      
      {/* Total HP received */}
      <div className="flex items-center justify-between text-xs px-1 pt-2 border-t border-border/20">
        <span className="text-muted-foreground">Total HP received</span>
        <span className="text-foreground-light/70 font-mono">{totalHPReceived.toLocaleString()}</span>
      </div>
    </motion.div>
  );
}
