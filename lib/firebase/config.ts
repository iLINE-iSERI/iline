// Firebase 초기화 설정
import { initializeApp, getApps } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore, initializeFirestore, type Firestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// Firebase 앱 중복 초기화 방지
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]

// Firestore: undefined 필드 자동 무시 (옵셔널 필드를 빈 값으로 둘 수 있도록)
let _db: Firestore
try {
  _db = initializeFirestore(app, { ignoreUndefinedProperties: true })
} catch {
  // 이미 초기화된 경우 (HMR 등): 기존 인스턴스 재사용
  _db = getFirestore(app)
}

export const auth = getAuth(app)
export const db = _db
export const storage = getStorage(app)
export default app
