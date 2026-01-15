import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Volume2, VolumeX } from 'lucide-react';
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
import { Button } from '@/components/ui/button';

type TabType = 'home' | 'x' | 'writings';

const STORAGE_KEY_MUTED = 'octo_voice_muted';
const TWITTER_URL = 'https://x.com/OctoClaude'; // Replace with actual Twitter handle

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
    walletBalance,
    contractAddress,
    // Pump.fun integration
    pumpfunTokenMint,
    setPumpfunToken,
    isPumpfunConnected,
  } = useOctoState();
  
  // Sound state - persisted in localStorage
  const [isMuted, setIsMuted] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(STORAGE_KEY_MUTED) === 'true';
    }
    return false;
  });
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  // Save mute state to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_MUTED, isMuted.toString());
  }, [isMuted]);
  
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
      {/* Hidden Admin Panel - Ctrl+Shift+A to toggle */}
      <AdminPanel 
        currentTokenMint={pumpfunTokenMint}
        onTokenChange={setPumpfunToken}
        isPumpfunConnected={isPumpfunConnected}
        currentHp={state.hp}
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
          {/* Sound toggle button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMuted(!isMuted)}
            className={`relative ${isSpeaking && !isMuted ? 'text-emerald-400' : 'text-foreground-light/60'} hover:text-foreground-light`}
            title={isMuted ? 'Unmute voice' : 'Mute voice'}
          >
            {isMuted ? (
              <VolumeX className="w-5 h-5" />
            ) : (
              <Volume2 className={`w-5 h-5 ${isSpeaking ? 'animate-pulse' : ''}`} />
            )}
          </Button>
          
          {/* Twitter/X link */}
          <a
            href={TWITTER_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center w-9 h-9 rounded-md hover:bg-white/10 transition-colors"
            title="Follow on X"
          >
            <svg 
              viewBox="0 0 24 24" 
              className="w-5 h-5 text-foreground-light/60 hover:text-foreground-light"
              fill="currentColor"
            >
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </a>
          
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
                  walletBalance={walletBalance}
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
                    <OctopusScene lifeState={state.lifeState} hp={state.hp} isDead={state.isDead} isSpeaking={isSpeaking} />
                  </div>
                  
                  {/* Speech bubble - right side */}
                  <div className="flex-1 pt-8">
                    <SpeechBubble 
                      message={currentResponse} 
                      isMuted={isMuted}
                      onSpeakingChange={setIsSpeaking}
                    />
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
                    walletBalance={walletBalance}
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
