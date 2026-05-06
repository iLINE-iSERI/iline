import {
  collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc,
  query, where, orderBy, serverTimestamp, increment, limit,
} from 'firebase/firestore'
import { db } from './config'
import type { Course, UserProfile, Enrollment, Progress, Post, PointRule, PointHistory, QnA, Category, StudentGroup, Reward, RewardClaim } from '@/lib/types'

// ===== Users =====
export async function createUserProfile(uid: string, data: Omit<UserProfile, 'createdAt'>) {
  try {
    await setDoc(doc(db, 'users', uid), { ...data, createdAt: serverTimestamp() })
  } catch (error) { console.error('사용자 프로필 생성 에러:', error); throw error }
}
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    const docSnap = await getDoc(doc(db, 'users', uid))
    return docSnap.exists() ? (docSnap.data() as UserProfile) : null
  } catch (error) { console.error('사용자 프로필 조회 에러:', error); throw error }
}
export async function updateUserProfile(uid: string, data: Partial<UserProfile>) {
  try {
    await updateDoc(doc(db, 'users', uid), { ...data })
  } catch (error) { console.error('사용자 프로필 업데이트 에러:', error); throw error }
}

// ===== Courses =====
export async function getCourses(): Promise<Course[]> {
  try {
    const q = query(collection(db, 'courses'), where('isPublished', '==', true))
    const snapshot = await getDocs(q)
    const courses = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Course))
    return courses.sort((a, b) => (a.order || 0) - (b.order || 0))
  } catch (error) { console.error('강의 목록 조회 에러:', error); return [] }
}
export async function getAllCourses(): Promise<Course[]> {
  try {
    const q = query(collection(db, 'courses'), orderBy('order', 'asc'))
    const snapshot = await getDocs(q)
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Course))
  } catch (error) { console.error('전체 강의 목록 조회 에러:', error); return [] }
}
export async function getCourse(courseId: string): Promise<Course | null> {
  try {
    const docSnap = await getDoc(doc(db, 'courses', courseId))
    return docSnap.exists() ? ({ id: docSnap.id, ...docSnap.data() } as Course) : null
  } catch (error) { console.error('강의 조회 에러:', error); throw error }
}
export async function createCourse(data: Omit<Course, 'id' | 'createdAt' | 'updatedAt'>) {
  try {
    const docRef = doc(collection(db, 'courses'))
    await setDoc(docRef, { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() })
    return docRef.id
  } catch (error) { console.error('강의 생성 에러:', error); throw error }
}
export async function updateCourse(courseId: string, data: Partial<Course>) {
  try {
    await updateDoc(doc(db, 'courses', courseId), { ...data, updatedAt: serverTimestamp() })
  } catch (error) { console.error('강의 업데이트 에러:', error); throw error }
}
export async function deleteCourse(courseId: string) {
  try { await deleteDoc(doc(db, 'courses', courseId)) }
  catch (error) { console.error('강의 삭제 에러:', error); throw error }
}

// ===== Categories =====
export async function getCategories(): Promise<Category[]> {
  try {
    const q = query(collection(db, 'categories'), orderBy('order', 'asc'))
    const snapshot = await getDocs(q)
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Category))
  } catch (error) { console.error('카테고리 조회 에러:', error); return [] }
}
export async function createCategory(data: Omit<Category, 'id' | 'createdAt'>) {
  try {
    const docRef = doc(collection(db, 'categories'))
    await setDoc(docRef, { ...data, createdAt: serverTimestamp() })
    return docRef.id
  } catch (error) { console.error('카테고리 생성 에러:', error); throw error }
}
export async function updateCategory(categoryId: string, data: Partial<Category>) {
  try { await updateDoc(doc(db, 'categories', categoryId), { ...data }) }
  catch (error) { console.error('카테고리 업데이트 에러:', error); throw error }
}
export async function deleteCategory(categoryId: string) {
  try { await deleteDoc(doc(db, 'categories', categoryId)) }
  catch (error) { console.error('카테고리 삭제 에러:', error); throw error }
}

