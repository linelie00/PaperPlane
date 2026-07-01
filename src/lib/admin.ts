// 개발자(관리자) 게이팅. ADMIN_EMAILS 환경변수(콤마 구분)에 포함된 이메일만 허용한다.
export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const raw = process.env.ADMIN_EMAILS;
  if (!raw) return false;
  const allow = raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return allow.includes(email.toLowerCase());
}
