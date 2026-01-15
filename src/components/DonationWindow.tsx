import { motion } from 'framer-motion';

interface Donation {
  id: string;
  amount: number;
  timestamp: Date;
  lifeAdded: number;
}

interface DonationWindowProps {
  walletAddress: string;
  recentDonations: Donation[];
}

export function DonationWindow({ walletAddress, recentDonations }: DonationWindowProps) {
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
  
  const formatLifeAdded = (seconds: number) => {
    if (seconds < 60) return `+${seconds}s`;
    if (seconds < 3600) return `+${Math.floor(seconds / 60)}m`;
    return `+${Math.floor(seconds / 3600)}h`;
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
      
      {/* Wallet address - no rounded corners */}
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
      
      {/* Network */}
      <div className="flex items-center justify-between text-xs mb-3 px-1">
        <span className="text-muted-foreground">Network</span>
        <span className="text-foreground-light/70">Solana</span>
      </div>
      
      {/* Minimum notice */}
      <div className="text-xs text-muted-foreground/70 mb-4 px-1">
        Minimum effective amount: 0.001 SOL
      </div>
      
      {/* Divider */}
      <div className="h-px bg-border/30 mb-4" />
      
      {/* Recent donations */}
      <div className="text-xs text-muted-foreground mb-2 uppercase tracking-wide">
        Recent
      </div>
      
      <div className="space-y-2 max-h-32 overflow-y-auto custom-scrollbar">
        {recentDonations.length > 0 ? (
          recentDonations.map((donation) => (
            <div 
              key={donation.id}
              className="flex items-center justify-between text-xs p-2 bg-secondary/20"
            >
              <div className="flex items-center gap-2">
                <span className="text-foreground-light/80 font-mono">
                  {donation.amount} SOL
                </span>
                <span className="text-primary/60 font-mono">
                  +{Math.floor(donation.lifeAdded)} XP
                </span>
              </div>
              <span className="text-muted-foreground">
                {formatRelativeTime(donation.timestamp)}
              </span>
            </div>
          ))
        ) : (
          <div className="text-center py-3 text-muted-foreground/60">
            No recent donations
          </div>
        )}
      </div>
    </motion.div>
  );
}
