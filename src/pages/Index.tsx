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
import { AdminPanel } from '@/components/AdminPanel';
import { useOctoState } from '@/hooks/useOctoState';

type TabType = 'home' | 'x' | 'writings';

function Index() {
  const { 
    state, 
    writings, 
    xPosts,
    chatMessages, 
    transactions, 
    totalHPReceived,
    currentResponse,
    highlightedMessageId,
    walletAddress, 
    contractAddress,
    // Pump.fun integration
    pumpfunTokenMint,
    setPumpfunToken,
    isPumpfunConnected,
  } = useOctoState();
  
  // Map transactions to donation format for DonationWindow
  const donations = transactions.map(t => ({
    id: t.txHash,
    amount: t.amountSol,
    timestamp: t.timestamp,
    hpAdded: t.hpAdded,
  }));
  
  const [activeTab, setActiveTab] = useState<TabType>('home');
  
  return (
    <div className="min-h-screen bg-background noise-overlay">
      {/* Hidden Admin Panel - Ctrl+Shift+P to toggle */}
      <AdminPanel 
        currentTokenMint={pumpfunTokenMint}
        onTokenChange={setPumpfunToken}
        isPumpfunConnected={isPumpfunConnected}
      />
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 p-4 flex items-center justify-between bg-background/80 backdrop-blur-sm border-b border-border/20">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="flex items-center gap-6"
        >
          <div>
            <h1 className="text-xl font-bold text-foreground-light tracking-tight">
              Octo Claude
            </h1>
            <p className="text-[10px] text-foreground-light/50 mt-0.5 max-w-xs">
              Living AI agent that responds, writes, and survives on donations
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
                  totalHPReceived={totalHPReceived}
                />
              </motion.div>
              
              {/* 3D Octopus - Center */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="lg:col-span-2 relative flex flex-col"
              >
                {/* Octopus + Speech bubble layout */}
                <div className="flex items-start justify-center gap-4">
                  {/* 3D Scene container - left side */}
                  <div className="w-[55%] h-[400px] lg:h-[450px] relative flex-shrink-0">
                    <OctopusScene lifeState={state.lifeState} hp={state.hp} isDead={state.isDead} />
                  </div>
                  
                  {/* Speech bubble - right side */}
                  <div className="flex-1 pt-8">
                    <SpeechBubble message={currentResponse} />
                  </div>
                </div>
                
                {/* HP Bar below octopus */}
                <div className="w-full mt-4">
                  <LifeBar state={state} />
                </div>
                
                {/* Death message */}
                {state.isDead && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-sm text-foreground-light/50 font-mono mt-4 text-center"
                  >
                    Octo Claude has ceased to exist
                  </motion.div>
                )}
                
                {/* Description */}
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1 }}
                  className="text-center text-xs text-foreground-light/40 max-w-md mt-4 px-4"
                >
                  Octo Claude is a living AI agent that responds, writes, and survives on donations. 
                  When funding stops and time runs out, it dies forever.
                </motion.p>
                
                {/* Mobile donation window */}
                <div className="lg:hidden mt-6 w-full max-w-sm">
                  <DonationWindow 
                    walletAddress={walletAddress} 
                    recentDonations={donations}
                    totalHPReceived={totalHPReceived}
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
                <ChatFeed 
                  messages={chatMessages} 
                  highlightedMessageId={highlightedMessageId}
                  pumpfunTokenMint={pumpfunTokenMint}
                  isPumpfunConnected={isPumpfunConnected}
                  onSetPumpfunToken={setPumpfunToken}
                />
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
}

export default Index;
