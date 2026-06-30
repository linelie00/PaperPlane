"use client";

import { useState } from "react";
import { langLabel } from "@/lib/lang";

type Translation = { language: string; html: string };

// 회차 본문. 원문을 기본으로 보여주고, 번역이 있으면 언어 버튼으로 전환한다.
export function ChapterContent({
  original,
  sourceLanguage,
  translations,
}: {
  original: string;
  sourceLanguage: string;
  translations: Translation[];
}) {
  // 선택된 언어. null이면 원문.
  const [lang, setLang] = useState<string | null>(null);
  const current = translations.find((t) => t.language === lang);
  const html = current ? current.html : original;

  return (
    <div>
      {translations.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-1.5 rounded-2xl bg-sky-pale p-1.5 text-sm font-bold">
          <button
            type="button"
            onClick={() => setLang(null)}
            className={`rounded-xl px-3.5 py-1.5 transition ${
              lang === null
                ? "bg-white text-plane-dark shadow-card"
                : "text-ink-sub hover:text-plane-dark"
            }`}
          >
            원문 · {langLabel(sourceLanguage)}
          </button>
          {translations.map((t) => (
            <button
              key={t.language}
              type="button"
              onClick={() => setLang(t.language)}
              className={`rounded-xl px-3.5 py-1.5 transition ${
                lang === t.language
                  ? "bg-white text-plane-dark shadow-card"
                  : "text-ink-sub hover:text-plane-dark"
              }`}
            >
              {langLabel(t.language)}
            </button>
          ))}
        </div>
      )}

      {/* 저장 시점에 sanitize된 HTML이므로 렌더는 안전하다. */}
      <article
        className="rich-content mt-6 text-[18px] text-ink-main"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
