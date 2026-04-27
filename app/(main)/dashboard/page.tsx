'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import AuthGuard from '@/components/auth/AuthGuard';
import { getUserEnrollments, getCourse, getProgress } from '@/lib/firebase/firestore';
import type { Course, Enrollment, Progress } from '@/lib/types';
import Link from 'next/link';

interface EnrolledCourseData {
  enrollment: Enrollment;
  course: Course;
  progress: Progress | null;
}

function DashboardContent() {
  const { user, userProfile } = useAuth();
  const [enrollments, setEnrollments] = useState<EnrolledCourseData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) return;
    const loadEnrollments = async () => {
      try {
        const enrollmentList = await getUserEnrollments(user.uid);
        const courseDataPromises = enrollmentList.map(async (enrollment) => {
          const course = await getCourse(enrollment.courseId);
          const progress = await getProgress(user.uid, enrollment.courseId);
          return { enrollment, course: course as Course, progress };
        });
        const courseData = await Promise.all(courseDataPromises);
        setEnrollments(courseData);
      } catch (error) {
        console.error('등록된 강좌 로드 실패:', error);
      } finally {
        setLoading(false);
      }
    };
    loadEnrollments();
  }, [user?.uid]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-purple-100 rounded-xl w-1/4 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-28 bg-purple-50 rounded-2xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const completedCount = enrollments.filter((e) => e.progress?.completed).length;
  const totalHours = Math.floor(
    enrollments.reduce((acc, e) => acc + (e.progress?.watchedSeconds || 0), 0) / 3600
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-sm font-medium mb-3">
          대시보드
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
          환영합니다, <span className="gradient-text">{userProfile?.name}</span>님!
        </h1>
        <p className="text-gray-500">학습을 계속하세요</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="card-hover bg-gradient-to-br from-purple-500 to-purple-700 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-medium text-purple-200">등록된 강좌</div>
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
          </div>
          <div className="text-4xl font-bold">{enrollments.length}</div>
        </div>

        <div className="card-hover bg-gradient-to-br from-teal-500 to-teal-700 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-medium text-teal-200">완료된 강좌</div>
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="text-4xl font-bold">{completedCount}</div>
        </div>

        <div className="card-hover bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-medium text-blue-200">총 학습 시간</div>
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="text-4xl font-bold">{totalHours}h</div>
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">나의 강좌</h2>
        {enrollments.length === 0 ? (
          <div className="text-center py-16 bg-gradient-to-br from-purple-50 to-teal-50 rounded-3xl border border-purple-100">
            <p className="text-gray-500 mb-6">아직 등록된 강좌가 없습니다</p>
            <Link
              href="/courses"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white font-semibold py-3 px-8 rounded-xl hover:shadow-lg hover:shadow-purple-200"
            >
              강좌 탐색하기
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {enrollments.map((item) => {
              const progressPercent = Math.min(100, Math.round(((item.progress?.watchedSeconds || 0) / 600) * 100));
              const categoryColors: Record<string, string> = {
                'ai-basic': 'from-purple-500 to-purple-600',
                'ai-ethics': 'from-teal-500 to-teal-600',
                'coding': 'from-blue-500 to-blue-600',
              };
              const categoryNames: Record<string, string> = {
                'ai-basic': 'AI 기초',
                'ai-ethics': 'AI 윤리',
                'coding': '코딩',
              };
              return (
                <Link key={item.enrollment.id} href={`/courses/${item.course.id}`} className="card-hover bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="relative">
                    <img src={item.course.thumbnailUrl} alt={item.course.title} className="w-full h-40 object-cover" />
                    <span className={`absolute top-3 right-3 bg-gradient-to-r ${categoryColors[item.course.category]} text-white text-xs font-semibold px-3 py-1 rounded-full`}>
                      {categoryNames[item.course.category]}
                    </span>
                  </div>
                  <div className="p-5">
                    <h3 className="font-bold text-gray-900 mb-3 line-clamp-2">{item.course.title}</h3>
                    <div className="flex items-center gap-2 text-sm">
                      {item.progress?.completed ? (
                        <span className="text-teal-600 font-semibold">완료</span>
                      ) : (
                        <>
                          <div className="flex-grow bg-gray-100 rounded-full h-2">
                            <div className="progress-gradient h-2 rounded-full" style={{ width: `${progressPercent}%` }}></div>
                          </div>
                          <span className="text-xs font-medium text-purple-600">{progressPercent}%</span>
                        </>
                      )}
                    </div>
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
