'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AuthGuard from '@/components/auth/AuthGuard';
import { useAuth } from '@/lib/hooks/useAuth';
import {
  getOfflineCourse, getMyApplicationForCourse, applyOfflineCourse,
} from '@/lib/firebase/firestore';
import type { OfflineCourse, OfflineApplication, OfflineApplicationStatus } from '@/lib/types';

const STATUS_LABEL: Record<OfflineApplicationStatus, string> = {
  pending: '승인 대기 중',
  approved: '승인 완료',
  rejected: '거절됨',
  completed: '수료',
};

const STATUS_STYLE: Record<OfflineApplicationStatus, string> = {
  pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  approved: 'bg-green-50 text-green-700 border-green-200',
  rejected: 'bg-red-50 text-red-700 border-red-200',
  completed: 'bg-blue-50 text-blue-700 border-blue-200',
};

const STATUS_DESC: Record<OfflineApplicationStatus, string> = {
  pending: '신청이 접수되었어요. 관리자 승인을 기다리는 중입니다.',
  approved: '신청이 승인되었습니다. 일정에 맞춰 참석해주세요.',
  rejected: '신청이 거절되었습니다. 관리자에게 문의해주세요.',
  completed: '수료가 확정되었습니다. 수료증을 확인해보세요.',
};

interface Props { params: { id: string } }

function OfflineCourseDetailContent({ courseId }: { courseId: string }) {
  const { user, userProfile } = useAuth();
  const router = useRouter();
  const [course, setCourse] = useState<OfflineCourse | null>(null);
  const [myApp, setMyApp] = useState<OfflineApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    if (!user?.uid || !courseId) return;
    Promise.all([
      getOfflineCourse(courseId),
      getMyApplicationForCourse(user.uid, courseId),
    ])
      .then(([c, app]) => {
        setCourse(c);
        setMyApp(app);
      })
      .finally(() => setLoading(false));
  }, [user?.uid, courseId]);

  const handleApply = async () => {
    if (!user?.uid || !course || !userProfile) return;
    const phoneInfo = userProfile.phone ? `\n연락처: ${userProfile.phone}` : '\n⚠️ 연락처가 등록되지 않았습니다 (마이페이지에서 등록 권장)';
    if (!confirm(`이 강좌에 신청하시겠습니까?\n\n강좌: ${course.title}\n이름: ${userProfile.name}${phoneInfo}\n\n관리자 승인 후 확정됩니다.`)) return;

    setApplying(true);
    try {
      await applyOfflineCourse({
        userId: user.uid,
        userName: userProfile.name,
        userPhone: userProfile.phone || '',
        userEmail: userProfile.email || user.email || '',
        courseId: course.id,
        courseTitle: course.title,
      });
      const newApp = await getMyApplicationForCourse(user.uid, courseId);
      setMyApp(newApp);
      alert('신청이 접수되었습니다. 관리자 승인을 기다려주세요.');
    } catch (e) {
      alert('신청에 실패했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-72 bg-gray-200 rounded-2xl" />
          <div className="h-8 bg-gray-200 rounded w-1/2" />
          <div className="h-32 bg-gray-200 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <p className="text-gray-600">강좌를 찾을 수 없습니다</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <button onClick={() => router.back()} className="text-purple-600 hover:text-purple-700 font-semibold mb-6">
        ← 돌아가기
      </button>

      {/* 포스터 */}
      {course.posterUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={course.posterUrl} alt={course.title} className="w-full h-64 sm:h-80 object-cover rounded-2xl mb-6" />
      ) : (
        <div className="w-full h-64 sm:h-80 bg-gradient-to-br from-purple-100 to-teal-100 rounded-2xl mb-6 flex items-center justify-center">
          <span className="text-6xl opacity-60">📚</span>
        </div>
      )}

      {/* 제목 + 상태 */}
      <h1 className="text-3xl font-bold text-gray-900 mb-3">{course.title}</h1>
      {!course.isOpen && (
        <div className="mb-4 p-3 bg-gray-100 text-gray-600 rounded-xl text-sm">
          현재 신청을 받지 않습니다
        </div>
      )}

      {/* 상세 정보 */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-6 space-y-2 text-sm">
        <div className="flex items-center gap-2"><span className="font-semibold text-gray-700 w-20">📅 기간</span><span className="text-gray-900">{course.startDate} ~ {course.endDate}</span></div>
        <div className="flex items-center gap-2"><span className="font-semibold text-gray-700 w-20">📍 장소</span><span className="text-gray-900">{course.location}</span></div>
        {course.instructor && <div className="flex items-center gap-2"><span className="font-semibold text-gray-700 w-20">👤 강사</span><span className="text-gray-900">{course.instructor}</span></div>}
        <div className="flex items-center gap-2"><span className="font-semibold text-gray-700 w-20">👥 정원</span><span className="text-gray-900">{course.capacity > 0 ? `${course.capacity}명` : '제한 없음'}</span></div>
      </div>

      {/* 교육 내용 */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-6">
        <h2 className="font-bold text-gray-900 mb-3">교육 내용</h2>
        <p className="text-gray-700 whitespace-pre-wrap">{course.content}</p>
      </div>

      {/* 신청/상태 */}
      {myApp ? (
        <div className={`rounded-2xl border p-5 ${STATUS_STYLE[myApp.status]}`}>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-bold text-lg">{STATUS_LABEL[myApp.status]}</span>
          </div>
          <p className="text-sm">{STATUS_DESC[myApp.status]}</p>
          {myApp.status === 'completed' && (
            <button
              onClick={() => router.push(`/my/certificates/${course.id}`)}
              className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-5 rounded-lg transition"
            >
              🏆 수료증 보기
            </button>
          )}
        </div>
      ) : course.isOpen ? (
        <button
          onClick={handleApply}
          disabled={applying}
          className="w-full bg-gradient-to-r from-purple-600 to-teal-600 hover:from-purple-700 hover:to-teal-700 disabled:from-gray-300 disabled:to-gray-400 text-white font-semibold py-4 px-6 rounded-2xl text-lg transition-all hover:shadow-lg hover:shadow-purple-200"
        >
          {applying ? '신청 중...' : '🎓 신청하기'}
        </button>
      ) : (
        <button disabled className="w-full bg-gray-200 text-gray-500 font-semibold py-4 px-6 rounded-2xl text-lg cursor-not-allowed">
          신청 마감
        </button>
      )}
    </div>
  );
}

export default function OfflineCourseDetailPage({ params }: Props) {
  return (
    <AuthGuard>
      <OfflineCourseDetailContent courseId={params.id} />
    </AuthGuard>
  );
}
