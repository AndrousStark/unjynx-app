'use client';

import { useDailyContent } from '@/lib/hooks/use-dashboard';
import { Shimmer } from '@/components/ui/shimmer';
import { Quote } from 'lucide-react';

export function DailyContentCard() {
  const { data: content, isLoading } = useDailyContent();

  if (isLoading) {
    return (
      <div className="glass-card p-5">
        <Shimmer className="h-4 w-20 mb-4" />
        <Shimmer className="h-4 w-full mb-2" />
        <Shimmer className="h-4 w-3/4 mb-4" />
        <Shimmer className="h-3 w-32" />
      </div>
    );
  }

  // Fallback content
  const quote = content?.quote ?? '"Break the satisfactory. The only limits are the ones you accept."';
  const author = content?.author ?? 'UNJYNX Philosophy';
  const category = content?.category ?? 'Growth Mindset';

  return (
    <div className="relative overflow-hidden rounded-xl border border-unjynx-violet/20 bg-gradient-to-br from-unjynx-deep-purple via-unjynx-purple-mist to-unjynx-midnight p-5">
      {/* Decorative glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-unjynx-gold/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-unjynx-violet/10 rounded-full blur-2xl" />

      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-3">
          <Quote size={14} className="text-unjynx-gold" />
          <span className="text-[10px] uppercase tracking-widest text-unjynx-gold font-outfit font-semibold">
            {category}
          </span>
        </div>

        <blockquote className="font-playfair italic text-base leading-relaxed text-unjynx-gold mb-3">
          {quote}
        </blockquote>

        <p className="text-xs text-unjynx-lavender font-dm-sans">
          — {author}
        </p>
      </div>
    </div>
  );
}
