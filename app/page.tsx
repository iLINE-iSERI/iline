// 홈 페이지 (랜딩)
import Link from 'next/link'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* 히어로 섹션 */}
        <section className="relative overflow-hidden bg-gradient-hero text-white min-h-[600px] flex items-center">
          <div className="absolute top-20 left-10 w-72 h-72 bg-purple-400/20 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-teal-400/20 rounded-full blur-3xl animate-float-delay" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/5 rounded-full blur-3xl" />

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
            <div className="text-center animate-fade-in-up">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-dark text-sm font-medium mb-8">
                <span className="w-2 h-2 bg-teal-400 rounded-full animate-pulse-soft" />
                AI 공공 교육 플랫폼
              </div>

              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
                나에게 딱 맞는 인공지능 라인
                <br />
                <span className="bg-gradient-to-r from-teal-300 to-emerald-300 bg-clip-text text-transparent">
                
                </span>
              </h1>
              <p className="text-lg md:text-xl text-purple-100 mb-10 max-w-2xl mx-auto leading-relaxed">
                모두를 위한 체계적인 인공지능 교육 플랫폼.
                <br className="hidden sm:block" />
                동영상 강의와 실습으로 AI 역량을 키워보세요.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/signup"
                  className="group relative bg-white text-purple-700 px-8 py-4 rounded-2xl font-bold text-lg hover:bg-purple-50 transition-all hover:scale-105 hover:shadow-2xl shadow-lg"
                >
                  무료로 시작하기
                  <span className="inline-block ml-2 transition-transform group-hover:translate-x-1">&rarr;</span>
                </Link>
                <Link
                  href="/courses"
                  className="glass-dark text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-white/20 transition-all"
                >
                  강의 둘러보기
                </Link>
              </div>

              <div className="mt-16 grid grid-cols-3 gap-8 max-w-lg mx-auto">
                <div className="text-center">
                  <div className="text-3xl md:text-4xl font-bold text-white">3+</div>
                  <div className="text-sm text-purple-200 mt-1"> 다양한 콘텐츠 </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl md:text-4xl font-bold text-white">Free</div>
                  <div className="text-sm text-purple-200 mt-1"> 무료 콘텐츠 </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl md:text-4xl font-bold text-white">K-12</div>
                  <div className="text-sm text-purple-200 mt-1">초중고 학생 콘텐츠</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 특징 섹션 */}
        <section className="py-20 md:py-28 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-sm font-medium mb-4">
               iLINE은
              </div>
              <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">
                AI 학습을 위한 <span className="gradient-text">최적의 환경</span>
              </h2>
              <p className="text-gray-500 text-lg max-w-xl mx-auto">
                유아부터 시니어까지 모두를 위한 체계적이고 직관적인 교육을 제공합니다
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="card-hover group relative bg-gradient-to-br from-purple-50 to-white p-8 rounded-3xl border border-purple-100">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-700 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-purple-200 group-hover:scale-110 transition-transform">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">동영상 강의</h3>
                <p className="text-gray-600 leading-relaxed">
                  전문 강사진이 제작한 체계적인 AI 교육 영상으로 언제 어디서나 학습하세요.
                </p>
              </div>

              <div className="card-hover group relative bg-gradient-to-br from-teal-50 to-white p-8 rounded-3xl border border-teal-100">
                <div className="w-14 h-14 bg-gradient-to-br from-teal-500 to-teal-700 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-teal-200 group-hover:scale-110 transition-transform">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">학습 진도 관리</h3>
                <p className="text-gray-600 leading-relaxed">
                  개인별 학습 진도를 자동으로 추적하고 완료 현황을 한눈에 확인하세요.
                </p>
              </div>

              <div className="card-hover group relative bg-gradient-to-br from-blue-50 to-white p-8 rounded-3xl border border-blue-100">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-blue-200 group-hover:scale-110 transition-transform">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">체계적 커리큘럼</h3>
                <p className="text-gray-600 leading-relaxed">
                  AI 기초부터 AI 윤리, 코딩까지. 교육과정에 맞춘 단계별 학습 경로를 제공합니다.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 카테고리 미리보기 */}
        <section className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                학습 카테고리
              </h2>
              <p className="text-gray-500 text-lg">관심 분야를 선택하고 학습을 시작하세요</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Link
                href="/courses"
                className="card-hover group relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-600 to-purple-800 p-8 text-white min-h-[200px] flex flex-col justify-end"
              >
                <div className="absolute top-4 right-4 w-20 h-20 bg-white/10 rounded-full blur-xl" />
                <div className="text-sm font-medium text-purple-200 mb-2">AI BASICS</div>
                <h3 className="text-2xl font-bold mb-2">AI 기초</h3>
                <p className="text-purple-200 text-sm">인공지능의 기본 개념과 원리를 배워보세요</p>
              </Link>

              <Link
                href="/courses"
                className="card-hover group relative overflow-hidden rounded-3xl bg-gradient-to-br from-teal-600 to-teal-800 p-8 text-white min-h-[200px] flex flex-col justify-end"
              >
                <div className="absolute top-4 right-4 w-20 h-20 bg-white/10 rounded-full blur-xl" />
                <div className="text-sm font-medium text-teal-200 mb-2">AI ETHICS</div>
                <h3 className="text-2xl font-bold mb-2">AI 윤리</h3>
                <p className="text-teal-200 text-sm">인공지능과 윤리적 사고를 함께 키워보세요</p>
              </Link>

              <Link
                href="/courses"
                className="card-hover group relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 to-blue-800 p-8 text-white min-h-[200px] flex flex-col justify-end"
              >
                <div className="absolute top-4 right-4 w-20 h-20 bg-white/10 rounded-full blur-xl" />
                <div className="text-sm font-medium text-blue-200 mb-2">CODING</div>
                <h3 className="text-2xl font-bold mb-2">코딩</h3>
                <p className="text-blue-200 text-sm">프로그래밍의 기초부터 실습까지 도전하세요</p>
              </Link>
            </div>
          </div>
        </section>

        {/* CTA 섹션 */}
        <section className="relative overflow-hidden py-20">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-purple-800 to-teal-900" />
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl" />

          <div className="relative max-w-4xl mx-auto px-4 text-center text-white">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              지금 바로 시작하세요
            </h2>
            <p className="text-purple-200 text-lg mb-10 max-w-xl mx-auto">
              무료 계정으로 모든 강의를 수강할 수 있습니다.
              초중고 학생과 교사 누구나 환영합니다.
            </p>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 bg-white text-purple-700 px-10 py-4 rounded-2xl font-bold text-lg hover:bg-purple-50 transition-all hover:scale-105 shadow-2xl"
            >
              무료 회원가입
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
