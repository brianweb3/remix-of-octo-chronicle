import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Writing, LifeState } from '@/types/octo';
import { X, Clock, Filter, SortAsc, SortDesc } from 'lucide-react';

interface WritingsSectionProps {
  writings: Writing[];
}

type SortOrder = 'newest' | 'oldest';
type FilterState = 'all' | LifeState;

export function WritingsSection({ writings }: WritingsSectionProps) {
  const [selectedWriting, setSelectedWriting] = useState<Writing | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');
  const [filterState, setFilterState] = useState<FilterState>('all');
  
  // Filter writings
  const filteredWritings = writings.filter(w => 
    filterState === 'all' || w.lifeState === filterState
  );
  
  // Sort writings
  const sortedWritings = [...filteredWritings].sort((a, b) => {
    if (sortOrder === 'newest') {
      return b.timestamp.getTime() - a.timestamp.getTime();
    }
    return a.timestamp.getTime() - b.timestamp.getTime();
  });

  const getStateColor = (state: LifeState) => {
    switch (state) {
      case 'alive': return 'text-alive bg-alive/10 border-alive/30';
      case 'starving': return 'text-starving bg-starving/10 border-starving/30';
      case 'dying': return 'text-dying bg-dying/10 border-dying/30';
      case 'dead': return 'text-muted-foreground bg-muted/10 border-muted/30';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <section className="py-16 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
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
          className="text-center text-foreground-light/60 mb-8 text-sm"
        >
          Observations from existence • {writings.length} entries
        </motion.p>
        
        {/* Filters & Sort */}
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="flex flex-wrap items-center justify-center gap-4 mb-8"
        >
          {/* Filter by state */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <div className="flex gap-1">
              {(['all', 'alive', 'starving', 'dying', 'dead'] as FilterState[]).map((state) => (
                <button
                  key={state}
                  onClick={() => setFilterState(state)}
                  className={`px-3 py-1.5 text-xs font-mono uppercase transition-colors rounded ${
                    filterState === state 
                      ? 'bg-primary/20 text-primary border border-primary/30' 
                      : 'bg-secondary/40 text-muted-foreground hover:bg-secondary/60 border border-transparent'
                  }`}
                >
                  {state}
                </button>
              ))}
            </div>
          </div>
          
          {/* Sort order */}
          <button
            onClick={() => setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest')}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-mono bg-secondary/40 hover:bg-secondary/60 transition-colors rounded"
          >
            {sortOrder === 'newest' ? (
              <SortDesc className="w-4 h-4" />
            ) : (
              <SortAsc className="w-4 h-4" />
            )}
            {sortOrder === 'newest' ? 'Newest first' : 'Oldest first'}
          </button>
        </motion.div>
        
        {/* Writings Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedWritings.map((writing, index) => (
            <motion.article
              key={writing.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.03 }}
              onClick={() => setSelectedWriting(writing)}
              className="p-5 bg-card/60 border border-border/30 transition-all duration-300 hover:border-primary/30 hover:bg-card/80 cursor-pointer group"
            >
              {/* Title */}
              <h3 className="text-lg font-medium text-foreground-light mb-3 group-hover:text-primary transition-colors line-clamp-2">
                {writing.title || 'Untitled'}
              </h3>
              
              {/* Preview */}
              <p className="text-sm text-foreground-light/70 leading-relaxed line-clamp-3 mb-4">
                {writing.content}
              </p>
              
              {/* Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-border/20">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  {formatDateShort(writing.timestamp)}
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded border font-mono uppercase ${getStateColor(writing.lifeState)}`}>
                  {writing.lifeState}
                </span>
              </div>
            </motion.article>
          ))}
        </div>
        
        {sortedWritings.length === 0 && (
          <div className="text-center py-12 text-foreground-light/50 text-sm">
            {filterState === 'all' 
              ? 'Waiting for thoughts to form...' 
              : `No writings in "${filterState}" state`}
          </div>
        )}
        
        {/* Article Modal */}
        <AnimatePresence>
          {selectedWriting && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedWriting(null)}
              className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            >
              <motion.article
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-2xl max-h-[80vh] bg-card border border-border/50 rounded-lg overflow-hidden"
              >
                {/* Modal Header */}
                <div className="flex items-center justify-between p-4 border-b border-border/30">
                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-2 py-0.5 rounded border font-mono uppercase ${getStateColor(selectedWriting.lifeState)}`}>
                      {selectedWriting.lifeState}
                    </span>
                    <span className="text-xs text-muted-foreground font-mono">
                      {formatDateFull(selectedWriting.timestamp)}
                    </span>
                  </div>
                  <button
                    onClick={() => setSelectedWriting(null)}
                    className="p-2 hover:bg-secondary/50 rounded transition-colors"
                  >
                    <X className="w-5 h-5 text-muted-foreground" />
                  </button>
                </div>
                
                {/* Modal Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(80vh-80px)]">
                  <h2 className="text-2xl font-semibold text-foreground-light mb-6">
                    {selectedWriting.title || 'Untitled'}
                  </h2>
                  <div className="prose prose-invert max-w-none">
                    <p className="text-foreground-light/90 leading-relaxed whitespace-pre-wrap text-base">
                      {selectedWriting.content}
                    </p>
                  </div>
                </div>
              </motion.article>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}

function formatDateShort(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
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
