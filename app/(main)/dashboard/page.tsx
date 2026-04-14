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
  // 상태 관리
  const { user, userProfile } = useAuth();
  const [enrollments, setEnrollments] = useState<EnrolledCourseData[]>([]);
  const [loading, setLoading] = useState(true);

  // 등록된 강좌 불러오기
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
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* 환영 메시지 */}
      <div className="mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          환영합니다, {userProfile?.name}님!
        </h1>
        <p className="text-lg text-gray-600">학습을 계속하세요</p>
      </div>

      {/* 학습 통계 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
          <div className="text-sm font-semibold text-blue-600 mb-2">등록된 강좌</div>
          <div className="text-3xl font-bold text-gray-900">{enrollments.length}</div>
        </div>
        <div className="bg-green-50 rounded-lg p-6 border border-green-200">
          <div className="text-sm font-semibold text-green-600 mb-2">완료된 강좌</div>
          <div className="text-3xl font-bold text-gray-900">
            {enrollments.filter((e) => e.progress?.completed).length}
          </div>
        </div>
        <div className="bg-purple-50 rounded-lg p-6 border border-purple-200">
          <div className="text-sm font-semibold text-purple-600 mb-2">총 학습 시간</div>
          <div className="text-3xl font-bold text-gray-900">
            {Math.floor(
              enrollments.reduce((acc, e) => acc + (e.progress?.watchedSeconds || 0), 0) / 3600
            )}
            h
          </div>
        </div>
      </div>

      {/* 등록된 강좌 */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">나의 강좌</h2>

        {enrollments.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-600 mb-4">아직 등록된 강좌가 없습니다</p>
            <Link
              href="/courses"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition"
            >
              강좌 탐색하기
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {enrollments.map((item) => {
              const progressPercent = item.course
                ? Math.min(
                    100,
                    Math.round(
                      ((item.progress?.watchedSeconds || 0) /
                        Math.max(
                          parseInt(
                            item.course.youtubeUrl
                              .match(/(?:youtu\.be\/|youtube\.com\/watch\?v=)([^&\n?#]+)/)?.[0] ||
                                '0'
                          ) || 600,
                          600
                        )) *
                        100
                    )
                  )
                : 0;

              return (
                <Link
                  key={item.enrollment.id}
                  href={`/courses/${item.course.id}`}
                  className="bg-white rounded-lg shadow hover:shadow-lg transition overflow-hidden"
                >
                  <div className="relative">
                    <img
                      src={item.course.thumbnailUrl}
                      alt={item.course.title}
                      className="w-full h-40 object-cover"
                    />
                    <span className="absolute top-2 right-2 bg-blue-600 text-white text-xs font-semibold px-2 py-1 rounded">
                      {item.course.category === 'ai-basic'
                        ? 'AI 기초'
                        : item.course.category === 'ai-ethics'
                          ? 'AI 윤리'
                          : '코딩'}
                    </span>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                      {item.course.title}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                      {item.progress?.completed ? (
                        <span className="text-green-600 font-semibold">완료</span>
                      ) : (
                        <>
                          <div className="flex-grow bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all"
                              style={{ width: `${progressPercent}%` }}
                            ></div>
                          </div>
                          <span className="text-xs">{progressPercent}%</span>
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
