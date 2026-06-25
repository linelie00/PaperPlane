import { createHash, randomBytes } from "crypto";

// 공개 작품 본문 최대 길이 (업로드 제한)
export const MAX_ORIGINAL_TEXT_LENGTH = 50000;
// 댓글 최대 길이 (docs/04_API_SPEC.md)
export const MAX_COMMENT_LENGTH = 500;

// 예측하기 어려운 공개 슬러그를 생성한다. (CLAUDE.md)
export function generatePublicSlug(): string {
  return randomBytes(12).toString("base64url");
}

// 예측 불가능한 임의 토큰을 생성한다. (이메일 인증, OAuth state 등)
export function generateToken(): string {
  return randomBytes(32).toString("base64url");
}

// 값을 SHA-256으로 해시한다. 원본 대신 해시만 저장할 때 사용한다.
export function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

// 개인정보 보호를 위해 IP는 해시 처리하여 저장한다. (docs/05_DB_SCHEMA.md)
export function hashIp(ip: string | null | undefined): string | null {
  if (!ip) return null;
  const salt = process.env.AUTH_SECRET ?? "paperplane";
  return sha256(`${salt}:${ip}`);
}

// 댓글 입력의 XSS 방지를 위해 HTML 태그를 제거한다. (docs/04_API_SPEC.md)
export function sanitizeText(input: string): string {
  return input
    .replace(/<[^>]*>/g, "")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .trim();
}

// 이메일 형식 검증
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// 요청 헤더에서 클라이언트 IP를 추출한다.
export function getClientIp(headers: Headers): string | null {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return headers.get("x-real-ip");
}
