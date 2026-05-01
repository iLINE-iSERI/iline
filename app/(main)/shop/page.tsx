'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import AuthGuard from '@/components/auth/AuthGuard';
import { getRewards, claimReward, getUserClaims, getUserProfile } from '@/lib/firebase/firestore';
import type { Reward, RewardClaim } from '@/lib/types';

function ShopContent() {
  const { user, userProfile } = useAuth();
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [claims, setClaims] = useState<RewardClaim[]>([]);
  const [loading, setLoading] = useState(true);
  const [myPoints, setMyPoints] = useState(0);
  const [claiming, setClaiming] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'shop' | 'history'>('shop');

  useEffect(() => {
    const load = async () => {
      try {
        const [rw, cl] = await Promise.all([
          getRewards(),
          user?.uid ? getUserClaims(user.uid) : Promise.resolve([]),
        ]);
        setRewards(rw.filter(r => r.isActive && r.stock > 0));
        setClaims(cl);
        setMyPoints(userProfile?.totalPoints || 0);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    load();
  }, [user?.uid, userProfile?.totalPoints]);

  const handleClaim = async (reward: Reward) => {
    if (!user?.uid || !userProfile) return;
    if (myPoints < reward.requiredPoints) { alert('그뤠잇이 부족합니다'); return; }
    if (!confirm(`${reward.name}을(를) ${reward.requiredPoints} 그뤠잇으로 교환하시겠습니까?`)) return;
    setClaiming(reward.id);
    try {
      const success = await claimReward(user.uid, userProfile.name, reward);
      if (success) {
        setMyPoints(prev => prev - reward.requiredPoints);
        setRewards(prev => prev.map(r => r.id === reward.id ? { ...r, stock: r.stock - 1 } : r));
        const updated = await getUserClaims(user.uid);
        setClaims(updated);
        alert('교환 신청이 완료되었습니다! 관리자 확인 후 지급됩니다.');
      }
    } catch (e) { alert('교환 실패'); }
    finally { setClaiming(null); }
  };

  const statusLabel: Record<string, string> = { pending: '대기중', completed: '지급완료', rejected: '거절됨' };
  const statusColor: Record<string, string> = { pending: 'text-yellow-600', completed: 'text-green-600', rejected: 'text-red-500' };

  if (loading) {
    return <div className="max-w-4xl mx-auto px-4 py-8"><div className="animate-pulse space-y-4">{[1,2,3].map(i=><div key={i} className="h-40 bg-gray-200 rounded-lg"></div>)}</div></div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* 내 포인트 */}
      <div className="bg-gradient-to-r from-teal-500 to-blue-500 rounded-2xl p-6 text-white mb-8 shadow-lg">
        <p className="text-teal-100 text-sm font-medium mb-1">내 그뤠잇</p>
        <p className="text-4xl font-bold">{myPoints.toLocaleString()}</p>
      </div>

      {/* 탭 */}
      <div className="flex gap-2 mb-8">
        <button onClick={() => setActiveTab('shop')}
          className={`px-5 py-2 rounded-full font-semibold text-sm transition-all ${activeTab === 'shop' ? 'bg-gradient-to-r from-teal-500 to-blue-500 text-white shadow' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
          보상 상점
        </button>
        <button onClick={() => setActiveTab('history')}
          className={`px-5 py-2 rounded-full font-semibold text-sm transition-all ${activeTab === 'history' ? 'bg-gradient-to-r from-teal-500 to-blue-500 text-white shadow' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
          교환 내역 ({claims.length})
        </button>
      </div>

      {/* 상점 */}
      {activeTab === 'shop' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {rewards.map(rw => {
            const canAfford = myPoints >= rw.requiredPoints;
            return (
              <div key={rw.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {rw.imageUrl && <img src={rw.imageUrl} alt={rw.name} className="w-full h-40 object-cover" />}
                <div className="p-5">
                  <h3 className="font-bold text-gray-900 text-lg mb-1">{rw.name}</h3>
                  <p className="text-sm text-gray-500 mb-4 line-clamp-2">{rw.description}</p>
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-bold text-teal-600 text-lg">{rw.requiredPoints.toLocaleString()} 그뤠잇</span>
                    <span className="text-xs text-gray-400">남은 수량: {rw.stock}</span>
                  </div>
                  <button
                    onClick={() => handleClaim(rw)}
                    disabled={!canAfford || claiming === rw.id}
                    className={`w-full py-3 rounded-xl font-semibold transition ${
                      canAfford
                        ? 'bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600 text-white'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {claiming === rw.id ? '처리중...' : !canAfford ? `${(rw.requiredPoints - myPoints).toLocaleString()} 그뤠잇 부족` : '교환하기'}
                  </button>
                </div>
              </div>
            );
          })}
          {rewards.length === 0 && (
            <div className="col-span-2 text-center py-16 text-gray-400">아직 등록된 보상 상품이 없습니다</div>
          )}
        </div>
      )}

      {/* 교환 내역 */}
      {activeTab === 'history' && (
        <div className="space-y-3">
          {claims.map(cl => (
            <div key={cl.id} className="bg-white rounded-xl border border-gray-100 p-5 flex items-center gap-4">
              <div className="flex-grow">
                <div className="font-semibold text-gray-900">{cl.rewardName}</div>
                <div className="text-xs text-gray-400">{cl.createdAt?.toDate ? new Date(cl.createdAt.toDate()).toLocaleDateString('ko-KR') : ''}</div>
              </div>
              <span className="text-sm text-gray-500">-{cl.points} 그뤠잇</span>
              <span className={`text-sm font-semibold ${statusColor[cl.status]}`}>{statusLabel[cl.status]}</span>
            </div>
          ))}
          {claims.length === 0 && <div className="text-center py-12 text-gray-400">교환 내역이 없습니다</div>}
        </div>
      )}
    </div>
  );
}

export default function ShopPage() {
  return (
    <AuthGuard>
      <ShopContent />
    </AuthGuard>
  );
}
