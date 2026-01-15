import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Writing } from '@/types/octo';

interface WritingsSectionProps {
  writings: Writing[];
}

export function WritingsSection({ writings }: WritingsSectionProps) {
  const [selectedWriting, setSelectedWriting] = useState<Writing | null>(null);

  return (
    <section className="py-16 px-4">
      <div className="max-w-5xl mx-auto">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl font-semibold text-foreground-light mb-2 text-center"
        >
          Writings
        </motion.h2>
        <motion.p 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-center text-foreground-light/60 mb-12 text-sm"
        >
          Observations from existence
        </motion.p>
        
        {/* Writings tabs/list */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Article list */}
          <div className="lg:col-span-1 space-y-3">
            {writings.map((writing, index) => (
              <motion.button
                key={writing.id}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                onClick={() => setSelectedWriting(writing)}
                className={`w-full text-left p-4 rounded-lg transition-all duration-300 border ${
                  selectedWriting?.id === writing.id
                    ? 'bg-primary/20 border-primary/50'
                    : 'bg-card/60 border-border/30 hover:bg-card/80 hover:border-primary/30'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div 
                    className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      writing.lifeState === 'alive' ? 'bg-alive' :
                      writing.lifeState === 'starving' ? 'bg-starving' :
                      writing.lifeState === 'dying' ? 'bg-dying' : 'bg-dead'
                    }`}
                  />
                  <time className="text-xs text-muted-foreground uppercase tracking-wide">
                    {formatDate(writing.timestamp)}
                  </time>
                </div>
                <p className="text-sm text-foreground-light/80 line-clamp-2">
                  {writing.content.slice(0, 100)}...
                </p>
              </motion.button>
            ))}
            
            {writings.length === 0 && (
              <div className="text-center py-8 text-foreground-light/50 text-sm">
                Waiting for thoughts to form...
              </div>
            )}
          </div>
          
          {/* Right: Selected article reader */}
          <div className="lg:col-span-2">
            <AnimatePresence mode="wait">
              {selectedWriting ? (
                <motion.article
                  key={selectedWriting.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="glass-panel p-8"
                >
                  <div className="flex items-center gap-3 mb-6">
                    <div 
                      className={`w-2 h-2 rounded-full ${
                        selectedWriting.lifeState === 'alive' ? 'bg-alive' :
                        selectedWriting.lifeState === 'starving' ? 'bg-starving' :
                        selectedWriting.lifeState === 'dying' ? 'bg-dying' : 'bg-dead'
                      }`}
                    />
                    <time className="text-xs text-muted-foreground uppercase tracking-wide">
                      {formatDateFull(selectedWriting.timestamp)}
                    </time>
                    <span className="text-xs text-primary/60 capitalize">
                      — {selectedWriting.lifeState}
                    </span>
                  </div>
                  
                  <div className="prose prose-invert max-w-none">
                    <p className="text-foreground-light/90 leading-relaxed whitespace-pre-line text-base">
                      {selectedWriting.content}
                    </p>
                  </div>
                </motion.article>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="glass-panel p-8 h-full min-h-[300px] flex items-center justify-center"
                >
                  <p className="text-foreground-light/40 text-sm text-center">
                    Select a writing to read
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });
}

function formatDateFull(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}
