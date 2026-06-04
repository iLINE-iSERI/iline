'use client';

import { useEffect, useMemo, useState } from 'react';
import { getGroups, createGroup, updateGroup, deleteGroup, getAllUsers } from '@/lib/firebase/firestore';
import type { StudentGroup, UserProfile } from '@/lib/types';

// 회원가입 폼과 동일한 매핑
const DEFAULT_GROUPS: { name: string; category: 'youth' | 'adult' }[] = [
  // 청소년
  { name: '초등학교', category: 'youth' },
  { name: '중학교',   category: 'youth' },
  { name: '고등학교', category: 'youth' },
  { name: '학교 밖',  category: 'youth' },
  // 성인
  { name: '강사',       category: 'adult' },
  { name: '학부모',     category: 'adult' },
  { name: '시니어',     category: 'adult' },
  { name: '기관관계자', category: 'adult' },
];

const CATEGORY_LABEL: Record<'youth' | 'adult', string> = { youth: '청소년', adult: '성인' };

export default function AdminGroupsPage() {
  const [groups, setGroups] = useState<StudentGroup[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState<'' | 'youth' | 'adult'>('');
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState<'' | 'youth' | 'adult'>('');
  const [seeding, setSeeding] = useState(false);
  const [savingOrder, setSavingOrder] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [gs, us] = await Promise.all([getGroups(), getAllUsers()]);
        setGroups(gs);
        setUsers(us);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  // 그룹별 회원 수 계산
  const memberCount = useMemo(() => {
    const m: Record<string, number> = {};
    users.forEach(u => {
      const g = (u.group || '').trim();
      if (!g) return;
      m[g] = (m[g] || 0) + 1;
    });
    return m;
  }, [users]);

  // 어느 그룹에도 속하지 않는 회원 수
  const unassignedCount = useMemo(
    () => users.filter(u => !(u.group || '').trim()).length,
    [users]
  );

  // 그룹 이름 중복/유사 감지 (case-insensitive, 공백 제거)
  const duplicateIds = useMemo(() => {
    const seen: Record<string, string[]> = {};
    groups.forEach(g => {
      const key = g.name.toLowerCase().replace(/\s+/g, '');
      seen[key] = seen[key] || [];
      seen[key].push(g.id);
    });
    const dup = new Set<string>();
    Object.values(seen).forEach(ids => {
      if (ids.length > 1) ids.forEach(id => dup.add(id));
    });
    return dup;
  }, [groups]);

  // 그룹 이름이 실제로 회원이 가지고 있는 group 값과 매칭이 안 되는 경우 — 잠재적 정리 대상
  // (예: 회원은 "고등학생"인데 그룹 컬렉션에는 "고등학교"만 있는 상황)
  const orphanedUserGroups = useMemo(() => {
    const groupNames = new Set(groups.map(g => g.name));
    const orphans: Record<string, number> = {};
    users.forEach(u => {
      const g = (u.group || '').trim();
      if (!g) return;
      if (!groupNames.has(g)) {
        orphans[g] = (orphans[g] || 0) + 1;
      }
    });
    return orphans;
  }, [groups, users]);

  const handleAdd = async () => {
    const name = newName.trim();
    if (!name) return;
    // 중복 사전 차단
    const exists = groups.find(g => g.name.toLowerCase().replace(/\s+/g, '') === name.toLowerCase().replace(/\s+/g, ''));
    if (exists) {
      alert(`이미 같은 이름의 그룹이 있습니다: "${exists.name}"`);
      return;
    }
    try {
      const category = newCategory || undefined;
      const id = await createGroup({ name, order: groups.length, category });
      setGroups([...groups, { id, name, order: groups.length, category } as StudentGroup]);
      setNewName(''); setNewCategory('');
    } catch (e) {
      const msg = e instanceof Error ? e.message : '알 수 없는 오류';
      alert(`그룹 추가 실패: ${msg}`);
    }
  };

  const handleSeedDefaults = async () => {
    const missing = DEFAULT_GROUPS.filter(d => !groups.find(g => g.name === d.name));
    if (missing.length === 0) { alert('기본 그룹이 모두 등록되어 있습니다'); return; }
    const lines = missing.map(d => `• [${CATEGORY_LABEL[d.category]}] ${d.name}`).join('\n');
    if (!confirm(`다음 ${missing.length}개 그룹을 추가할까요?\n\n${lines}`)) return;
    setSeeding(true);
    try {
      const created: StudentGroup[] = [];
      let base = groups.length;
      for (const d of missing) {
        const id = await createGroup({ name: d.name, order: base, category: d.category });
        created.push({ id, name: d.name, order: base, category: d.category } as StudentGroup);
        base += 1;
      }
      setGroups([...groups, ...created]);
      alert(`${created.length}개 그룹이 추가되었습니다`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : '알 수 없는 오류';
      alert(`기본 그룹 추가 실패: ${msg}`);
    } finally {
      setSeeding(false);
    }
  };

  const handleUpdate = async (id: string) => {
    const name = editName.trim();
    if (!name) return;
    try {
      const category = editCategory || undefined;
      await updateGroup(id, { name, category });
      setGroups(groups.map((g) => g.id === id ? { ...g, name, category } : g));
      setEditId(null); setEditName(''); setEditCategory('');
    } catch (e) {
      const msg = e instanceof Error ? e.message : '알 수 없는 오류';
      alert(`그룹 수정 실패: ${msg}`);
    }
  };

  const handleDelete = async (g: StudentGroup) => {
    const count = memberCount[g.name] || 0;
    const warn = count > 0
      ? `"${g.name}" 그룹에 ${count}명의 회원이 속해 있습니다. 삭제 후 이 회원들의 그룹 표시는 "미지정"으로 바뀝니다.\n\n그래도 삭제하시겠습니까?`
      : `"${g.name}" 그룹을 삭제하시겠습니까?`;
    if (!confirm(warn)) return;
    try {
      await deleteGroup(g.id);
      setGroups(groups.filter((x) => x.id !== g.id));
    } catch (e) {
      const msg = e instanceof Error ? e.message : '알 수 없는 오류';
      alert(`그룹 삭제 실패: ${msg}`);
    }
  };

  // 순서 변경 (위/아래)
  const moveGroup = async (idx: number, direction: -1 | 1) => {
    const next = idx + direction;
    if (next < 0 || next >= groups.length) return;
    const reordered = [...groups];
    [reordered[idx], reordered[next]] = [reordered[next], reordered[idx]];
    // order 필드 재할당
    const withNewOrders = reordered.map((g, i) => ({ ...g, order: i }));
    setGroups(withNewOrders);
    setSavingOrder(true);
    try {
      await Promise.all([
        updateGroup(withNewOrders[idx].id, { order: idx }),
        updateGroup(withNewOrders[next].id, { order: next }),
      ]);
    } catch (e) {
      alert('순서 저장 실패');
    } finally {
      setSavingOrder(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-16 bg-gray-200 rounded-xl"></div>)}
        </div>
      </div>
    );
  }

  const orphanEntries = Object.entries(orphanedUserGroups);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">그룹 관리</h1>
          <p className="text-gray-500 mt-1">총 {groups.length}개 그룹 · 회원 {users.length}명{unassignedCount > 0 && ` · 미지정 ${unassignedCount}명`}</p>
        </div>
        <a href="/admin/courses" className="text-sm text-purple-600 hover:text-purple-700 font-medium">강좌 관리 →</a>
      </div>

      {/* 정리 알림 — 회원이 가진 group 값과 그룹 컬렉션이 안 맞는 경우 */}
      {orphanEntries.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
          <p className="font-semibold text-amber-900 text-sm mb-1">⚠ 정리 필요한 그룹 값</p>
          <p className="text-xs text-amber-700 mb-2">
            아래 그룹명은 회원 일부가 가지고 있지만 그룹 컬렉션에는 등록되어 있지 않습니다. 그룹을 추가하거나 회원관리에서 해당 회원의 그룹을 다시 지정하세요.
          </p>
          <div className="flex flex-wrap gap-2">
            {orphanEntries.map(([name, count]) => (
              <span key={name} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs">
                <b>{name}</b>
                <span className="text-amber-600">{count}명</span>
                <button
                  onClick={async () => {
                    if (!confirm(`"${name}" 을 그룹 컬렉션에 등록할까요?`)) return;
                    try {
                      const id = await createGroup({ name, order: groups.length });
                      setGroups([...groups, { id, name, order: groups.length } as StudentGroup]);
                    } catch (e) {
                      alert('등록 실패');
                    }
                  }}
                  className="text-amber-700 hover:text-amber-900 font-semibold ml-1"
                >
                  + 등록
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 새 그룹 추가 */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">새 그룹 추가</h2>
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_140px_auto] gap-3">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }}
            placeholder="그룹 이름 (예: 초등학교)"
            className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
          />
          <select
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value as '' | 'youth' | 'adult')}
            className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition"
          >
            <option value="">구분 — 미지정</option>
            <option value="youth">청소년</option>
            <option value="adult">성인</option>
          </select>
          <button onClick={handleAdd} className="bg-gradient-to-r from-purple-600 to-teal-600 text-white font-semibold px-6 py-3 rounded-xl hover:shadow-lg transition-all">추가</button>
        </div>
        <div className="mt-4 flex items-center gap-2 text-xs text-gray-500">
          <span>빠른 추가:</span>
          <button
            onClick={handleSeedDefaults}
            disabled={seeding}
            className="text-purple-600 hover:text-purple-700 font-semibold disabled:text-gray-400"
          >
            {seeding ? '추가 중...' : '기본 그룹 8개 일괄 등록 (청소년 4 + 성인 4)'}
          </button>
        </div>
      </div>

      {/* 그룹 목록 — 카테고리별 섹션 */}
      <div className="space-y-4">
        {(['youth', 'adult', null] as const).map((catKey) => {
          const sectionGroups = groups.filter(g => (g.category || null) === catKey);
          if (sectionGroups.length === 0 && catKey === null) return null;
          const label = catKey === null ? '미분류' : CATEGORY_LABEL[catKey];
          const headerColor = catKey === 'youth'
            ? 'bg-teal-50 text-teal-700 border-teal-100'
            : catKey === 'adult'
              ? 'bg-blue-50 text-blue-700 border-blue-100'
              : 'bg-gray-50 text-gray-600 border-gray-100';
          return (
            <div key={catKey || 'none'} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className={`px-6 py-3 border-b ${headerColor} flex items-center justify-between`}>
                <h2 className="text-sm font-bold">{label} ({sectionGroups.length})</h2>
                {savingOrder && catKey === 'youth' && <span className="text-xs animate-pulse">순서 저장 중...</span>}
              </div>
              {sectionGroups.length === 0 ? (
                <p className="text-center py-8 text-gray-400 text-sm">이 구분의 그룹이 없습니다</p>
              ) : (
                <ul>
                  {sectionGroups.map((g) => {
                    const idx = groups.findIndex(x => x.id === g.id);
                    const count = memberCount[g.name] || 0;
                    const isDup = duplicateIds.has(g.id);
                    const isEmpty = count === 0;
                    return (
                      <li
                        key={g.id}
                        className={`flex items-center justify-between px-6 py-3 border-b border-gray-50 last:border-b-0 ${isDup ? 'bg-red-50' : ''}`}
                      >
                        {editId === g.id ? (
                          <div className="flex gap-2 flex-1 items-center">
                            <input
                              type="text"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              onKeyDown={(e) => { if (e.key === 'Enter') handleUpdate(g.id); }}
                              className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                              autoFocus
                            />
                            <select
                              value={editCategory}
                              onChange={(e) => setEditCategory(e.target.value as '' | 'youth' | 'adult')}
                              className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-sm"
                            >
                              <option value="">미지정</option>
                              <option value="youth">청소년</option>
                              <option value="adult">성인</option>
                            </select>
                            <button onClick={() => handleUpdate(g.id)} className="text-teal-600 font-semibold text-sm px-2">저장</button>
                            <button onClick={() => { setEditId(null); setEditName(''); setEditCategory(''); }} className="text-gray-400 font-semibold text-sm px-2">취소</button>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center gap-3 flex-grow">
                              {/* 순서 변경 화살표 */}
                              <div className="flex flex-col gap-0.5">
                                <button
                                  onClick={() => moveGroup(idx, -1)}
                                  disabled={idx === 0 || savingOrder}
                                  className="text-gray-400 hover:text-purple-600 disabled:opacity-30 text-xs leading-none"
                                  title="위로"
                                >
                                  ▲
                                </button>
                                <button
                                  onClick={() => moveGroup(idx, 1)}
                                  disabled={idx === groups.length - 1 || savingOrder}
                                  className="text-gray-400 hover:text-purple-600 disabled:opacity-30 text-xs leading-none"
                                  title="아래로"
                                >
                                  ▼
                                </button>
                              </div>
                              <span className={`font-medium ${isDup ? 'text-red-700' : 'text-gray-900'}`}>{g.name}</span>
                              {isDup && <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-semibold">중복</span>}
                              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${isEmpty ? 'bg-gray-100 text-gray-400' : 'bg-teal-100 text-teal-700'}`}>
                                {count}명
                              </span>
                            </div>
                            <div className="flex gap-2">
                              <button onClick={() => { setEditId(g.id); setEditName(g.name); setEditCategory(g.category || ''); }} className="text-blue-600 hover:text-blue-700 font-semibold text-sm">수정</button>
                              <button onClick={() => handleDelete(g)} className="text-red-500 hover:text-red-600 font-semibold text-sm">삭제</button>
                            </div>
                          </>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </div>

      {/* 회원가입 시 표시되는 옵션 안내 */}
      <div className="mt-6 bg-gray-50 border border-gray-200 rounded-xl p-4 text-xs text-gray-500">
        <p className="font-semibold text-gray-700 mb-1">참고 — 회원가입 폼에 표시되는 소속 옵션</p>
        <p>회원가입 폼은 구분(청소년/성인)을 선택하면 해당 구분에 등록된 그룹만 드롭다운에 노출합니다. 추가로 모든 화면에서 항상 &ldquo;기타&rdquo;는 주관식으로 직접 입력 가능합니다.</p>
      </div>
    </div>
  );
}
