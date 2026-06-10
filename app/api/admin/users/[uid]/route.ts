import { NextRequest, NextResponse } from 'next/server'
import { getAdminAuth, getAdminFirestore, verifyAdminCaller } from '@/lib/firebase/admin'

export const runtime = 'nodejs'
export const maxDuration = 30

// 회원 완전 삭제 — Firebase Auth + Firestore 프로필 + 관련 데이터 일괄 정리
//
// 정리 대상 컬렉션:
// - users/<uid> (프로필)
// - enrollments (where userId == uid)
// - progress (문서 ID가 <uid>_<courseId> 형태)
// - pointHistory (where userId == uid)
// - rewardClaims (where userId == uid)
// - courseComments (where authorId == uid)
// - quizAttempts (where userId == uid)
// - hiddenClicks (where userId == uid)
// - offlineApplications (where userId == uid)
export async function DELETE(
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

  // 2. 자기 자신은 삭제 못 함 (안전장치)
  if (callerUid === targetUid) {
    return NextResponse.json({ error: '본인 계정은 삭제할 수 없습니다' }, { status: 403 })
  }

  const auth = getAdminAuth()
  const db = getAdminFirestore()

  const summary: Record<string, number> = {}

  try {
    // 3. 관련 데이터 삭제 — 컬렉션별로 쿼리해서 배치 삭제
    const deleteCollection = async (
      collectionName: string,
      field: string,
      label: string,
    ) => {
      const snap = await db.collection(collectionName).where(field, '==', targetUid).get()
      if (snap.empty) { summary[label] = 0; return }
      // Firestore 배치 최대 500개
      const docs = snap.docs
      for (let i = 0; i < docs.length; i += 500) {
        const batch = db.batch()
        docs.slice(i, i + 500).forEach(d => batch.delete(d.ref))
        await batch.commit()
      }
      summary[label] = docs.length
    }

    await Promise.all([
      deleteCollection('enrollments', 'userId', 'enrollments'),
      deleteCollection('pointHistory', 'userId', 'pointHistory'),
      deleteCollection('rewardClaims', 'userId', 'rewardClaims'),
      deleteCollection('courseComments', 'authorId', 'courseComments'),
      deleteCollection('quizAttempts', 'userId', 'quizAttempts'),
      deleteCollection('hiddenClicks', 'userId', 'hiddenClicks'),
      deleteCollection('offlineApplications', 'userId', 'offlineApplications'),
    ])

    // progress 컬렉션은 ID 패턴(<uid>_<courseId>)으로 조회 — userId 필드도 있다고 가정하고 같은 방식 시도
    await deleteCollection('progress', 'userId', 'progress')

    // 4. Firestore 프로필 삭제
    await db.collection('users').doc(targetUid).delete()
    summary.userProfile = 1

    // 5. Firebase Auth 계정 삭제 (없으면 silent skip)
    try {
      await auth.deleteUser(targetUid)
      summary.authAccount = 1
    } catch (e: any) {
      if (e?.code === 'auth/user-not-found') {
        summary.authAccount = 0
      } else {
        // Auth 삭제 실패는 Firestore 정리는 이미 끝났으니 부분 성공으로 보고
        console.error('[admin/users DELETE] Auth 삭제 실패:', e)
        return NextResponse.json({
          error: `회원 데이터는 삭제됐지만 Firebase Auth 계정 삭제 실패: ${e?.message || '알 수 없음'}`,
          partial: true,
          summary,
        }, { status: 207 })
      }
    }

    return NextResponse.json({ success: true, summary, deletedBy: callerUid })
  } catch (e: any) {
    console.error('[admin/users DELETE] 실패:', e)
    return NextResponse.json({
      error: e instanceof Error ? e.message : '삭제 실패',
      summary,
    }, { status: 500 })
  }
}
