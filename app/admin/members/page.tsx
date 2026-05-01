'use client';

import { useEffect, useState } from 'react';
import { getAllUsers, getUserEnrollments, getCourse, getUserAllProgress, getUserPointHistory } from '@/lib/firebase/firestore';
import type { UserProfile, Course, Progress, PointHistory } from '@/lib/types';

interface MemberDetail {
  user: UserProfile;
  courses: { course: Course; progress: Progress | null }[];
  pointHistory: PointHistory[];
}

export default function AdminMembersPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<MemberDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getAllUsers();
        setUsers(data);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const handleSelectUser = async (user: UserProfile) => {
    setDetailLoading(true);
    setSelectedUser(null);
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
    } catch (e) { console.error(e); }
    finally { setDetailLoading(false); }
  };

  const filteredUsers = search.trim()
    ? users.filter(u => u.name?.includes(search) || u.email?.includes(search))
    : users;

  const roleLabel: Record<string, string> = { student: '학생', teacher: '강사', admin: '관리자' };
  const groupLabel = (g: string) => g || '-';

  if (loading) {
    return (<div className="max-w-6xl mx-auto px-4 py-8"><div className="animate-pulse space-y-4">{[1,2,3,4,5].map(i=><div key={i} className="h-16 bg-gray-200 rounded-lg"></div>)}</div></div>);
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">회원 관리</h1>
      <p className="text-gray-500 mb-6">총 {users.length}명의 회원</p>

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
                <div className="text-xs text-gray-400 mt-1">{u.email} · {groupLabel(u.group)}</div>
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
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">{selectedUser.user.name}</h2>
                      <p className="text-sm text-gray-500">{selectedUser.user.email}</p>
                    </div>
                    <button onClick={() => setSelectedUser(null)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-gray-50 rounded-lg p-3 text-center"><div className="text-xs text-gray-500 mb-1">역할</div><div className="font-semibold text-sm">{roleLabel[selectedUser.user.role]}</div></div>
                    <div className="bg-gray-50 rounded-lg p-3 text-center"><div className="text-xs text-gray-500 mb-1">그룹</div><div className="font-semibold text-sm">{groupLabel(selectedUser.user.group)}</div></div>
                    <div className="bg-teal-50 rounded-lg p-3 text-center"><div className="text-xs text-teal-600 mb-1">그뤠잇</div><div className="font-bold text-teal-600">{(selectedUser.user.totalPoints || 0).toLocaleString()}</div></div>
                  </div>
                  {selectedUser.user.birthDate && (
                    <div className="mt-3 text-xs text-gray-400">생년월일: {selectedUser.user.birthDate}</div>
                  )}
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
