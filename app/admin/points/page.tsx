'use client';

import { useEffect, useState } from 'react';
import {
  getPointRules, createPointRule, updatePointRule, deletePointRule,
  getRewards, createReward, updateReward, deleteReward,
  getAllClaims, updateClaimStatus,
} from '@/lib/firebase/firestore';
import type { PointRule, Reward, RewardClaim } from '@/lib/types';

const defaultActions = [
  { action: 'signup', name: '회원가입', pts: 100 },
  { action: 'daily-login', name: '출석 체크', pts: 5 },
  { action: 'course-complete', name: '강좌 수강 완료', pts: 50 },
  { action: 'post-write', name: '게시글 작성', pts: 10 },
];

export default function AdminPointsPage() {
  const [tab, setTab] = useState<'rules' | 'rewards' | 'claims'>('rules');
  const [rules, setRules] = useState<PointRule[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [claims, setClaims] = useState<RewardClaim[]>([]);
  const [loading, setLoading] = useState(true);
  // 규칙 폼
  const [rName, setRName] = useState(''); const [rSlug, setRSlug] = useState(''); const [rPts, setRPts] = useState(10);
  const [editRuleId, setEditRuleId] = useState<string | null>(null); const [showRuleForm, setShowRuleForm] = useState(false);
  // 보상 폼
  const [rwName, setRwName] = useState(''); const [rwDesc, setRwDesc] = useState('');
  const [rwImg, setRwImg] = useState(''); const [rwPts, setRwPts] = useState(100); const [rwStock, setRwStock] = useState(10);
  const [editRewardId, setEditRewardId] = useState<string | null>(null); const [showRewardForm, setShowRewardForm] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [r, rw, cl] = await Promise.all([getPointRules(), getRewards(), getAllClaims()]);
        setRules(r); setRewards(rw); setClaims(cl);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  // === 규칙 핸들러 ===
  const handleInitDefaults = async () => {
    for (const item of defaultActions) {
      if (!rules.find(r => r.action === item.action)) {
        const id = await createPointRule({ action: item.action, name: item.name, points: item.pts, isActive: true });
        setRules(prev => [...prev, { id, action: item.action, name: item.name, points: item.pts, isActive: true } as PointRule]);
      }
    }
    alert('기본 규칙이 생성되었습니다');
  };
  const handleSaveRule = async () => {
    if (!rName.trim()) { alert('이름을 입력하세요'); return; }
    const slug = rSlug.trim() || rName.toLowerCase().replace(/\s+/g, '-');
    try {
      if (editRuleId) {
        await updatePointRule(editRuleId, { name: rName, action: slug, points: rPts });
        setRules(prev => prev.map(r => r.id === editRuleId ? { ...r, name: rName, action: slug, points: rPts } : r));
      } else {
        const id = await createPointRule({ action: slug, name: rName, points: rPts, isActive: true });
        setRules(prev => [...prev, { id, action: slug, name: rName, points: rPts, isActive: true } as PointRule]);
      }
      setRName(''); setRSlug(''); setRPts(10); setEditRuleId(null); setShowRuleForm(false);
    } catch (e) { alert('저장 실패'); }
  };
  const handleToggleRule = async (rule: PointRule) => {
    await updatePointRule(rule.id, { isActive: !rule.isActive });
    setRules(prev => prev.map(r => r.id === rule.id ? { ...r, isActive: !r.isActive } : r));
  };
  const handleRulePtsChange = async (rule: PointRule, pts: number) => {
    await updatePointRule(rule.id, { points: pts });
    setRules(prev => prev.map(r => r.id === rule.id ? { ...r, points: pts } : r));
  };
  const handleDeleteRule = async (id: string) => {
    if (!confirm('삭제하시겠습니까?')) return;
    await deletePointRule(id); setRules(prev => prev.filter(r => r.id !== id));
  };

  // === 보상 핸들러 ===
  const handleSaveReward = async () => {
    if (!rwName.trim()) { alert('상품명을 입력하세요'); return; }
    try {
      if (editRewardId) {
        await updateReward(editRewardId, { name: rwName, description: rwDesc, imageUrl: rwImg, requiredPoints: rwPts, stock: rwStock });
        setRewards(prev => prev.map(r => r.id === editRewardId ? { ...r, name: rwName, description: rwDesc, imageUrl: rwImg, requiredPoints: rwPts, stock: rwStock } : r));
      } else {
        const id = await createReward({ name: rwName, description: rwDesc, imageUrl: rwImg, requiredPoints: rwPts, stock: rwStock, isActive: true });
        setRewards(prev => [...prev, { id, name: rwName, description: rwDesc, imageUrl: rwImg, requiredPoints: rwPts, stock: rwStock, isActive: true } as Reward]);
      }
      setRwName(''); setRwDesc(''); setRwImg(''); setRwPts(100); setRwStock(10); setEditRewardId(null); setShowRewardForm(false);
    } catch (e) { alert('저장 실패'); }
  };
  const handleToggleReward = async (reward: Reward) => {
    await updateReward(reward.id, { isActive: !reward.isActive });
    setRewards(prev => prev.map(r => r.id === reward.id ? { ...r, isActive: !r.isActive } : r));
  };
  const handleDeleteReward = async (id: string) => {
    if (!confirm('삭제하시겠습니까?')) return;
    await deleteReward(id); setRewards(prev => prev.filter(r => r.id !== id));
  };
  const handleEditReward = (r: Reward) => {
    setRwName(r.name); setRwDesc(r.description); setRwImg(r.imageUrl); setRwPts(r.requiredPoints); setRwStock(r.stock);
    setEditRewardId(r.id); setShowRewardForm(true);
  };

  // === 교환 신청 핸들러 ===
  const handleClaimAction = async (claim: RewardClaim, status: 'completed' | 'rejected') => {
    const label = status === 'completed' ? '완료' : '거절';
    if (!confirm(`이 신청을 ${label} 처리하시겠습니까?`)) return;
    try {
      await updateClaimStatus(claim.id, status);
      setClaims(prev => prev.map(c => c.id === claim.id ? { ...c, status } : c));
    } catch (e) { alert('처리 실패'); }
  };

  if (loading) {
    return <div className="max-w-4xl mx-auto px-4 py-8"><div className="animate-pulse space-y-4">{[1,2,3].map(i=><div key={i} className="h-20 bg-gray-200 rounded-lg"></div>)}</div></div>;
  }

  const statusLabel: Record<string, string> = { pending: '대기중', completed: '완료', rejected: '거절' };
  const statusColor: Record<string, string> = { pending: 'bg-yellow-100 text-yellow-800', completed: 'bg-green-100 text-green-800', rejected: 'bg-red-100 text-red-800' };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">그뤠잇 포인트 관리</h1>
      <p className="text-gray-500 mb-6">포인트 규칙, 보상 상품, 교환 신청을 관리하세요</p>

      {/* 탭 */}
      <div className="flex gap-2 mb-8">
        {[
          { key: 'rules' as const, label: '포인트 규칙' },
          { key: 'rewards' as const, label: '보상 상품' },
          { key: 'claims' as const, label: `교환 신청 (${claims.filter(c=>c.status==='pending').length})` },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-5 py-2 rounded-full font-semibold text-sm transition-all ${tab === t.key ? 'bg-gradient-to-r from-teal-500 to-blue-500 text-white shadow' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >{t.label}</button>
        ))}
      </div>

      {/* === 포인트 규칙 탭 === */}
      {tab === 'rules' && (
        <div>
          {rules.length === 0 && (
            <button onClick={handleInitDefaults} className="mb-6 bg-gradient-to-r from-teal-500 to-blue-500 text-white font-semibold py-2 px-4 rounded-lg">기본 규칙 생성</button>
          )}
          <div className="space-y-3 mb-6">
            {rules.map(rule => (
              <div key={rule.id} className={`bg-white rounded-xl shadow-sm border p-4 flex items-center gap-4 ${rule.isActive ? 'border-teal-200' : 'border-gray-200 opacity-60'}`}>
                <button onClick={() => handleToggleRule(rule)} className={`w-12 h-7 rounded-full transition relative flex-shrink-0 ${rule.isActive ? 'bg-teal-500' : 'bg-gray-300'}`}>
                  <span className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${rule.isActive ? 'left-5' : 'left-0.5'}`} />
                </button>
                <div className="flex-grow"><div className="font-semibold text-gray-900">{rule.name}</div><div className="text-xs text-gray-400">{rule.action}</div></div>
                <input type="number" value={rule.points} onChange={e => handleRulePtsChange(rule, parseInt(e.target.value)||0)} className="w-20 px-3 py-1.5 border rounded-lg text-center font-bold text-teal-600 focus:ring-2 focus:ring-teal-500 outline-none" />
                <span className="text-sm text-gray-500">그뤠잇</span>
                <button onClick={() => { setRName(rule.name); setRSlug(rule.action); setRPts(rule.points); setEditRuleId(rule.id); setShowRuleForm(true); }} className="text-blue-600 text-sm font-medium">수정</button>
                <button onClick={() => handleDeleteRule(rule.id)} className="text-red-500 text-sm font-medium">삭제</button>
              </div>
            ))}
          </div>
          {!showRuleForm ? (
            <button onClick={() => setShowRuleForm(true)} className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-teal-400 hover:text-teal-600 transition font-medium">+ 새 규칙 추가</button>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-teal-200 p-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                <input value={rName} onChange={e=>setRName(e.target.value)} placeholder="활동 이름" className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 outline-none" />
                <input value={rSlug} onChange={e=>setRSlug(e.target.value)} placeholder="코드 (영문)" className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 outline-none" />
                <input type="number" value={rPts} onChange={e=>setRPts(parseInt(e.target.value)||0)} placeholder="포인트" className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 outline-none" />
              </div>
              <div className="flex gap-2">
                <button onClick={handleSaveRule} className="bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2 px-6 rounded-lg">{editRuleId ? '수정' : '추가'}</button>
                <button onClick={() => { setShowRuleForm(false); setEditRuleId(null); setRName(''); setRSlug(''); setRPts(10); }} className="bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg">취소</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* === 보상 상품 탭 === */}
      {tab === 'rewards' && (
        <div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            {rewards.map(rw => (
              <div key={rw.id} className={`bg-white rounded-xl shadow-sm border p-5 ${rw.isActive ? 'border-teal-200' : 'border-gray-200 opacity-60'}`}>
                {rw.imageUrl && <img src={rw.imageUrl} alt={rw.name} className="w-full h-32 object-cover rounded-lg mb-3" />}
                <h3 className="font-bold text-gray-900 mb-1">{rw.name}</h3>
                <p className="text-sm text-gray-500 mb-3 line-clamp-2">{rw.description}</p>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-bold text-teal-600">{rw.requiredPoints} 그뤠잇</span>
                  <span className="text-sm text-gray-400">재고: {rw.stock}개</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleToggleReward(rw)} className={`text-xs px-3 py-1 rounded-full font-medium ${rw.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {rw.isActive ? '공개' : '비공개'}
                  </button>
                  <button onClick={() => handleEditReward(rw)} className="text-blue-600 text-sm font-medium">수정</button>
                  <button onClick={() => handleDeleteReward(rw.id)} className="text-red-500 text-sm font-medium">삭제</button>
                </div>
              </div>
            ))}
          </div>
          {!showRewardForm ? (
            <button onClick={() => setShowRewardForm(true)} className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-teal-400 hover:text-teal-600 transition font-medium">+ 새 보상 상품 추가</button>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-teal-200 p-6">
              <h3 className="font-semibold mb-4">{editRewardId ? '상품 수정' : '새 상품 추가'}</h3>
              <div className="space-y-3 mb-4">
                <input value={rwName} onChange={e=>setRwName(e.target.value)} placeholder="상품명 (예: 스타벅스 아메리카노)" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 outline-none" />
                <input value={rwDesc} onChange={e=>setRwDesc(e.target.value)} placeholder="설명" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 outline-none" />
                <input value={rwImg} onChange={e=>setRwImg(e.target.value)} placeholder="이미지 URL" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 outline-none" />
                <div className="grid grid-cols-2 gap-3">
                  <input type="number" value={rwPts} onChange={e=>setRwPts(parseInt(e.target.value)||0)} placeholder="필요 포인트" className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 outline-none" />
                  <input type="number" value={rwStock} onChange={e=>setRwStock(parseInt(e.target.value)||0)} placeholder="재고 수량" className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 outline-none" />
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={handleSaveReward} className="bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2 px-6 rounded-lg">{editRewardId ? '수정' : '추가'}</button>
                <button onClick={() => { setShowRewardForm(false); setEditRewardId(null); setRwName(''); setRwDesc(''); setRwImg(''); setRwPts(100); setRwStock(10); }} className="bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg">취소</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* === 교환 신청 탭 === */}
      {tab === 'claims' && (
        <div className="space-y-3">
          {claims.length === 0 && <div className="text-center py-12 text-gray-400">교환 신청이 없습니다</div>}
          {claims.map(cl => (
            <div key={cl.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-center gap-4">
              <div className="flex-grow">
                <div className="font-semibold text-gray-900">{cl.rewardName}</div>
                <div className="text-sm text-gray-500">{cl.userName} · {cl.points} 그뤠잇</div>
                <div className="text-xs text-gray-400">{cl.createdAt?.toDate ? new Date(cl.createdAt.toDate()).toLocaleDateString('ko-KR') : ''}</div>
              </div>
              <span className={`text-xs font-semibold px-3 py-1 rounded-full ${statusColor[cl.status]}`}>{statusLabel[cl.status]}</span>
              {cl.status === 'pending' && (
                <div className="flex gap-2">
                  <button onClick={() => handleClaimAction(cl, 'completed')} className="bg-green-600 hover:bg-green-700 text-white text-sm font-semibold py-1.5 px-4 rounded-lg">완료</button>
                  <button onClick={() => handleClaimAction(cl, 'rejected')} className="bg-red-500 hover:bg-red-600 text-white text-sm font-semibold py-1.5 px-4 rounded-lg">거절</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
