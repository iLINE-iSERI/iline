'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import AuthGuard from '@/components/auth/AuthGuard';
import { getLeaderboard, getUserPointHistory } from '@/lib/firebase/firestore';
import type { UserProfile, PointHistory } from '@/lib/types';

function LeaderboardContent() {
  const { user, userProfile } = useAuth();
  const [ranking, setRanking] = useState<UserProfile[]>([]);
  const [history, setHistory] = useState<PointHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ranking' | 'history'>('ranking');

  useEffect(() => {
    const load = async () => {
      try {
        const [rankData, histData] = await Promise.all([
          getLeaderboard(20),
          user?.uid ? getUserPointHistory(user.uid) : Promise.resolve([]),
        ]);
        setRanking(rankData);
        setHistory(histData);
      } catch (error) {
        console.error('로드 실패:', error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user?.uid]);

  const myPoints = userProfile?.totalPoints || 0;
  const myRank = ranking.findIndex(u => u.uid === user?.uid) + 1;

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          {[1,2,3,4,5].map(i => <div key={i} className="h-16 bg-gray-200 rounded-lg"></div>)}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* 내 포인트 카드 */}
      <div className="bg-gradient-to-r from-teal-500 to-blue-500 rounded-2xl p-6 text-white mb-8 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-teal-100 text-sm font-medium mb-1">나의 그뤠잇</p>
            <p className="text-4xl font-bold">{myPoints.toLocaleString()}</p>
          </div>
          {myRank > 0 && (
            <div className="text-right">
              <p className="text-teal-100 text-sm font-medium mb-1">랭킹</p>
              <p className="text-4xl font-bold">{myRank}위</p>
            </div>
          )}
        </div>
      </div>

      {/* 탭 */}
      <div className="flex gap-2 mb-6">
        <button onClick={() => setActiveTab('ranking')}
          className={`px-5 py-2 rounded-full font-semibold text-sm transition-all ${activeTab === 'ranking' ? 'bg-gradient-to-r from-teal-500 to-blue-500 text-white shadow' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
          랭킹
        </button>
        <button onClick={() => setActiveTab('history')}
          className={`px-5 py-2 rounded-full font-semibold text-sm transition-all ${activeTab === 'history' ? 'bg-gradient-to-r from-teal-500 to-blue-500 text-white shadow' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
          내 포인트 내역
        </button>
      </div>

      {/* 랭킹 */}
      {activeTab === 'ranking' && (
        <div className="space-y-2">
          {ranking.map((u, idx) => {
            const isMe = u.uid === user?.uid;
            const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '';
            return (
              <div key={u.uid}
                className={`flex items-center gap-4 p-4 rounded-xl transition ${isMe ? 'bg-teal-50 border-2 border-teal-300' : 'bg-white border border-gray-100'}`}>
                <div className="w-10 text-center font-bold text-lg text-gray-400">{medal || `${idx+1}`}</div>
                <div className="flex-grow">
                  <span className={`font-semibold ${isMe ? 'text-teal-700' : 'text-gray-900'}`}>{u.name} {isMe && '(나)'}</span>
                </div>
                <div className="font-bold text-teal-600">{(u.totalPoints || 0).toLocaleString()} 그뤠잇</div>
              </div>
            );
          })}
          {ranking.length === 0 && <div className="text-center py-12 text-gray-400">아직 랭킹 데이터가 없습니다</div>}
        </div>
      )}

      {/* 내역 */}
      {activeTab === 'history' && (
        <div className="space-y-2">
          {history.map(h => (
            <div key={h.id} className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-100">
              <div className={`w-16 text-center font-bold ${h.points >= 0 ? 'text-teal-600' : 'text-red-500'}`}>{h.points >= 0 ? '+' : ''}{h.points}</div>
              <div className="flex-grow">
                <div className="font-medium text-gray-900">{h.description}</div>
                <div className="text-xs text-gray-400">{h.createdAt?.toDate ? new Date(h.createdAt.toDate()).toLocaleDateString('ko-KR') : ''}</div>
              </div>
            </div>
          ))}
          {history.length === 0 && <div className="text-center py-12 text-gray-400">아직 포인트 내역이 없습니다</div>}
        </div>
      )}
    </div>
  );
}

export default function LeaderboardPage() {
  return (
    <AuthGuard>
      <LeaderboardContent />
    </AuthGuard>
  );
}
