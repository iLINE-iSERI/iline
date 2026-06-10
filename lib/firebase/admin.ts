import { initializeApp, getApps, cert, App } from 'firebase-admin/app'
import { getAuth, Auth } from 'firebase-admin/auth'
import { getFirestore, Firestore } from 'firebase-admin/firestore'

let _app: App | null = null

/**
 * Firebase Admin App을 한 번만 초기화하고 재사용.
 * 환경변수 FIREBASE_SERVICE_ACCOUNT_KEY (JSON 문자열) 필요.
 */
export function getAdminApp(): App {
  if (_app) return _app
  if (getApps().length > 0) {
    _app = getApps()[0]
    return _app
  }

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
  if (!raw) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY 환경변수가 설정되지 않았습니다')
  }

  let serviceAccount: Record<string, unknown>
  try {
    serviceAccount = JSON.parse(raw)
  } catch (e) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY가 올바른 JSON이 아닙니다')
  }

  // 다중라인 private_key 처리: 환경변수에서 \\n으로 들어온 경우 실제 줄바꿈으로 변환
  if (typeof serviceAccount.private_key === 'string') {
    serviceAccount.private_key = (serviceAccount.private_key as string).replace(/\\n/g, '\n')
  }

  _app = initializeApp({
    credential: cert(serviceAccount as any),
  })
  return _app
}

export function getAdminAuth(): Auth {
  return getAuth(getAdminApp())
}

export function getAdminFirestore(): Firestore {
  return getFirestore(getAdminApp())
}

/**
 * 요청 헤더의 Authorization Bearer 토큰에서 호출자를 검증하고
 * users/<uid>.role === 'admin' 인지 확인. 통과 시 호출자 uid 반환.
 */
export async function verifyAdminCaller(authHeader: string | null): Promise<string> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('인증 토큰이 없습니다')
  }
  const token = authHeader.slice('Bearer '.length).trim()
  if (!token) throw new Error('인증 토큰이 비어있습니다')

  const decoded = await getAdminAuth().verifyIdToken(token)
  const callerUid = decoded.uid

  const userDoc = await getAdminFirestore().collection('users').doc(callerUid).get()
  if (!userDoc.exists) throw new Error('사용자 정보를 찾을 수 없습니다')
  const role = userDoc.data()?.role
  if (role !== 'admin') throw new Error('관리자 권한이 없습니다')

  return callerUid
}
