"use client";

import { LANGUAGES } from "@/lib/lang";

// 번역 대상 언어 다중 선택 (원문 언어는 제외)
export function LanguagePicker({
  sourceLanguage,
  value,
  onChange,
}: {
  sourceLanguage: string;
  value: string[];
  onChange: (langs: string[]) => void;
}) {
  const options = LANGUAGES.filter((l) => l.code !== sourceLanguage);

  function toggle(code: string) {
    onChange(
      value.includes(code)
        ? value.filter((c) => c !== code)
        : [...value, code],
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((l) => {
        const active = value.includes(l.code);
        return (
          <button
            key={l.code}
            type="button"
            onClick={() => toggle(l.code)}
            className={`rounded-full border px-4 py-1.5 text-sm font-bold transition ${
              active
                ? "border-plane-primary bg-plane-primary text-white"
                : "border-paper-border bg-white text-ink-sub hover:bg-sky-pale"
            }`}
          >
            {l.label}
          </button>
        );
      })}
    </div>
  );
}
