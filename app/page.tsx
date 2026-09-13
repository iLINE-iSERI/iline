/**
 * iline.or.kr 루트 — 인트로 허브 (작업지시서 A″안 · D-1 · D-20 · 09-13 구현)
 *
 * 연구소의 두 서비스로 갈라 보내는 첫 화면이다.
 *   iLINE 온라인 AI 교육 플랫폼  → /home            (예전 루트 랜딩 — 그대로 옮김)
 *   교원양성지원사업               → aiedu.iline.or.kr (별도 레포·별도 배포)
 *
 * 기존 iLINE 의 Header/Footer 를 쓰지 않는다 — 로그인 상태·강의 메뉴가 붙은
 * 학습 플랫폼 헤더이고, 여기는 어느 서비스에도 속하지 않은 갈림길이기 때문이다.
 * 색·글꼴은 intro.module.css 한 곳에만 있다.
 * 09-13 iSERI 「UI/UX 개선 지시서」대로 재구성 — 능선은 맨 아래로, 카드 뒤는 비움.
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

      <main className={s.main}>
        {/* 히어로 — 2차 지시서 §2: 제목 · 부제 두 줄만 (기관명 라벨은 카드와 겹쳐 뺌) */}
        <section className={s.hero} aria-labelledby="intro-title">
          <div className={s.heroInner}>
            <h1 id="intro-title" className={s.title}>
              이용하실 서비스를 선택해 주세요
            </h1>
            <p className={s.lead}>제주대학교 지능소프트웨어교육연구소 교육·지원 플랫폼</p>
          </div>
        </section>

        {/* 서비스 카드 둘 — 지시서 §2-B. 링크·문구는 그대로 */}
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

        {/* 제주 상징 — 2차 지시서 §3: 한라산(백록담) 능선 · 오름 · 해.
            전부 미니멀 플랫 실루엣, 극도로 옅게. 카드 아래·푸터 위에만 있고
            pointer-events 없음 — 클릭·호버를 막지 않는다.
            돌하르방 실루엣은 09-13 시도 뒤 뺐다 — 옅은 실루엣으로는 표정이 안 살아 어색함 (iSERI) */}
        <div className={s.land} aria-hidden="true">
          {/* 해 — 오른쪽 위 구석, 한라산 능선보다 위 하늘에. CI 주황이 맡는 유일한 자리 */}
          <span className={s.sun} />
          <svg className={s.ridge} viewBox="0 0 1440 220" preserveAspectRatio="none" focusable="false">
            {/* 한라산 — 오른쪽에 치우친 큰 산, 정상은 백록담처럼 뚜렷하게 파임. 오름보다 한 단 진하게 (09-13 iSERI) */}
            <path
              d="M520 220 C 700 180, 840 112, 960 66 C 990 54, 1010 52, 1030 60 C 1042 70, 1056 75, 1072 75 C 1088 75, 1102 70, 1114 60 C 1134 52, 1154 54, 1184 66 C 1290 108, 1380 160, 1440 190 L1440 220 Z"
              fill="rgba(60, 106, 179, 0.11)"
            />
            {/* 오름 능선 세 겹 */}
            <path
              d="M0 160 C 200 90, 380 90, 560 145 S 900 200, 1100 140 S 1340 80, 1440 120 L1440 220 L0 220 Z"
              fill="rgba(60, 106, 179, 0.05)"
            />
            <path
              d="M0 185 C 240 135, 420 130, 640 170 S 980 210, 1180 165 S 1360 130, 1440 155 L1440 220 L0 220 Z"
              fill="rgba(0, 177, 157, 0.08)"
            />
            <path
              d="M0 205 C 300 175, 560 170, 800 195 S 1220 215, 1440 190 L1440 220 L0 220 Z"
              fill="rgba(0, 177, 157, 0.12)"
            />
          </svg>
        </div>
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
