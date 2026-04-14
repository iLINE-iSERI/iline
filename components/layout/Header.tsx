'use client'

// 상단 네비게이션 헤더
import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/hooks/useAuth'
import { logOut } from '@/lib/firebase/auth'

export default function Header() {
  const { user, userProfile: profile, loading } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = async () => {
    try {
      await logOut()
    } catch (error) {
      console.error('로그아웃 에러:', error)
    }
  }

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* 로고 */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <span className="text-2xl font-bold text-blue-600">iLINE</span>
              <span className="hidden sm:block text-sm text-gray-500">지능소프트웨어교육연구소</span>
            </Link>
          </div>

          {/* 데스크톱 네비게이션 */}
          <div className="hidden md:flex items-center space-x-8">
            {user && (
              <>
                <Link href="/dashboard" className="text-gray-700 hover:text-blue-600 transition-colors">
                  대시보드
                </Link>
                <Link href="/courses" className="text-gray-700 hover:text-blue-600 transition-colors">
                  강의
                </Link>
                <Link href="/board/notice" className="text-gray-700 hover:text-blue-600 transition-colors">
                  공지사항
                </Link>
                <Link href="/board/resource" className="text-gray-700 hover:text-blue-600 transition-colors">
                  자료실
                </Link>
              </>
            )}
          </div>

          {/* 사용자 메뉴 */}
          <div className="flex items-center space-x-4">
            {loading ? (
              <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
            ) : user ? (
              <div className="flex items-center space-x-3">
                <Link href="/mypage" className="text-sm text-gray-700 hover:text-blue-600">
                  {profile?.name || user.email}
                </Link>
                {profile?.role === 'admin' && (
                  <Link
                    href="/admin/courses"
                    className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded"
                  >
                    관리자
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
                >
                  로그아웃
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  href="/login"
                  className="text-sm text-gray-700 hover:text-blue-600 transition-colors"
                >
                  로그인
                </Link>
                <Link
                  href="/signup"
                  className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  회원가입
                </Link>
              </div>
            )}

            {/* 모바일 메뉴 버튼 */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* 모바일 메뉴 */}
        {mobileMenuOpen && user && (
          <div className="md:hidden py-3 border-t border-gray-200">
            <div className="flex flex-col space-y-2">
              <Link href="/dashboard" className="px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
                대시보드
              </Link>
              <Link href="/courses" className="px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
                강의
              </Link>
              <Link href="/board/notice" className="px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
                공지사항
              </Link>
              <Link href="/board/resource" className="px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
                자료실
              </Link>
              <Link href="/mypage" className="px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
                마이페이지
              </Link>
            </div>
          </div>
        )}
      </nav>
    </header>
  )
}
