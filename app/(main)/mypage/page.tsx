'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import AuthGuard from '@/components/auth/AuthGuard';
import { getUserEnrollments, getProgress } from '@/lib/firebase/firestore';

function MypageContent() {
  const { user, userProfile, logout } = useAuth();
  const [enrollmentCount, setEnrollmentCount] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [totalWatchedSeconds, setTotalWatchedSeconds] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) return;
    const loadStats = async () => {
      try {
        const enrollments = await getUserEnrollments(user.uid);
        setEnrollmentCount(enrollments.length);
        let completed = 0;
        let totalSeconds = 0;
        for (const enrollment of enrollments) {
          const progress = await getProgress(user.uid, enrollment.courseId);
          if (progress?.completed) completed++;
          totalSeconds += progress?.lastPosition || 0;
        }
        setCompletedCount(completed);
        setTotalWatchedSeconds(totalSeconds);
      } catch (error) {
        console.error('통계 로드 실패:', error);
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, [user?.uid]);

  const roleLabel: Record<string, string> = {
    'student': '학생',
    'teacher': '강사',
    'admin': '관리자',
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('로그아웃 실패:', error);
    }
  };

  const totalHours = Math.floor(totalWatchedSeconds / 3600);
  const totalMinutes = Math.floor((totalWatchedSeconds % 3600) / 60);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-8">
          <div className="h-32 bg-gray-200 rounded-lg"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900">마이페이지</h1>
      </div>

      {/* 프로필 정보 */}
      <div className="bg-white rounded-lg shadow p-8 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{userProfile?.name}</h2>
            <p className="text-gray-600 mb-1">{userProfile?.email}</p>
            <span className="inline-block bg-teal-100 text-teal-800 text-sm font-semibold px-3 py-1 rounded-full">
              {roleLabel[userProfile?.role || 'student']}
            </span>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg transition"
        >
          로그아웃
        </button>
      </div>

      {/* 학습 통계 */}
      <div className="mb-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-6">학습 통계</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-teal-50 rounded-lg p-6 border border-teal-200">
            <div className="text-sm font-semibold text-teal-600 mb-2">등록된 강좌</div>
            <div className="text-3xl font-bold text-gray-900">{enrollmentCount}</div>
          </div>
          <div className="bg-green-50 rounded-lg p-6 border border-green-200">
            <div className="text-sm font-semibold text-green-600 mb-2">완료된 강좌</div>
            <div className="text-3xl font-bold text-gray-900">{completedCount}</div>
          </div>
          <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
            <div className="text-sm font-semibold text-blue-600 mb-2">총 학습 시간</div>
            <div className="text-3xl font-bold text-gray-900">
              {totalHours > 0 ? `${totalHours}시간 ` : ''}{totalMinutes}분
            </div>
          </div>
        </div>
      </div>

      {/* 계정 정보 */}
      <div className="bg-white rounded-lg shadow p-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-6">계정 정보</h3>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">이름</span>
            <span className="font-semibold text-gray-900">{userProfile?.name}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">이메일</span>
            <span className="font-semibold text-gray-900">{userProfile?.email}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">역할</span>
            <span className="font-semibold text-gray-900">
              {roleLabel[userProfile?.role || 'student']}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">가입일</span>
            <span className="font-semibold text-gray-900">
              {userProfile?.createdAt
                ? new Date(userProfile.createdAt.toDate()).toLocaleDateString('ko-KR')
                : '-'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MyPage() {
  return (
    <AuthGuard>
      <MypageContent />
    </AuthGuard>
  );
}
