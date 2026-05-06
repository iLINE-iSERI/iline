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
