'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getCategories } from '@/lib/firebase/firestore';
import { adjustHex } from '@/lib/utils';
import type { Category, CategoryColor } from '@/lib/types';

const COLOR_GRADIENTS: Record<CategoryColor, { card: string; label: string; sub: string }> = {
  teal:    { card: 'from-teal-500 to-teal-700',         label: 'text-teal-100',    sub: 'text-teal-100' },
  blue:    { card: 'from-blue-500 to-blue-700',         label: 'text-blue-100',    sub: 'text-blue-100' },
  cyan:    { card: 'from-cyan-500 to-cyan-700',         label: 'text-cyan-100',    sub: 'text-cyan-100' },
  purple:  { card: 'from-purple-500 to-purple-700',     label: 'text-purple-100',  sub: 'text-purple-100' },
  pink:    { card: 'from-pink-500 to-pink-700',         label: 'text-pink-100',    sub: 'text-pink-100' },
  orange:  { card: 'from-orange-500 to-orange-700',     label: 'text-orange-100',  sub: 'text-orange-100' },
  green:   { card: 'from-green-500 to-green-700',       label: 'text-green-100',   sub: 'text-green-100' },
  red:     { card: 'from-red-500 to-red-700',           label: 'text-red-100',     sub: 'text-red-100' },
  yellow:  { card: 'from-yellow-400 to-yellow-600',     label: 'text-yellow-50',   sub: 'text-yellow-50' },
  lime:    { card: 'from-lime-500 to-lime-700',         label: 'text-lime-100',    sub: 'text-lime-100' },
  emerald: { card: 'from-emerald-500 to-emerald-700',   label: 'text-emerald-100', sub: 'text-emerald-100' },
  sky:     { card: 'from-sky-500 to-sky-700',           label: 'text-sky-100',     sub: 'text-sky-100' },
  indigo:  { card: 'from-indigo-500 to-indigo-700',     label: 'text-indigo-100',  sub: 'text-indigo-100' },
  violet:  { card: 'from-violet-500 to-violet-700',     label: 'text-violet-100',  sub: 'text-violet-100' },
  fuchsia: { card: 'from-fuchsia-500 to-fuchsia-700',   label: 'text-fuchsia-100', sub: 'text-fuchsia-100' },
  rose:    { card: 'from-rose-500 to-rose-700',         label: 'text-rose-100',    sub: 'text-rose-100' },
  amber:   { card: 'from-amber-500 to-amber-700',       label: 'text-amber-50',    sub: 'text-amber-50' },
  slate:   { card: 'from-slate-500 to-slate-700',       label: 'text-slate-200',   sub: 'text-slate-200' },
};

const FALLBACK_PALETTE: CategoryColor[] = [
  'teal', 'blue', 'cyan', 'purple', 'pink', 'orange', 'green', 'indigo', 'rose', 'emerald',
];

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
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
      {cats.map((cat, idx) => {
        const englishLabel = cat.englishLabel || cat.slug.toUpperCase().replace(/-/g, ' ');

        // 우선순위: customColor (헥스) → 옛 colorTheme → 폴백 팔레트 자동 회전
        if (cat.customColor) {
          const dark = adjustHex(cat.customColor, 0.6);
          return (
            <Link
              key={cat.id}
              href={`/courses?category=${cat.slug}`}
              className="card-hover group relative overflow-hidden rounded-2xl p-4 sm:p-5 text-white min-h-[120px] sm:min-h-[140px] flex flex-col justify-end"
              style={{ background: `linear-gradient(to bottom right, ${cat.customColor}, ${dark})` }}
            >
              {cat.emoji && <div className="absolute top-2 right-2 text-2xl sm:text-3xl opacity-30">{cat.emoji}</div>}
              <div className="text-[10px] sm:text-xs font-medium text-white/80 mb-1 tracking-wider">{englishLabel}</div>
              <h3 className="text-base sm:text-lg font-bold mb-1 leading-tight">{cat.name}</h3>
              {cat.description && <p className="text-white/85 text-[11px] sm:text-xs line-clamp-2 leading-snug">{cat.description}</p>}
            </Link>
          );
        }

        const color = COLOR_GRADIENTS[cat.colorTheme || FALLBACK_PALETTE[idx % FALLBACK_PALETTE.length]];
        return (
          <Link
            key={cat.id}
            href={`/courses?category=${cat.slug}`}
            className={`card-hover group relative overflow-hidden rounded-2xl bg-gradient-to-br ${color.card} p-4 sm:p-5 text-white min-h-[120px] sm:min-h-[140px] flex flex-col justify-end`}
          >
            {cat.emoji && <div className="absolute top-2 right-2 text-2xl sm:text-3xl opacity-30">{cat.emoji}</div>}
            <div className={`text-[10px] sm:text-xs font-medium ${color.label} mb-1 tracking-wider`}>{englishLabel}</div>
            <h3 className="text-base sm:text-lg font-bold mb-1 leading-tight">{cat.name}</h3>
            {cat.description && <p className={`${color.sub} text-[11px] sm:text-xs line-clamp-2 leading-snug`}>{cat.description}</p>}
          </Link>
        );
      })}
    </div>
  );
}
