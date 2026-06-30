"use client";

import { useState } from "react";

// 현재 페이지(회차) URL을 복사하는 공유 버튼.
export function ShareButton({ className = "" }: { className?: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      type="button"
      onClick={copy}
      className={
        className ||
        "inline-flex items-center gap-1.5 rounded-full border border-plane-light bg-white px-4 py-2 text-sm font-bold text-plane-dark transition hover:bg-sky-pale"
      }
    >
      {copied ? "링크 복사됨!" : "공유"}
    </button>
  );
}
