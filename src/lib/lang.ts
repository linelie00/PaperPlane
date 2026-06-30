// 지원 언어 목록 및 라벨

export const LANGUAGES: { code: string; label: string }[] = [
  { code: "ko", label: "한국어" },
  { code: "en", label: "English" },
  { code: "ja", label: "日本語" },
  { code: "zh", label: "中文" },
];

const LABELS: Record<string, string> = Object.fromEntries(
  LANGUAGES.map((l) => [l.code, l.label]),
);

export function langLabel(code: string): string {
  return LABELS[code] ?? code;
}

// 입력 배열을 지원 언어로 정규화하고, 원문 언어와 중복은 제거한다.
export function normalizeLanguages(input: unknown, sourceLanguage: string): string[] {
  if (!Array.isArray(input)) return [];
  const valid = new Set(LANGUAGES.map((l) => l.code));
  const seen = new Set<string>();
  const out: string[] = [];
  for (const x of input) {
    if (typeof x !== "string") continue;
    if (!valid.has(x) || x === sourceLanguage || seen.has(x)) continue;
    seen.add(x);
    out.push(x);
  }
  return out;
}
