'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import AuthGuard from '@/components/auth/AuthGuard';
import { getUserEnrollments, getCourse, getProgress, getCategories, getUserPointHistory } from '@/lib/firebase/firestore';
import type { Course, Enrollment, Progress, Category, PointHistory } from '@/lib/types';
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
  const [catMap, setCatMap] = useState<Record<string, string>>({});
  const [pointHistory, setPointHistory] = useState<PointHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) return;
    const loadData = async () => {
      try {
        const [enrollmentList, cats, history] = await Promise.all([
          getUserEnrollments(user.uid),
          getCategories(),
          getUserPointHistory(user.uid),
        ]);

        const map: Record<string, string> = {
          'ai-basic': 'AI 기초', 'ai-ethics': 'AI 윤리', 'coding': '코딩',
        };
        (cats as Category[]).forEach(c => { map[c.slug] = c.name; });
        setCatMap(map);
        setPointHistory(history);

        const courseDataPromises = enrollmentList.map(async (enrollment) => {
          const course = await getCourse(enrollment.courseId);
          const progress = await getProgress(user.uid, enrollment.courseId);
          return { enrollment, course: course as Course, progress };
        });
        const courseData = await Promise.all(courseDataPromises);
        setEnrollments(courseData.filter(item => item.course !== null));
      } catch (error) {
        console.error('데이터 로드 실패:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [user?.uid]);

  const totalSeconds = enrollments.reduce((acc, e) => acc + (e.progress?.lastPosition || 0), 0);
  const totalHours = Math.floor(totalSeconds / 3600);
  const totalMinutes = Math.floor((totalSeconds % 3600) / 60);
  const myPoints = userProfile?.totalPoints || 0;

 if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>)}
          </div>
        </div>
      </div>
    );
  }

 
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* 환영 메시지 + 그뤠잇 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-1">
            환영합니다, {userProfile?.name}님!
          </h1>
          <p className="text-lg text-gray-600">학습을 계속하세요</p>
        </div>
        <Link href="/leaderboard" className="flex items-center gap-3 bg-gradient-to-r from-teal-500 to-blue-500 rounded-2xl px-6 py-4 text-white shadow-lg hover:shadow-xl transition group">
          <div>
            <p className="text-teal-100 text-xs font-medium">나의 그뤠잇</p>
            <p className="text-3xl font-bold">{myPoints.toLocaleString()}</p>
          </div>
          <svg className="w-5 h-5 text-teal-200 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>

      {/* 학습 통계 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <div className="bg-teal-50 rounded-xl p-5 border border-teal-200">
          <div className="text-xs font-semibold text-teal-600 mb-1">등록된 강좌</div>
          <div className="text-3xl font-bold text-gray-900">{enrollments.length}</div>
        </div>
        <div className="bg-green-50 rounded-xl p-5 border border-green-200">
          <div className="text-xs font-semibold text-green-600 mb-1">완료된 강좌</div>
          <div className="text-3xl font-bold text-gray-900">
            {enrollments.filter(e => e.progress?.completed).length}
          </div>
        </div>
        <div className="bg-blue-50 rounded-xl p-5 border border-blue-200">
          <div className="text-xs font-semibold text-blue-600 mb-1">총 학습 시간</div>
          <div className="text-3xl font-bold text-gray-900">
            {totalHours > 0 ? `${totalHours}시간` : `${totalMinutes}분`}
          </div>
        </div>
        <Link href="/shop" className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-5 border border-amber-200 hover:shadow-md transition">
          <div className="text-xs font-semibold text-amber-600 mb-1">보상 상점</div>
          <div className="text-lg font-bold text-gray-900">그뤠잇 사용하기 →</div>
        </Link>
      </div>

      {/* 최근 그뤠잇 내역 */}
      {pointHistory.length > 0 && (
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">최근 그뤠잇 내역</h2>
            <Link href="/leaderboard" className="text-sm text-teal-600 hover:text-teal-700 font-medium">전체 보기 →</Link>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm divide-y divide-gray-50">
            {pointHistory.slice(0, 5).map(h => (
              <div key={h.id} className="flex items-center gap-4 px-5 py-3">
                <div className={`w-14 text-center font-bold text-sm ${h.points >= 0 ? 'text-teal-600' : 'text-red-500'}`}>
                  {h.points >= 0 ? '+' : ''}{h.points}
                </div>
                <div className="flex-grow">
                  <span className="text-sm font-medium text-gray-900">{h.description}</span>
                </div>
                <div className="text-xs text-gray-400">
                  {h.createdAt?.toDate ? new Date(h.createdAt.toDate()).toLocaleDateString('ko-KR') : ''}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 나의 강좌 */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-6">나의 강좌</h2>
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
                  <div
