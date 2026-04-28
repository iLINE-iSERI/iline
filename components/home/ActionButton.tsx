'use client'

import Link from 'next/link'
import { useAuth } from '@/lib/hooks/useAuth'

export function HeroButtons() {
  const { user, loading } = useAuth()
  const target = user ? '/dashboard' : '/signup'
  const loginTarget = user ? '/dashboard' : '/login'

  if (loading) return null

  return (
    <div className="flex flex-col sm:flex-row gap-4 justify-center">
      <Link href={target} className="group relative bg-white text-teal-700 px-8 py-4 rounded-2xl font-bold text-lg hover:bg-teal-50 transition-all hover:scale-105 hover:shadow-2xl shadow-lg">
        {user ? '대시보드로 이동' : '무료로 시작하기'}
        <span className="inline-block ml-2 transition-transform group-hover:translate-x-1">&rarr;</span>
      </Link>
      <Link href={user ? '/courses' : '/courses'} className="glass-dark text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-white/20 transition-all">
        강의 둘러보기
      </Link>
    </div>
  )
}

export function CtaButton() {
  const { user, loading } = useAuth()
  if (loading) return null

  return (
    <Link href={user ? '/dashboard' : '/signup'} className="inline-flex items-center gap-2 bg-white text-teal-700 px-10 py-4 rounded-2xl font-bold text-lg hover:bg-teal-50 transition-all hover:scale-105 shadow-2xl">
      {user ? '대시보드로 이동' : '무료 회원가입'}
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
      </svg>
    </Link>
  )
}
