import { useState, useEffect } from 'react';
import { X, Settings, Check, Heart, MessageSquare, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';

interface AdminPanelProps {
  currentTokenMint: string;
  onTokenChange: (tokenMint: string) => void;
  isPumpfunConnected: boolean;
  currentHp?: number;
  onHpChange?: (hp: number) => void;
  onAddChatMessage?: (author: string, content: string) => void;
}

export function AdminPanel({ currentTokenMint, onTokenChange, isPumpfunConnected, currentHp = 100, onHpChange, onAddChatMessage }: AdminPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tokenInput, setTokenInput] = useState(currentTokenMint);
  const [hpInput, setHpInput] = useState(currentHp.toString());
  const [saved, setSaved] = useState(false);
  const [hpSaved, setHpSaved] = useState(false);
  const [hpSaving, setHpSaving] = useState(false);
  const [chatAuthor, setChatAuthor] = useState('anon');
  const [chatMessage, setChatMessage] = useState('');

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

  // Sync HP input when prop changes
  useEffect(() => {
    setHpInput(currentHp.toString());
  }, [currentHp]);

  const handleSave = () => {
    if (tokenInput.trim() && tokenInput !== currentTokenMint) {
      onTokenChange(tokenInput.trim());
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  const handleHpSave = async () => {
    const newHp = parseInt(hpInput, 10);
    if (isNaN(newHp) || newHp < 0 || newHp > 1000) {
      return;
    }
    
    setHpSaving(true);
    try {
      const { error } = await supabase
        .from('agent_state')
        .update({ hp: newHp, updated_at: new Date().toISOString() })
        .eq('id', (await supabase.from('agent_state').select('id').limit(1).single()).data?.id);
      
      if (!error) {
        onHpChange?.(newHp);
        setHpSaved(true);
        setTimeout(() => setHpSaved(false), 2000);
        console.log('[AdminPanel] HP updated to:', newHp);
      } else {
        console.error('[AdminPanel] Failed to update HP:', error);
      }
    } catch (e) {
      console.error('[AdminPanel] Error updating HP:', e);
    } finally {
      setHpSaving(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    }
  };

  const handleHpKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleHpSave();
    }
  };

  const handleAddChatMessage = () => {
    if (chatMessage.trim() && onAddChatMessage) {
      onAddChatMessage(chatAuthor.trim() || 'anon', chatMessage.trim());
      setChatMessage('');
    }
  };

  const handleChatKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddChatMessage();
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

          {/* Chat Message Input */}
          <div className="space-y-2 p-3 bg-white/5 rounded-lg border border-white/10">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-blue-400" />
              <Label className="text-white/70 font-mono text-sm">
                Add Chat Message
              </Label>
            </div>
            <div className="flex gap-2">
              <Input
                value={chatAuthor}
                onChange={(e) => setChatAuthor(e.target.value)}
                placeholder="Author..."
                className="w-24 bg-white/5 border-white/20 text-white font-mono text-xs placeholder:text-white/30 focus:border-white/40"
              />
              <Input
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                onKeyDown={handleChatKeyPress}
                placeholder="Message from pump.fun..."
                className="flex-1 bg-white/5 border-white/20 text-white font-mono text-sm placeholder:text-white/30 focus:border-white/40"
              />
              <Button
                onClick={handleAddChatMessage}
                disabled={!chatMessage.trim()}
                className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-white/40 font-mono">Octo will respond to this message</p>
          </div>

          {/* HP Input */}
          <div className="space-y-2 p-3 bg-white/5 rounded-lg border border-white/10">
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-red-400" />
              <Label htmlFor="hpValue" className="text-white/70 font-mono text-sm">
                Set HP Value (0-1000)
              </Label>
            </div>
            <div className="flex gap-2">
              <Input
                id="hpValue"
                type="number"
                min="0"
                max="1000"
                value={hpInput}
                onChange={(e) => setHpInput(e.target.value)}
                onKeyDown={handleHpKeyPress}
                placeholder="Enter HP..."
                className="bg-white/5 border-white/20 text-white font-mono text-sm placeholder:text-white/30 focus:border-white/40"
              />
              <Button
                onClick={handleHpSave}
                disabled={hpSaving || isNaN(parseInt(hpInput, 10)) || parseInt(hpInput, 10) < 0 || parseInt(hpInput, 10) > 1000}
                className="bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 font-mono"
              >
                {hpSaved ? (
                  <Check className="w-4 h-4" />
                ) : hpSaving ? (
                  '...'
                ) : (
                  'Set'
                )}
              </Button>
            </div>
            <p className="text-xs text-white/40 font-mono">Current: {currentHp} HP</p>
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
