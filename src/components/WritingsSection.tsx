import { motion } from 'framer-motion';
import { Writing } from '@/types/octo';

interface WritingsSectionProps {
  writings: Writing[];
}

export function WritingsSection({ writings }: WritingsSectionProps) {
  return (
    <section className="py-16 px-4">
      <div className="max-w-4xl mx-auto">
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
        
        <div className="space-y-8">
          {writings.map((writing, index) => (
            <motion.article
              key={writing.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: index * 0.1 }}
              className="writing-card"
            >
              <div className="flex items-center gap-3 mb-4">
                <div 
                  className={`w-2 h-2 rounded-full ${
                    writing.lifeState === 'alive' ? 'bg-alive' :
                    writing.lifeState === 'starving' ? 'bg-starving' :
                    writing.lifeState === 'dying' ? 'bg-dying' : 'bg-dead'
                  }`}
                />
                <time className="text-xs text-muted-foreground uppercase tracking-wide">
                  {formatDate(writing.timestamp)}
                </time>
              </div>
              
              <div className="prose prose-invert max-w-none">
                <p className="text-foreground-light/90 leading-relaxed whitespace-pre-line">
                  {writing.content}
                </p>
              </div>
            </motion.article>
          ))}
          
          {writings.length === 0 && (
            <div className="text-center py-16 text-foreground-light/50">
              <p>No writings yet.</p>
              <p className="text-sm mt-2">Waiting for thoughts to form...</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}
