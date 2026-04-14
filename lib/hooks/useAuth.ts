'use client'

// 인증 상태 관리 커스텀 훅
import { useState, useEffect } from 'react'
import { User } from 'firebase/auth'
import { onAuthChange, logOut } from '@/lib/firebase/auth'
import { getUserProfile } from '@/lib/firebase/firestore'
import type { UserProfile } from '@/lib/types'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      setUser(firebaseUser)

      if (firebaseUser) {
        try {
          const profile = await getUserProfile(firebaseUser.uid)
          setUserProfile(profile)
        } catch (error) {
          console.error('프로필 로드 에러:', error)
          setUserProfile(null)
        }
      } else {
        setUserProfile(null)
      }

      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const logout = async () => {
    try {
      await logOut()
    } catch (error) {
      console.error('로그아웃 에러:', error)
      throw error
    }
  }

  return { user, userProfile, loading, logout }
}
