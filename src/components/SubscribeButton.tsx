"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// 작가 구독 토글 버튼. 비로그인 시 로그인으로 유도.
export function SubscribeButton({
  authorId,
  initialSubscribed,
  initialCount,
  isLoggedIn,
  loginNext,
}: {
  authorId: string;
  initialSubscribed: boolean;
  initialCount: number;
  isLoggedIn: boolean;
  loginNext: string;
}) {
  const router = useRouter();
  const [subscribed, setSubscribed] = useState(initialSubscribed);
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    if (!isLoggedIn) {
      router.push(`/login?next=${encodeURIComponent(loginNext)}`);
      return;
    }
    const next = !subscribed;
    setSubscribed(next);
    setCount((c) => c + (next ? 1 : -1));
    setLoading(true);
    const res = await fetch("/api/subscriptions", {
      method: next ? "POST" : "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ authorId }),
    });
    if (res.ok) {
      const data = await res.json();
      setSubscribed(data.subscribed);
      setCount(data.count);
    } else {
      // 롤백
      setSubscribed(!next);
      setCount((c) => c + (next ? -1 : 1));
    }
    setLoading(false);
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={
        subscribed
          ? "inline-flex items-center gap-1.5 rounded-full border border-plane-light bg-white px-5 py-2 text-sm font-bold text-plane-dark transition hover:bg-sky-pale disabled:opacity-50"
          : "inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-plane-primary to-sky px-5 py-2 text-sm font-bold text-white shadow-plane transition hover:-translate-y-0.5 disabled:opacity-50"
      }
    >
      {subscribed ? "구독 중" : "구독"}
      <span className="opacity-80">{count}</span>
    </button>
  );
}