// ===== Enrollments =====
export async function enrollCourse(userId: string, courseId: string) {
  try {
    const enrollmentId = `${userId}_${courseId}`
    await setDoc(doc(db, 'enrollments', enrollmentId), { userId, courseId, enrolledAt: serverTimestamp() })
  } catch (error) { console.error('수강 등록 에러:', error); throw error }
}
export async function getUserEnrollments(userId: string): Promise<Enrollment[]> {
  try {
    const q = query(collection(db, 'enrollments'), where('userId', '==', userId))
    const snapshot = await getDocs(q)
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Enrollment))
  } catch (error) { console.error('수강 목록 조회 에러:', error); return [] }
}

// ===== Progress =====
export async function updateProgress(userId: string, courseId: string, data: Partial<Omit<Progress, 'userId' | 'courseId'>>) {
  try {
    const progressId = `${userId}_${courseId}`

    let alreadyCompleted = false
    if (data.completed === true) {
      const existing = await getDoc(doc(db, 'progress', progressId))
      alreadyCompleted = existing.exists() && existing.data()?.completed === true
    }

    const updateData: Record<string, unknown> = { ...data, userId, courseId, updatedAt: serverTimestamp() }
    if (data.completed) { updateData.completedAt = serverTimestamp() }
    await setDoc(doc(db, 'progress', progressId), updateData, { merge: true })

    if (data.completed === true && !alreadyCompleted) {
      await awardPoints(userId, 'course-complete', '강좌 수강 완료')
    }
  } catch (error) { console.error('학습 진도 업데이트 에러:', error); throw error }
}
export async function getProgress(userId: string, courseId: string): Promise<Progress | null> {
  try {
    const progressId = `${userId}_${courseId}`
    const docSnap = await getDoc(doc(db, 'progress', progressId))
    return docSnap.exists() ? (docSnap.data() as Progress) : null
  } catch (error) { console.error('학습 진도 조회 에러:', error); return null }
}

// ===== Posts =====
export async function getPosts(type: 'notice' | 'resource'): Promise<Post[]> {
  try {
    const q = query(collection(db, 'posts'), where('type', '==', type))
    const snapshot = await getDocs(q)
    const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Post))
    return items.sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0))
  } catch (error) { console.error('게시글 조회 에러:', error); return [] }
}
export async function createPost(data: Omit<Post, 'id' | 'createdAt' | 'updatedAt'>) {
  try {
    const docRef = doc(collection(db, 'posts'))
    await setDoc(docRef, { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() })
    return docRef.id
  } catch (error) { console.error('게시글 생성 에러:', error); throw error }
}

// ===== Groups =====
export async function getGroups(): Promise<StudentGroup[]> {
  try {
    const q = query(collection(db, 'groups'), orderBy('order', 'asc'))
    const snapshot = await getDocs(q)
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as StudentGroup))
  } catch (error) { console.error('그룹 조회 에러:', error); return [] }
}
export async function createGroup(data: Omit<StudentGroup, 'id' | 'createdAt'>) {
  try {
    const docRef = doc(collection(db, 'groups'))
    await setDoc(docRef, { ...data, createdAt: serverTimestamp() })
    return docRef.id
  } catch (error) { console.error('그룹 생성 에러:', error); throw error }
}
export async function updateGroup(groupId: string, data: Partial<StudentGroup>) {
  try { await updateDoc(doc(db, 'groups', groupId), { ...data }) }
  catch (error) { console.error('그룹 업데이트 에러:', error); throw error }
}
export async function deleteGroup(groupId: string) {
  try { await deleteDoc(doc(db, 'groups', groupId)) }
  catch (error) { console.error('그룹 삭제 에러:', error); throw error }
}

// ===== 그뤠잇 포인트 규칙 =====
export async function getPointRules(): Promise<PointRule[]> {
  try {
    const q = query(collection(db, 'pointRules'), orderBy('createdAt', 'asc'))
    const snapshot = await getDocs(q)
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as PointRule))
  } catch (error) { console.error('포인트 규칙 조회 에러:', error); return [] }
}
export async function createPointRule(data: Omit<PointRule, 'id' | 'createdAt'>) {
  try {
    const docRef = doc(collection(db, 'pointRules'))
    await setDoc(docRef, { ...data, createdAt: serverTimestamp() })
    return docRef.id
  } catch (error) { console.error('포인트 규칙 생성 에러:', error); throw error }
}
export async function updatePointRule(ruleId: string, data: Partial<PointRule>) {
  try { await updateDoc(doc(db, 'pointRules', ruleId), { ...data }) }
  catch (error) { console.error('포인트 규칙 업데이트 에러:', error); throw error }
}
export async function deletePointRule(ruleId: string) {
  try { await deleteDoc(doc(db, 'pointRules', ruleId)) }
  catch (error) { console.error('포인트 규칙 삭제 에러:', error); throw error }
}

