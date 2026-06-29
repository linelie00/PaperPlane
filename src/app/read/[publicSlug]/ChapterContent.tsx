"use client";

import { useState } from "react";

const LANG_LABEL: Record<string, string> = {
  ko: "한국어",
  en: "English",
  ja: "日本語",
  zh: "中文",
};

function langLabel(code: string) {
  return LANG_LABEL[code] ?? code;
}

// 회차 본문. 원문을 기본으로 보여주고, 번역이 있으면 언어를 전환할 수 있다.
export function ChapterContent({
  original,
  translated,
  sourceLanguage,
  targetLanguage,
}: {
  original: string;
  translated: string | null;
  sourceLanguage: string;
  targetLanguage: string;
}) {
  const [showTranslated, setShowTranslated] = useState(false);
  const hasTranslation = !!translated;
  const html = showTranslated && translated ? translated : original;

  return (
    <div>
      {hasTranslation && (
        <div className="mt-6 inline-flex rounded-full bg-sky-pale p-1 text-sm font-bold">
          <button
            type="button"
            onClick={() => setShowTranslated(false)}
            className={`rounded-full px-4 py-1.5 transition ${
              !showTranslated
                ? "bg-white text-plane-dark shadow-card"
                : "text-ink-sub hover:text-plane-dark"
            }`}
          >
            원문 · {langLabel(sourceLanguage)}
          </button>
          <button
            type="button"
            onClick={() => setShowTranslated(true)}
            className={`rounded-full px-4 py-1.5 transition ${
              showTranslated
                ? "bg-white text-plane-dark shadow-card"
                : "text-ink-sub hover:text-plane-dark"
            }`}
          >
            {langLabel(targetLanguage)} 번역
          </button>
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
