"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

export function ChapterActions({
  workId,
  chapterId,
  order,
  initialPublic,
  workIsPublic,
  publicSlug,
  appUrl,
}: {
  workId: string;
  chapterId: string;
  order: number;
  initialPublic: boolean;
  workIsPublic: boolean;
  publicSlug: string | null;
  appUrl: string;
}) {
  const router = useRouter();
  const [isPublic, setIsPublic] = useState(initialPublic);
  const [busy, setBusy] = useState(false);

  const readUrl =
    workIsPublic && isPublic && publicSlug && appUrl
      ? `${appUrl}/read/${publicSlug}/${order}`
      : "";

  async function retranslate() {
    setBusy(true);
    await fetch("/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chapterId }),
    });
    setBusy(false);
    router.refresh();
  }

  async function togglePublic() {
    setBusy(true);
    const res = await fetch(`/api/chapters/${chapterId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPublic: !isPublic }),
    });
    if (res.ok) {
      setIsPublic(!isPublic);
      router.refresh();
    } else {
      const data = await res.json().catch(() => null);
      alert(data?.error?.message ?? "변경에 실패했습니다.");
    }
    setBusy(false);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {isPublic ? (
        <span className="rounded-full bg-sky-soft px-2.5 py-0.5 text-xs font-semibold text-plane-dark">
          공개됨
        </span>
      ) : (
        <span className="rounded-full bg-paper-border/50 px-2.5 py-0.5 text-xs font-semibold text-ink-muted">
          비공개
        </span>
      )}
      <div className="ml-auto flex flex-wrap items-center gap-2">
        {readUrl && (
          <a
            href={readUrl}
            target="_blank"
            rel="noreferrer"
            className="rounded-lg px-3 py-1.5 text-sm font-semibold text-ink-sub hover:text-plane-dark"
          >
            미리보기
          </a>
        )}
        <Button
          variant="secondary"
          onClick={retranslate}
          disabled={busy}
          className="px-4 py-2 text-sm"
        >
          {busy ? "처리 중…" : "다시 번역"}
        </Button>
        <Link
          href={`/works/${workId}/chapters/${chapterId}/edit`}
          className="rounded-full border border-plane-light bg-white px-4 py-2 text-sm font-bold text-plane-dark hover:bg-sky-pale"
        >
          수정
        </Link>
        <Button
          onClick={togglePublic}
          disabled={busy}
          className="px-4 py-2 text-sm"
          variant={isPublic ? "secondary" : "primary"}
        >
          {isPublic ? "비공개로" : "회차 공개"}
        </Button>
      </div>
    </div>
  );
}
