// 인증 관련 함수 모음
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth'
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from './config'
import { awardPoints } from './firestore'

const googleProvider = new GoogleAuthProvider()

// 이메일/비밀번호 회원가입
export async function signUpWithEmail(
  email: string,
  password: string,
  name: string,
  birthDate: string,
  group: string
) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    const user = userCredential.user

    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      email: user.email,
      name,
      birthDate,
      group,
      role: 'student',
      totalPoints: 0,
      createdAt: serverTimestamp(),
      photoURL: user.photoURL || null,
    })

    await awardPoints(user.uid, 'signup', '회원가입')

    return user
  } catch (error) {
    console.error('회원가입 에러:', error)
    throw error
  }
}

// 이메일/비밀번호 로그인
export async function signInWithEmail(email: string, password: string) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    await awardPoints(userCredential.user.uid, 'daily-login', '출석 체크')
    return userCredential.user
  } catch (error) {
    console.error('로그인 에러:', error)
    throw error
  }
}

// Google OAuth 로그인
export async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider)
    const user = result.user

    const userDoc = await getDoc(doc(db, 'users', user.uid))
    if (!userDoc.exists()) {
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email,
        name: user.displayName || '사용자',
        birthDate: '',
        group: '',
        role: 'student',
        totalPoints: 0,
        createdAt: serverTimestamp(),
        photoURL: user.photoURL || null,
      })
      await awardPoints(user.uid, 'signup', '회원가입')
    }

    await awardPoints(user.uid, 'daily-login', '출석 체크')

    return user
  } catch (error) {
    console.error('Google 로그인 에러:', error)
    throw error
  }
}

// 로그아웃
export async function logOut() {
  try {
    await signOut(auth)
  } catch (error) {
    console.error('로그아웃 에러:', error)
    throw error
  }
}

// 인증 상태 변화 감지
export function onAuthChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback)
}
