'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signUpWithEmail } from '@/lib/firebase/auth';

type Category = 'youth' | 'adult' | '';
type Gender = 'male' | 'female' | 'unspecified';

const YOUTH_GROUPS = ['초등학교', '중학교', '고등학교', '학교 밖', '기타'] as const;
const ADULT_GROUPS = ['강사', '학부모', '시니어', '기관관계자', '기타'] as const;

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
}

export default function SignupPage() {
  const [step, setStep] = useState<1 | 2>(1);

  // step 1
  const [category, setCategory] = useState<Category>('');
  const [groupChoice, setGroupChoice] = useState('');
  const [groupOther, setGroupOther] = useState('');

  // step 2
  const [name, setName] = useState('');
  const [gender, setGender] = useState<Gender>('unspecified');
  const [birthDate, setBirthDate] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const groups = category === 'youth' ? YOUTH_GROUPS : category === 'adult' ? ADULT_GROUPS : [];
  const isOther = groupChoice === '기타';
  const resolvedGroup = isOther ? groupOther.trim() : groupChoice;

  const goToStep2 = () => {
    setError('');
    if (!category) { setError('구분을 선택해주세요'); return; }
    if (!groupChoice) { setError('소속을 선택해주세요'); return; }
    if (isOther && !groupOther.trim()) { setError('소속을 입력해주세요'); return; }
    setStep(2);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name.trim()) { setError('이름을 입력해주세요'); return; }
    if (!birthDate) { setError('생년월일을 선택해주세요'); return; }
    if (!email.trim()) { setError('이메일을 입력해주세요'); return; }
    if (!phone.trim()) { setError('연락처를 입력해주세요'); return; }
    if (password !== passwordConfirm) { setError('비밀번호가 일치하지 않습니다'); return; }
    if (password.length < 6) { setError('비밀번호는 6자 이상이어야 합니다'); return; }

    setLoading(true);
    try {
      await signUpWithEmail({
        email,
        password,
        name,
        birthDate,
        category: category as 'youth' | 'adult',
        group: resolvedGroup,
        gender,
        phone,
      });
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : '회원가입에 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = 'w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition';

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden px-4">
      <div className="absolute inset-0 bg-gradient-to-br from-teal-50 via-white to-purple-50" />
      <div className="absolute top-20 right-20 w-72 h-72 bg-teal-200/40 rounded-full blur-3xl" />
      <div className="absolute bottom-20 left-20 w-72 h-72 bg-purple-200/40 rounded-full blur-3xl" />
      <div className="relative w-full max-w-md bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl shadow-purple-100/50 p-8 border border-white/50">
        <div className="text-center mb-6">
          <Link href="/"><span className="text-3xl font-bold gradient-text">iLINE</span></Link>
          <p className="text-gray-500 mt-2">새 계정을 생성하세요</p>
          <p className="text-xs text-teal-600 mt-1 font-medium">모든 강의가 무료입니다</p>
        </div>

        {/* 스텝 인디케이터 */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className={`flex items-center gap-2 ${step === 1 ? 'text-purple-600 font-semibold' : 'text-gray-400'}`}>
            <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${step === 1 ? 'bg-purple-600 text-white' : 'bg-gray-200'}`}>1</span>
            <span className="text-sm">소속</span>
          </div>
          <div className="w-10 h-0.5 bg-gray-200" />
          <div className={`flex items-center gap-2 ${step === 2 ? 'text-purple-600 font-semibold' : 'text-gray-400'}`}>
            <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${step === 2 ? 'bg-purple-600 text-white' : 'bg-gray-200'}`}>2</span>
            <span className="text-sm">정보</span>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-100 rounded-2xl">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* === Step 1: 구분 + 소속 === */}
        {step === 1 && (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">구분</label>
              <div className="grid grid-cols-2 gap-3">
                {(['youth', 'adult'] as const).map((c) => (
                  <button
                    type="button"
                    key={c}
                    onClick={() => { setCategory(c); setGroupChoice(''); setGroupOther(''); }}
                    className={`py-3 rounded-xl border-2 font-medium transition ${category === c ? 'border-purple-600 bg-purple-50 text-purple-700' : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300'}`}
                  >
                    {c === 'youth' ? '청소년' : '성인'}
                  </button>
                ))}
              </div>
            </div>

            {category && (
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">소속</label>
                <select value={groupChoice} onChange={(e) => { setGroupChoice(e.target.value); if (e.target.value !== '기타') setGroupOther(''); }} className={inputClass} required>
                  <option value="" disabled>선택해주세요</option>
                  {groups.map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
                {isOther && (
                  <input
                    value={groupOther}
                    onChange={(e) => setGroupOther(e.target.value)}
                    placeholder="소속을 입력해주세요"
                    className={`${inputClass} mt-2`}
                    required
                  />
                )}
              </div>
            )}

            <button
              type="button"
              onClick={goToStep2}
              className="w-full bg-gradient-to-r from-purple-600 to-teal-600 hover:from-purple-700 hover:to-teal-700 text-white font-semibold py-3 rounded-xl transition-all hover:shadow-lg hover:shadow-purple-200"
            >
              다음
            </button>
          </div>
        )}

        {/* === Step 2: 인적 정보 === */}
        {step === 2 && (
          <form onSubmit={handleSignup} className="space-y-4">
            <button type="button" onClick={() => { setError(''); setStep(1); }} className="text-sm text-gray-500 hover:text-purple-600 transition mb-2">
              ← 이전 단계
            </button>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">이름</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="홍길동" className={inputClass} required />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">성별</label>
              <div className="grid grid-cols-3 gap-2">
                {([
                  { v: 'male', label: '남' },
                  { v: 'female', label: '여' },
                  { v: 'unspecified', label: '선택안함' },
                ] as const).map((g) => (
                  <button
                    type="button"
                    key={g.v}
                    onClick={() => setGender(g.v)}
                    className={`py-2.5 rounded-xl border-2 text-sm font-medium transition ${gender === g.v ? 'border-purple-600 bg-purple-50 text-purple-700' : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300'}`}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">생년월일</label>
              <input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} className={inputClass} required />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">이메일</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" className={inputClass} required />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">연락처</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(formatPhone(e.target.value))}
                placeholder="010-1234-5678"
                inputMode="numeric"
                className={inputClass}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">비밀번호</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="6자 이상" className={inputClass} required />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">비밀번호 확인</label>
              <input type="password" value={passwordConfirm} onChange={(e) => setPasswordConfirm(e.target.value)} placeholder="비밀번호 재입력" className={inputClass} required />
            </div>

            <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-purple-600 to-teal-600 hover:from-purple-700 hover:to-teal-700 disabled:from-gray-300 disabled:to-gray-400 text-white font-semibold py-3 rounded-xl transition-all hover:shadow-lg hover:shadow-purple-200 mt-2">
              {loading ? '가입 중...' : '무료 회원가입'}
            </button>
          </form>
        )}

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
