// TypeScript 타입 정의
import { Timestamp } from 'firebase/firestore'

// 사용자 프로필
export interface UserProfile {
  uid: string
  email: string
  name: string
  role: 'student' | 'teacher' | 'admin'
  group: string
  birthDate: string
  createdAt: Timestamp
  photoURL?: string
}

// 카테고리
export interface Category {
  id: string
  name: string
  slug: string
  order: number
  createdAt: Timestamp
}

// 강의
export interface Course {
  id: string
  title: string
  description: string
  youtubeUrl: string
  thumbnailUrl: string
  category: string
  order: number
  isPublished: boolean
  createdAt: Timestamp
  updatedAt: Timestamp
}

// 수강 등록
export interface Enrollment {
  id: string
  userId: string
  courseId: string
  enrolledAt: Timestamp
}

// 학습 진도
export interface Progress {
  userId: string
  courseId: string
  lastPosition: number
  totalDuration: number
  completed: boolean
  completedAt?: Timestamp
  updatedAt: Timestamp
}

// 게시글 (공지사항/자료실)
export interface Post {
  id: string
  type: 'notice' | 'resource'
  title: string
  content: string
  authorId: string
  attachmentUrl?: string
  createdAt: Timestamp
  updatedAt: Timestamp
}

// 학생 그룹
export interface StudentGroup {
  id: string
  name: string
  order: number
  createdAt: Timestamp
}
