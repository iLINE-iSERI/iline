import { NextRequest, NextResponse } from 'next/server'
import { getAdminAuth, getAdminFirestore, verifyAdminCaller } from '@/lib/firebase/admin'

export const runtime = 'nodejs'

interface RequestBody {
  email: string
}

// GET — 회원의 Auth 이메일 + Firestore 이메일 동시 조회
// 두 값이 다르면 관리자가 동기화할지 결정 가능
export async function GET(
  req: NextRequest,
  ctx: { params: { uid: string } }
) {
  const { uid: targetUid } = ctx.params
  if (!targetUid) {
    return NextResponse.json({ error: '대상 사용자 ID가 없습니다' }, { status: 400 })
  }

  try {
    await verifyAdminCaller(req.headers.get('authorization'))
  } catch (e) {
    const msg = e instanceof Error ? e.message : '인증 실패'
    return NextResponse.json({ error: msg }, { status: 401 })
  }

  try {
    const auth = getAdminAuth()
    const db = getAdminFirestore()

    let authEmail: string | null = null
    let authExists = true
    try {
      const userRecord = await auth.getUser(targetUid)
      authEmail = userRecord.email || null
    } catch (e: any) {
      if (e?.code === 'auth/user-not-found') authExists = false
      else throw e
    }

    const docSnap = await db.collection('users').doc(targetUid).get()
    const firestoreEmail = (docSnap.data()?.email as string | undefined) || null

    return NextResponse.json({
      authEmail,
      firestoreEmail,
      authExists,
      synced: authExists && authEmail === firestoreEmail,
    })
  } catch (e: any) {
    console.error('[admin/users email GET] 실패:', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : '조회 실패', code: e?.code },
      { status: 500 }
    )
  }
}

export async function PATCH(
  req: NextRequest,
  ctx: { params: { uid: string } }
) {
  const { uid: targetUid } = ctx.params
  if (!targetUid) {
    return NextResponse.json({ error: '대상 사용자 ID가 없습니다' }, { status: 400 })
  }

  // 1. 호출자가 관리자인지 검증
  let callerUid: string
  try {
    callerUid = await verifyAdminCaller(req.headers.get('authorization'))
  } catch (e) {
    const msg = e instanceof Error ? e.message : '인증 실패'
    return NextResponse.json({ error: msg }, { status: 401 })
  }

  // 2. 새 이메일 검증
  let body: RequestBody
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: '잘못된 요청 형식' }, { status: 400 })
  }
  const newEmail = (body.email || '').trim().toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
    return NextResponse.json({ error: '올바른 이메일 형식이 아닙니다' }, { status: 400 })
  }

  try {
    const auth = getAdminAuth()
    const db = getAdminFirestore()

    // 3. Firebase Auth 이메일 변경 (실제 로그인 이메일)
    await auth.updateUser(targetUid, { email: newEmail, emailVerified: false })

    // 4. Firestore 표시용 이메일 같이 동기화
    await db.collection('users').doc(targetUid).update({ email: newEmail })

    return NextResponse.json({
      success: true,
      email: newEmail,
      meta: { changedBy: callerUid },
    })
  } catch (e: any) {
    const code = e?.code as string | undefined
    let userMessage = '이메일 변경 실패'
    let status = 500
    if (code === 'auth/email-already-exists') {
      userMessage = '이미 다른 회원이 사용 중인 이메일입니다'
      status = 409
    } else if (code === 'auth/invalid-email') {
      userMessage = '유효하지 않은 이메일 형식입니다'
      status = 400
    } else if (code === 'auth/user-not-found') {
      userMessage = '해당 회원을 Firebase Auth에서 찾을 수 없습니다'
      status = 404
    } else if (e instanceof Error) {
      userMessage = `이메일 변경 실패: ${e.message}`
    }
    console.error('[admin/users email] 실패:', e)
    return NextResponse.json({ error: userMessage, detail: e?.message || String(e), code }, { status })
  }
}
