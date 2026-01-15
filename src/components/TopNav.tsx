import { motion } from 'framer-motion';

type TabType = 'home' | 'x' | 'writings';

interface TopNavProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export function TopNav({ activeTab, onTabChange }: TopNavProps) {
  const tabs: { id: TabType; label: string }[] = [
    { id: 'home', label: 'HOME' },
    { id: 'x', label: 'X' },
    { id: 'writings', label: 'WRITINGS' },
  ];

  return (
    <nav className="flex items-center gap-1">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`
            relative px-4 py-2 text-xs uppercase tracking-widest font-mono
            transition-colors duration-200
            ${activeTab === tab.id 
              ? 'text-foreground-light' 
              : 'text-foreground-light/40 hover:text-foreground-light/70'
            }
          `}
        >
          {tab.label}
          {activeTab === tab.id && (
            <motion.div
              layoutId="activeTab"
              className="absolute bottom-0 left-0 right-0 h-px bg-primary"
              transition={{ type: 'spring', stiffness: 500, damping: 35 }}
            />
          )}
        </button>
      ))}
    </nav>
  );
}
