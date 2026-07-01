"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// 작가/작품 하트 토글 버튼. 비로그인 시 로그인으로 유도.
export function HeartButton({
  targetType,
  targetId,
  initialHearted,
  initialCount,
  isLoggedIn,
  loginNext,
}: {
  targetType: "author" | "work";
  targetId: string;
  initialHearted: boolean;
  initialCount: number;
  isLoggedIn: boolean;
  loginNext: string;
}) {
  const router = useRouter();
  const [hearted, setHearted] = useState(initialHearted);
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    if (!isLoggedIn) {
      router.push(`/login?next=${encodeURIComponent(loginNext)}`);
      return;
    }
    const next = !hearted;
    setHearted(next);
    setCount((c) => c + (next ? 1 : -1));
    setLoading(true);
    const res = await fetch("/api/hearts", {
      method: next ? "POST" : "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetType, targetId }),
    });
    if (res.ok) {
      const data = await res.json();
      setHearted(data.hearted);
      setCount(data.count);
    } else {
      setHearted(!next);
      setCount((c) => c + (next ? -1 : 1));
    }
    setLoading(false);
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      aria-pressed={hearted}
      className={
        hearted
          ? "inline-flex items-center gap-1.5 rounded-full border border-error/30 bg-error/5 px-4 py-2 text-sm font-bold text-error transition hover:bg-error/10 disabled:opacity-50"
          : "inline-flex items-center gap-1.5 rounded-full border border-paper-border bg-white px-4 py-2 text-sm font-bold text-ink-sub transition hover:border-error/40 hover:text-error disabled:opacity-50"
      }
    >
      <span aria-hidden>{hearted ? "❤️" : "🤍"}</span>
      <span>{count}</span>
    </button>
  );
}
