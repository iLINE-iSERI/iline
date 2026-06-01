'use client';

import { useEffect, useState } from 'react';
import { getGroups, createGroup, updateGroup, deleteGroup } from '@/lib/firebase/firestore';
import type { StudentGroup } from '@/lib/types';

const DEFAULT_GROUPS = ['초등학생', '중학생', '고등학생', '학교 밖', '기관관계자'];

export default function AdminGroupsPage() {
  const [groups, setGroups] = useState<StudentGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [seeding, setSeeding] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const list = await getGroups();
        setGroups(list);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const handleAdd = async () => {
    if (!newName.trim()) return;
    try {
      const id = await createGroup({ name: newName.trim(), order: groups.length });
      setGroups([...groups, { id, name: newName.trim(), order: groups.length } as StudentGroup]);
      setNewName('');
    } catch (e) {
      const msg = e instanceof Error ? e.message : '알 수 없는 오류';
      alert(`그룹 추가 실패: ${msg}`);
    }
  };

  const handleSeedDefaults = async () => {
    const missing = DEFAULT_GROUPS.filter(n => !groups.find(g => g.name === n));
    if (missing.length === 0) { alert('기본 그룹이 모두 등록되어 있습니다'); return; }
    if (!confirm(`다음 ${missing.length}개 그룹을 추가할까요?\n\n${missing.join(', ')}`)) return;
    setSeeding(true);
    try {
      const created: StudentGroup[] = [];
      let base = groups.length;
      for (const name of missing) {
        const id = await createGroup({ name, order: base });
        created.push({ id, name, order: base } as StudentGroup);
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
    if (!editName.trim()) return;
    try {
      await updateGroup(id, { name: editName.trim() });
      setGroups(groups.map((g) => g.id === id ? { ...g, name: editName.trim() } : g));
      setEditId(null);
      setEditName('');
    } catch (e) {
      const msg = e instanceof Error ? e.message : '알 수 없는 오류';
      alert(`그룹 수정 실패: ${msg}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    try {
      await deleteGroup(id);
      setGroups(groups.filter((g) => g.id !== id));
    } catch (e) {
      const msg = e instanceof Error ? e.message : '알 수 없는 오류';
      alert(`그룹 삭제 실패: ${msg}`);
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

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">그룹 관리</h1>
          <p className="text-gray-500 mt-1">교육생 그룹을 추가하고 관리하세요</p>
        </div>
        <a href="/admin/courses" className="text-sm text-purple-600 hover:text-purple-700 font-medium">강좌 관리 &rarr;</a>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
        <h2 className="text-lg font-bold text-gray-900 mb-4">새 그룹 추가</h2>
        <div className="flex gap-3">
          <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="그룹 이름 (예: 초등학생)" className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition" />
          <button onClick={handleAdd} className="bg-gradient-to-r from-purple-600 to-teal-600 text-white font-semibold px-6 py-3 rounded-xl hover:shadow-lg transition-all">추가</button>
        </div>
        <div className="mt-4 flex items-center gap-2 text-xs text-gray-500">
          <span>빠른 추가:</span>
          <button
            onClick={handleSeedDefaults}
            disabled={seeding}
            className="text-purple-600 hover:text-purple-700 font-semibold disabled:text-gray-400"
          >
            {seeding ? '추가 중...' : '기본 그룹(초·중·고·학교 밖·기관관계자) 일괄 등록'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">그룹 목록 ({groups.length})</h2>
        </div>
        {groups.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400">등록된 그룹이 없습니다</p>
            <p className="text-gray-400 text-sm mt-1">위에서 그룹을 추가하거나 "기본 그룹 일괄 등록"을 클릭하세요</p>
          </div>
        ) : (
          <ul>
            {groups.map((g, idx) => (
              <li key={g.id} className={`flex items-center justify-between px-6 py-4 ${idx < groups.length - 1 ? 'border-b border-gray-50' : ''}`}>
                {editId === g.id ? (
                  <div className="flex gap-2 flex-1">
                    <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none" />
                    <button onClick={() => handleUpdate(g.id)} className="text-teal-600 font-semibold text-sm">저장</button>
                    <button onClick={() => { setEditId(null); setEditName(''); }} className="text-gray-400 font-semibold text-sm">취소</button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center text-sm font-bold">{idx + 1}</span>
                      <span className="font-medium text-gray-900">{g.name}</span>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => { setEditId(g.id); setEditName(g.name); }} className="text-blue-600 hover:text-blue-700 font-semibold text-sm">수정</button>
                      <button onClick={() => handleDelete(g.id)} className="text-red-500 hover:text-red-600 font-semibold text-sm">삭제</button>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
