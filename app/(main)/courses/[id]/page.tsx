'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import AuthGuard from '@/components/auth/AuthGuard';
import YouTubePlayer from '@/components/courses/YouTubePlayer';
import {
  getCourse, enrollCourse, updateProgress, getProgress,
  getUserEnrollments, getCategories,
  getCourseComments, createCourseComment, deleteCourseComment,
  createQuizAttempt, getUserQuizAttempts,
} from '@/lib/firebase/firestore';
import type { Course, Progress, Category, CourseComment, QuizQuestion, QuizAttempt } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { formatSeconds } from '@/lib/utils';

interface CourseDetailProps {
  params: { id: string };
}

function CourseDetailContent({ courseId }: { courseId: string }) {
  const { user, userProfile } = useAuth();
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
  const [comments, setComments] = useState<CourseComment[]>([]);
  const [commentInput, setCommentInput] = useState('');
  const [posting, setPosting] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});
  const [quizSelfGraded, setQuizSelfGraded] = useState<Record<string, 'correct' | 'wrong' | null>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizGenerating, setQuizGenerating] = useState(false);
  const [quizError, setQuizError] = useState('');
  const [quizAttempts, setQuizAttempts] = useState<QuizAttempt[]>([]);
  const lastSavedRef = useRef(0);
  const isAdmin = userProfile?.role === 'admin';

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

  useEffect(() => {
    if (!isEnrolled || !courseId) return;
    getCourseComments(courseId).then(setComments).catch(e => console.error('댓글 로드 실패:', e));
  }, [isEnrolled, courseId]);

  const handleAddComment = async () => {
    const text = commentInput.trim();
    if (!text || !user?.uid) return;
    const authorName = userProfile?.name || user.email || '익명';
    setPosting(true);
    try {
      const id = await createCourseComment({ courseId, authorId: user.uid, authorName, content: text });
      const optimistic: CourseComment = {
        id, courseId, authorId: user.uid, authorName, content: text,
        createdAt: { toMillis: () => Date.now(), toDate: () => new Date() } as unknown as CourseComment['createdAt'],
      };
      setComments(prev => [optimistic, ...prev]);
      setCommentInput('');
    } catch (e) {
      alert('댓글 작성 실패');
    } finally {
      setPosting(false);
    }
  };

  const handleDeleteComment = async (id: string) => {
    if (!confirm('이 댓글을 삭제하시겠습니까?')) return;
    try {
      await deleteCourseComment(id);
      setComments(prev => prev.filter(c => c.id !== id));
    } catch (e) {
      alert('삭제 실패');
    }
  };

  // 학습 완료 시 응시 기록 로드
  useEffect(() => {
    if (!user?.uid || !progress?.completed) return;
    getUserQuizAttempts(user.uid, courseId).then(setQuizAttempts).catch(e => console.error('퀴즈 기록 로드 실패:', e));
  }, [user?.uid, courseId, progress?.completed]);

  const handleGenerateQuiz = async () => {
    if (!course) return;
    setQuizError('');
    setQuizGenerating(true);
    setQuizQuestions([]);
    setQuizAnswers({});
    setQuizSelfGraded({});
    setQuizSubmitted(false);
    try {
      const res = await fetch(`/api/courses/${courseId}/quiz`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: course.title,
          description: course.description,
          youtubeUrl: course.youtubeUrl,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || '퀴즈 생성 실패');
      setQuizQuestions(data.questions);
    } catch (e) {
      setQuizError(e instanceof Error ? e.message : '퀴즈 생성 실패');
    } finally {
      setQuizGenerating(false);
    }
  };

  const handleSubmitQuiz = async () => {
    if (!user?.uid || quizQuestions.length === 0) return;
    let score = 0;
    let totalAutoGraded = 0;
    for (const q of quizQuestions) {
      if (q.type === 'short-answer') continue;
      totalAutoGraded += 1;
      if (quizAnswers[q.id] === q.correctAnswer) score += 1;
    }
    setQuizSubmitted(true);
    try {
      const id = await createQuizAttempt({
        userId: user.uid,
        courseId,
        questions: quizQuestions,
        answers: quizAnswers,
        score,
        totalAutoGraded,
      });
      const optimistic: QuizAttempt = {
        id, userId: user.uid, courseId, questions: quizQuestions, answers: quizAnswers, score, totalAutoGraded,
        createdAt: { toMillis: () => Date.now(), toDate: () => new Date() } as unknown as QuizAttempt['createdAt'],
      };
      setQuizAttempts(prev => [optimistic, ...prev]);
    } catch (e) {
      console.error('응시 기록 저장 실패:', e);
    }
  };

  const handleRetakeQuiz = () => {
    setQuizQuestions([]);
    setQuizAnswers({});
    setQuizSelfGraded({});
    setQuizSubmitted(false);
    setQuizError('');
  };

  const autoGradedCorrect = quizQuestions.filter(q => q.type !== 'short-answer' && quizAnswers[q.id] === q.correctAnswer).length;
  const autoGradedTotal = quizQuestions.filter(q => q.type !== 'short-answer').length;
  const allAnswered = quizQuestions.length > 0 && quizQuestions.every(q => (quizAnswers[q.id] ?? '').trim().length > 0);

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

        {/* 퀴즈 섹션 (학습 완료 시에만) */}
        {isEnrolled && progress?.completed && (
          <div className="mt-10 bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-xl font-bold text-gray-900">학습 점검 퀴즈</h2>
              {quizAttempts.length > 0 && (
                <span className="text-xs text-gray-500">이전 응시 {quizAttempts.length}회</span>
              )}
            </div>
            <p className="text-sm text-gray-500 mb-5">강좌 내용을 잘 이해했는지 AI가 만든 퀴즈로 확인해보세요</p>

            {quizError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
                {quizError}
              </div>
            )}

            {/* 초기 상태 — 생성 버튼 */}
            {quizQuestions.length === 0 && !quizGenerating && (
              <div className="text-center py-6">
                <button
                  onClick={handleGenerateQuiz}
                  className="bg-gradient-to-r from-purple-600 to-teal-600 hover:from-purple-700 hover:to-teal-700 text-white font-semibold py-3 px-8 rounded-xl transition-all hover:shadow-lg hover:shadow-purple-200"
                >
                  ✨ 퀴즈 생성
                </button>
                {quizAttempts.length > 0 && (
                  <p className="text-xs text-gray-400 mt-3">
                    최근 점수: {quizAttempts[0].score}/{quizAttempts[0].totalAutoGraded}
                  </p>
                )}
              </div>
            )}

            {/* 로딩 */}
            {quizGenerating && (
              <div className="text-center py-12 text-gray-500">
                <div className="animate-pulse">퀴즈를 생성 중입니다...</div>
                <p className="text-xs mt-2">5~15초 정도 걸릴 수 있어요</p>
              </div>
            )}

            {/* 문제 목록 */}
            {quizQuestions.length > 0 && (
              <div className="space-y-6">
                {quizQuestions.map((q, idx) => {
                  const userAnswer = quizAnswers[q.id] ?? '';
                  const isCorrect = q.type !== 'short-answer' && userAnswer === q.correctAnswer;
                  const showFeedback = quizSubmitted;

                  return (
                    <div key={q.id} className="border border-gray-200 rounded-xl p-4">
                      <div className="flex items-start gap-2 mb-3">
                        <span className="bg-purple-100 text-purple-700 text-xs font-bold px-2 py-1 rounded">
                          Q{idx + 1}
                        </span>
                        <span className="text-xs text-gray-500 mt-1">
                          {q.type === 'multiple-choice' ? '4지선다' : q.type === 'ox' ? 'OX' : '주관식'}
                        </span>
                        {showFeedback && q.type !== 'short-answer' && (
                          <span className={`text-xs font-semibold px-2 py-1 rounded ml-auto ${isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {isCorrect ? '정답' : '오답'}
                          </span>
                        )}
                      </div>
                      <p className="font-medium text-gray-900 mb-3 whitespace-pre-wrap">{q.question}</p>

                      {/* 4지선다 / OX */}
                      {(q.type === 'multiple-choice' || q.type === 'ox') && (
                        <div className="space-y-2">
                          {(q.choices ?? []).map((choice, ci) => {
                            const value = q.type === 'multiple-choice' ? String(ci) : choice;
                            const selected = userAnswer === value;
                            const isAnswer = q.correctAnswer === value;
                            const cls = showFeedback
                              ? isAnswer
                                ? 'border-green-500 bg-green-50 text-green-800'
                                : selected
                                  ? 'border-red-500 bg-red-50 text-red-800'
                                  : 'border-gray-200 bg-white text-gray-600'
                              : selected
                                ? 'border-purple-500 bg-purple-50 text-purple-800'
                                : 'border-gray-200 bg-white text-gray-700 hover:border-purple-300';
                            return (
                              <button
                                type="button"
                                key={ci}
                                disabled={showFeedback}
                                onClick={() => setQuizAnswers(prev => ({ ...prev, [q.id]: value }))}
                                className={`w-full text-left px-4 py-3 rounded-xl border-2 transition ${cls}`}
                              >
                                {q.type === 'multiple-choice' ? `${ci + 1}. ${choice}` : choice}
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* 주관식 */}
                      {q.type === 'short-answer' && (
                        <div>
                          <textarea
                            value={userAnswer}
                            onChange={(e) => setQuizAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                            disabled={showFeedback}
                            placeholder="답안을 입력하세요"
                            rows={2}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none resize-none disabled:bg-gray-100"
                          />
                          {showFeedback && (
                            <div className="mt-3 p-3 bg-blue-50 border border-blue-100 rounded-xl">
                              <p className="text-xs font-semibold text-blue-700 mb-1">모범답안</p>
                              <p className="text-sm text-blue-900 whitespace-pre-wrap">{q.correctAnswer}</p>
                              <div className="flex gap-2 mt-3">
                                <button
                                  type="button"
                                  onClick={() => setQuizSelfGraded(prev => ({ ...prev, [q.id]: 'correct' }))}
                                  className={`text-xs font-medium px-3 py-1.5 rounded-lg border-2 transition ${quizSelfGraded[q.id] === 'correct' ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 bg-white text-gray-600 hover:border-green-300'}`}
                                >
                                  맞춘 것 같아요
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setQuizSelfGraded(prev => ({ ...prev, [q.id]: 'wrong' }))}
                                  className={`text-xs font-medium px-3 py-1.5 rounded-lg border-2 transition ${quizSelfGraded[q.id] === 'wrong' ? 'border-red-500 bg-red-50 text-red-700' : 'border-gray-200 bg-white text-gray-600 hover:border-red-300'}`}
                                >
                                  더 공부할게요
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* 해설 */}
                      {showFeedback && q.explanation && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                          <p className="text-xs font-semibold text-gray-600 mb-1">해설</p>
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">{q.explanation}</p>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* 결과 / 액션 버튼 */}
                {!quizSubmitted ? (
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={handleRetakeQuiz}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-5 rounded-lg transition"
                    >
                      취소
                    </button>
                    <button
                      onClick={handleSubmitQuiz}
                      disabled={!allAnswered}
                      className="bg-gradient-to-r from-purple-600 to-teal-600 hover:from-purple-700 hover:to-teal-700 disabled:from-gray-300 disabled:to-gray-400 text-white font-semibold py-2 px-6 rounded-lg transition"
                    >
                      답안 제출
                    </button>
                  </div>
                ) : (
                  <div className="bg-gradient-to-r from-purple-50 to-teal-50 rounded-xl p-4 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm text-gray-600">자동 채점 결과</p>
                      <p className="text-2xl font-bold text-purple-700">
                        {autoGradedCorrect} / {autoGradedTotal} 정답
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleRetakeQuiz}
                        className="bg-white hover:bg-gray-50 border-2 border-gray-300 text-gray-600 font-semibold py-2 px-5 rounded-lg transition"
                      >
                        종료
                      </button>
                      <button
                        onClick={handleGenerateQuiz}
                        className="bg-white hover:bg-gray-50 border-2 border-purple-300 text-purple-700 font-semibold py-2 px-5 rounded-lg transition"
                      >
                        🔄 다시 풀기
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* 댓글 섹션 (수강생 전용) */}
        {isEnrolled && (
          <div className="mt-10 bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-1">댓글</h2>
            <p className="text-sm text-gray-500 mb-5">강좌 내용에 대한 질문이나 의견을 자유롭게 남겨보세요</p>

            <div className="mb-6">
              <textarea
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                placeholder="댓글을 입력하세요"
                rows={3}
                maxLength={500}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none resize-none transition"
              />
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-gray-400">{commentInput.length}/500</span>
                <button
                  onClick={handleAddComment}
                  disabled={posting || !commentInput.trim()}
                  className="bg-gradient-to-r from-purple-600 to-teal-600 hover:from-purple-700 hover:to-teal-700 disabled:from-gray-300 disabled:to-gray-400 text-white font-semibold py-2 px-5 rounded-lg transition"
                >
                  {posting ? '작성 중...' : '댓글 작성'}
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {comments.length === 0 ? (
                <p className="text-center py-8 text-gray-400 text-sm">아직 댓글이 없습니다. 첫 댓글을 남겨보세요!</p>
              ) : (
                comments.map(c => (
                  <div key={c.id} className="flex gap-3 p-4 bg-gray-50 rounded-xl">
                    <div className="flex-grow min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-gray-900 text-sm">{c.authorName}</span>
                        <span className="text-xs text-gray-400">
                          {c.createdAt?.toDate ? new Date(c.createdAt.toDate()).toLocaleString('ko-KR') : ''}
                        </span>
                      </div>
                      <p className="text-gray-700 text-sm whitespace-pre-wrap break-words">{c.content}</p>
                    </div>
                    {isAdmin && (
                      <button
                        onClick={() => handleDeleteComment(c.id)}
                        className="text-red-500 hover:text-red-700 text-xs font-medium self-start whitespace-nowrap"
                      >
                        삭제
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
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