// ===== 그뤠잇 포인트 부여 =====
export async function awardPoints(userId: string, action: string, description: string) {
  try {
    const rules = await getPointRules()
    const rule = rules.find(r => r.action === action && r.isActive)
    if (!rule) return 0
    if (action === 'daily-login') {
      const today = new Date().toISOString().split('T')[0]
      const checkId = `${userId}_${action}_${today}`
      const existing = await getDoc(doc(db, 'pointHistory', checkId))
      if (existing.exists()) return 0
      await setDoc(doc(db, 'pointHistory', checkId), {
        userId, action, points: rule.points, description, createdAt: serverTimestamp(),
      })
    } else {
      const docRef = doc(collection(db, 'pointHistory'))
      await setDoc(docRef, {
        userId, action, points: rule.points, description, createdAt: serverTimestamp(),
      })
    }
    await updateDoc(doc(db, 'users', userId), { totalPoints: increment(rule.points) })
    return rule.points
  } catch (error) { console.error('포인트 부여 에러:', error); return 0 }
}

export async function getUserPointHistory(userId: string): Promise<PointHistory[]> {
  try {
    const q = query(collection(db, 'pointHistory'), where('userId', '==', userId))
    const snapshot = await getDocs(q)
    const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as PointHistory))
    return items.sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0))
  } catch (error) { console.error('포인트 내역 조회 에러:', error); return [] }
}

export async function getLeaderboard(count: number = 20): Promise<UserProfile[]> {
  try {
    const q = query(collection(db, 'users'), orderBy('totalPoints', 'desc'), limit(count))
    const snapshot = await getDocs(q)
    return snapshot.docs.map((d) => (d.data() as UserProfile))
  } catch (error) { console.error('랭킹 조회 에러:', error); return [] }
}

// ===== 보상 상품 =====
export async function getRewards(): Promise<Reward[]> {
  try {
    const q = query(collection(db, 'rewards'), orderBy('createdAt', 'desc'))
    const snapshot = await getDocs(q)
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Reward))
  } catch (error) { console.error('보상 조회 에러:', error); return [] }
}
export async function createReward(data: Omit<Reward, 'id' | 'createdAt'>) {
  try {
    const docRef = doc(collection(db, 'rewards'))
    await setDoc(docRef, { ...data, createdAt: serverTimestamp() })
    return docRef.id
  } catch (error) { console.error('보상 생성 에러:', error); throw error }
}
export async function updateReward(rewardId: string, data: Partial<Reward>) {
  try { await updateDoc(doc(db, 'rewards', rewardId), { ...data }) }
  catch (error) { console.error('보상 업데이트 에러:', error); throw error }
}
export async function deleteReward(rewardId: string) {
  try { await deleteDoc(doc(db, 'rewards', rewardId)) }
  catch (error) { console.error('보상 삭제 에러:', error); throw error }
}

// 보상 교환 신청
export async function claimReward(userId: string, userName: string, reward: Reward): Promise<boolean> {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId))
    const userData = userDoc.data() as UserProfile
    if ((userData.totalPoints || 0) < reward.requiredPoints) {
      alert('그뤠잇이 부족합니다')
      return false
    }
    if (reward.stock <= 0) {
      alert('재고가 없습니다')
      return false
    }
    // 포인트 차감
    await updateDoc(doc(db, 'users', userId), { totalPoints: increment(-reward.requiredPoints) })
    // 재고 감소
    await updateDoc(doc(db, 'rewards', reward.id), { stock: increment(-1) })
    // 교환 내역 기록
    const claimRef = doc(collection(db, 'rewardClaims'))
    await setDoc(claimRef, {
      userId, userName, rewardId: reward.id, rewardName: reward.name,
      points: reward.requiredPoints, status: 'pending', createdAt: serverTimestamp(),
    })
    // 포인트 차감 내역
    const histRef = doc(collection(db, 'pointHistory'))
    await setDoc(histRef, {
      userId, action: 'reward-claim', points: -reward.requiredPoints,
      description: `보상 교환: ${reward.name}`, createdAt: serverTimestamp(),
    })
    return true
  } catch (error) { console.error('보상 교환 에러:', error); return false }
}

