'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 관리자 권한 확인
  const { user, userProfile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && userProfile?.role !== 'admin') {
      router.push('/dashboard');
    }
  }, [loading, userProfile?.role, router]);

  if (loading || userProfile?.role !== 'admin') {
    return <LoadingSkeleton />;
  }

  return <>{children}</>;
}
