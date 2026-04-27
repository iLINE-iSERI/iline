// 하단 푸터 컴포넌트
import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* 브랜드 */}
          <div className="md:col-span-2">
            <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-teal-400 bg-clip-text text-transparent">
              iLINE
            </span>
            <p className="mt-3 text-sm leading-relaxed max-w-sm">
              지능소프트웨어교육연구소
              <br />
              초중고 학생과 교사를 위한 무료 AI 교육 플랫폼
            </p>
            <div className="mt-4 flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-900/50 text-teal-400 text-xs font-medium">
                <span className="w-1.5 h-1.5 bg-teal-400 rounded-full" />
                무료 운영
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-900/50 text-purple-400 text-xs font-medium">
                공공 교육
              </span>
            </div>
          </div>

          {/* 바로가기 */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">바로가기</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/courses" className="hover:text-purple-400 transition-colors">
                  강의 목록
                </Link>
              </li>
              <li>
                <Link href="/board/notice" className="hover:text-purple-400 transition-colors">
                  공지사항
                </Link>
              </li>
              <li>
                <Link href="/board/resource" className="hover:text-purple-400 transition-colors">
                  자료실
                </Link>
              </li>
            </ul>
          </div>

          {/* 문의 */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">문의</h4>
            <p className="text-sm">
              이메일: iline.iseri@gmail.com
            </p>
          </div>
        </div>

        <div className="mt-10 pt-8 border-t border-gray-800 text-center text-sm">
          <p>&copy; {new Date().getFullYear()} iLINE 지능소프트웨어교육연구소. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
