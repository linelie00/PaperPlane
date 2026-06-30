// 회차 종류(카테고리) 프리셋 — 랜딩의 'Papers' 개념과 맞춤.
export const CHAPTER_CATEGORIES = [
  "본편",
  "외전",
  "짧은 컷",
  "낙서",
  "작업 비하인드",
] as const;

export type ChapterCategory = (typeof CHAPTER_CATEGORIES)[number];

// 입력값을 허용된 카테고리로 정규화한다. (목록에 없으면 null)
export function normalizeCategory(value: unknown): string | null {
  if (typeof value !== "string") return null;
  return (CHAPTER_CATEGORIES as readonly string[]).includes(value)
    ? value
    : null;
}
