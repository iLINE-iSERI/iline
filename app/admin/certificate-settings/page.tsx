'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AuthGuard from '@/components/auth/AuthGuard';
import { useAuth } from '@/lib/hooks/useAuth';
import {
  getCertificateSettings, updateCertificateSettings, DEFAULT_CERTIFICATE_SETTINGS,
} from '@/lib/firebase/firestore';
import type { CertificateSettings } from '@/lib/types';

const SAMPLE = {
  studentName: '홍길동',
  courseTitle: '디지털 윤리 1기',
  startDate: '2026-05-11',
  endDate: '2026-05-15',
  location: '서울시 종로구 OO빌딩 3층',
  instructor: '김선생',
  issuedDate: '2026년 5월 15일',
  certNumber: 'SAMPLE12',
};

function CertificatePreview({ settings }: { settings: CertificateSettings }) {
  const bodyParts = settings.bodyTemplate.split('{courseTitle}');

  return (
    <div
      style={{
        width: '1100px',
        height: '780px',
        backgroundColor: '#ffffff',
        position: 'relative',
        padding: '60px 80px',
        border: `8px double ${settings.primaryColor}`,
        boxSizing: 'border-box',
        fontFamily: '"Noto Sans KR", system-ui, -apple-system, sans-serif',
        transform: 'scale(0.5)',
        transformOrigin: 'top left',
      }}
    >
      <div style={{ position: 'absolute', inset: '20px', border: `2px solid ${settings.primaryColor}55`, pointerEvents: 'none' }} />

      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        {settings.logoImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={settings.logoImageUrl} alt="logo" style={{ height: '40px', display: 'inline-block' }} />
        ) : (
          <div style={{ fontSize: '24px', fontWeight: 700, color: settings.primaryColor, letterSpacing: '4px', marginBottom: '8px' }}>
            {settings.logoText}
          </div>
        )}
        <div style={{ height: '2px', width: '120px', background: `linear-gradient(90deg, ${settings.primaryColor}, ${settings.accentColor})`, margin: '8px auto 0' }} />
      </div>

      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ fontSize: '64px', fontWeight: 900, color: '#1a1a1a', letterSpacing: '20px', margin: 0, paddingLeft: '20px' }}>
          {settings.mainTitle}
        </h1>
      </div>

      <div style={{ textAlign: 'center', marginBottom: '50px' }}>
        <div style={{ fontSize: '18px', color: '#555', marginBottom: '24px' }}>제 {SAMPLE.certNumber} 호</div>
        <div style={{ display: 'inline-block', fontSize: '32px', fontWeight: 700, color: '#1a1a1a', borderBottom: `2px solid ${settings.primaryColor}`, padding: '0 40px 6px', marginBottom: '32px' }}>
          {SAMPLE.studentName}
        </div>
        <p style={{ fontSize: '20px', color: '#333', lineHeight: 1.8, margin: 0, whiteSpace: 'pre-wrap' }}>
          {bodyParts[0]}
          <strong style={{ color: settings.primaryColor }}>「{SAMPLE.courseTitle}」</strong>
          {bodyParts[1] ?? ''}
        </p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '60px', marginBottom: '50px', fontSize: '16px', color: '#444' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontWeight: 700, marginBottom: '6px', color: settings.primaryColor }}>교육 기간</div>
          <div>{SAMPLE.startDate} ~ {SAMPLE.endDate}</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontWeight: 700, marginBottom: '6px', color: settings.primaryColor }}>교육 장소</div>
          <div>{SAMPLE.location}</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontWeight: 700, marginBottom: '6px', color: settings.primaryColor }}>강사</div>
          <div>{SAMPLE.instructor}</div>
        </div>
      </div>

      <div style={{ position: 'absolute', bottom: '80px', left: 0, right: 0, textAlign: 'center' }}>
        <div style={{ fontSize: '20px', color: '#1a1a1a', marginBottom: '20px', letterSpacing: '4px' }}>{SAMPLE.issuedDate}</div>
        <div style={{ fontSize: '24px', fontWeight: 700, color: '#1a1a1a', letterSpacing: '8px' }}>{settings.institutionName}</div>
        {settings.sealImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={settings.sealImageUrl} alt="seal" style={{ height: '60px', marginTop: '12px' }} />
        ) : (
          <div style={{ display: 'inline-block', marginTop: '12px', padding: '8px 20px', border: '3px solid #c41e3a', borderRadius: '50%', color: '#c41e3a', fontSize: '14px', fontWeight: 700, letterSpacing: '4px' }}>
            {settings.sealText}
          </div>
        )}
      </div>
    </div>
  );
}

