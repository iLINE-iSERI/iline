'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/hooks/useAuth';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, userProfile, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && userProfile?.role !== 'admin') {
      router.push('/dashboard');
    }
  }, [loading, userProfile?.role, router]);

  if (loading || userProfile?.role !== 'admin') {
    return <LoadingSkeleton />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 관리자 네비게이션 바 */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            {/* 왼쪽: 홈 버튼 */}
            <Link
              href="/"
              className="flex items-center gap-2 text-gray-600 hover:text-teal-600 transition-colors text-sm font-medium"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0h4" />
              </svg>
              홈으로
            </Link>

            {/* 가운데: 관리자 메뉴 */}
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-400 mr-2 hidden sm:inline">관리자</span>
              <Link
                href="/admin/courses"
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                  pathname === '/admin/courses'
                    ? 'bg-gradient-to-r from-teal-500 to-blue-500 text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                강좌관리
              </Link>
              <Link
                href="/admin/groups"
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                  pathname === '/admin/groups'
                    ? 'bg-gradient-to-r from-teal-500 to-blue-500 text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                그룹관리
              </Link>
            </div>

            {/* 오른쪽: 대시보드 링크 */}
            <Link
              href="/dashboard"
              className="flex items-center gap-1 text-gray-600 hover:text-teal-600 transition-colors text-sm font-medium"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              대시보드
            </Link>
          </div>
        </div>
      </nav>

      {/* 페이지 내용 */}
      {children}
    </div>
  );
}
