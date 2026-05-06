'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AuthGuard from '@/components/auth/AuthGuard';
import { useAuth } from '@/lib/hooks/useAuth';
import { getUserOfflineApplications } from '@/lib/firebase/firestore';
import type { OfflineApplication } from '@/lib/types';

function CertificatesListContent() {
  const { user } = useAuth();
  const [completed, setCompleted] = useState<OfflineApplication[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) return;
    getUserOfflineApplications(user.uid)
      .then(apps => setCompleted(apps.filter(a => a.status === 'completed')))
      .finally(() => setLoading(false));
  }, [user?.uid]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-24 bg-gray-200 rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">내 수료증</h1>
      <p className="text-gray-500 mb-8">수료한 오프라인 강좌의 수료증을 확인하고 다운로드할 수 있습니다</p>

      {completed.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-200 text-gray-400">
          <p className="text-lg font-medium mb-2">아직 수료한 강좌가 없습니다</p>
          <Link href="/offline-courses" className="text-purple-600 hover:text-purple-700 text-sm font-medium">
            오프라인 강좌 둘러보기 →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {completed.map(app => (
            <Link
              key={app.id}
              href={`/my/certificates/${app.courseId}`}
              className="block bg-white rounded-2xl border border-gray-200 hover:border-purple-300 hover:shadow-md transition p-5"
            >
              <div className="flex items-center gap-4">
                <div className="text-4xl">🏆</div>
                <div className="flex-grow">
                  <h3 className="font-bold text-gray-900 mb-1">{app.courseTitle}</h3>
                  <p className="text-xs text-gray-500">
                    수료일: {app.certificateIssuedAt?.toDate ? new Date(app.certificateIssuedAt.toDate()).toLocaleDateString('ko-KR') : '-'}
                  </p>
                </div>
                <span className="text-purple-600 text-sm font-medium">수료증 보기 →</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function CertificatesListPage() {
  return (
    <AuthGuard>
      <CertificatesListContent />
    </AuthGuard>
  );
}
