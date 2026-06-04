'use client';

import { useEffect, useMemo, useState } from 'react';
import { getGroups, createGroup, updateGroup, deleteGroup, getAllUsers, updateUserProfile } from '@/lib/firebase/firestore';
import type { StudentGroup, UserProfile } from '@/lib/types';

// 회원가입 폼과 동일한 최종 매핑 (10개)
const DEFAULT_GROUPS: { name: string; category: 'youth' | 'adult' }[] = [
  // 청소년
  { name: '초등학교',     category: 'youth' },
  { name: '중학교',       category: 'youth' },
  { name: '고등학교',     category: 'youth' },
  { name: '학교밖청소년', category: 'youth' },
  { name: '기타(청소년)', category: 'youth' },
  // 성인
  { name: '강사',         category: 'adult' },
  { name: '학부모',       category: 'adult' },
  { name: '시니어',       category: 'adult' },
  { name: '기관 관계자',  category: 'adult' },
  { name: '기타(성인)',   category: 'adult' },
];

const CATEGORY_LABEL: Record<'youth' | 'adult', string> = { youth: '청소년', adult: '성인' };

// 옛 라벨 → 새 라벨 통일 매핑
// 키는 정규화(공백 제거, 소문자) 기준이지만 실제 값은 화면 표시용 원본 사용
const RENAME_MAP: Record<string, string> = {
  '학교 밖':     '학교밖청소년',
  '학교밖':       '학교밖청소년',
  '기관관계자':   '기관 관계자',
  '기관관계자(성인)': '기관 관계자',
};

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

  // 최종 스펙대로 한 번에 정리:
  //   0) 옛 라벨 통일 (학교 밖 → 학교밖청소년, 기관관계자 → 기관 관계자)
  //      - 그룹 문서 이름 변경
  //      - 그 이름을 갖고 있던 회원들의 group 필드도 같이 변경
  //   1) 같은 이름의 그룹이 여러 개면 가장 앞(작은 order)의 것만 남기고 나머지 삭제
  //   2) 스펙에 있는 그룹의 카테고리를 자동 설정
  //   3) 스펙에 없는 그룹은 그대로 (관리자가 직접 판단)
  //   4) 스펙에 있지만 등록되지 않은 그룹은 추가
  const handleApplyFinalSpec = async () => {
    const summary: string[] = [];
    const norm = (s: string) => s.replace(/\s+/g, '').toLowerCase();

    // 0. 라벨 통일 — 그룹 문서 + 회원 group 필드 동시에
    const groupRenames: { id: string; from: string; to: string }[] = [];
    groups.forEach(g => {
      const target = RENAME_MAP[g.name] || RENAME_MAP[g.name.trim()];
      if (target && target !== g.name) {
        groupRenames.push({ id: g.id, from: g.name, to: target });
      }
    });

    const userRenames: { uid: string; from: string; to: string }[] = [];
    users.forEach(u => {
      const cur = (u.group || '').trim();
      if (!cur) return;
      const target = RENAME_MAP[cur];
      if (target && target !== cur) {
        userRenames.push({ uid: u.uid, from: cur, to: target });
      }
    });

    // 위 0 단계가 끝난 후 사용할 "효과적인" 그룹 리스트
    const effectiveGroups: StudentGroup[] = groups.map(g => {
      const r = groupRenames.find(x => x.id === g.id);
      return r ? { ...g, name: r.to } : g;
    });

    // 1. 이름 정규화 키별로 묶기 (rename 적용 후 기준)
    const byName: Record<string, StudentGroup[]> = {};
    effectiveGroups.forEach(g => {
      const key = norm(g.name);
      byName[key] = byName[key] || [];
      byName[key].push(g);
    });

    const dupKeep: StudentGroup[] = [];
    const toDelete: string[] = [];
    Object.values(byName).forEach(list => {
      if (list.length === 1) { dupKeep.push(list[0]); return; }
      // 가장 앞의 것 유지, 나머지 삭제 대상
      const sorted = [...list].sort((a, b) => (a.order || 0) - (b.order || 0));
      dupKeep.push(sorted[0]);
      sorted.slice(1).forEach(g => toDelete.push(g.id));
    });
    const duplicatesCount = toDelete.length;

    // 2. 스펙 매핑으로 카테고리 정리
    const specByName: Record<string, 'youth' | 'adult'> = {};
    DEFAULT_GROUPS.forEach(d => { specByName[norm(d.name)] = d.category; });

    const toUpdate: { id: string; data: Partial<StudentGroup> }[] = [];
    dupKeep.forEach(g => {
      const expected = specByName[norm(g.name)];
      if (expected && g.category !== expected) {
        toUpdate.push({ id: g.id, data: { category: expected } });
      }
    });
    const categoryFixCount = toUpdate.length;

    // 3. 누락된 스펙 그룹 추가
    const specKeys = new Set(DEFAULT_GROUPS.map(d => norm(d.name)));
    const existingKeys = new Set(dupKeep.map(g => norm(g.name)));
    const toCreate = DEFAULT_GROUPS.filter(d => !existingKeys.has(norm(d.name)));
    const createCount = toCreate.length;

    // 4. 스펙 외 그룹 정리
    //    - 회원 0명: 자동 삭제
    //    - 회원 있음: 알림만 (관리자가 직접 처리)
    const dupKeepIds = new Set(dupKeep.map(g => g.id));
    const orphanEmpty: StudentGroup[] = [];
    const orphanWithMembers: StudentGroup[] = [];
    dupKeep.forEach(g => {
      if (specKeys.has(norm(g.name))) return; // 스펙에 있으면 통과
      // 카운트 (rename 반영된 이름 기준)
      const count = users.filter(u => {
        const cur = (u.group || '').trim();
        const mapped = RENAME_MAP[cur] || cur;
        return mapped === g.name;
      }).length;
      if (count === 0) orphanEmpty.push(g);
      else orphanWithMembers.push(g);
    });
    const orphanDeleteCount = orphanEmpty.length;

    if (
      groupRenames.length + userRenames.length + duplicatesCount + categoryFixCount + createCount + orphanDeleteCount === 0
      && orphanWithMembers.length === 0
    ) {
      alert('이미 최종 스펙 그대로 정리되어 있습니다');
      return;
    }

    const renameSummary = groupRenames.length > 0
      ? `그룹 이름 통일 ${groupRenames.length}건 (${groupRenames.map(r => `${r.from}→${r.to}`).join(', ')})`
      : null;
    const userRenameSummary = userRenames.length > 0
      ? `회원 ${userRenames.length}명의 group 값 자동 변경`
      : null;
    const orphanDeleteSummary = orphanDeleteCount > 0
      ? `스펙 외 빈 그룹 ${orphanDeleteCount}개 자동 삭제 (${orphanEmpty.map(g => g.name).join(', ')})`
      : null;
    const orphanWarnSummary = orphanWithMembers.length > 0
      ? `⚠ 스펙 외 그룹 ${orphanWithMembers.length}개 (회원 있음) — 자동 삭제하지 않음: ${orphanWithMembers.map(g => `${g.name}(${users.filter(u => (u.group || '').trim() === g.name).length}명)`).join(', ')}`
      : null;

    const msg = [
      renameSummary,
      userRenameSummary,
      duplicatesCount > 0 ? `중복 그룹 ${duplicatesCount}개 삭제` : null,
      categoryFixCount > 0 ? `카테고리 ${categoryFixCount}개 조정` : null,
      createCount > 0 ? `누락된 ${createCount}개 추가 (${toCreate.map(d => d.name).join(', ')})` : null,
      orphanDeleteSummary,
      orphanWarnSummary,
    ].filter(Boolean).join('\n');

    if (!confirm(`다음 작업을 진행할까요?\n\n${msg}`)) return;

    setSeeding(true);
    try {
      // 0. 이름 통일 — 그룹 + 회원 동시
      await Promise.all([
        ...groupRenames.map(r => updateGroup(r.id, { name: r.to })),
        ...userRenames.map(r => updateUserProfile(r.uid, { group: r.to })),
      ]);
      if (groupRenames.length) summary.push(`그룹 이름 ${groupRenames.length}건 통일`);
      if (userRenames.length) summary.push(`회원 ${userRenames.length}명 group 자동 변경`);

      // 로컬 users 즉시 반영
      if (userRenames.length) {
        setUsers(prev => prev.map(u => {
          const r = userRenames.find(x => x.uid === u.uid);
          return r ? { ...u, group: r.to } : u;
        }));
      }

      // 1. 중복 삭제 + 스펙 외 빈 그룹 삭제
      const allDeletes = [...toDelete, ...orphanEmpty.map(g => g.id)];
      await Promise.all(allDeletes.map(id => deleteGroup(id)));
      if (toDelete.length) summary.push(`중복 ${toDelete.length}개 삭제`);
      if (orphanEmpty.length) summary.push(`스펙 외 빈 그룹 ${orphanEmpty.length}개 삭제`);

      // 2. 카테고리 업데이트
      await Promise.all(toUpdate.map(u => updateGroup(u.id, u.data)));
      if (toUpdate.length) summary.push(`카테고리 ${toUpdate.length}개 조정`);

      // 3. 신규 추가 (스펙 순서대로 order 부여)
      const remainingMax = Math.max(0, ...dupKeep.map(g => g.order || 0));
      let baseOrder = remainingMax + 1;
      const created: StudentGroup[] = [];
      for (const d of toCreate) {
        const id = await createGroup({ name: d.name, order: baseOrder, category: d.category });
        created.push({ id, name: d.name, order: baseOrder, category: d.category } as StudentGroup);
        baseOrder += 1;
      }
      if (created.length) summary.push(`${created.length}개 신규 추가`);

      // 로컬 groups 재계산 (rename + delete + update + create 모두 반영)
      const deletedIds = new Set(allDeletes);
      const next = [
        ...dupKeep
          .filter(g => !deletedIds.has(g.id))
          .map(g => {
            // rename 적용
            const r = groupRenames.find(x => x.id === g.id);
            const renamed = r ? { ...g, name: r.to } : g;
            // category 업데이트 적용
            const upd = toUpdate.find(u => u.id === renamed.id);
            return upd ? { ...renamed, ...upd.data } : renamed;
          }),
        ...created,
      ];
      setGroups(next);

      const warning = orphanWithMembers.length > 0
        ? `\n\n⚠ 회원이 있는 스펙 외 그룹은 그대로 두었습니다. 해당 회원을 회원관리에서 다른 그룹으로 옮긴 뒤 다시 이 버튼을 누르면 자동 삭제됩니다.`
        : '';
      alert(`완료\n• ${summary.join('\n• ')}${warning}`);
    } catch (e) {
      const m = e instanceof Error ? e.message : '알 수 없는 오류';
      alert(`작업 중 일부 실패: ${m}\n페이지를 새로고침해 현재 상태를 확인하세요.`);
    } finally {
      setSeeding(false);
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

      {/* 한 번에 정리 (이름 통일 + 중복 합치기 + 카테고리 부여 + 누락 추가) */}
      <div className="bg-gradient-to-r from-purple-50 to-teal-50 border border-purple-200 rounded-2xl p-5 mb-6 flex items-center gap-4">
        <div className="flex-grow">
          <p className="font-semibold text-purple-900 text-sm">최종 스펙대로 한 번에 정리</p>
          <p className="text-xs text-purple-700 mt-1">옛 이름 통일 · 회원 group 값 자동 변경 · 중복 병합 · 카테고리 자동 부여 · 누락 그룹 자동 추가 · 스펙 외 빈 그룹 자동 삭제 (회원이 있는 스펙 외 그룹은 안전상 유지)</p>
        </div>
        <button
          onClick={handleApplyFinalSpec}
          disabled={seeding}
          className="flex-shrink-0 bg-gradient-to-r from-purple-600 to-teal-600 hover:from-purple-700 hover:to-teal-700 text-white font-semibold py-2.5 px-5 rounded-xl shadow-sm transition disabled:from-gray-300 disabled:to-gray-300"
        >
          {seeding ? '정리 중...' : '✨ 최종 세팅 적용'}
        </button>
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
