'use client';

import type { Course } from '@/lib/types';
import Link from 'next/link';
import { useState } from 'react';
import { getYouTubeThumbnail } from '@/lib/utils';

interface CourseCardProps {
  course: Course;
}

export default function CourseCard({ course }: CourseCardProps) {
  const categoryLabel: Record<string, string> = {
    'ai-basic': 'AI 기초',
    'ai-ethics': 'AI 윤리',
    'coding': '코딩',
  };

  const categoryGradient: Record<string, string> = {
    'ai-basic': 'from-purple-500 to-purple-600',
    'ai-ethics': 'from-teal-500 to-teal-600',
    'coding': 'from-blue-500 to-blue-600',
  };

  // 우선순위: 명시된 thumbnailUrl → YouTube 고해상도 → 깨지면 YouTube 표준 화질
  const ytMax = getYouTubeThumbnail(course.youtubeUrl, 'max');
  const ytHq = getYouTubeThumbnail(course.youtubeUrl, 'hq');
  const initialSrc = course.thumbnailUrl || ytMax || ytHq || '';
  const [src, setSrc] = useState(initialSrc);
  const [errored, setErrored] = useState(false);

  const handleError = () => {
    // maxresdefault → hqdefault 폴백 → 그래도 실패면 placeholder 표시
    if (src === course.thumbnailUrl && ytMax) { setSrc(ytMax); return; }
    if (src !== ytHq && ytHq) { setSrc(ytHq); return; }
    setErrored(true);
  };

  const gradient = categoryGradient[course.category] || 'from-gray-400 to-gray-500';
  const label = categoryLabel[course.category] || course.category;

  return (
    <Link href={`/courses/${course.id}`}>
      <div className="card-hover bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden cursor-pointer h-full flex flex-col">
        <div className="relative overflow-hidden bg-gray-100 h-44">
          {src && !errored ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={src}
              alt={course.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={handleError}
            />
          ) : (
            <div className={`w-full h-full flex items-center justify-center bg-gradient-to-br ${gradient}`}>
              <svg className="w-16 h-16 text-white/70" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          )}
          <span
            className={`absolute top-3 right-3 text-xs font-semibold px-3 py-1 rounded-full bg-gradient-to-r ${gradient} text-white shadow-md`}
          >
            {label}
          </span>
        </div>

        <div className="p-5 flex flex-col flex-grow">
          <h3 className="font-bold text-gray-900 mb-2 line-clamp-2 text-base">
            {course.title}
          </h3>
          <p className="text-sm text-gray-500 line-clamp-2 flex-grow mb-4 leading-relaxed">
            {course.description}
          </p>
          <span className="inline-flex items-center gap-1 text-purple-600 hover:text-purple-700 font-semibold text-sm group">
            자세히 보기
            <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </span>
        </div>
      </div>
    </Link>
  );
}
