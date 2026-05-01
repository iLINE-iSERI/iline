import { Timestamp } from 'firebase/firestore'

export interface UserProfile {
  uid: string
  email: string
  name: string
  displayName: string
  role: 'student' | 'teacher' | 'admin'
  group: string
  totalPoints: number
  photoURL?: string
  birthDate?: string
  phone?: string
  school?: string
  grade?: string
  createdAt: Timestamp
  [key: string]: any
}

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

export interface Enrollment {
  id: string
  userId: string
  courseId: string
  enrolledAt: Timestamp
}

export interface Progress {
  userId: string
  courseId: string
  watchedSeconds: number
  lastPosition: number
  totalDuration: number
  completed: boolean
  completedAt?: Timestamp
  updatedAt: Timestamp
}
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

export interface PointRule {
  id: string
  action: string
  label: string
  points: number
  isActive: boolean
}

export interface PointHistory {
  id: string
  userId: string
  action: string
  label: string
  description?: string
  points: number
  createdAt: Timestamp
}

export interface QnA {
  id: string
  title: string
  content: string
  authorId: string
  authorName: string
  answer?: string
  answeredAt?: Timestamp
  createdAt: Timestamp
}

export interface Category {
  id: string
  name: string
  slug: string
  order: number
}
export interface StudentGroup {
  id: string
  name: string
  order: number
  createdAt: Timestamp
}

export interface Reward {
  id: string
  name: string
  description: string
  imageUrl?: string
  requiredPoints: number
  stock: number
  isActive: boolean
  createdAt: Timestamp
}

export interface RewardClaim {
  id: string
  userId: string
  userName: string
  rewardId: string
  rewardName: string
  points: number
  status: 'pending' | 'completed' | 'rejected'
  createdAt: Timestamp
}
