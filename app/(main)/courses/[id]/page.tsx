'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import AuthGuard from '@/components/auth/AuthGuard';
import YouTubePlayer from '@/components/courses/YouTubePlayer';
import {
  getCourse, enrollCourse, updateProgress, getProgress,
  getUserEnrollments, getCategories,
} from '@/lib/firebase/firestore';
import type { Course, Progress, Category } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { formatSeconds } from '@/lib/utils';

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
  const [catMap, setCatMap] = useState<Record<string, string>>({});
  const [showResumeChoice, setShowResumeChoice] = useState(false);
  const [startTime, setStartTime] = useState(0);
  const [showPlayer, setShowPlayer] = useState(false);
  const lastSavedRef = useRef(0);

  useEffect(() => {
    if (!courseId) return;
    const loadCourse = async () => {
      try {
        const [courseData, cats] = await Promise.all([
          getCourse(courseId),
          getCategories(),
        ]);
        setCourse(courseData as Course);
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
            const p = await getProgress(user.uid, courseId);
            setProgress(p);
            if (p && (p.lastPosition || 0) > 10 && !p.completed) {
              setShowResumeChoice(true);
            } else {
              setShowPlayer(true);
            }
          } else {
            setShowPlayer(true);
          }
        } else {
          setShowPlayer(true);
        }
      } catch (error) {
        console.error('강좌 로드 실패:', error);
      } finally {
        setLoading(false);
      }
    };
    loadCourse();
  }, [courseId, user?.uid]);

  const handleResume = () => {
    if (progress) {
      setStartTime(progress.lastPosition || 0);
      lastSavedRef.current = progress.lastPosition || 0;
    }
    setShowResumeChoice(false);
    setShowPlayer(true);
  };

  const handleRestart = () => {
    setStartTime(0);
    lastSavedRef.current = 0;
    setShowResumeChoice(false);
    setShowPlayer(true);
  };

  const handleEnroll = async () => {
    if (!user?.uid) return;
    setEnrolling(true);
    try {
      await enrollCourse(user.uid, courseId);
      setIsEnrolled(true);
      setShowPlayer(true);
    } catch (error) {
      console.error('강좌 등록 실패:', error);
      alert('강좌 등록에 실패했습니다');
    } finally {
      setEnrolling(false);
    }
  };

  const handleProgress = useCallback(async (seconds: number, duration: number) => {
    if (!user?.uid) return;
    // 마지막 저장과 10초 이상 차이날 때만 저장
    if (Math.abs(seconds - lastSavedRef.current) < 10 && seconds < duration - 5) return;
    lastSavedRef.current = seconds;
    try {
      const isCompleted = duration > 0 && seconds >= duration - 5;
      await updateProgress(user.uid, courseId, {
        lastPosition: seconds,
        totalDuration: duration,
        completed: isCompleted,
      });
      setProgress(prev => {
        const base = prev || { userId: user.uid, courseId, lastPosition: 0, totalDuration: 0, completed: false } as Progress;
        return { ...base, lastPosition: seconds, totalDuration: duration, completed: isCompleted };
      });
    } catch (error) {
      console.error('진도 저장 실패:', error);
    }
  }, [user?.uid, courseId]);

  const handleVideoEnded = useCallback(async () => {
    if (!user?.uid) return;
    try {
      await updateProgress(user.uid, courseId, {
        completed: true,
      });
      setProgress(prev => prev ? { ...prev, completed: true } : null);
    } catch (error) {
      console.error('완료 처리 실패:', error);
    }
  }, [user?.uid, courseId]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-8">
          <div className="h-96 bg-gray-200 rounded-lg"></div>
          <div className="space-y-4">
            <div className="h-10 bg-gray-200 rounded w-1/2"></div>
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

  const progressPercent = progress && progress.totalDuration > 0
    ? Math.min(100, Math.round((progress.lastPosition / progress.totalDuration) * 100))
    : 0;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <button onClick={() => router.back()} className="text-teal-600 hover:text-teal-700 font-semibold mb-6">
        ← 돌아가기
      </button>

      {/* 이어보기 선택 */}
      {showResumeChoice && progress && (
        <div className="mb-6 bg-white rounded-2xl shadow-lg border border-teal-100 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-gray-900">이전 시청 기록이 있어요</p>
              <p className="text-sm text-gray-500">
                {formatSeconds(progress.lastPosition)} 까지 시청했습니다
                {progress.totalDuration > 0 && ` (전체 ${formatSeconds(progress.totalDuration)})`}
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleResume}
              className="flex-1 bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600 text-white font-semibold py-3 px-4 rounded-xl transition"
            >
              이어서 보기 ({formatSeconds(progress.lastPosition)}부터)
            </button>
            <button
              onClick={handleRestart}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-4 rounded-xl transition"
            >
              처음부터 보기
            </button>
          </div>
        </div>
      )}

      {/* 비디오 플레이어 */}
      {showPlayer && (
        <YouTubePlayer
          videoUrl={course.youtubeUrl}
          title={course.title}
          startTime={startTime}
          onProgress={handleProgress}
          onEnded={handleVideoEnded}
        />
      )}

      {/* 강좌 정보 */}
      <div className="mt-8">
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="bg-teal-100 text-teal-800 text-xs font-semibold px-3 py-1 rounded-full">
              {catMap[course.category] || course.category}
            </span>
            {progress?.completed && (
              <span className="bg-green-100 text-green-800 text-xs font-semibold px-3 py-1 rounded-full">
                ✓ 학습 완료
              </span>
            )}
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">{course.title}</h1>
          <p className="text-lg text-gray-600">{course.description}</p>
        </div>

        {/* 학습 진도 바 */}
        {isEnrolled && progress && (
          <div className="mt-6 bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="font-semibold text-gray-900">학습 진도</span>
              <span className="text-sm font-medium text-teal-600">{progressPercent}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
              <div
                className="bg-gradient-to-r from-teal-400 to-blue-500 h-3 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>{formatSeconds(progress.lastPosition)} 시청</span>
              <span>전체 {progress.totalDuration > 0 ? formatSeconds(progress.totalDuration) : '-'}</span>
            </div>
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
            <button
              onClick={() => router.push('/dashboard')}
              className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-lg transition"
            >
              대시보드로
            </button>
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
