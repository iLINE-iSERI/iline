// TypeScript 타입 정의
import { Timestamp } from 'firebase/firestore'

// 사용자 프로필
export interface UserProfile {
  uid: string
  email: string
  name: string
  role: 'student' | 'teacher' | 'admin'
  createdAt: Timestamp
  photoURL?: string
}

// 강의
export interface Course {
  id: string
  title: string
  description: string
  youtubeUrl: string
  thumbnailUrl: string
  category: 'ai-basic' | 'ai-ethics' | 'coding'
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
  watchedSeconds: number
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
