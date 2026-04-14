export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 인증 페이지 레이아웃 (헤더/풋터 없음)
  return <>{children}</>;
}
