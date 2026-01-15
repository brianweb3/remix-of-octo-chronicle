import { useState, useEffect } from 'react';
import { X, Settings, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface AdminPanelProps {
  currentTokenMint: string;
  onTokenChange: (tokenMint: string) => void;
  isPumpfunConnected: boolean;
}

export function AdminPanel({ currentTokenMint, onTokenChange, isPumpfunConnected }: AdminPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tokenInput, setTokenInput] = useState(currentTokenMint);
  const [saved, setSaved] = useState(false);

  // Secret key combo: Ctrl/Cmd + Shift + A (for Admin)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Ctrl+Shift+A or Cmd+Shift+A (works on Mac and Windows)
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modifier = isMac ? e.metaKey : e.ctrlKey;
      
      if (modifier && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault();
        setIsOpen(prev => !prev);
        console.log('[AdminPanel] Toggled via keyboard shortcut');
      }
      // Also ESC to close
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Sync input when prop changes
  useEffect(() => {
    setTokenInput(currentTokenMint);
  }, [currentTokenMint]);

  const handleSave = () => {
    if (tokenInput.trim() && tokenInput !== currentTokenMint) {
      onTokenChange(tokenInput.trim());
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-md mx-4 bg-black/90 border border-white/20 rounded-lg p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-white/60" />
            <h2 className="text-lg font-mono text-white/90">Admin Panel</h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(false)}
            className="text-white/60 hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="space-y-4">
          {/* Connection Status */}
          <div className="flex items-center gap-2 text-sm">
            <div className={`w-2 h-2 rounded-full ${isPumpfunConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-white/60 font-mono">
              pump.fun: {isPumpfunConnected ? 'connected' : 'disconnected'}
            </span>
          </div>

          {/* Token Input */}
          <div className="space-y-2">
            <Label htmlFor="tokenMint" className="text-white/70 font-mono text-sm">
              Token Mint Address
            </Label>
            <Input
              id="tokenMint"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Enter pump.fun token mint..."
              className="bg-white/5 border-white/20 text-white font-mono text-sm placeholder:text-white/30 focus:border-white/40"
            />
          </div>

          {/* Save Button */}
          <Button
            onClick={handleSave}
            disabled={!tokenInput.trim() || tokenInput === currentTokenMint}
            className="w-full bg-white/10 hover:bg-white/20 text-white border border-white/20 font-mono"
          >
            {saved ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                Saved
              </>
            ) : (
              'Apply Token'
            )}
          </Button>

          {/* Current Token Display */}
          <div className="pt-4 border-t border-white/10">
            <p className="text-xs text-white/40 font-mono mb-1">Current token:</p>
            <p className="text-xs text-white/60 font-mono break-all">{currentTokenMint}</p>
          </div>

          {/* Hint */}
          <p className="text-xs text-white/30 font-mono text-center pt-2">
            Press ⌘/Ctrl + Shift + A to toggle this panel
          </p>
        </div>
      </div>
    </div>
  );
}
