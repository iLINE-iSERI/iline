/**
 * iline.or.kr 루트 — 인트로 허브 (작업지시서 A″안 · D-1 · D-20 · 09-13 구현)
 *
 * 연구소의 두 서비스로 갈라 보내는 첫 화면이다.
 *   iLINE 온라인 AI 교육 플랫폼  → /home            (예전 루트 랜딩 — 그대로 옮김)
 *   교원양성지원사업               → aiedu.iline.or.kr (별도 레포·별도 배포)
 *
 * 기존 iLINE 의 Header/Footer 를 쓰지 않는다 — 로그인 상태·강의 메뉴가 붙은
 * 학습 플랫폼 헤더이고, 여기는 어느 서비스에도 속하지 않은 갈림길이기 때문이다.
 * 색·글꼴은 intro.module.css 한 곳에만 있다 (연구소 CI 반영 시 그 파일만).
 *
 * 로그인한 iLINE 이용자가 북마크로 / 에 들어와도 카드 한 번이면 /home 이다 —
 * 별도 리다이렉트는 두지 않는다 (D-21).
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import s from './intro.module.css'

export const metadata: Metadata = {
  title: 'iLINE — 제주대학교 지능소프트웨어교육연구소',
  description:
    '제주대학교 지능소프트웨어교육연구소의 온라인 AI 교육 플랫폼과 교원양성지원사업 사이트로 안내합니다.',
}

/** 교원양성지원사업 사이트 — 도메인이 바뀌면 여기만 */
const SUPPORT_URL = 'https://aiedu.iline.or.kr'

export default function IntroHubPage() {
  return (
    <div className={s.intro}>
      {/* 상단 띠 */}
      <header className={s.top}>
        <div className={s.topInner}>
          {/* 로그인 링크는 두지 않는다 (09-13 iSERI) — 갈림길에는 서비스 선택만 */}
          <div className={s.brand}>
            <Image src="/logo.png" alt="iLINE" width={120} height={40} priority />
          </div>
        </div>
      </header>

      <main>
        {/* 바다·하늘 + 오름 능선 */}
        <section className={s.hero} aria-labelledby="intro-title">
          {/* 연구소 이름이 주인공, 안내는 한 줄 (09-13 iSERI) */}
          <div className={s.heroInner}>
            <h1 id="intro-title" className={s.org}>
              제주대학교 지능소프트웨어교육연구소
            </h1>
            <p className={s.title}>이용하실 서비스를 선택해주세요.</p>
          </div>

          {/* 해 — CI 주황이 맡는 유일한 자리. 바다 위 하늘에 하나 (09-13 iSERI: 점은 뜬금없다) */}
          <span className={s.sun} aria-hidden="true" />

          {/* 오름 능선 — 도형 세 겹. 사진 없음 (가벼움·저작권 없음) */}
          <svg
            className={s.ridge}
            viewBox="0 0 1440 190"
            preserveAspectRatio="none"
            aria-hidden="true"
            focusable="false"
          >
            {/* 로고 CI 세 색 — 파랑 #1268B3 · 청남 #0190AF · 청록 #01B8A4 을 옅게 */}
            <path
              d="M0 120 C 180 60, 300 60, 460 110 S 760 150, 900 100 S 1200 40, 1440 95 L1440 190 L0 190 Z"
              fill="rgba(18, 104, 179, 0.16)"
            />
            <path
              d="M0 150 C 220 100, 380 90, 560 135 S 860 170, 1040 130 S 1300 90, 1440 130 L1440 190 L0 190 Z"
              fill="rgba(1, 144, 175, 0.22)"
            />
            <path
              d="M0 175 C 260 145, 520 140, 760 165 S 1180 185, 1440 160 L1440 190 L0 190 Z"
              fill="rgba(1, 184, 164, 0.34)"
            />
          </svg>
        </section>

        {/* 서비스 카드 둘 — 태그 줄은 두지 않는다 (09-13 iSERI: 간결하게). 지원사업 문구는 iSERI 가 다시 줄 예정 */}
        <nav className={s.cards} aria-label="서비스 선택">
          <Link href="/home" className={`${s.card} ${s.learn}`}>
            <div className={s.cardHead} />
            <div className={s.cardBody}>
              {/* 작은 줄 = 운영 주체. iLINE 은 연구소 명의 — '사범대학' 표기 허가는 지원사업 쪽만 (09-13 iSERI) */}
              <p className={s.kicker}>지능소프트웨어교육연구소</p>
              <h2 className={s.cardTitle}>
                iLINE
                <small>온라인 AI 교육 플랫폼</small>
              </h2>
              <p className={s.cardDesc}>초·중·고 학생부터 누구나 무료로 듣는 인공지능 강의.</p>
            </div>
            {/* 대상 표시("학생 · 교사 · 일반")는 두지 않는다 — 이용자 유형을 인트로가 단정하지 않는다 (09-13 iSERI) */}
            <div className={s.cardFoot}>
              <span className={s.go}>들어가기 →</span>
            </div>
          </Link>

          <a href={SUPPORT_URL} className={`${s.card} ${s.support}`}>
            <div className={s.cardHead} />
            <div className={s.cardBody}>
              <p className={s.kicker}>한국과학창의재단 · 제주대학교 사범대학</p>
              <h2 className={s.cardTitle}>
                교원양성지원사업
                <small>예비교원을 위한 지원 프로그램</small>
              </h2>
              <p className={s.cardDesc}>다양한 지원 프로그램과 학습시설 이용까지 한곳에서.</p>
            </div>
            <div className={s.cardFoot}>
              <span className={s.go}>들어가기 →</span>
            </div>
          </a>
        </nav>

      </main>

      <footer className={s.footer}>
        <div className={s.footerInner}>
          <span>© {new Date().getFullYear()} 제주대학교 지능소프트웨어교육연구소 iLINE</span>
          <nav className={s.footerLinks} aria-label="약관">
            <Link href="/terms">이용약관</Link>
            <Link href="/privacy">개인정보 처리방침</Link>
          </nav>
        </div>
      </footer>
    </div>
  )
}
