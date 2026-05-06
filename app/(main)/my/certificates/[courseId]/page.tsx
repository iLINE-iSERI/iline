'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import AuthGuard from '@/components/auth/AuthGuard';
import { useAuth } from '@/lib/hooks/useAuth';
import { getOfflineCourse, getMyApplicationForCourse } from '@/lib/firebase/firestore';
import type { OfflineCourse, OfflineApplication } from '@/lib/types';

interface Props { params: { courseId: string } }

function CertificateContent({ courseId }: { courseId: string }) {
  const { user, userProfile } = useAuth();
  const router = useRouter();
  const [course, setCourse] = useState<OfflineCourse | null>(null);
  const [app, setApp] = useState<OfflineApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const certRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user?.uid || !courseId) return;
    Promise.all([
      getOfflineCourse(courseId),
      getMyApplicationForCourse(user.uid, courseId),
    ])
      .then(([c, a]) => {
        setCourse(c);
        setApp(a);
      })
      .finally(() => setLoading(false));
  }, [user?.uid, courseId]);

  const handleDownload = async () => {
    if (!certRef.current || !course) return;
    setDownloading(true);
    try {
      // 동적 import로 클라이언트 번들에서만 로드
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ]);

      const canvas = await html2canvas(certRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();

      // 캔버스 비율 유지하며 페이지에 맞춤
      const imgRatio = canvas.width / canvas.height;
      const pageRatio = pageW / pageH;
      let renderW: number, renderH: number;
      if (imgRatio > pageRatio) {
        renderW = pageW;
        renderH = pageW / imgRatio;
      } else {
        renderH = pageH;
        renderW = pageH * imgRatio;
      }
      const offsetX = (pageW - renderW) / 2;
      const offsetY = (pageH - renderH) / 2;

      pdf.addImage(imgData, 'PNG', offsetX, offsetY, renderW, renderH);
      pdf.save(`수료증_${course.title}.pdf`);
    } catch (e) {
      console.error('PDF 생성 실패:', e);
      alert('PDF 다운로드에 실패했습니다');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="animate-pulse h-96 bg-gray-200 rounded-2xl" />
      </div>
    );
  }

  if (!course || !app || app.status !== 'completed') {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 text-center">
        <p className="text-gray-600 mb-4">수료증을 발급할 수 없습니다</p>
        <button onClick={() => router.push('/my/certificates')} className="text-purple-600 hover:text-purple-700 font-semibold">
          수료증 목록으로
        </button>
      </div>
    );
  }

  const issuedDate = app.certificateIssuedAt?.toDate
    ? new Date(app.certificateIssuedAt.toDate()).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
    : '-';

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => router.push('/my/certificates')} className="text-purple-600 hover:text-purple-700 font-semibold">
          ← 수료증 목록
        </button>
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="bg-gradient-to-r from-purple-600 to-teal-600 hover:from-purple-700 hover:to-teal-700 disabled:from-gray-300 disabled:to-gray-400 text-white font-semibold py-2 px-5 rounded-lg transition"
        >
          {downloading ? 'PDF 생성 중...' : '📄 PDF 다운로드'}
        </button>
      </div>

      {/* 수료증 본체 */}
      <div className="overflow-x-auto">
        <div
          ref={certRef}
          style={{
            width: '1100px',
            height: '780px',
            margin: '0 auto',
            backgroundColor: '#ffffff',
            position: 'relative',
            padding: '60px 80px',
            border: '8px double #6b46c1',
            boxSizing: 'border-box',
            fontFamily: '"Noto Sans KR", system-ui, -apple-system, sans-serif',
          }}
        >
          {/* 외곽 데코 보더 */}
          <div style={{
            position: 'absolute', inset: '20px',
            border: '2px solid #c7a8eb',
            pointerEvents: 'none',
          }} />

          {/* 상단 로고/타이틀 영역 */}
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <div style={{
              fontSize: '24px', fontWeight: 700,
              color: '#6b46c1', letterSpacing: '4px',
              marginBottom: '8px',
            }}>
              iLINE
            </div>
            <div style={{ height: '2px', width: '120px', background: 'linear-gradient(90deg, #6b46c1, #14b8a6)', margin: '0 auto' }} />
          </div>

          {/* 수료증 타이틀 */}
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <h1 style={{
              fontSize: '64px', fontWeight: 900,
              color: '#1a1a1a',
              letterSpacing: '20px',
              margin: 0,
              paddingLeft: '20px',
            }}>
              수 료 증
            </h1>
          </div>

          {/* 본문 */}
          <div style={{ textAlign: 'center', marginBottom: '50px' }}>
            <div style={{ fontSize: '18px', color: '#555', marginBottom: '24px' }}>
              제 {courseId.slice(0, 8).toUpperCase()} 호
            </div>
            <div style={{
              display: 'inline-block',
              fontSize: '32px', fontWeight: 700,
              color: '#1a1a1a',
              borderBottom: '2px solid #6b46c1',
              padding: '0 40px 6px',
              marginBottom: '32px',
            }}>
              {userProfile?.name || '학습자'}
            </div>
            <p style={{ fontSize: '20px', color: '#333', lineHeight: 1.8, margin: 0 }}>
              위 사람은 <strong style={{ color: '#6b46c1' }}>「{course.title}」</strong> 과정을<br />
              성실히 이수하였기에 이 수료증을 수여합니다.
            </p>
          </div>

          {/* 정보 박스 */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '60px',
            marginBottom: '50px',
            fontSize: '16px',
            color: '#444',
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: 700, marginBottom: '6px', color: '#6b46c1' }}>교육 기간</div>
              <div>{course.startDate} ~ {course.endDate}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: 700, marginBottom: '6px', color: '#6b46c1' }}>교육 장소</div>
              <div>{course.location}</div>
            </div>
            {course.instructor && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontWeight: 700, marginBottom: '6px', color: '#6b46c1' }}>강사</div>
                <div>{course.instructor}</div>
              </div>
            )}
          </div>

          {/* 발급일 + 발급기관 */}
          <div style={{
            position: 'absolute',
            bottom: '80px', left: 0, right: 0,
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '20px', color: '#1a1a1a', marginBottom: '20px', letterSpacing: '4px' }}>
              {issuedDate}
            </div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#1a1a1a', letterSpacing: '8px' }}>
              iLINE 교육원
            </div>
            <div style={{
              display: 'inline-block',
              marginTop: '12px',
              padding: '8px 20px',
              border: '3px solid #c41e3a',
              borderRadius: '50%',
              color: '#c41e3a',
              fontSize: '14px',
              fontWeight: 700,
              letterSpacing: '4px',
            }}>
              印
            </div>
          </div>
        </div>
      </div>

      <p className="text-center text-xs text-gray-400 mt-4">
        모니터 환경에 따라 화면 표시가 PDF와 약간 다를 수 있습니다
      </p>
    </div>
  );
}

export default function CertificatePage({ params }: Props) {
  return (
    <AuthGuard>
      <CertificateContent courseId={params.courseId} />
    </AuthGuard>
  );
}
