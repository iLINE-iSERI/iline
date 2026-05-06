'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AuthGuard from '@/components/auth/AuthGuard';
import { useAuth } from '@/lib/hooks/useAuth';
import { getOfflineCourses, getUserOfflineApplications } from '@/lib/firebase/firestore';
import type { OfflineCourse, OfflineApplication, OfflineApplicationStatus } from '@/lib/types';

const STATUS_LABEL: Record<OfflineApplicationStatus, string> = {
  pending: '승인 대기',
  approved: '승인됨',
  rejected: '거절됨',
  completed: '수료',
};

const STATUS_STYLE: Record<OfflineApplicationStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  completed: 'bg-blue-100 text-blue-700',
};

function OfflineCoursesListContent() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<OfflineCourse[]>([]);
  const [myApps, setMyApps] = useState<Record<string, OfflineApplication>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) return;
    Promise.all([
      getOfflineCourses({ onlyOpen: true }),
      getUserOfflineApplications(user.uid),
    ])
      .then(([cs, apps]) => {
        // 시작일 오름차순 (가까운 일정 먼저)
        cs.sort((a, b) => (a.startDate || '').localeCompare(b.startDate || ''));
        setCourses(cs);
        const map: Record<string, OfflineApplication> = {};
        apps.forEach(a => { map[a.courseId] = a; });
        setMyApps(map);
      })
      .finally(() => setLoading(false));
  }, [user?.uid]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="h-32 bg-gray-200 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">오프라인 강좌</h1>
      <p className="text-gray-500 mb-8">현장 교육에 신청하고 수료증을 받아보세요</p>

      {courses.length === 0 ? (
        <div className="text-center py-16 text-gray-400 bg-white rounded-2xl border border-gray-200">
          <p className="text-lg font-medium">현재 신청 받는 오프라인 강좌가 없습니다</p>
          <p className="text-sm mt-2">새 강좌가 개설되면 알려드릴게요</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {courses.map(c => {
            const app = myApps[c.id];
            return (
              <Link
                key={c.id}
                href={`/offline-courses/${c.id}`}
                className="bg-white rounded-2xl border border-gray-200 hover:border-purple-300 hover:shadow-lg transition overflow-hidden flex flex-col"
              >
                {c.posterUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.posterUrl} alt={c.title} className="w-full h-44 object-cover" />
                ) : (
                  <div className="w-full h-44 bg-gradient-to-br from-purple-100 to-teal-100 flex items-center justify-center">
                    <span className="text-4xl font-bold text-white opacity-60">📚</span>
                  </div>
                )}
                <div className="p-5 flex-grow flex flex-col">
                  <div className="flex items-start gap-2 mb-2">
                    <h3 className="font-bold text-lg text-gray-900 flex-grow line-clamp-2">{c.title}</h3>
                    {app && (
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full whitespace-nowrap ${STATUS_STYLE[app.status]}`}>
                        {STATUS_LABEL[app.status]}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2 whitespace-pre-wrap">{c.content}</p>
                  <div className="mt-auto space-y-1 text-xs text-gray-500">
                    <div className="flex items-center gap-1">📅 {c.startDate} ~ {c.endDate}</div>
                    <div className="flex items-center gap-1">📍 {c.location}</div>
                    {c.instructor && <div className="flex items-center gap-1">👤 {c.instructor}</div>}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function OfflineCoursesPage() {
  return (
    <AuthGuard>
      <OfflineCoursesListContent />
    </AuthGuard>
  );
}
