'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getCategories } from '@/lib/firebase/firestore';
import type { Category, CategoryColor } from '@/lib/types';

const COLOR_GRADIENTS: Record<CategoryColor, { card: string; label: string; sub: string }> = {
  teal:   { card: 'from-teal-500 to-teal-700',     label: 'text-teal-200',   sub: 'text-teal-200' },
  blue:   { card: 'from-blue-500 to-blue-700',     label: 'text-blue-200',   sub: 'text-blue-200' },
  cyan:   { card: 'from-cyan-500 to-cyan-700',     label: 'text-cyan-200',   sub: 'text-cyan-200' },
  purple: { card: 'from-purple-500 to-purple-700', label: 'text-purple-200', sub: 'text-purple-200' },
  pink:   { card: 'from-pink-500 to-pink-700',     label: 'text-pink-200',   sub: 'text-pink-200' },
  orange: { card: 'from-orange-500 to-orange-700', label: 'text-orange-200', sub: 'text-orange-200' },
  green:  { card: 'from-green-500 to-green-700',   label: 'text-green-200',  sub: 'text-green-200' },
  red:    { card: 'from-red-500 to-red-700',       label: 'text-red-200',    sub: 'text-red-200' },
};

const FALLBACK_PALETTE: CategoryColor[] = ['teal', 'blue', 'cyan', 'purple', 'pink', 'orange'];

export default function HomeCategories() {
  const [cats, setCats] = useState<Category[] | null>(null);

  useEffect(() => {
    getCategories()
      .then(all => {
        const visible = all
          .filter(c => c.showOnHome !== false)
          .sort((a, b) => (a.order || 0) - (b.order || 0));
        setCats(visible);
      })
      .catch(() => setCats([]));
  }, []);

  if (!cats || cats.length === 0) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {cats.map((cat, idx) => {
        const color = COLOR_GRADIENTS[cat.colorTheme || FALLBACK_PALETTE[idx % FALLBACK_PALETTE.length]];
        const englishLabel = cat.englishLabel || cat.slug.toUpperCase().replace(/-/g, ' ');
        return (
          <Link
            key={cat.id}
            href={`/courses?category=${cat.slug}`}
            className={`card-hover group relative overflow-hidden rounded-3xl bg-gradient-to-br ${color.card} p-8 text-white min-h-[200px] flex flex-col justify-end`}
          >
            {cat.emoji && <div className="absolute top-4 right-4 text-4xl opacity-30">{cat.emoji}</div>}
            <div className={`text-sm font-medium ${color.label} mb-2`}>{englishLabel}</div>
            <h3 className="text-2xl font-bold mb-2">{cat.name}</h3>
            {cat.description && <p className={`${color.sub} text-sm`}>{cat.description}</p>}
          </Link>
        );
      })}
    </div>
  );
}
