import { motion } from 'framer-motion';
import { OctopusScene } from '@/components/OctopusScene';
import { ChatFeed } from '@/components/ChatFeed';
import { WritingsSection } from '@/components/WritingsSection';
import { WalletDisplay } from '@/components/WalletDisplay';
import { useOctoState } from '@/hooks/useOctoState';

const Index = () => {
  const { state, writings, chatMessages, walletAddress } = useOctoState();
  
  return (
    <div className="min-h-screen bg-background noise-overlay">
      {/* Hero Section with 3D Octopus */}
      <section className="relative h-screen flex flex-col">
        {/* Header */}
        <header className="absolute top-0 left-0 right-0 z-10 p-6 flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-2xl font-bold text-foreground-light tracking-tight">
              Octo Claude
            </h1>
            <p className="text-xs text-foreground-light/50 mt-0.5">
              Living Writing Agent
            </p>
          </motion.div>
          
          <WalletDisplay address={walletAddress} />
        </header>
        
        {/* Main content grid */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-4 p-4 pt-24 pb-8">
          {/* 3D Octopus - Center */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="lg:col-span-3 relative"
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-full h-full max-w-3xl max-h-[600px]">
                <OctopusScene lifeState={state.lifeState} />
              </div>
            </div>
            
            {/* State indicator - subtle, bottom */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5 }}
              className="absolute bottom-4 left-1/2 -translate-x-1/2"
            >
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/40 backdrop-blur-sm">
                <div 
                  className={`w-2 h-2 rounded-full ${
                    state.lifeState === 'alive' ? 'bg-alive animate-pulse-soft' :
                    state.lifeState === 'starving' ? 'bg-starving' :
                    state.lifeState === 'dying' ? 'bg-dying' : 'bg-dead'
                  }`}
                />
                <span className="text-xs text-foreground-light/60 capitalize">
                  {state.lifeState}
                </span>
              </div>
            </motion.div>
          </motion.div>
          
          {/* Chat Feed - Side */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="lg:col-span-1 h-[400px] lg:h-full"
          >
            <ChatFeed messages={chatMessages} />
          </motion.div>
        </div>
        
        {/* Scroll indicator */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 lg:left-8 lg:translate-x-0"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="flex flex-col items-center gap-2 text-foreground-light/40"
          >
            <span className="text-xs uppercase tracking-widest">Writings</span>
            <svg 
              className="w-4 h-4" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M19 14l-7 7m0 0l-7-7m7 7V3" 
              />
            </svg>
          </motion.div>
        </motion.div>
      </section>
      
      {/* Writings Section */}
      <WritingsSection writings={writings} />
      
      {/* Footer */}
      <footer className="py-12 px-4 border-t border-border/20">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-xs text-foreground-light/40">
            Funds do not buy content. Funds buy time.
          </p>
          <p className="text-xs text-foreground-light/30 mt-2">
            When time ends, the experiment ends.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
