import Link from 'next/link';

export const metadata = { title: '이용약관 · iLINE' };

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-teal-50 px-4 py-12">
      <div className="max-w-3xl mx-auto bg-white/90 backdrop-blur-xl rounded-3xl shadow-lg border border-white/50 p-8 sm:p-12">
        <div className="flex items-center justify-between mb-8">
          <Link href="/" className="text-2xl font-bold gradient-text">iLINE</Link>
          <Link href="/signup" className="text-sm text-purple-600 hover:text-purple-700 font-medium">회원가입으로 돌아가기 →</Link>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">이용약관</h1>
        <p className="text-sm text-gray-500 mb-10">최종 개정일 : 2026년 5월 9일</p>

        <div className="prose prose-sm sm:prose-base max-w-none text-gray-700 leading-relaxed space-y-8">

          <section>
            <h2 className="text-xl font-bold text-gray-900 mt-0">제1조 (목적)</h2>
            <p>본 약관은 iSERI(이하 &ldquo;회사&rdquo;)가 운영하는 iLINE 서비스(이하 &ldquo;서비스&rdquo;)를 이용함에 있어, 회사와 회원의 권리·의무 및 책임 사항, 기타 필요한 사항을 규정함을 목적으로 합니다.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900">제2조 (정의)</h2>
            <ol className="list-decimal pl-5 space-y-1">
              <li>&ldquo;서비스&rdquo;란 회사가 제공하는 온라인·오프라인 교육 콘텐츠, 학습 관리, 보상 프로그램(그뤠잇) 등 일체의 서비스를 말합니다.</li>
              <li>&ldquo;회원&rdquo;이란 본 약관에 동의하고 회사와 이용 계약을 체결한 자를 말합니다.</li>
              <li>&ldquo;청소년 회원&rdquo;이란 회원가입 시 본인을 청소년(만 19세 미만)으로 등록한 회원을 말합니다.</li>
              <li>&ldquo;그뤠잇&rdquo;이란 회사가 학습 활동 등에 대한 보상으로 청소년 회원에게 지급하는 가상의 포인트를 말합니다.</li>
            </ol>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900">제3조 (약관의 게시와 개정)</h2>
            <ol className="list-decimal pl-5 space-y-1">
              <li>회사는 본 약관의 내용을 회원이 쉽게 알 수 있도록 서비스 초기 화면 또는 회원가입 화면에 게시합니다.</li>
              <li>회사는 관련 법령에 위배되지 않는 범위에서 본 약관을 개정할 수 있으며, 개정 시 적용일자 및 개정 사유를 명시하여 적용일자 7일 전부터 공지합니다. 다만 회원에게 불리한 변경의 경우 30일 전부터 공지합니다.</li>
              <li>회원이 개정 약관 시행일 이후에도 서비스를 계속 이용하는 경우 개정 약관에 동의한 것으로 봅니다.</li>
            </ol>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900">제4조 (회원가입 및 자격)</h2>
            <ol className="list-decimal pl-5 space-y-1">
              <li>회원가입은 신청자가 본 약관 및 개인정보 처리방침의 내용에 동의하고, 회사가 정한 양식에 따라 회원 정보를 기입한 후 회사가 이를 승낙함으로써 체결됩니다.</li>
              <li>회사는 다음 각 호의 경우 회원가입 신청을 거절하거나 사후에 이용계약을 해지할 수 있습니다.
                <ul className="list-disc pl-5 mt-1 space-y-1">
                  <li>실명이 아니거나 타인의 명의를 도용한 경우</li>
                  <li>허위 정보를 기재하거나 회사가 요구하는 내용을 기재하지 않은 경우</li>
                  <li>기타 회원으로 등록하는 것이 회사의 운영 및 다른 회원에게 현저히 지장이 있다고 판단되는 경우</li>
                </ul>
              </li>
            </ol>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900">제5조 (회원의 의무)</h2>
            <ol className="list-decimal pl-5 space-y-1">
              <li>회원은 가입 신청 또는 정보 변경 시 모든 사항을 사실에 근거하여 작성하여야 합니다.</li>
              <li>회원은 자신의 계정 정보를 제3자에게 양도·대여할 수 없으며, 관리 부주의로 인해 발생하는 손해에 대한 책임은 회원 본인에게 있습니다.</li>
              <li>회원은 서비스 이용 시 관련 법령, 본 약관, 운영 정책 및 회사가 통지하는 사항을 준수하여야 합니다.</li>
            </ol>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900">제6조 (서비스의 제공 및 변경)</h2>
            <ol className="list-decimal pl-5 space-y-1">
              <li>회사는 다음과 같은 서비스를 제공합니다.
                <ul className="list-disc pl-5 mt-1 space-y-1">
                  <li>AI·디지털 윤리 등 온라인 교육 콘텐츠</li>
                  <li>오프라인 강좌 안내 및 신청</li>
                  <li>학습 진도 관리 및 수료증 발급</li>
                  <li>청소년 대상 그뤠잇 적립 및 보상 교환</li>
                  <li>그 외 회사가 추가 개발하거나 제휴를 통해 제공하는 일체의 서비스</li>
                </ul>
              </li>
              <li>회사는 서비스의 내용·운영상·기술상 필요에 따라 제공하는 서비스의 전부 또는 일부를 변경할 수 있습니다.</li>
            </ol>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900">제7조 (그뤠잇 정책)</h2>
            <ol className="list-decimal pl-5 space-y-1">
              <li>그뤠잇은 회사가 청소년 회원에게 학습 활동에 대한 동기 부여를 위해 무상으로 지급하는 가상의 포인트로서, 환금성이 없으며 양도 및 현금 교환이 불가능합니다.</li>
              <li>그뤠잇은 본 서비스 내에서 회사가 지정한 보상 상품의 교환에만 사용할 수 있으며, 각 보상 상품에 표시된 교환 가능 기간이 경과하면 해당 상품으로의 교환이 제한될 수 있습니다.</li>
              <li>회사는 부정한 방법으로 그뤠잇을 적립하거나 사용한 것이 확인된 경우 해당 그뤠잇을 회수하거나 회원 자격을 정지할 수 있습니다.</li>
              <li>회원이 탈퇴하는 경우 보유한 그뤠잇은 자동으로 소멸되며 복구되지 않습니다.</li>
            </ol>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900">제8조 (서비스 이용의 제한)</h2>
            <p>회원이 다음 각 호에 해당하는 행위를 한 경우, 회사는 사전 통지 없이 서비스 이용을 일시 정지하거나 회원 자격을 박탈할 수 있습니다.</p>
            <ul className="list-disc pl-5 mt-1 space-y-1">
              <li>타인의 정보 도용, 허위 정보 등록</li>
              <li>회사 또는 제3자의 지적재산권 침해</li>
              <li>다른 회원에 대한 욕설·비방·괴롭힘</li>
              <li>서비스의 정상적인 운영을 방해하는 일체의 행위</li>
              <li>관련 법령 또는 본 약관이 금지하는 기타 행위</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900">제9조 (회원 탈퇴)</h2>
            <ol className="list-decimal pl-5 space-y-1">
              <li>회원은 언제든지 서비스 내 메뉴 또는 회사가 안내하는 절차에 따라 탈퇴를 신청할 수 있으며, 회사는 즉시 처리합니다.</li>
              <li>탈퇴 시 보유 그뤠잇, 수강 이력 등 회원과 관련된 일체의 데이터는 회사의 개인정보 처리방침에 따라 처리됩니다.</li>
            </ol>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900">제10조 (면책)</h2>
            <ol className="list-decimal pl-5 space-y-1">
              <li>회사는 천재지변, 전쟁, 통신 장애 등 불가항력으로 인하여 서비스를 제공할 수 없는 경우 책임을 지지 않습니다.</li>
              <li>회사는 회원의 귀책 사유로 인한 서비스 이용 장애에 대하여 책임을 지지 않습니다.</li>
              <li>회사는 회원이 서비스를 통해 기대하는 학습 효과를 보증하지 않습니다.</li>
            </ol>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900">제11조 (준거법 및 분쟁의 해결)</h2>
            <p>본 약관과 관련된 분쟁은 대한민국 법을 준거법으로 하며, 회사와 회원 간에 발생한 분쟁은 민사소송법상 관할 법원에 제소합니다.</p>
          </section>

          <section className="border-t border-gray-200 pt-6">
            <p className="text-xs text-gray-500">부칙 : 본 약관은 2026년 5월 9일부터 시행합니다.</p>
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
