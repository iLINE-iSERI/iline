// 하단 푸터 컴포넌트
export default function Footer() {
  return (
    <footer className="bg-gray-800 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-white font-bold text-lg mb-3">iLINE</h3>
            <p className="text-sm">
              지능소프트웨어교육연구소
              <br />
              AI 교육의 새로운 기준
            </p>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-3">바로가기</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="/courses" className="hover:text-white transition-colors">강의 목록</a></li>
              <li><a href="/board/notice" className="hover:text-white transition-colors">공지사항</a></li>
              <li><a href="/board/resource" className="hover:text-white transition-colors">자료실</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-3">문의</h4>
            <p className="text-sm">
              이메일: iline.iseri@gmail.com
            </p>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-gray-700 text-center text-sm">
          <p>&copy; {new Date().getFullYear()} iLINE 지능소프트웨어교육연구소. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
