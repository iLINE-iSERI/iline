'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
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
    <header className="sticky top-0 z-50 glass border-b border-white/20">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2 group">
              <Image src="/logo.png" alt="iLINE" width={120} height={40} className="h-10 w-auto" />
            </Link>
          </div>
          <div className="hidden md:flex items-center space-x-1">
            {user && (
              <>
                <Link href="/dashboard" className="text-gray-600 hover:text-purple-600 hover:bg-purple-50 px-4 py-2 rounded-xl text-sm font-medium transition-all">대시보드</Link>
                <Link href="/courses" className="text-gray-600 hover:text-purple-600 hover:bg-purple-50 px-4 py-2 rounded-xl text-sm font-medium transition-all">강의</Link>
                <Link href="/offline-courses" className="text-gray-600 hover:text-purple-600 hover:bg-purple-50 px-4 py-2 rounded-xl text-sm font-medium transition-all">오프라인</Link>
                <Link href="/board/notice" className="text-gray-600 hover:text-purple-600 hover:bg-purple-50 px-4 py-2 rounded-xl text-sm font-medium transition-all">공지사항</Link>
                <Link href="/qna" className="text-gray-600 hover:text-purple-600 hover:bg-purple-50 px-4 py-2 rounded-xl text-sm font-medium transition-all">Q&amp;A</Link>
                <Link href="/board/resource" className="text-gray-600 hover:text-purple-600 hover:bg-purple-50 px-4 py-2 rounded-xl text-sm font-medium transition-all">자료실</Link>
              </>
            )}
          </div>
          <div className="flex items-center space-x-3">
            {loading ? (
              <div className="w-8 h-8 bg-purple-100 rounded-full animate-pulse" />
            ) : user ? (
              <div className="flex items-center space-x-2">
                <Link href="/mypage" className="text-sm text-gray-600 hover:text-purple-600 font-medium transition-colors">{profile?.name || user.email}</Link>
                {profile?.role === 'admin' && (
                  <>
                    <Link href="/admin/courses" className="text-xs bg-gradient-to-r from-purple-600 to-teal-500 text-white px-3 py-1 rounded-full font-medium">강좌관리</Link>
                    <Link href="/admin/offline-courses" className="text-xs bg-gradient-to-r from-pink-500 to-purple-500 text-white px-3 py-1 rounded-full font-medium">오프라인</Link>
                    <Link href="/admin/certificate-settings" className="text-xs bg-gradient-to-r from-blue-500 to-purple-500 text-white px-3 py-1 rounded-full font-medium">수료증</Link>
                    <Link href="/admin/groups" className="text-xs bg-gradient-to-r from-teal-500 to-cyan-500 text-white px-3 py-1 rounded-full font-medium">그룹관리</Link>
                  </>
                )}
                <button onClick={handleLogout} className="text-sm text-gray-400 hover:text-gray-600 transition-colors">로그아웃</button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link href="/login" className="text-sm text-gray-600 hover:text-purple-600 font-medium transition-colors px-4 py-2">로그인</Link>
                <Link href="/signup" className="text-sm bg-gradient-to-r from-purple-600 to-purple-700 text-white px-5 py-2 rounded-xl font-semibold hover:shadow-lg hover:shadow-purple-200 transition-all hover:scale-105">회원가입</Link>
              </div>
            )}
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 rounded-xl hover:bg-purple-50 transition-colors">
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
        {mobileMenuOpen && user && (
          <div className="md:hidden py-3 border-t border-purple-100">
            <div className="flex flex-col space-y-1">
              <Link href="/dashboard" className="px-4 py-3 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-xl font-medium transition-all">대시보드</Link>
              <Link href="/courses" className="px-4 py-3 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-xl font-medium transition-all">강의</Link>
              <Link href="/offline-courses" className="px-4 py-3 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-xl font-medium transition-all">오프라인</Link>
              <Link href="/board/notice" className="px-4 py-3 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-xl font-medium transition-all">공지사항</Link>
              <Link href="/qna" className="px-4 py-3 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-xl font-medium transition-all">Q&amp;A</Link>
              <Link href="/board/resource" className="px-4 py-3 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-xl font-medium transition-all">자료실</Link>
              <Link href="/mypage" className="px-4 py-3 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-xl font-medium transition-all">마이페이지</Link>
            </div>
          </div>
        )}
      </nav>
    </header>
  )
}
