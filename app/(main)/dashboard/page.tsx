'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import AuthGuard from '@/components/auth/AuthGuard';
import { getUserEnrollments, getCourse, getProgress, getCategories } from '@/lib/firebase/firestore';
import type { Course, Enrollment, Progress, Category } from '@/lib/types';
import Link from 'next/link';
import { formatSeconds } from '@/lib/utils';

interface EnrolledCourseData {
  enrollment: Enrollment;
  course: Course;
  progress: Progress | null;
}

function DashboardContent() {
  const { user, userProfile } = useAuth();
  const [enrollments, setEnrollments] = useState<EnrolledCourseData[]>([]);
  const [loading, setLoading] = useState(true);
  const [catMap, setCatMap] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!user?.uid) return;
    const loadData = async () => {
      try {
        const [enrollmentList, cats] = await Promise.all([
          getUserEnrollments(user.uid),
          getCategories(),
        ]);
        const map: Record<string, string> = {
          'ai-basic': 'AI 기초', 'ai-ethics': 'AI 윤리', 'coding': '코딩',
        };
        (cats as Category[]).forEach(c => { map[c.slug] = c.name; });
        setCatMap(map);

        const courseDataPromises = enrollmentList.map(async (enrollment) => {
          const course = await getCourse(enrollment.courseId);
          const progress = await getProgress(user.uid, enrollment.courseId);
          return { enrollment, course: course as Course, progress };
        });
        const courseData = await Promise.all(courseDataPromises);
        setEnrollments(courseData.filter(item => item.course !== null));
      } catch (error) {
        console.error('등록된 강좌 로드 실패:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [user?.uid]);

  const totalSeconds = enrollments.reduce((acc, e) => acc + (e.progress?.lastPosition || 0), 0);
  const totalHours = Math.floor(totalSeconds / 3600);
  const totalMinutes = Math.floor((totalSeconds % 3600) / 60);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">환영합니다, {userProfile?.name}님!</h1>
        <p className="text-lg text-gray-600">학습을 계속하세요</p>
      </div>

      {/* 학습 통계 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-teal-50 rounded-lg p-6 border border-teal-200">
          <div className="text-sm font-semibold text-teal-600 mb-2">등록된 강좌</div>
          <div className="text-3xl font-bold text-gray-900">{enrollments.length}</div>
        </div>
        <div className="bg-green-50 rounded-lg p-6 border border-green-200">
          <div className="text-sm font-semibold text-green-600 mb-2">완료된 강좌</div>
          <div className="text-3xl font-bold text-gray-900">
            {enrollments.filter(e => e.progress?.completed).length}
          </div>
        </div>
        <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
          <div className="text-sm font-semibold text-blue-600 mb-2">총 학습 시간</div>
          <div className="text-3xl font-bold text-gray-900">
            {totalHours > 0 ? `${totalHours}시간 ` : ''}{totalMinutes}분
          </div>
        </div>
      </div>

      {/* 등록된 강좌 */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">나의 강좌</h2>
        {enrollments.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-600 mb-4">아직 등록된 강좌가 없습니다</p>
            <Link href="/courses" className="inline-block bg-gradient-to-r from-teal-500 to-blue-500 text-white font-semibold py-2 px-6 rounded-lg transition">
              강좌 탐색하기
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {enrollments.map(item => {
              const pct = item.progress && item.progress.totalDuration > 0
                ? Math.min(100, Math.round((item.progress.lastPosition / item.progress.totalDuration) * 100))
                : 0;

              return (
                <Link
                  key={item.enrollment.id}
                  href={`/courses/${item.course.id}`}
                  className="bg-white rounded-2xl shadow hover:shadow-lg transition overflow-hidden border border-gray-100"
                >
                  <div className="relative">
                    <img src={item.course.thumbnailUrl} alt={item.course.title} className="w-full h-40 object-cover" />
                    <span className="absolute top-2 right-2 bg-gradient-to-r from-teal-500 to-blue-500 text-white text-xs font-semibold px-2 py-1 rounded-full">
                      {catMap[item.course.category] || item.course.category}
                    </span>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-3 line-clamp-2">{item.course.title}</h3>
                    {item.progress?.completed ? (
                      <div className="text-green-600 font-semibold text-sm">✓ 학습 완료</div>
                    ) : (
                      <div>
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>{formatSeconds(item.progress?.lastPosition || 0)} 시청</span>
                          <span>{pct}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-teal-400 to-blue-500 h-2 rounded-full transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <AuthGuard>
      <DashboardContent />
    </AuthGuard>
  );
}
