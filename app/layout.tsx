import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'iLINE - 지능소프트웨어교육연구소',
  description: 'AI 교육 플랫폼 - 초중고 학생과 교사를 위한 인공지능 교육',
  keywords: ['AI 교육', '인공지능', '코딩 교육', '소프트웨어 교육'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-gray-50 antialiased">
        {children}
      </body>
    </html>
  )
}
