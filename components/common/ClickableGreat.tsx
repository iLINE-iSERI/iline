'use client';

import { useRef, useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { claimHiddenGreat } from '@/lib/firebase/firestore';

interface Pop {
  id: number;
  type: 'plus' | 'max';
}

interface Props {
  containerClassName?: string;
  imageClassName?: string;
}

export default function ClickableGreat({ containerClassName = '', imageClassName = '' }: Props) {
  const { user } = useAuth();
  const [pops, setPops] = useState<Pop[]>([]);
  const [busy, setBusy] = useState(false);
  const idRef = useRef(0);

  const interactive = !!user?.uid;

  const handleClick = async () => {
    if (!interactive || busy) return;
    setBusy(true);
    try {
      const result = await claimHiddenGreat(user.uid);
      const id = ++idRef.current;
      setPops(prev => [...prev, { id, type: result.success ? 'plus' : 'max' }]);
      // 1.5초 후 제거 (애니메이션 길이와 동일)
      setTimeout(() => setPops(prev => prev.filter(p => p.id !== id)), 1500);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={`relative inline-block ${containerClassName}`}>
      <button
        type="button"
        onClick={handleClick}
        aria-label="히든 그뤠잇 받기"
        disabled={!interactive || busy}
        className={`block w-full h-full ${
          interactive
            ? 'cursor-pointer hover:scale-105 active:scale-95'
            : 'cursor-default'
        } transition-transform duration-150`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/great.png"
          alt="GREAT"
          draggable={false}
          className={`select-none ${imageClassName}`}
        />
      </button>

      {/* 클릭 피드백 팝퍼 */}
      {pops.map(p => (
        <span
          key={p.id}
          className={`absolute left-1/2 -top-2 pointer-events-none animate-float-up font-extrabold whitespace-nowrap ${
            p.type === 'plus'
              ? 'text-pink-400 text-2xl sm:text-3xl drop-shadow-lg'
              : 'text-gray-300 text-base sm:text-lg drop-shadow-md'
          }`}
        >
          {p.type === 'plus' ? '+1 그뤠잇' : '오늘은 끝!'}
        </span>
      ))}
    </div>
  );
}
