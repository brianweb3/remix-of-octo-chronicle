import { useState } from 'react';
import { motion } from 'framer-motion';
import { OctopusScene } from '@/components/OctopusScene';
import { ChatFeed } from '@/components/ChatFeed';
import { WritingsSection } from '@/components/WritingsSection';
import { XSection } from '@/components/XSection';
import { LifeBar } from '@/components/LifeBar';
import { DonationWindow } from '@/components/DonationWindow';
import { ContractButton } from '@/components/ContractButton';
import { TopNav } from '@/components/TopNav';
import { SpeechBubble } from '@/components/SpeechBubble';
import { useOctoState } from '@/hooks/useOctoState';

type TabType = 'home' | 'x' | 'writings';

const Index = () => {
  const { 
    state, 
    writings, 
    xPosts,
    chatMessages, 
    donations, 
    totalXPReceived,
    currentResponse,
    walletAddress, 
    contractAddress 
  } = useOctoState();
  
  const [activeTab, setActiveTab] = useState<TabType>('home');
  
  return (
    <div className="min-h-screen bg-background noise-overlay">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 p-6 flex items-center justify-between bg-background/80 backdrop-blur-sm border-b border-border/20">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="flex items-center gap-8"
        >
          <div>
            <h1 className="text-2xl font-bold text-foreground-light tracking-tight">
              Octo Claude
            </h1>
            <p className="text-xs text-foreground-light/50 mt-0.5">
              Living Writing Agent
            </p>
          </div>
          
          <TopNav activeTab={activeTab} onTabChange={setActiveTab} />
        </motion.div>
        
        <div className="flex items-center gap-3">
          <ContractButton address={contractAddress} />
        </div>
      </header>
      
      {/* Main content based on active tab */}
      {activeTab === 'home' && (
        <>
          {/* Hero Section with 3D Octopus */}
          <section className="relative min-h-screen flex flex-col pt-24">
            {/* Main content grid */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-4 p-4 pb-8">
              {/* Left side - Donation Window */}
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="hidden lg:block lg:col-span-1"
              >
                <DonationWindow 
                  walletAddress={walletAddress} 
                  recentDonations={donations}
                  totalXPReceived={totalXPReceived}
                />
              </motion.div>
              
              {/* 3D Octopus - Center */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="lg:col-span-2 relative flex flex-col items-center justify-center"
              >
                {/* Speech bubble */}
                <SpeechBubble message={currentResponse} />
                
                {/* 3D Scene container */}
                <div className="w-full h-[400px] lg:h-[500px] relative">
                  <OctopusScene lifeState={state.lifeState} isDead={state.isDead} />
                </div>
                
                {/* Death message */}
                {state.isDead && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute bottom-24 text-xs text-foreground-light/40 font-mono"
                  >
                    Octo Claude has ceased to exist
                  </motion.div>
                )}
                
                {/* Life bar and state - below octopus */}
                <div className="flex flex-col items-center gap-3 mt-4">
                  <LifeBar state={state} />
                  
                  {/* Minimal status indicator */}
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.5 }}
                  >
                    <span className="text-xs text-foreground-light/50 uppercase tracking-widest font-mono">
                      {state.lifeState}
                    </span>
                  </motion.div>
                </div>
                
                {/* Mobile donation window */}
                <div className="lg:hidden mt-6 w-full max-w-sm">
                  <DonationWindow 
                    walletAddress={walletAddress} 
                    recentDonations={donations}
                    totalXPReceived={totalXPReceived}
                  />
                </div>
              </motion.div>
              
              {/* Chat Feed - Right */}
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="lg:col-span-1 h-[400px] lg:h-[500px]"
              >
                <ChatFeed messages={chatMessages} />
              </motion.div>
            </div>
          </section>
          
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
        </>
      )}
      
      {activeTab === 'x' && (
        <div className="pt-24">
          <XSection posts={xPosts} />
        </div>
      )}
      
      {activeTab === 'writings' && (
        <div className="pt-24">
          <WritingsSection writings={writings} />
        </div>
      )}
    </div>
  );
};

export default Index;
