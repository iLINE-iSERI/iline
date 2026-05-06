'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AuthGuard from '@/components/auth/AuthGuard';
import { useAuth } from '@/lib/hooks/useAuth';
import {
  getOfflineCourse, getCourseApplications, updateApplicationStatus, awardPoints,
} from '@/lib/firebase/firestore';
import type { OfflineCourse, OfflineApplication, OfflineApplicationStatus } from '@/lib/types';

const STATUS_LABEL: Record<OfflineApplicationStatus, string> = {
  pending: '대기', approved: '승인', rejected: '거절', completed: '수료',
};

const STATUS_STYLE: Record<OfflineApplicationStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  completed: 'bg-blue-100 text-blue-700',
};

interface Props { params: { id: string } }

function ApplicantsContent({ courseId }: { courseId: string }) {
  const { user, userProfile, loading: authLoading } = useAuth();
  const router = useRouter();
  const [course, setCourse] = useState<OfflineCourse | null>(null);
  const [applications, setApplications] = useState<OfflineApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!userProfile || userProfile.role !== 'admin') {
      router.push('/dashboard');
      return;
    }
    Promise.all([
      getOfflineCourse(courseId),
      getCourseApplications(courseId),
    ]).then(([c, apps]) => {
      setCourse(c);
      setApplications(apps);
    }).finally(() => setLoading(false));
  }, [authLoading, userProfile, router, courseId]);

  const handleUpdate = async (app: OfflineApplication, newStatus: OfflineApplicationStatus) => {
    if (!user?.uid) return;
    const action = STATUS_LABEL[newStatus];
    const extraNote = newStatus === 'completed' ? '\n\n수료 처리 시 학생에게 1,000 그뤠잇이 적립됩니다 (강좌당 1회).' : '';
    if (!confirm(`${app.userName}님을 "${action}" 처리하시겠습니까?${extraNote}`)) return;

    setUpdating(app.id);
    try {
      await updateApplicationStatus(app.id, newStatus, user.uid);
      if (newStatus === 'completed') {
        await awardPoints(
          app.userId,
          '오프라인-교육-신청',
          `${course?.title || '오프라인 강좌'} 수료`,
          { dedupKey: app.courseId }
        );
      }
      setApplications(prev => prev.map(a => a.id === app.id ? { ...a, status: newStatus } : a));
    } catch (e) {
      alert('처리 실패');
    } finally {
      setUpdating(null);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-24 bg-gray-200 rounded-xl" />)}
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

  // 통계
  const counts = {
    pending: applications.filter(a => a.status === 'pending').length,
    approved: applications.filter(a => a.status === 'approved').length,
    rejected: applications.filter(a => a.status === 'rejected').length,
    completed: applications.filter(a => a.status === 'completed').length,
  };

  // 정렬: 대기 → 승인 → 수료 → 거절
  const order: Record<OfflineApplicationStatus, number> = { pending: 0, approved: 1, completed: 2, rejected: 3 };
  const sorted = [...applications].sort((a, b) => order[a.status] - order[b.status]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <button onClick={() => router.push('/admin/offline-courses')} className="text-purple-600 hover:text-purple-700 font-semibold mb-6">
        ← 강좌 목록
      </button>

      <h1 className="text-3xl font-bold text-gray-900 mb-1">신청자 관리</h1>
      <p className="text-gray-600 font-medium mb-1">{course.title}</p>
      <p className="text-sm text-gray-400 mb-6">
        📅 {course.startDate} ~ {course.endDate} · 📍 {course.location}
      </p>

      {/* 통계 카드 */}
      <div className="grid grid-cols-4 gap-3 mb-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-center">
          <p className="text-xs text-yellow-700 font-medium mb-1">대기</p>
          <p className="text-2xl font-bold text-yellow-800">{counts.pending}</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
          <p className="text-xs text-green-700 font-medium mb-1">승인</p>
          <p className="text-2xl font-bold text-green-800">{counts.approved}</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
          <p className="text-xs text-blue-700 font-medium mb-1">수료</p>
          <p className="text-2xl font-bold text-blue-800">{counts.completed}</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
          <p className="text-xs text-red-700 font-medium mb-1">거절</p>
          <p className="text-2xl font-bold text-red-800">{counts.rejected}</p>
        </div>
      </div>

      {/* 신청자 목록 */}
      {applications.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-200 text-gray-400">
          아직 신청자가 없습니다
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map(app => (
            <div key={app.id} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                <div className="flex-grow min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="font-bold text-gray-900">{app.userName}</span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_STYLE[app.status]}`}>
                      {STATUS_LABEL[app.status]}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 space-y-0.5">
                    {app.userPhone && <div>📞 {app.userPhone}</div>}
                    {app.userEmail && <div>✉️ {app.userEmail}</div>}
                    <div>🕐 신청: {app.appliedAt?.toDate ? new Date(app.appliedAt.toDate()).toLocaleString('ko-KR') : '-'}</div>
                    {app.decidedAt && (
                      <div>✅ 처리: {app.decidedAt?.toDate ? new Date(app.decidedAt.toDate()).toLocaleString('ko-KR') : '-'}</div>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 flex-shrink-0">
                  {app.status !== 'approved' && (
                    <button
                      onClick={() => handleUpdate(app, 'approved')}
                      disabled={updating === app.id}
                      className="text-xs font-medium px-3 py-1.5 rounded-lg bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 disabled:opacity-50 transition"
                    >
                      승인
                    </button>
                  )}
                  {app.status !== 'rejected' && (
                    <button
                      onClick={() => handleUpdate(app, 'rejected')}
                      disabled={updating === app.id}
                      className="text-xs font-medium px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 disabled:opacity-50 transition"
                    >
                      거절
                    </button>
                  )}
                  {app.status !== 'completed' && (
                    <button
                      onClick={() => handleUpdate(app, 'completed')}
                      disabled={updating === app.id}
                      className="text-xs font-medium px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 disabled:opacity-50 transition"
                    >
                      수료 처리
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ApplicantsPage({ params }: Props) {
  return (
    <AuthGuard>
      <ApplicantsContent courseId={params.id} />
    </AuthGuard>
  );
}
