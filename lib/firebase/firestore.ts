// Firestore DB 함수 모음
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore'
import { db } from './config'
import type { Course, UserProfile, Enrollment, Progress, Post } from '@/lib/types'

// ===== Users =====
export async function createUserProfile(uid: string, data: Omit<UserProfile, 'createdAt'>) {
  try {
    await setDoc(doc(db, 'users', uid), {
      ...data,
      createdAt: serverTimestamp(),
    })
  } catch (error) {
    console.error('사용자 프로필 생성 에러:', error)
    throw error
  }
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    const docSnap = await getDoc(doc(db, 'users', uid))
    return docSnap.exists() ? (docSnap.data() as UserProfile) : null
  } catch (error) {
    console.error('사용자 프로필 조회 에러:', error)
    throw error
  }
}

export async function updateUserProfile(uid: string, data: Partial<UserProfile>) {
  try {
    await updateDoc(doc(db, 'users', uid), { ...data })
  } catch (error) {
    console.error('사용자 프로필 업데이트 에러:', error)
    throw error
  }
}

// ===== Courses =====
export async function getCourses(): Promise<Course[]> {
  try {
    const q = query(
      collection(db, 'courses'),
      where('isPublished', '==', true),
      orderBy('order', 'asc')
    )
    const snapshot = await getDocs(q)
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Course))
  } catch (error) {
    console.error('강의 목록 조회 에러:', error)
    throw error
  }
}

export async function getCourse(courseId: string): Promise<Course | null> {
  try {
    const docSnap = await getDoc(doc(db, 'courses', courseId))
    return docSnap.exists() ? ({ id: docSnap.id, ...docSnap.data() } as Course) : null
  } catch (error) {
    console.error('강의 조회 에러:', error)
    throw error
  }
}

export async function createCourse(data: Omit<Course, 'id' | 'createdAt' | 'updatedAt'>) {
  try {
    const docRef = doc(collection(db, 'courses'))
    await setDoc(docRef, {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    return docRef.id
  } catch (error) {
    console.error('강의 생성 에러:', error)
    throw error
  }
}

export async function updateCourse(courseId: string, data: Partial<Course>) {
  try {
    await updateDoc(doc(db, 'courses', courseId), {
      ...data,
      updatedAt: serverTimestamp(),
    })
  } catch (error) {
    console.error('강의 업데이트 에러:', error)
    throw error
  }
}

export async function deleteCourse(courseId: string) {
  try {
    await deleteDoc(doc(db, 'courses', courseId))
  } catch (error) {
    console.error('강의 삭제 에러:', error)
    throw error
  }
}

// ===== Enrollments =====
export async function enrollCourse(userId: string, courseId: string) {
  try {
    const enrollmentId = `${userId}_${courseId}`
    await setDoc(doc(db, 'enrollments', enrollmentId), {
      userId,
      courseId,
      enrolledAt: serverTimestamp(),
    })
  } catch (error) {
    console.error('수강 등록 에러:', error)
    throw error
  }
}

export async function getUserEnrollments(userId: string): Promise<Enrollment[]> {
  try {
    const q = query(collection(db, 'enrollments'), where('userId', '==', userId))
    const snapshot = await getDocs(q)
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Enrollment))
  } catch (error) {
    console.error('수강 목록 조회 에러:', error)
    throw error
  }
}

// ===== Progress =====
export async function updateProgress(userId: string, courseId: string, data: Partial<Omit<Progress, 'userId' | 'courseId'>>) {
  try {
    const progressId = `${userId}_${courseId}`
    const updateData: Record<string, unknown> = {
      ...data,
      userId,
      courseId,
      updatedAt: serverTimestamp(),
    }
    if (data.completed) {
      updateData.completedAt = serverTimestamp()
    }
    await setDoc(doc(db, 'progress', progressId), updateData, { merge: true })
  } catch (error) {
    console.error('학습 진도 업데이트 에러:', error)
    throw error
  }
}

export async function getProgress(userId: string, courseId: string): Promise<Progress | null> {
  try {
    const progressId = `${userId}_${courseId}`
    const docSnap = await getDoc(doc(db, 'progress', progressId))
    return docSnap.exists() ? (docSnap.data() as Progress) : null
  } catch (error) {
    console.error('학습 진도 조회 에러:', error)
    throw error
  }
}

// ===== Posts =====
export async function getPosts(type: 'notice' | 'resource'): Promise<Post[]> {
  try {
    const q = query(
      collection(db, 'posts'),
      where('type', '==', type),
      orderBy('createdAt', 'desc')
    )
    const snapshot = await getDocs(q)
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Post))
  } catch (error) {
    console.error('게시글 목록 조회 에러:', error)
    throw error
  }
}

export async function createPost(data: Omit<Post, 'id' | 'createdAt' | 'updatedAt'>) {
  try {
    const docRef = doc(collection(db, 'posts'))
    await setDoc(docRef, {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    return docRef.id
  } catch (error) {
    console.error('게시글 생성 에러:', error)
    throw error
  }
}
