// Firebase Storage 파일 업로드 함수
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { storage } from './config'

// 파일 업로드 후 다운로드 URL 반환
export async function uploadFile(file: File, path: string): Promise<string> {
  try {
    const storageRef = ref(storage, path)
    const snapshot = await uploadBytes(storageRef, file, { contentType: file.type })
    const downloadURL = await getDownloadURL(snapshot.ref)
    return downloadURL
  } catch (error) {
    console.error('파일 업로드 에러:', error)
    throw error
  }
}

const MAX_POSTER_BYTES = 5 * 1024 * 1024 // 5MB

/**
 * 오프라인 강좌 포스터 이미지를 Firebase Storage에 업로드.
 * @param file 이미지 파일 (5MB 이하)
 * @param courseId 기존 강좌 수정 시 해당 id, 신규 작성 시 undefined
 * @returns 업로드된 파일의 다운로드 URL
 */
export async function uploadOfflineCoursePoster(file: File, courseId?: string): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('이미지 파일만 업로드 가능합니다')
  }
  if (file.size > MAX_POSTER_BYTES) {
    throw new Error('파일 크기는 5MB 이하여야 합니다')
  }
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase()
  const filename = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`
  const path = courseId
    ? `posters/offline-courses/${courseId}/${filename}`
    : `posters/offline-courses/_new/${filename}`
  return uploadFile(file, path)
}

/**
 * 게시판 글(공지/자료실)에 첨부할 이미지를 업로드.
 */
export async function uploadPostImage(file: File, postType: 'notice' | 'resource' = 'notice'): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('이미지 파일만 업로드 가능합니다')
  }
  if (file.size > MAX_POSTER_BYTES) {
    throw new Error('파일 크기는 5MB 이하여야 합니다')
  }
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase()
  const filename = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`
  const path = `posts/${postType}/${filename}`
  return uploadFile(file, path)
}

/**
 * 보상 상품 이미지를 Firebase Storage에 업로드.
 */
export async function uploadRewardImage(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('이미지 파일만 업로드 가능합니다')
  }
  if (file.size > MAX_POSTER_BYTES) {
    throw new Error('파일 크기는 5MB 이하여야 합니다')
  }
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase()
  const filename = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`
  const path = `rewards/${filename}`
  return uploadFile(file, path)
}

const MAX_RESOURCE_BYTES = 20 * 1024 * 1024 // 20MB

/**
 * 자료실에 첨부할 일반 파일(PDF, PPT, 한글 등) 업로드.
 * 원본 파일명도 함께 반환하여 다운로드 시 표시할 수 있게 한다.
 */
export async function uploadResourceFile(file: File): Promise<{ url: string; name: string }> {
  if (file.size > MAX_RESOURCE_BYTES) {
    throw new Error('파일 크기는 20MB 이하여야 합니다')
  }
  const ext = (file.name.split('.').pop() || 'bin').toLowerCase()
  const stored = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`
  const path = `posts/resource/${stored}`
  const url = await uploadFile(file, path)
  return { url, name: file.name }
}
