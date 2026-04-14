// Firebase Storage 파일 업로드 함수
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { storage } from './config'

// 파일 업로드 후 다운로드 URL 반환
export async function uploadFile(file: File, path: string): Promise<string> {
  try {
    const storageRef = ref(storage, path)
    const snapshot = await uploadBytes(storageRef, file)
    const downloadURL = await getDownloadURL(snapshot.ref)
    return downloadURL
  } catch (error) {
    console.error('파일 업로드 에러:', error)
    throw error
  }
}
