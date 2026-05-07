'use client';

import { useEffect, useState } from 'react';
import ClickableGreat from '@/components/common/ClickableGreat';

// Hero 영역에서 고래가 무작위로 등장할 위치 후보.
// 본문 텍스트와 너무 겹치지 않도록 코너/측면 위주.
const POSITIONS = [
  'bottom-8 right-8 lg:right-16',
  'bottom-16 right-1/4',
  'bottom-12 left-8 lg:left-16',
  'top-32 right-8 lg:right-16',
  'top-1/3 right-1/4',
  'bottom-24 right-1/2',
] as const;

const DEFAULT_POSITION = POSITIONS[0];

export default function HomeHeroGreat() {
  // SSR과 첫 클라이언트 렌더 모두에서 동일한 default를 사용해 hydration mismatch 방지.
  // mount 후 useEffect에서 무작위 위치로 바꿔줌.
  const [pos, setPos] = useState<string>(DEFAULT_POSITION);

  useEffect(() => {
    const random = POSITIONS[Math.floor(Math.random() * POSITIONS.length)];
    setPos(random);
  }, []);

  return (
    <ClickableGreat
      containerClassName={`absolute ${pos} w-24 sm:w-32 md:w-40 lg:w-56 xl:w-64 z-10 transition-all duration-300 ease-out`}
      imageClassName="w-full object-contain drop-shadow-2xl animate-float-fast"
    />
  );
}
