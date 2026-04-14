'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  // 인증 상태 확인
  const { user, loading } = useAuth();
  const router = useRouter();

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (!user) {
    router.push('/login');
    return null;
  }

  return <>{children}</>;
}
