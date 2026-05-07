'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getOfflineCourses } from '@/lib/firebase/firestore';
import type { OfflineCourse } from '@/lib/types';

export default function OpenOfflineCoursesPreview() {
  const [courses, setCourses] = useState<OfflineCourse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getOfflineCourses({ onlyOpen: true })
      .then(all => {
        const today = new Date().toISOString().split('T')[0];
        const active = all.filter(c => (c.endDate || '') >= today);
        active.sort((a, b) => (a.startDate || '').localeCompare(b.startDate || ''));
        setCourses(active.slice(0, 6));
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading || courses.length === 0) return null;

  return (
    <div className="mt-20">
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-100 text-pink-700 text-sm font-medium mb-4">
          OFFLINE
        </div>
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
          모집 중인 <span className="bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">오프라인 강의</span>
        </h2>
        <p className="text-gray-500 text-lg">현장에서 함께 배우는 교육 프로그램</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map(c => (
          <Link
            key={c.id}
            href={`/offline-courses/${c.id}`}
            className="card-hover group relative overflow-hidden rounded-3xl min-h-[280px] flex flex-col justify-end"
            style={{
              background: c.posterUrl
                ? `url(${c.posterUrl}) center/cover no-repeat`
                : 'linear-gradient(135deg, #ec4899, #a855f7)',
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
            <div className="relative p-6 text-white">
              <div className="inline-block text-xs font-semibold bg-white/25 backdrop-blur px-2 py-1 rounded mb-3">
                OFFLINE
              </div>
              <h3 className="text-xl font-bold mb-2 line-clamp-2">{c.title}</h3>
              <div className="text-sm opacity-90 flex items-center gap-1 mb-1">📅 {c.startDate} ~ {c.endDate}</div>
              <div className="text-sm opacity-90 flex items-center gap-1 line-clamp-1">📍 {c.location}</div>
            </div>
          </Link>
        ))}
      </div>
      <div className="text-center mt-8">
        <Link href="/offline-courses" className="inline-flex items-center gap-1 text-pink-600 hover:text-pink-700 font-semibold transition">
          전체 오프라인 강의 보기 →
        </Link>
      </div>
    </div>
  );
}
