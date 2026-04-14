// 인증 미들웨어 - 라우트 보호
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// 보호할 경로 패턴
const protectedRoutes = ['/dashboard', '/courses', '/board', '/mypage']
const adminRoutes = ['/admin']
const authRoutes = ['/login', '/signup']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Firebase Auth는 클라이언트에서 처리하므로
  // 미들웨어에서는 기본적인 라우트 제어만 수행
  // 실제 인증 체크는 클라이언트 컴포넌트에서 useAuth 훅으로 처리

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
