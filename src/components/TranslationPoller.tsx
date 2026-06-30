"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// 번역이 진행 중(pending/processing)이면 일정 간격으로 화면을 새로고침해
// 백그라운드 번역 완료 상태를 자동으로 반영한다.
export function TranslationPoller({
  active,
  intervalMs = 3000,
}: {
  active: boolean;
  intervalMs?: number;
}) {
  const router = useRouter();

  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => router.refresh(), intervalMs);
    return () => clearInterval(id);
  }, [active, intervalMs, router]);

  return null;
}
