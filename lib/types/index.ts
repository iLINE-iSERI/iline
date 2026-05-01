import { Timestamp } from 'firebase/firestore'

export interface UserProfile {
  uid: string
  email: string
  name: string
  role: 'student' | 'teacher' | 'admin'
  group: string
  birthDate: string
  totalPoints: number
  createdAt: Timestamp
  photoURL?: string
}

export interface Category {
  id: string
  name: string
  slug: string
  order: number
  createdAt: Timestamp
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

export interface StudentGroup {
  id: string
  name: string
  order: number
  createdAt: Timestamp
}

export interface PointRule {
  id: string
  action: string
  name: string
  points: number
  isActive: boolean
  createdAt: Timestamp
}

export interface PointHistory {
  id: string
  userId: string
  action: string
  points: number
  description: string
  createdAt: Timestamp
}

// 보상 상품
export interface Reward {
  id: string
  name: string
  description: string
  imageUrl: string
  requiredPoints: number
  stock: number
  isActive: boolean
  createdAt: Timestamp
}

// 보상 교환 내역
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

// Q&A
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
