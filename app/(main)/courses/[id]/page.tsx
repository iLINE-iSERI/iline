'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import AuthGuard from '@/components/auth/AuthGuard';
import YouTubePlayer from '@/components/courses/YouTubePlayer';
import {
  getCourse, enrollCourse, updateProgress, getProgress,
  getUserEnrollments, getCategories,
} from '@/lib/firebase/firestore';
import type { Course, Progress, Category } from '@/lib/types';
import { useRouter } from 'next/navigation';

interface CourseDetailProps {
  params: { id: string };
}

function CourseDetailContent({ courseId }: { courseId: string }) {
  const { user } = useAuth();
  const router = useRouter();
  const [course, setCourse] = useState<Course | null>(null);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [lastWatchedSeconds, setLastWatchedSeconds] = useState(0);
  const [catMap, setCatMap] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!courseId) return;
    const loadCourse = async () => {
      try {
        const [courseData, cats] = await Promise.all([
          getCourse(courseId),
          getCategories(),
        ]);
        setCourse(courseData as Course);

        // 카테고리 slug→name 매핑
        const map: Record<string, string> = {
          'ai-basic': 'AI 기초', 'ai-ethics': 'AI 윤리', 'coding': '코딩',
        };
        (cats as Category[]).forEach(c => { map[c.slug] = c.name; });
        setCatMap(map);

        if (user?.uid) {
          const enrollments = await getUserEnrollments(user.uid);
          const enrolled = enrollments.some(e => e.courseId === courseId);
          setIsEnrolled(enrolled);
          if (enrolled) {
            const progressData = await getProgress(user.uid, courseId);
            setProgress(progressData);
            setLastWatchedSeconds(progressData?.watchedSeconds || 0);
          }
        }
      } catch (error) {
        console.error('강좌 로드 실패:', error);
      } finally {
        setLoading(false);
      }
    };
    loadCourse();
  }, [courseId, user?.uid]);

  const handleEnroll = async () => {
    if (!user?.uid) return;
    setEnrolling(true);
    try {
      await enrollCourse(user.uid, courseId);
      setIsEnrolled(true);
      const progressData = await getProgress(user.uid, courseId);
      setProgress(progressData);
    } catch (error) {
      console.error('강좌 등록 실패:', error);
      alert('강좌 등록에 실패했습니다');
    } finally {
      setEnrolling(false);
    }
  };

  const handleProgressUpdate = async (seconds: number) => {
    if (!user?.uid || !isEnrolled) return;
    if (Math.abs(seconds - lastWatchedSeconds) < 5) return;
    setLastWatchedSeconds(seconds);
    try {
      await updateProgress(user.uid, courseId, { watchedSeconds: seconds });
      setProgress(prev => prev ? { ...prev, watchedSeconds: seconds } : null);
    } catch (error) {
      console.error('진도 업데이트 실패:', error);
    }
  };

  const handleMarkComplete = async () => {
    if (!user?.uid) return;
    try {
      await updateProgress(user.uid, courseId, { completed: true });
      setProgress(prev => prev ? { ...prev, completed: true } : null);
      alert('강좌가 완료되었습니다!');
    } catch (error) {
      console.error('완료 처리 실패:', error);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-8">
          <div className="h-96 bg-gray-200 rounded-lg"></div>
          <div className="space-y-4">
            <div className="h-10 bg-gray-200 rounded w-1/2"></div>
            <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <p className="text-gray-600">강좌를 찾을 수 없습니다</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <button onClick={() => router.back()} className="text-teal-600 hover:text-teal-700 font-semibold mb-6">
        ← 돌아가기
      </button>

      <YouTubePlayer videoUrl={course.youtubeUrl} title={course.title} onProgress={handleProgressUpdate} />

      <div className="mt-8">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="bg-teal-100 text-teal-800 text-xs font-semibold px-3 py-1 rounded-full">
                {catMap[course.category] || course.category}
              </span>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">{course.title}</h1>
            <p className="text-lg text-gray-600">{course.description}</p>
          </div>
        </div>

        {/* 진도 표시 */}
        {isEnrolled && progress && (
          <div className="mt-6 p-4 bg-teal-50 rounded-lg border border-teal-200">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-gray-900">학습 진도</span>
              <span className="text-sm text-gray-600">{progress.watchedSeconds}초 시청</span>
            </div>
            {progress.completed && (
              <div className="text-green-600 font-semibold">✓ 완료됨</div>
            )}
          </div>
        )}

        {/* 액션 버튼 */}
        <div className="flex gap-3 mt-6">
          {!isEnrolled ? (
            <button
              onClick={handleEnroll}
              disabled={enrolling}
              className="bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600 disabled:from-gray-400 disabled:to-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition flex-1"
            >
              {enrolling ? '등록 중...' : '수강 신청하기'}
            </button>
          ) : (
            <>
              {!progress?.completed && (
                <button
                  onClick={handleMarkComplete}
                  className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition"
                >
                  완료로 표시
                </button>
              )}
              <button
                onClick={() => router.push('/dashboard')}
                className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-lg transition"
              >
                대시보드로
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CourseDetailPage({ params }: CourseDetailProps) {
  return (
    <AuthGuard>
      <CourseDetailContent courseId={params.id} />
    </AuthGuard>
  );
}
