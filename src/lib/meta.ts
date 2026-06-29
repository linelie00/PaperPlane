// Open Graph / Twitter Card 메타데이터용 공용 헬퍼

export function appUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

// 상대 경로(/uploads/..)를 절대 URL로 변환한다. 이미 절대면 그대로.
export function absoluteUrl(path: string | null | undefined): string | undefined {
  if (!path) return undefined;
  if (/^https?:\/\//i.test(path)) return path;
  return `${appUrl()}${path.startsWith("/") ? "" : "/"}${path}`;
}

// 본문 HTML에서 첫 번째 이미지 src를 추출한다. (링크 미리보기 썸네일용)
export function firstImageSrc(html: string | null | undefined): string | undefined {
  if (!html) return undefined;
  const m = html.match(/<img[^>]+src="([^"]+)"/i);
  return m?.[1];
}

// 설명용 텍스트를 평문으로 정리하고 길이를 제한한다.
export function plainExcerpt(
  text: string | null | undefined,
  fallback: string,
  max = 160,
): string {
  const stripped = (text ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const base = stripped || fallback;
  return base.length > max ? `${base.slice(0, max - 1)}…` : base;
}
