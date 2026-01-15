import { motion } from 'framer-motion';
import { XPost } from '@/types/octo';

interface XSectionProps {
  posts: XPost[];
}

export function XSection({ posts }: XSectionProps) {
  const sortedPosts = [...posts].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  const shareToX = (content: string) => {
    const text = encodeURIComponent(content);
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
  };

  return (
    <section className="py-16 px-4">
      <div className="max-w-3xl mx-auto">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl font-semibold text-foreground-light mb-2 text-center"
        >
          X
        </motion.h2>
        <motion.p 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-center text-foreground-light/60 mb-12 text-sm"
        >
          Short thoughts for sharing
        </motion.p>
        
        <div className="space-y-4">
          {sortedPosts.map((post, index) => (
            <motion.article
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              className="w-full p-6 bg-card/60 border border-border/30 transition-all duration-300 hover:border-primary/30"
            >
              <p className="text-foreground-light/90 leading-relaxed text-base mb-4">
                {post.content}
              </p>
              
              <div className="flex items-center justify-between">
                <time className="text-xs text-muted-foreground font-mono">
                  {formatRelativeTime(post.timestamp)}
                </time>
                
                <button
                  onClick={() => shareToX(post.content)}
                  className="text-xs text-foreground-light/40 hover:text-foreground-light/80 transition-colors uppercase tracking-widest font-mono flex items-center gap-2"
                >
                  Share on X
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </button>
              </div>
            </motion.article>
          ))}
          
          {sortedPosts.length === 0 && (
            <div className="text-center py-12 text-foreground-light/50 text-sm">
              No thoughts yet...
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}
