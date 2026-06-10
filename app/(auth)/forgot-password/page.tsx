'use client';

import { useState } from 'react';
import Link from 'next/link';
import { sendPasswordReset } from '@/lib/firebase/auth';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const trimmed = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError('올바른 이메일 형식이 아닙니다');
      return;
    }
    setLoading(true);
    try {
      await sendPasswordReset(trimmed);
      // Firebase는 등록되지 않은 이메일에 대해서도 같은 응답을 함
      // (열거 공격 방지). 보안상 같은 메시지를 보여줌
      setSent(true);
    } catch (err: any) {
      const code = err?.code as string | undefined;
      // 일부 에러는 명확히 안내
      if (code === 'auth/invalid-email') {
        setError('올바른 이메일 형식이 아닙니다');
      } else if (code === 'auth/too-many-requests') {
        setError('요청이 너무 많습니다. 잠시 후 다시 시도해주세요');
      } else if (code === 'auth/network-request-failed') {
        setError('네트워크 연결을 확인해주세요');
      } else {
        // 그 외의 경우(존재하지 않는 이메일 포함)도 성공처럼 처리 — 보안
        setSent(true);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden px-4">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-white to-teal-50" />
      <div className="absolute top-20 left-20 w-72 h-72 bg-purple-200/40 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-20 w-72 h-72 bg-teal-200/40 rounded-full blur-3xl" />

      <div className="relative w-full max-w-md bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl shadow-purple-100/50 p-8 border border-white/50 animate-fade-in-up">
        <div className="text-center mb-8">
          <Link href="/">
            <span className="text-3xl font-bold gradient-text">iLINE</span>
          </Link>
          <h1 className="text-xl font-bold text-gray-900 mt-4">비밀번호 재설정</h1>
          <p className="text-gray-500 text-sm mt-1">가입하신 이메일로 재설정 링크를 보내드려요</p>
        </div>

        {sent ? (
          <div className="space-y-5">
            <div className="bg-green-50 border border-green-100 rounded-2xl p-5 text-center">
              <div className="text-4xl mb-2">📧</div>
              <p className="font-semibold text-green-900">메일을 발송했습니다</p>
              <p className="text-sm text-green-700 mt-2">
                <span className="font-medium">{email}</span> 으로 비밀번호 재설정 링크를 보냈어요.
              </p>
              <p className="text-xs text-green-600 mt-3">
                메일이 안 보이면 스팸 폴더도 확인해주세요.<br />
                해당 이메일이 등록되지 않았다면 메일이 오지 않습니다.
              </p>
            </div>
            <Link
              href="/login"
              className="block w-full text-center bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold py-3 rounded-xl transition-all hover:shadow-lg hover:shadow-purple-200"
            >
              로그인 페이지로
            </Link>
          </div>
        ) : (
          <>
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-100 rounded-2xl">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-600 mb-2">
                  이메일
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
                  required
                  autoFocus
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 disabled:from-gray-300 disabled:to-gray-400 text-white font-semibold py-3 rounded-xl transition-all hover:shadow-lg hover:shadow-purple-200"
              >
                {loading ? '발송 중...' : '재설정 링크 받기'}
              </button>
            </form>
          </>
        )}

        <div className="text-center mt-6">
          <p className="text-gray-500 text-sm">
            계정이 기억나셨나요?{' '}
            <Link href="/login" className="text-purple-600 hover:text-purple-700 font-semibold">
              로그인
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
