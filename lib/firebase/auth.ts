'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signUpWithEmail } from '@/lib/firebase/auth';
import { getGroups } from '@/lib/firebase/firestore';
import type { StudentGroup } from '@/lib/types';

export default function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [group, setGroup] = useState('');
  const [groups, setGroups] = useState<StudentGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const loadGroups = async () => {
      try {
        const list = await getGroups();
        setGroups(list);
        if (list.length > 0) setGroup(list[0].name);
      } catch (e) {
        console.error('그룹 로드 실패:', e);
        setGroups([]);
      }
    };
    loadGroups();
  }, []);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) { setError('이름을 입력해주세요'); return; }
    if (!birthDate) { setError('생년월일을 선택해주세요'); return; }
    if (!group) { setError('그룹을 선택해주세요'); return; }
    if (password !== passwordConfirm) { setError('비밀번호가 일치하지 않습니다'); return; }
    if (password.length < 6) { setError('비밀번호는 6자 이상이어야 합니다'); return; }

    setLoading(true);
    try {
      await signUpWithEmail(email, password, name, birthDate, group);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : '회원가입에 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden px-4">
      <div className="absolute inset-0 bg-gradient-to-br from-teal-50 via-white to-purple-50" />
      <div className="absolute top-20 right-20 w-72 h-72 bg-teal-200/40 rounded-full blur-3xl" />
      <div className="absolute bottom-20 left-20 w-72 h-72 bg-purple-200/40 rounded-full blur-3xl" />

      <div className="relative w-full max-w-md bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl shadow-purple-100/50 p-8 border border-white/50">
        <div className="text-center mb-8">
          <Link href="/"><span className="text-3xl font-bold gradient-text">iLINE</span></Link>
          <p className="text-gray-500 mt-2">새 계정을 생성하세요</p>
          <p className="text-xs text-teal-600 mt-1 font-medium">모든 강의가 무료입니다</p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-100 rounded-2xl">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-600 mb-1">이름</label>
            <input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)}
              placeholder="홍길동"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition" required />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-600 mb-1">이메일</label>
            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition" required />
          </div>

          <div>
            <label htmlFor="birthDate" className="block text-sm font-medium text-gray-600 mb-1">생년월일</label>
            <input id="birthDate" type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition" required />
          </div>

          <div>
            <label htmlFor="group" className="block text-sm font-medium text-gray-600 mb-1">그룹</label>
            <select id="group" value={group} onChange={(e) => setGroup(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition" required>
              {groups.length === 0 ? (
                <>
                  <option value="초등학생">초등학생</option>
                  <option value="중학생">중학생</option>
                  <option value="고등학생">고등학생</option>
                </>
              ) : (
                groups.map((g) => <option key={g.id} value={g.name}>{g.name}</option>)
              )}
            </select>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-600 mb-1">비밀번호</label>
            <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="6자 이상"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition" required />
          </div>

          <div>
            <label htmlFor="passwordConfirm" className="block text-sm font-medium text-gray-600 mb-1">비밀번호 확인</label>
            <input id="passwordConfirm" type="password" value={passwordConfirm} onChange={(e) => setPasswordConfirm(e.target.value)}
              placeholder="비밀번호 재입력"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition" required />
          </div>

          <button type="submit" disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 to-teal-600 hover:from-purple-700 hover:to-teal-700 disabled:from-gray-300 disabled:to-gray-400 text-white font-semibold py-3 rounded-xl transition-all hover:shadow-lg hover:shadow-purple-200 mt-2">
            {loading ? '가입 중...' : '무료 회원가입'}
          </button>
        </form>

        <div className="text-center mt-6">
          <p className="text-gray-500 text-sm">
            이미 계정이 있으신가요?{' '}
            <Link href="/login" className="text-purple-600 hover:text-purple-700 font-semibold">로그인</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
