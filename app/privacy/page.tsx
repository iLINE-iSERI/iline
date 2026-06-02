import Link from 'next/link';

export const metadata = { title: '개인정보 처리방침 · iLINE' };

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-teal-50 px-4 py-12">
      <div className="max-w-3xl mx-auto bg-white/90 backdrop-blur-xl rounded-3xl shadow-lg border border-white/50 p-8 sm:p-12">
        <div className="flex items-center justify-between mb-8">
          <Link href="/" className="text-2xl font-bold gradient-text">iLINE</Link>
          <Link href="/signup" className="text-sm text-purple-600 hover:text-purple-700 font-medium">회원가입으로 돌아가기 →</Link>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">개인정보 처리방침</h1>
        <p className="text-sm text-gray-500 mb-10">최종 개정일 : 2026년 5월 9일</p>

        <div className="prose prose-sm sm:prose-base max-w-none text-gray-700 leading-relaxed space-y-8">

          <section>
            <p>iSERI(이하 &ldquo;회사&rdquo;)는 「개인정보 보호법」 및 관련 법령에 따라 회원의 개인정보를 보호하고 이와 관련한 고충을 신속하게 처리할 수 있도록 본 처리방침을 수립·공개합니다.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mt-0">제1조 (수집하는 개인정보 항목)</h2>
            <p>회사는 다음의 정보를 회원가입·서비스 제공 시 수집합니다.</p>
            <div className="bg-gray-50 rounded-xl p-4 mt-2">
              <p className="font-semibold mb-1">필수 항목</p>
              <p>이름, 이메일 주소, 비밀번호, 휴대전화번호, 생년월일, 성별, 구분(청소년/성인), 소속</p>
              <p className="font-semibold mt-3 mb-1">서비스 이용 과정에서 자동 수집되는 항목</p>
              <p>학습 진도, 수강 기록, 그뤠잇 적립/사용 내역, 게시판 활동, 접속 로그, 접속 IP</p>
              <p className="font-semibold mt-3 mb-1">오프라인 강좌 신청 시 추가</p>
              <p>응급 연락처, 보호자 연락처(청소년의 경우), 알레르기 등 강좌 운영에 필요한 정보</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900">제2조 (개인정보 수집·이용 목적)</h2>
            <ol className="list-decimal pl-5 space-y-1">
              <li>회원 식별 및 본인 확인, 부정 이용 방지</li>
              <li>온라인·오프라인 교육 콘텐츠 제공 및 학습 진도 관리</li>
              <li>청소년 회원 대상 그뤠잇 적립·교환 및 보상 발송</li>
              <li>공지사항, 강좌 안내 등 서비스 운영 관련 통지</li>
              <li>고객 문의 응대, 분쟁 처리</li>
              <li>(선택 동의 시) 마케팅·이벤트 정보 안내</li>
            </ol>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900">제3조 (개인정보 보유 및 이용기간)</h2>
            <ol className="list-decimal pl-5 space-y-1">
              <li>회사는 회원 탈퇴 시까지 회원의 개인정보를 보유합니다.</li>
              <li>회원 탈퇴 후에는 관련 법령에 따라 다음 기간 동안 보존됩니다.
                <ul className="list-disc pl-5 mt-1 space-y-1">
                  <li>계약 또는 청약 철회 등에 관한 기록 : 5년 (전자상거래법)</li>
                  <li>대금 결제 및 재화 등의 공급에 관한 기록 : 5년 (전자상거래법)</li>
                  <li>소비자 불만 또는 분쟁 처리에 관한 기록 : 3년 (전자상거래법)</li>
                  <li>웹사이트 방문 기록 : 3개월 (통신비밀보호법)</li>
                </ul>
              </li>
            </ol>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900">제4조 (개인정보의 제3자 제공)</h2>
            <p>회사는 회원의 개인정보를 본 처리방침 제2조에서 명시한 범위 내에서 처리하며, 회원의 사전 동의 없이 제3자에게 제공하지 않습니다. 다만, 다음 각 호에 해당하는 경우는 예외로 합니다.</p>
            <ul className="list-disc pl-5 mt-1 space-y-1">
              <li>회원이 사전에 명시적으로 동의한 경우</li>
              <li>법령에 특별한 규정이 있거나 수사 목적으로 법령에 정해진 절차와 방법에 따라 수사기관의 요구가 있는 경우</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900">제5조 (개인정보 처리의 위탁)</h2>
            <p>회사는 원활한 서비스 제공을 위해 다음과 같이 개인정보 처리 업무를 위탁하고 있습니다.</p>
            <div className="bg-gray-50 rounded-xl p-4 mt-2 text-sm">
              <p>• Google LLC (Firebase Authentication, Cloud Firestore, Cloud Storage) — 회원 인증 및 데이터 저장</p>
              <p>• Vercel Inc. — 웹 호스팅</p>
              <p>• Google LLC (YouTube) — 강좌 영상 스트리밍</p>
            </div>
            <p className="mt-2 text-sm text-gray-500">위탁 업체의 변경이 발생할 경우 본 처리방침을 통해 사전 공지합니다.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900">제6조 (정보주체의 권리·의무)</h2>
            <p>회원은 언제든지 다음 권리를 행사할 수 있습니다.</p>
            <ol className="list-decimal pl-5 space-y-1">
              <li>개인정보 열람·정정·삭제 요구</li>
              <li>처리 정지 요구</li>
              <li>동의 철회 (서비스 내 메뉴 또는 고객센터를 통해 요청 가능)</li>
            </ol>
            <p className="mt-2">권리 행사는 회원이 직접 또는 법정대리인을 통해 가능하며, 회사는 정당한 요청에 대해 지체 없이 조치합니다.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900">제7조 (만 14세 미만 아동의 개인정보)</h2>
            <p>회사는 만 14세 미만 아동의 개인정보를 수집하는 경우, 법정대리인의 동의를 얻은 후 수집합니다. 법정대리인은 아동의 개인정보 열람·정정·삭제·동의 철회를 요청할 수 있으며, 회사는 정당한 요청에 대해 지체 없이 조치합니다.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900">제8조 (개인정보의 파기)</h2>
            <ol className="list-decimal pl-5 space-y-1">
              <li>회사는 개인정보 보유기간의 경과, 처리 목적 달성 등 개인정보가 불필요하게 되었을 때에는 지체 없이 해당 개인정보를 파기합니다.</li>
              <li>전자적 파일 형태의 정보는 기록을 재생할 수 없는 기술적 방법을 사용하여 삭제하며, 종이 문서는 분쇄하거나 소각합니다.</li>
            </ol>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900">제9조 (개인정보 보호 책임자)</h2>
            <div className="bg-gray-50 rounded-xl p-4 mt-2 text-sm">
              <p>• 책임자 : iLINE 운영팀</p>
              <p>• 이메일 : <a href="mailto:iline.iseri@gmail.com" className="text-purple-600 hover:underline">iline.iseri@gmail.com</a></p>
            </div>
            <p className="mt-2 text-sm">개인정보 보호와 관련한 문의·불만 처리·피해 구제는 위 연락처로 접수해 주시면 신속하게 답변·처리해 드리겠습니다.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900">제10조 (개인정보 처리방침의 변경)</h2>
            <p>본 처리방침은 법령·정책 또는 보안 기술의 변경에 따라 내용의 추가·삭제 및 수정이 있을 수 있으며, 변경 시 적용일자 7일 전부터 공지합니다. 다만 회원 권리에 중대한 영향을 미치는 경우 30일 전부터 공지합니다.</p>
          </section>

          <section className="border-t border-gray-200 pt-6">
            <p className="text-xs text-gray-500">부칙 : 본 처리방침은 2026년 5월 9일부터 시행합니다.</p>
          </section>
        </div>

        <div className="mt-10 flex justify-center">
          <Link href="/signup" className="bg-gradient-to-r from-purple-600 to-teal-600 hover:from-purple-700 hover:to-teal-700 text-white font-semibold py-3 px-8 rounded-xl transition-all hover:shadow-lg">
            회원가입으로 돌아가기
          </Link>
        </div>
      </div>
    </div>
  );
}
