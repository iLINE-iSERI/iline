// 홈 페이지 (랜딩)
import Link from 'next/link'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { HeroButtons, CtaButton } from '@/components/home/ActionButton'

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        {/* 히어로 섹션 */}
        <section className="relative overflow-hidden text-white min-h-[600px] flex items-center" style={{background: 'linear-gradient(135deg, #0d9488 0%, #0891b2 30%, #2563eb 60%, #7e22ce 100%)'}}>
          <div className="absolute top-20 left-10 w-72 h-72 bg-teal-300/20 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-300/20 rounded-full blur-3xl animate-float-delay" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/5 rounded-full blur-3xl" />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
            <div className="text-center animate-fade-in-up">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-dark text-sm font-medium mb-8">
                <span className="w-2 h-2 bg-teal-300 rounded-full animate-pulse-soft" />
                AI 공공 교육 플랫폼
              </div>
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
                나에게 딱 맞는 인공지능 라인
                <br />
                <span className="bg-gradient-to-r from-teal-200 to-cyan-200 bg-clip-text text-transparent">
                
                </span>
              </h1>
              <p className="text-lg md:text-xl text-blue-100 mb-10 max-w-2xl mx-auto leading-relaxed">
                모두를 위한 체계적인 인공지능 교육 플랫폼.
                <br className="hidden sm:block" />
                동영상 강의와 실습으로 AI 역량을 키워보세요.
              </p>
              <HeroButtons />
              <div className="mt-16 grid grid-cols-3 gap-8 max-w-lg mx-auto">
                <div className="text-center">
                  <div className="text-3xl md:text-4xl font-bold text-white">K-12</div>
                  <div className="text-sm text-blue-200 mt-1"> 초중고 학생 콘텐츠 </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl md:text-4xl font-bold text-white">-100</div>
                  <div className="text-sm text-blue-200 mt-1"> 다양한 콘텐츠 </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl md:text-4xl font-bold text-white">Free</div>
                  <div className="text-sm text-blue-200 mt-1">무료 콘텐츠</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 특징 섹션 */}
        <section className="py-20 md:py-28 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-100 text-teal-700 text-sm font-medium mb-4">
               iLINE은
              </div>
              <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">
                AI 학습을 위한 <span className="bg-gradient-to-r from-teal-500 to-blue-500 bg-clip-text text-transparent">최적의 환경</span>
              </h2>
              <p className="text-gray-500 text-lg max-w-xl mx-auto">
                유아부터 시니어까지 모두를 위한 체계적이고 직관적인 교육을 제공합니다
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="card-hover group relative bg-gradient-to-br from-teal-50 to-white p-8 rounded-3xl border border-teal-100">
                <div className="w-16 h-16 bg-gradient-to-br from-teal-400 to-teal-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-teal-200 group-hover:scale-110 transition-transform">
                  <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24">
                    <rect x="2" y="4" width="20" height="14" rx="3" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                    <path d="M9.5 8.5L15 12L9.5 15.5V8.5Z" fill="currentColor"/>
                    <circle cx="12" cy="21" r="1" fill="currentColor"/>
                    <path d="M8 21h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">동영상 강의</h3>
                <p className="text-gray-600 leading-relaxed">전문 강사진이 제작한 체계적인 AI 교육 영상으로 언제 어디서나 학습하세요.</p>
              </div>
              <div className="card-hover group relative bg-gradient-to-br from-blue-50 to-white p-8 rounded-3xl border border-blue-100">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-blue-200 group-hover:scale-110 transition-transform">
                  <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                    <path d="M12 6v6l4.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    <circle cx="12" cy="12" r="2" fill="currentColor" opacity="0.3"/>
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">학습 진도 관리</h3>
                <p className="text-gray-600 leading-relaxed">개인별 학습 진도를 자동으로 추적하고 완료 현황을 한눈에 확인하세요.</p>
              </div>
              <div className="card-hover group relative bg-gradient-to-br from-cyan-50 to-white p-8 rounded-3xl border border-cyan-100">
                <div className="w-16 h-16 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-cyan-200 group-hover:scale-110 transition-transform">
                  <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24">
                    <path d="M4 19.5C4 18.1 5.1 17 6.5 17H20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                    <path d="M9 7h6M9 11h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    <circle cx="15" cy="13" r="2.5" stroke="currentColor" strokeWidth="1.2" fill="none"/>
                    <path d="M16.8 14.8L18 16" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">체계적 커리큘럼</h3>
                <p className="text-gray-600 leading-relaxed">AI 기초부터 AI 윤리, 코딩까지. 교육과정에 맞춘 단계별 학습 경로를 제공합니다.</p>
              </div>
            </div>
          </div>
        </section>

        {/* 카테고리 미리보기 */}
        <section className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">학습 카테고리</h2>
              <p className="text-gray-500 text-lg">관심 분야를 선택하고 학습을 시작하세요</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Link href="/courses" className="card-hover group relative overflow-hidden rounded-3xl bg-gradient-to-br from-teal-500 to-teal-700 p-8 text-white min-h-[200px] flex flex-col justify-end">
                <div className="absolute top-4 right-4 text-4xl opacity-30">🤖</div>
                <div className="text-sm font-medium text-teal-200 mb-2">AI BASICS</div>
                <h3 className="text-2xl font-bold mb-2">AI 기초</h3>
                <p className="text-teal-200 text-sm">인공지능의 기본 개념과 원리를 배워보세요</p>
              </Link>
              <Link href="/courses" className="card-hover group relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-500 to-blue-700 p-8 text-white min-h-[200px] flex flex-col justify-end">
                <div className="absolute top-4 right-4 text-4xl opacity-30">💡</div>
                <div className="text-sm font-medium text-blue-200 mb-2">AI ETHICS</div>
                <h3 className="text-2xl font-bold mb-2">AI 윤리</h3>
                <p className="text-blue-200 text-sm">인공지능과 윤리적 사고를 함께 키워보세요</p>
              </Link>
              <Link href="/courses" className="card-hover group relative overflow-hidden rounded-3xl bg-gradient-to-br from-cyan-500 to-cyan-700 p-8 text-white min-h-[200px] flex flex-col justify-end">
                <div className="absolute top-4 right-4 text-4xl opacity-30">💻</div>
                <div className="text-sm font-medium text-cyan-200 mb-2">CODING</div>
                <h3 className="text-2xl font-bold mb-2">코딩</h3>
                <p className="text-cyan-200 text-sm">프로그래밍의 기초부터 실습까지 도전하세요</p>
              </Link>
            </div>
          </div>
        </section>

        {/* CTA 섹션 */}
        <section className="relative overflow-hidden py-20">
          <div className="absolute inset-0" style={{background: 'linear-gradient(135deg, #134e4a 0%, #164e63 40%, #1e3a8a 70%, #581c87 100%)'}} />
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
          <div className="relative max-w-4xl mx-auto px-4 text-center text-white">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">지금 바로 시작하세요</h2>
            <p className="text-blue-200 text-lg mb-10 max-w-xl mx-auto">
              무료 계정으로 모든 강의를 수강할 수 있습니다.
              초중고 학생과 교사 누구나 환영합니다.
            </p>
            <CtaButton />
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
