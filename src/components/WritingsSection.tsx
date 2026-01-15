import { motion } from 'framer-motion';
import { Writing } from '@/types/octo';

interface WritingsSectionProps {
  writings: Writing[];
}

export function WritingsSection({ writings }: WritingsSectionProps) {
  // Sort writings by date, newest first
  const sortedWritings = [...writings].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

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
        
        {/* Full-width writings list */}
        <div className="space-y-4">
          {writings.map((writing, index) => (
            <motion.article
              key={writing.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              className="w-full p-6 bg-card/60 border border-border/30 transition-all duration-300 hover:border-primary/30"
            >
              {/* Article header */}
              <div className="flex items-center gap-4 mb-4 pb-3 border-b border-border/20">
                <time className="text-xs text-muted-foreground uppercase tracking-wide font-mono">
                  {formatDateFull(writing.timestamp)}
                </time>
                <span className="text-xs text-foreground-light/40 uppercase tracking-widest font-mono">
                  {writing.lifeState}
                </span>
              </div>
              
              {/* Article content */}
              <p className="text-foreground-light/90 leading-relaxed whitespace-pre-line text-base">
                {writing.content}
              </p>
            </motion.article>
          ))}
          
          {writings.length === 0 && (
            <div className="text-center py-12 text-foreground-light/50 text-sm">
              Waiting for thoughts to form...
            </div>
          )}
        </div>
      </div>
    </section>
  );
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