function CertificateSettingsContent() {
  const { user, userProfile, loading: authLoading } = useAuth();
  const router = useRouter();
  const [settings, setSettings] = useState<CertificateSettings>(DEFAULT_CERTIFICATE_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!userProfile || userProfile.role !== 'admin') {
      router.push('/dashboard');
      return;
    }
    getCertificateSettings().then(setSettings).finally(() => setLoading(false));
  }, [authLoading, userProfile, router]);

  const update = (k: keyof CertificateSettings) => (v: string) => setSettings(prev => ({ ...prev, [k]: v }));

  const handleSave = async () => {
    if (!user?.uid) return;
    setSaving(true);
    try {
      await updateCertificateSettings(settings, user.uid);
      setSavedAt(new Date().toLocaleTimeString('ko-KR'));
    } catch {
      alert('저장 실패');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (!confirm('초기 기본값으로 되돌립니다. 저장은 별도로 눌러주세요.')) return;
    setSettings({ ...DEFAULT_CERTIFICATE_SETTINGS });
  };

  if (loading || authLoading) {
    return <div className="max-w-6xl mx-auto px-4 py-8"><div className="animate-pulse h-96 bg-gray-200 rounded-xl" /></div>;
  }

  const inputClass = 'w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition';

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">수료증 설정</h1>
      <p className="text-gray-500 mb-8">로고, 발급기관, 인증 문구, 색상 등 수료증에 표시되는 항목을 관리합니다</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 폼 */}
        <div className="space-y-5">
          <section className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3">
            <h2 className="font-bold text-gray-900 mb-2">텍스트</h2>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">로고 텍스트</label>
              <input value={settings.logoText} onChange={e => update('logoText')(e.target.value)} placeholder="iLINE" className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">메인 타이틀</label>
              <input value={settings.mainTitle} onChange={e => update('mainTitle')(e.target.value)} placeholder="수 료 증" className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">발급 기관</label>
              <input value={settings.institutionName} onChange={e => update('institutionName')(e.target.value)} placeholder="iLINE 교육원" className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">인증 문구 (자리표시자: {'{courseTitle}'})</label>
              <textarea
                value={settings.bodyTemplate}
                onChange={e => update('bodyTemplate')(e.target.value)}
                rows={3}
                placeholder="위 사람은 「{courseTitle}」 과정을 ..."
                className={`${inputClass} resize-none`}
              />
              <p className="text-xs text-gray-400 mt-1">{'{courseTitle}'}는 자동으로 강좌명으로 치환됩니다</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">직인 텍스트</label>
              <input value={settings.sealText} onChange={e => update('sealText')(e.target.value)} placeholder="印" className={inputClass} />
            </div>
          </section>

          <section className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3">
            <h2 className="font-bold text-gray-900 mb-2">이미지 (선택, 입력하면 텍스트 대신 표시)</h2>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">로고 이미지 URL</label>
              <input value={settings.logoImageUrl ?? ''} onChange={e => update('logoImageUrl')(e.target.value)} placeholder="https://..." className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">직인 이미지 URL</label>
              <input value={settings.sealImageUrl ?? ''} onChange={e => update('sealImageUrl')(e.target.value)} placeholder="https://..." className={inputClass} />
            </div>
          </section>

          <section className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3">
            <h2 className="font-bold text-gray-900 mb-2">색상</h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">메인 색상</label>
                <div className="flex gap-2 items-center">
                  <input type="color" value={settings.primaryColor} onChange={e => update('primaryColor')(e.target.value)} className="w-12 h-10 border border-gray-200 rounded-lg cursor-pointer" />
                  <input value={settings.primaryColor} onChange={e => update('primaryColor')(e.target.value)} className={inputClass} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">보조 색상</label>
                <div className="flex gap-2 items-center">
                  <input type="color" value={settings.accentColor} onChange={e => update('accentColor')(e.target.value)} className="w-12 h-10 border border-gray-200 rounded-lg cursor-pointer" />
                  <input value={settings.accentColor} onChange={e => update('accentColor')(e.target.value)} className={inputClass} />
                </div>
              </div>
            </div>
          </section>

          <div className="flex gap-2 sticky bottom-4">
            <button onClick={handleReset} className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-5 rounded-lg transition">
              기본값으로
            </button>
            <button onClick={handleSave} disabled={saving} className="flex-grow bg-gradient-to-r from-purple-600 to-teal-600 hover:from-purple-700 hover:to-teal-700 disabled:from-gray-300 text-white font-semibold py-2 px-6 rounded-lg transition">
              {saving ? '저장 중...' : '저장'}
            </button>
          </div>
          {savedAt && <p className="text-xs text-green-600 text-right">✓ {savedAt}에 저장됨</p>}
        </div>

        {/* 미리보기 */}
        <div>
          <h2 className="font-bold text-gray-900 mb-3">미리보기</h2>
          <div
            className="bg-gray-50 rounded-2xl border border-gray-200 overflow-hidden"
            style={{ height: '390px' }}
          >
            <CertificatePreview settings={settings} />
          </div>
          <p className="text-xs text-gray-400 mt-2 text-center">실제 크기의 50% 비율로 미리보기 표시 · 입력 즉시 반영</p>
        </div>
      </div>
    </div>
  );
}

export default function CertificateSettingsPage() {
  return (
    <AuthGuard>
      <CertificateSettingsContent />
    </AuthGuard>
  );
}