// 교환 내역 조회 (관리자용)
export async function getAllClaims(): Promise<RewardClaim[]> {
  try {
    const q = query(collection(db, 'rewardClaims'), orderBy('createdAt', 'desc'))
    const snapshot = await getDocs(q)
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as RewardClaim))
  } catch (error) { console.error('교환 내역 조회 에러:', error); return [] }
}

// 교환 내역 조회 (유저용)
export async function getUserClaims(userId: string): Promise<RewardClaim[]> {
  try {
    const q = query(collection(db, 'rewardClaims'), where('userId', '==', userId))
    const snapshot = await getDocs(q)
    const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as RewardClaim))
    return items.sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0))
  } catch (error) { console.error('내 교환 내역 조회 에러:', error); return [] }
}

// 교환 상태 변경 (관리자)
export async function updateClaimStatus(claimId: string, status: 'completed' | 'rejected') {
  try {
    await updateDoc(doc(db, 'rewardClaims', claimId), { status })
    // 거절 시 포인트 환불 + 재고 복구
    if (status === 'rejected') {
      const claimDoc = await getDoc(doc(db, 'rewardClaims', claimId))
      const claim = claimDoc.data() as RewardClaim
      await updateDoc(doc(db, 'users', claim.userId), { totalPoints: increment(claim.points) })
      await updateDoc(doc(db, 'rewards', claim.rewardId), { stock: increment(1) })
    }
  } catch (error) { console.error('상태 변경 에러:', error); throw error }
}

// ===== 회원 관리 (관리자용) =====
export async function getAllUsers(): Promise<UserProfile[]> {
  try {
    const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'))
    const snapshot = await getDocs(q)
    return snapshot.docs.map((d) => (d.data() as UserProfile))
  } catch (error) { console.error('회원 목록 조회 에러:', error); return [] }
}

export async function getUserAllProgress(userId: string): Promise<Progress[]> {
  try {
    const q = query(collection(db, 'progress'), where('userId', '==', userId))
    const snapshot = await getDocs(q)
    return snapshot.docs.map((d) => (d.data() as Progress))
  } catch (error) { console.error('유저 진도 조회 에러:', error); return [] }
}

// ===== Q&A =====
export async function getQnAs(): Promise<QnA[]> {
  try {
    const q = query(collection(db, 'qna'), orderBy('createdAt', 'desc'))
    const snapshot = await getDocs(q)
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as QnA))
  } catch (error) {
    console.error('Q&A 목록 조회 에러:', error)
    return []
  }
}

export async function createQnA(data: { title: string; content: string; authorId: string; authorName: string }) {
  try {
    const docRef = doc(collection(db, 'qna'))
    await setDoc(docRef, { ...data, createdAt: serverTimestamp() })
    try {
      const sheetUrl = process.env.NEXT_PUBLIC_GOOGLE_SHEET_URL
      if (sheetUrl) {
        await fetch(sheetUrl, {
          method: 'POST', mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: data.authorName, title: data.title, content: data.content, date: new Date().toLocaleString('ko-KR') }),
        })
      }
    } catch (e) { console.error('Google Sheets 연동 에러:', e) }
    return docRef.id
  } catch (error) { throw error }
}

export async function answerQnA(qnaId: string, answer: string) {
  try {
    await updateDoc(doc(db, 'qna', qnaId), { answer, answeredAt: serverTimestamp() })
  } catch (error) { throw error }
}

export async function deleteQnA(qnaId: string) {
  try {
    await deleteDoc(doc(db, 'qna', qnaId))
  } catch (error) { throw error }
}
