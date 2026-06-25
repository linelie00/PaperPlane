"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { WorkDetail } from "@/types";

export function WorkDetailView({
  work,
  appUrl,
}: {
  work: WorkDetail;
  appUrl: string;
}) {
  const router = useRouter();
  const [isPublic, setIsPublic] = useState(work.isPublic);
  const [publicSlug, setPublicSlug] = useState(work.publicSlug);
  const [status, setStatus] = useState(work.translationStatus);
  const [translatedText, setTranslatedText] = useState(work.translatedText);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const publicUrl =
    publicSlug && appUrl ? `${appUrl}/read/${publicSlug}` : "";

  async function togglePublic() {
    setBusy(true);
    const res = await fetch(`/api/works/${work.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPublic: !isPublic }),
    });
    if (res.ok) {
      const data = await res.json();
      setIsPublic(data.isPublic);
      setPublicSlug(data.publicSlug);
    }
    setBusy(false);
  }

  async function copyLink() {
    if (!publicUrl) return;
    await navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function retranslate() {
    setBusy(true);
    setStatus("processing");
    const res = await fetch("/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workId: work.id }),
    });
    if (res.ok) {
      const data = await res.json();
      setStatus(data.translationStatus);
      setTranslatedText(data.translatedText);
    } else {
      setStatus("failed");
    }
    setBusy(false);
    router.refresh();
  }

  const canPublish = status === "completed";

  return (
    <main className="mx-auto max-w-5xl px-5 py-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-extrabold text-ink-main">
              {work.title}
            </h1>
            <StatusBadge status={status} />
          </div>
          {work.description && (
            <p className="mt-2 max-w-2xl text-ink-sub">{work.description}</p>
          )}
          {(work.genre || work.tags.length > 0) && (
            <div className="mt-2 flex flex-wrap gap-2 text-xs">
              {work.genre && (
                <span className="rounded-full bg-sky-soft px-3 py-1 text-plane-dark">
                  {work.genre}
                </span>
              )}
              {work.tags.map((t) => (
                <span
                  key={t}
                  className="rounded-full bg-sky-pale px-3 py-1 text-ink-sub"
                >
                  #{t}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="text-right text-sm text-ink-sub">
          <p>조회수 {work.viewCount}</p>
          <p>댓글 {work.comments.length}</p>
        </div>
      </div>

      {/* 공개 관리 */}
      <Card className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="font-bold text-ink-main">
            공개 여부: {isPublic ? "공개" : "비공개"}
          </p>
          <p className="mt-1 text-sm text-ink-sub">
            {canPublish
              ? "공개하면 누구나 링크로 번역본을 읽을 수 있습니다."
              : "번역이 완료되어야 공개할 수 있습니다."}
          </p>
          {isPublic && publicUrl && (
            <p className="mt-2 break-all rounded-xl bg-sky-pale px-3 py-2 text-sm text-plane-dark">
              {publicUrl}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            variant={isPublic ? "secondary" : "primary"}
            onClick={togglePublic}
            disabled={busy || !canPublish}
          >
            {isPublic ? "비공개로 전환" : "작품 공개하기"}
          </Button>
          {isPublic && publicUrl && (
            <Button variant="secondary" onClick={copyLink}>
              {copied ? "복사됨!" : "공개 링크 복사"}
            </Button>
          )}
        </div>
      </Card>

      {/* 원문 / 번역문 */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="font-bold text-ink-main">원문</h2>
          <p className="mt-3 whitespace-pre-wrap text-[15px] leading-[1.8] text-ink-main">
            {work.originalText}
          </p>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-ink-main">번역문</h2>
            <Button
              variant="secondary"
              onClick={retranslate}
              disabled={busy || status === "processing"}
              className="px-4 py-2 text-sm"
            >
              {status === "processing" ? "번역 중…" : "다시 번역하기"}
            </Button>
          </div>
          {status === "processing" && (
            <p className="mt-3 text-sm text-plane-dark">
              ✈ 번역을 진행하고 있습니다…
            </p>
          )}
          {status === "failed" && (
            <p className="mt-3 text-sm text-error">
              번역에 실패했습니다. 다시 시도해주세요.
            </p>
          )}
          {translatedText ? (
            <p className="mt-3 whitespace-pre-wrap text-[15px] leading-[1.8] text-ink-main">
              {translatedText}
            </p>
          ) : (
            status !== "processing" &&
            status !== "failed" && (
              <p className="mt-3 text-sm text-ink-muted">
                아직 번역 결과가 없습니다.
              </p>
            )
          )}
        </Card>
      </div>

      {/* 댓글 목록 */}
      <Card className="mt-6">
        <h2 className="font-bold text-ink-main">
          댓글 {work.comments.length}
        </h2>
        {work.comments.length === 0 ? (
          <p className="mt-3 text-sm text-ink-muted">아직 댓글이 없습니다.</p>
        ) : (
          <ul className="mt-4 space-y-4">
            {work.comments.map((c) => (
              <li
                key={c.id}
                className="border-b border-paper-border pb-3 last:border-0"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-ink-main">
                    {c.nickname}
                  </span>
                  <span className="text-xs text-ink-muted">
                    {c.createdAt.slice(0, 10)}
                  </span>
                </div>
                <p className="mt-1 text-sm text-ink-sub">{c.content}</p>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </main>
  );
}
