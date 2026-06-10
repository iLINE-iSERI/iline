'use client';

import { useEffect, useMemo, useState } from 'react';
import { getAllUsers, getUserEnrollments, getCourse, getUserAllProgress, getUserPointHistory, getGroups, updateUserProfile } from '@/lib/firebase/firestore';
import { auth } from '@/lib/firebase/config';
import { sendPasswordReset } from '@/lib/firebase/auth';
import type { UserProfile, Course, Progress, PointHistory, StudentGroup } from '@/lib/types';

interface MemberDetail {
  user: UserProfile;
  courses: { course: Course; progress: Progress | null }[];
  pointHistory: PointHistory[];
}

const NO_GROUP = '__no_group__';

export default function AdminMembersPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [groups, setGroups] = useState<StudentGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<MemberDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [groupFilter, setGroupFilter] = useState<string>(''); // '' = 전체
  const [savingProfile, setSavingProfile] = useState(false);
  const [editingEmailFor, setEditingEmailFor] = useState<string | null>(null);
  const [emailDraft, setEmailDraft] = useState('');
  // 선택된 회원의 Auth 이메일 (Firestore 이메일과 다른지 확인용)
  const [authEmailCheck, setAuthEmailCheck] = useState<{ authEmail: string | null; authExists: boolean; synced: boolean } | null>(null);
  const [checkingEmail, setCheckingEmail] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [data, gs] = await Promise.all([getAllUsers(), getGroups()]);
        setUsers(data);
        setGroups(gs);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  // 회원 분포 — 그룹별 카운트
  const groupCounts = useMemo(() => {
    const counts: Record<string, number> = { '': users.length, [NO_GROUP]: 0 };
    groups.forEach(g => { counts[g.name] = 0; });
    users.forEach(u => {
      const g = (u.group || '').trim();
      if (!g) { counts[NO_GROUP] = (counts[NO_GROUP] || 0) + 1; return; }
      counts[g] = (counts[g] || 0) + 1;
    });
    return counts;
  }, [users, groups]);

  // 회원 그룹/카테고리/역할 변경 (관리자, Firestore만 변경)
  const handleUpdateUserField = async (
    uid: string,
    patch: Partial<Pick<UserProfile, 'group' | 'category' | 'role'>>
  ) => {
    setSavingProfile(true);
    try {
      await updateUserProfile(uid, patch);
      setUsers(prev => prev.map(u => u.uid === uid ? { ...u, ...patch } as UserProfile : u));
      setSelectedUser(prev => prev && prev.user.uid === uid
        ? { ...prev, user: { ...prev.user, ...patch } as UserProfile }
        : prev);
    } catch (e) {
      const msg = e instanceof Error ? e.message : '알 수 없는 오류';
      alert(`회원 정보 변경 실패: ${msg}`);
    } finally {
      setSavingProfile(false);
    }
  };

  // 회원 완전 삭제 (Auth + Firestore + 관련 데이터)
  const handleDeleteUser = async (targetUid: string, targetName: string) => {
    if (!auth.currentUser) { alert('로그인 정보가 없습니다'); return; }
    if (auth.currentUser.uid === targetUid) { alert('본인 계정은 삭제할 수 없습니다'); return; }
    // 1차 확인
    if (!confirm(`⚠ ${targetName} 회원을 완전히 삭제할까요?\n\n삭제되는 데이터:\n• 로그인 계정 (Firebase Auth)\n• 회원 프로필\n• 수강 이력 / 학습 진도\n• 그뤠잇 내역 / 보상 교환 내역\n• 강좌 댓글 / 퀴즈 응시 / 히든 클릭\n• 오프라인 강좌 신청 기록\n\n복구 불가능합니다.`)) return;
    // 2차 확인 — 이름 직접 입력
    const typed = window.prompt(`확인을 위해 회원 이름 "${targetName}" 을 정확히 입력해주세요`);
    if (typed === null) return;
    if (typed.trim() !== targetName) { alert('이름이 일치하지 않습니다. 삭제를 취소합니다.'); return; }

    setSavingProfile(true);
    try {
      const idToken = await auth.currentUser.getIdToken();
      const res = await fetch(`/api/admin/users/${targetUid}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${idToken}` },
      });
      const data = await res.json();
      if (!res.ok && res.status !== 207) throw new Error(data?.error || `HTTP ${res.status}`);

      // 로컬 state 정리
      setUsers(prev => prev.filter(u => u.uid !== targetUid));
      setSelectedUser(prev => prev && prev.user.uid === targetUid ? null : prev);

      const items = data?.summary
        ? Object.entries(data.summary)
            .filter(([, n]) => (n as number) > 0)
            .map(([k, n]) => `• ${k}: ${n}개`)
            .join('\n')
        : '';
      const headline = res.status === 207
        ? `⚠ 부분 삭제됨: ${data?.error}`
        : `${targetName} 회원이 완전히 삭제되었습니다`;
      alert(`${headline}\n\n${items}`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : '알 수 없는 오류';
      alert(`회원 삭제 실패: ${msg}`);
    } finally {
      setSavingProfile(false);
    }
  };

  // 비밀번호 재설정 메일 발송 (관리자 → 해당 회원 이메일로)
  const handleSendPasswordReset = async (targetEmail: string, targetName: string) => {
    if (!targetEmail) { alert('이 회원에게 로그인 이메일이 없어 재설정 메일을 보낼 수 없습니다'); return; }
    if (!confirm(`${targetName} 회원에게 비밀번호 재설정 메일을 보낼까요?\n\n받는 곳: ${targetEmail}`)) return;
    try {
      await sendPasswordReset(targetEmail);
      alert(`재설정 메일을 발송했습니다.\n\n${targetEmail}\n\n회원에게 메일 확인을 요청해주세요. (스팸 폴더 포함)`);
    } catch (e: any) {
      const code = e?.code as string | undefined;
      let msg = e instanceof Error ? e.message : '알 수 없는 오류';
      if (code === 'auth/user-not-found') msg = '이 이메일로 가입된 Firebase Auth 계정이 없습니다';
      else if (code === 'auth/invalid-email') msg = '유효하지 않은 이메일 형식';
      else if (code === 'auth/too-many-requests') msg = '요청이 너무 많습니다. 잠시 후 다시 시도해주세요';
      alert(`재설정 메일 발송 실패: ${msg}`);
    }
  };

  // 회원 이메일 변경 — Firebase Auth(로그인 이메일) + Firestore(표시용) 동시 변경
  // 서버 API 라우트가 Admin SDK로 처리
  const handleUpdateUserEmail = async (uid: string, newEmail: string) => {
    if (!auth.currentUser) { alert('로그인 정보가 없습니다'); return; }
    if (!confirm(`이 회원의 로그인 이메일을 "${newEmail}" 로 변경할까요?\n\n변경 후 회원은 새 이메일로 로그인해야 합니다.`)) return;
    setSavingProfile(true);
    try {
      const idToken = await auth.currentUser.getIdToken();
      const res = await fetch(`/api/admin/users/${uid}/email`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ email: newEmail }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
      // 로컬 state 반영
      setUsers(prev => prev.map(u => u.uid === uid ? { ...u, email: newEmail } as UserProfile : u));
      setSelectedUser(prev => prev && prev.user.uid === uid
        ? { ...prev, user: { ...prev.user, email: newEmail } as UserProfile }
        : prev);
      alert('이메일이 변경되었습니다. 회원은 새 이메일로 로그인해야 합니다.');
    } catch (e) {
      const msg = e instanceof Error ? e.message : '알 수 없는 오류';
      alert(`이메일 변경 실패: ${msg}`);
    } finally {
      setSavingProfile(false);
    }
  };

  // CSV 내보내기 — 현재 필터 결과 또는 전체
  const handleExportCsv = (scope: 'filtered' | 'all') => {
    const rows = scope === 'filtered' ? filteredUsers : users;
    if (rows.length === 0) { alert('내보낼 회원이 없습니다'); return; }

    const headers = [
      '이름', '이메일', '전화번호', '역할', '그룹', '구분', '성별',
      '생년월일', '학교', '학년', '그뤠잇', '가입일'
    ];
    const roleK: Record<string, string> = { student: '학생', teacher: '강사', admin: '관리자' };
    const catK: Record<string, string> = { youth: '청소년', adult: '성인' };
    const genderK: Record<string, string> = { male: '남', female: '여', unspecified: '미선택' };

    const escape = (v: unknown) => {
      const s = v == null ? '' : String(v);
      if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
      return s;
    };

    const lines = [headers.map(escape).join(',')];
    rows.forEach(u => {
      lines.push([
        u.name || '',
        u.email || '',
        u.phone || '',
        roleK[u.role] || u.role || '',
        u.group || '',
        u.category ? (catK[u.category] || u.category) : '',
        u.gender ? (genderK[u.gender] || u.gender) : '',
        u.birthDate || '',
        u.school || '',
        u.grade || '',
        u.totalPoints ?? 0,
        u.createdAt?.toDate ? new Date(u.createdAt.toDate()).toISOString().split('T')[0] : '',
      ].map(escape).join(','));
    });

    // UTF-8 BOM 포함 — Google Sheets / Excel 한글 깨짐 방지
    const bom = '﻿';
    const blob = new Blob([bom + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const today = new Date().toISOString().split('T')[0];
    const filename = scope === 'filtered'
      ? `iline_members_filtered_${today}.csv`
      : `iline_members_all_${today}.csv`;
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSelectUser = async (user: UserProfile) => {
    setDetailLoading(true);
    setSelectedUser(null);
    setAuthEmailCheck(null);
    try {
      const [enrollments, allProgress, history] = await Promise.all([
        getUserEnrollments(user.uid),
        getUserAllProgress(user.uid),
        getUserPointHistory(user.uid),
      ]);
      const coursePromises = enrollments.map(async (e) => {
        const course = await getCourse(e.courseId);
        const progress = allProgress.find(p => p.courseId === e.courseId) || null;
        return { course: course as Course, progress };
      });
      const courses = (await Promise.all(coursePromises)).filter(c => c.course !== null);
      setSelectedUser({ user, courses, pointHistory: history });
      // 백그라운드로 Auth 이메일 조회 (에러는 silent)
      void fetchAuthEmail(user.uid);
    } catch (e) { console.error(e); }
    finally { setDetailLoading(false); }
  };

  // Auth 이메일 조회 (Firestore 이메일과 비교용)
  const fetchAuthEmail = async (uid: string) => {
    if (!auth.currentUser) return;
    setCheckingEmail(true);
    try {
      const idToken = await auth.currentUser.getIdToken();
      const res = await fetch(`/api/admin/users/${uid}/email`, {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      if (!res.ok) {
        setAuthEmailCheck(null);
        return;
      }
      const data = await res.json();
      setAuthEmailCheck({ authEmail: data.authEmail, authExists: data.authExists, synced: data.synced });
    } catch (e) {
      console.error('Auth 이메일 조회 실패:', e);
      setAuthEmailCheck(null);
    } finally {
      setCheckingEmail(false);
    }
  };

  const filteredUsers = users.filter(u => {
    // 그룹 필터
    if (groupFilter === NO_GROUP) {
      if ((u.group || '').trim()) return false;
    } else if (groupFilter) {
      if ((u.group || '').trim() !== groupFilter) return false;
    }
    // 검색
    const q = search.trim();
    if (q && !(u.name?.includes(q) || u.email?.includes(q))) return false;
    return true;
  });

  const roleLabel: Record<string, string> = { student: '학생', teacher: '강사', admin: '관리자' };
  const groupLabel = (g: string) => g || '-';

  if (loading) {
    return (<div className="max-w-6xl mx-auto px-4 py-8"><div className="animate-pulse space-y-4">{[1,2,3,4,5].map(i=><div key={i} className="h-16 bg-gray-200 rounded-lg"></div>)}</div></div>);
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-start justify-between mb-2 gap-4">
        <h1 className="text-3xl font-bold text-gray-900">회원 관리</h1>
        <div className="flex gap-2">
          <button
            onClick={() => handleExportCsv('filtered')}
            className="bg-white border border-teal-300 text-teal-700 hover:bg-teal-50 font-semibold py-2 px-4 rounded-lg text-sm transition"
            title="현재 필터 + 검색 결과만 내보내기"
          >
            📥 필터 결과 ({filteredUsers.length}명)
          </button>
          <button
            onClick={() => handleExportCsv('all')}
            className="bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600 text-white font-semibold py-2 px-4 rounded-lg text-sm transition shadow-sm"
            title="전체 회원을 CSV로 내려받아 Google Sheets에서 열기"
          >
            📊 전체 명단 ({users.length}명)
          </button>
        </div>
      </div>
      <p className="text-gray-500 mb-6">총 {users.length}명의 회원 · 필터 적용 {filteredUsers.length}명 · CSV는 Google Sheets에서 바로 열립니다</p>

      {/* 그룹 필터 칩 */}
      <div className="flex flex-wrap gap-2 mb-4">
        {[
          { key: '', label: '전체' },
          ...groups.map(g => ({ key: g.name, label: g.name })),
          { key: NO_GROUP, label: '미지정' },
        ].map(chip => {
          const active = groupFilter === chip.key;
          const count = groupCounts[chip.key] ?? 0;
          return (
            <button
              key={chip.key || 'all'}
              onClick={() => setGroupFilter(chip.key)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium border transition ${
                active
                  ? 'bg-teal-600 border-teal-600 text-white shadow-sm'
                  : 'bg-white border-gray-200 text-gray-600 hover:border-teal-300'
              }`}
            >
              {chip.label} <span className={active ? 'text-teal-100' : 'text-gray-400'}>({count})</span>
            </button>
          );
        })}
      </div>

      <div className="flex gap-4">
        {/* 회원 목록 */}
        <div className={`${selectedUser || detailLoading ? 'w-1/2' : 'w-full'} transition-all`}>
          <input
            type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="이름 또는 이메일로 검색"
            className="w-full px-4 py-2 mb-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
          />
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {filteredUsers.map(u => (
              <button
                key={u.uid} onClick={() => handleSelectUser(u)}
                className={`w-full text-left p-4 rounded-xl border transition hover:shadow-md ${
                  selectedUser?.user.uid === u.uid ? 'border-teal-400 bg-teal-50' : 'border-gray-100 bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-gray-900">{u.name}</span>
                    <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${u.role === 'admin' ? 'bg-red-100 text-red-700' : u.role === 'teacher' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>{roleLabel[u.role]}</span>
                  </div>
                  <span className="font-bold text-teal-600 text-sm">{(u.totalPoints || 0).toLocaleString()} 그뤠잇</span>
                </div>
                <div className="text-xs text-gray-400 mt-1">{u.email} · {groupLabel(u.group || '')}</div>
              </button>
            ))}
            {filteredUsers.length === 0 && (<div className="text-center py-8 text-gray-400">검색 결과가 없습니다</div>)}
          </div>
        </div>

        {/* 상세 정보 */}
        {(selectedUser || detailLoading) && (
          <div className="w-1/2">
            {detailLoading ? (
              <div className="animate-pulse space-y-4"><div className="h-32 bg-gray-200 rounded-xl"></div><div className="h-48 bg-gray-200 rounded-xl"></div></div>
            ) : selectedUser && (
              <div className="sticky top-20 space-y-4">
                {/* 프로필 카드 */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex-grow min-w-0">
                      <h2 className="text-2xl font-bold text-gray-900">{selectedUser.user.name}</h2>
                      {editingEmailFor === selectedUser.user.uid ? (
                        <div className="mt-1 flex items-center gap-1 flex-wrap">
                          <input
                            type="email"
                            value={emailDraft}
                            onChange={(e) => setEmailDraft(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Escape') { setEditingEmailFor(null); setEmailDraft(''); }
                              if (e.key === 'Enter') {
                                const trimmed = emailDraft.trim();
                                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) { alert('올바른 이메일 형식이 아닙니다'); return; }
                                handleUpdateUserEmail(selectedUser.user.uid, trimmed);
                                setEditingEmailFor(null);
                              }
                            }}
                            placeholder="new@example.com"
                            className="px-2 py-1 text-sm border border-teal-300 rounded focus:ring-2 focus:ring-teal-500 outline-none w-56"
                            autoFocus
                          />
                          <button
                            onClick={() => {
                              const trimmed = emailDraft.trim();
                              if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) { alert('올바른 이메일 형식이 아닙니다'); return; }
                              handleUpdateUserEmail(selectedUser.user.uid, trimmed);
                              setEditingEmailFor(null);
                            }}
                            className="text-teal-600 text-xs font-semibold px-2"
                          >
                            저장
                          </button>
                          <button
                            onClick={() => { setEditingEmailFor(null); setEmailDraft(''); }}
                            className="text-gray-400 text-xs font-semibold px-2"
                          >
                            취소
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm text-gray-500 break-all">{selectedUser.user.email || '(이메일 없음)'}</p>
                            <span className="text-[10px] text-gray-400">Firestore</span>
                            <button
                              onClick={() => { setEmailDraft(selectedUser.user.email || ''); setEditingEmailFor(selectedUser.user.uid); }}
                              className="text-xs text-blue-600 hover:text-blue-700 font-semibold"
                            >
                              ✏️ 수정
                            </button>
                          </div>
                          {/* Auth 이메일 표시 (다를 때만 경고 + 동기화) */}
                          {checkingEmail && (
                            <p className="text-[10px] text-gray-400">Auth 이메일 확인 중...</p>
                          )}
                          {authEmailCheck && !authEmailCheck.authExists && (
                            <p className="text-[11px] text-red-500 font-medium">⚠ Firebase Auth 계정이 없습니다 (탈퇴/삭제됨)</p>
                          )}
                          {authEmailCheck?.authExists && !authEmailCheck.synced && (
                            <div className="flex items-center gap-2 flex-wrap p-2 bg-amber-50 border border-amber-200 rounded-lg">
                              <div className="flex-grow min-w-0">
                                <p className="text-[11px] text-amber-800 font-semibold">⚠ 로그인 이메일과 다름</p>
                                <p className="text-[11px] text-amber-700 break-all">실제 로그인: <b>{authEmailCheck.authEmail || '(없음)'}</b></p>
                              </div>
                              <button
                                onClick={async () => {
                                  const firestoreEmail = selectedUser.user.email;
                                  if (!firestoreEmail) { alert('Firestore 이메일이 비어있어 동기화할 수 없습니다'); return; }
                                  if (!confirm(`Firebase Auth의 로그인 이메일을 다음으로 변경합니다:\n\n${authEmailCheck.authEmail || '(없음)'}\n→ ${firestoreEmail}\n\n변경 후 회원은 새 이메일로 로그인해야 합니다.`)) return;
                                  await handleUpdateUserEmail(selectedUser.user.uid, firestoreEmail);
                                  await fetchAuthEmail(selectedUser.user.uid);
                                }}
                                className="text-[11px] bg-amber-600 hover:bg-amber-700 text-white font-semibold px-3 py-1 rounded-md whitespace-nowrap"
                              >
                                🔄 Auth에 적용
                              </button>
                            </div>
                          )}
                          {authEmailCheck?.synced && (
                            <p className="text-[10px] text-green-600">✓ 로그인 이메일과 동기화됨</p>
                          )}
                        </div>
                      )}
                    </div>
                    <button onClick={() => setSelectedUser(null)} className="text-gray-400 hover:text-gray-600 text-xl flex-shrink-0">✕</button>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-gray-50 rounded-lg p-3 text-center"><div className="text-xs text-gray-500 mb-1">역할</div><div className="font-semibold text-sm">{roleLabel[selectedUser.user.role]}</div></div>
                    <div className="bg-gray-50 rounded-lg p-3 text-center"><div className="text-xs text-gray-500 mb-1">그룹</div><div className="font-semibold text-sm">{groupLabel(selectedUser.user.group)}</div></div>
                    <div className="bg-teal-50 rounded-lg p-3 text-center"><div className="text-xs text-teal-600 mb-1">그뤠잇</div><div className="font-bold text-teal-600">{(selectedUser.user.totalPoints || 0).toLocaleString()}</div></div>
                  </div>
                  {selectedUser.user.birthDate && (
                    <div className="mt-3 text-xs text-gray-400">생년월일: {selectedUser.user.birthDate}</div>
                  )}

                  {/* 관리자 — 그룹/구분/역할 인라인 수정 */}
                  <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
                    <div className="flex items-center justify-between text-xs text-gray-500 font-semibold">
                      <span>관리자 수정</span>
                      {savingProfile && <span className="text-teal-500">저장 중...</span>}
                    </div>
                    <p className="text-[10px] text-gray-400 -mt-1">이메일 변경 시 회원의 로그인 이메일까지 함께 바뀝니다 (회원에게 새 이메일 안내 필요)</p>
                    <div className="grid grid-cols-2 gap-2">
                      <label className="text-xs text-gray-600">
                        <span className="block mb-1">그룹</span>
                        <select
                          value={selectedUser.user.group || ''}
                          onChange={e => handleUpdateUserField(selectedUser.user.uid, { group: e.target.value })}
                          disabled={savingProfile}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                        >
                          <option value="">— 미지정 —</option>
                          {groups.map(g => (
                            <option key={g.id} value={g.name}>{g.name}</option>
                          ))}
                          {/* 기존 사용자에게 등록된 그룹이 현재 그룹 목록에 없는 경우 보존 */}
                          {selectedUser.user.group && !groups.find(g => g.name === selectedUser.user.group) && (
                            <option value={selectedUser.user.group}>{selectedUser.user.group} (목록 외)</option>
                          )}
                        </select>
                      </label>
                      <label className="text-xs text-gray-600">
                        <span className="block mb-1">구분 <span className="text-amber-600">(그뤠잇은 청소년만)</span></span>
                        <select
                          value={selectedUser.user.category || ''}
                          onChange={e => handleUpdateUserField(selectedUser.user.uid, { category: e.target.value as 'youth' | 'adult' | undefined })}
                          disabled={savingProfile}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                        >
                          <option value="">— 미지정 —</option>
                          <option value="youth">청소년</option>
                          <option value="adult">성인</option>
                        </select>
                      </label>
                      <label className="text-xs text-gray-600 col-span-2">
                        <span className="block mb-1">역할</span>
                        <select
                          value={selectedUser.user.role}
                          onChange={e => {
                            const next = e.target.value as 'student' | 'teacher' | 'admin';
                            if (next === 'admin' && !confirm('이 회원을 관리자로 승격할까요? 관리자는 모든 화면에 접근 가능합니다.')) return;
                            handleUpdateUserField(selectedUser.user.uid, { role: next });
                          }}
                          disabled={savingProfile}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                        >
                          <option value="student">학생</option>
                          <option value="teacher">강사</option>
                          <option value="admin">관리자</option>
                        </select>
                      </label>
                    </div>

                    {/* 비밀번호 재설정 메일 발송 */}
                    <div className="pt-3 border-t border-gray-100">
                      <button
                        onClick={() => handleSendPasswordReset(selectedUser.user.email, selectedUser.user.name)}
                        disabled={savingProfile || !selectedUser.user.email}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-amber-50 hover:bg-amber-100 disabled:bg-gray-50 disabled:text-gray-400 text-amber-800 text-xs font-semibold rounded-lg border border-amber-200 transition"
                      >
                        🔑 비밀번호 재설정 메일 발송
                      </button>
                      <p className="text-[10px] text-gray-400 mt-1 text-center">회원의 등록 이메일로 재설정 링크를 보냅니다</p>
                    </div>

                    {/* 위험 영역 — 회원 완전 삭제 */}
                    <div className="pt-3 border-t border-red-100 bg-red-50/50 -mx-6 px-6 pb-4 mt-3 rounded-b-xl">
                      <p className="text-[11px] text-red-700 font-semibold mb-2">⚠ 위험 영역</p>
                      <button
                        onClick={() => handleDeleteUser(selectedUser.user.uid, selectedUser.user.name)}
                        disabled={savingProfile || selectedUser.user.uid === user?.uid}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-white hover:bg-red-100 disabled:bg-gray-50 disabled:text-gray-400 text-red-600 text-xs font-semibold rounded-lg border border-red-300 transition"
                      >
                        🗑 회원 완전 삭제
                      </button>
                      <p className="text-[10px] text-red-600 mt-1 text-center">
                        Auth 계정 + Firestore 프로필 + 모든 관련 데이터 일괄 삭제 (복구 불가)
                      </p>
                    </div>
                  </div>
                </div>

                {/* 수강 강좌 */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                  <h3 className="font-bold text-gray-900 mb-4">수강 강좌 ({selectedUser.courses.length})</h3>
                  {selectedUser.courses.length === 0 ? (
                    <p className="text-sm text-gray-400">등록된 강좌가 없습니다</p>
                  ) : (
                    <div className="space-y-3">
                      {selectedUser.courses.map((item, idx) => {
                        const pct = item.progress && item.progress.totalDuration > 0
                          ? Math.min(100, Math.round((item.progress.lastPosition / item.progress.totalDuration) * 100)) : 0;
                        return (
                          <div key={idx} className="flex items-center gap-3">
                            <div className="flex-grow">
                              <div className="text-sm font-medium text-gray-900">{item.course.title}</div>
                              <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                                <div className={`h-1.5 rounded-full ${item.progress?.completed ? 'bg-green-500' : 'bg-gradient-to-r from-teal-400 to-blue-500'}`} style={{ width: `${item.progress?.completed ? 100 : pct}%` }} />
                              </div>
                            </div>
                            <span className={`text-xs font-semibold flex-shrink-0 ${item.progress?.completed ? 'text-green-600' : 'text-gray-500'}`}>
                              {item.progress?.completed ? '완료' : `${pct}%`}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* 그뤠잇 내역 */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                  <h3 className="font-bold text-gray-900 mb-4">그뤠잇 내역 (최근 10건)</h3>
                  {selectedUser.pointHistory.length === 0 ? (
                    <p className="text-sm text-gray-400">포인트 내역이 없습니다</p>
                  ) : (
                    <div className="space-y-2">
                      {selectedUser.pointHistory.slice(0, 10).map(h => (
                        <div key={h.id} className="flex items-center gap-3 text-sm">
                          <span className={`w-12 text-center font-bold ${h.points >= 0 ? 'text-teal-600' : 'text-red-500'}`}>{h.points >= 0 ? '+' : ''}{h.points}</span>
                          <span className="flex-grow text-gray-700">{h.description}</span>
                          <span className="text-xs text-gray-400">{h.createdAt?.toDate ? new Date(h.createdAt.toDate()).toLocaleDateString('ko-KR') : ''}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
