"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { WorkDetail, ChapterItem } from "@/types";

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
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const publicUrl = publicSlug && appUrl ? `${appUrl}/read/${publicSlug}` : "";

  async function toggleWorkPublic() {
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

  async function deleteWork() {
    if (
      !confirm(
        "작품과 모든 회차·댓글이 삭제됩니다. 되돌릴 수 없습니다. 삭제할까요?",
      )
    )
      return;
    setBusy(true);
    const res = await fetch(`/api/works/${work.id}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/works");
      router.refresh();
    } else {
      setBusy(false);
      alert("삭제에 실패했습니다.");
    }
  }

  const publicChapters = work.chapters.filter((c) => c.isPublic).length;

  return (
    <main className="mx-auto max-w-5xl px-5 py-10">
      {/* 헤더 */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-ink-main">{work.title}</h1>
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
        <div className="flex flex-col items-end gap-3">
          <div className="flex gap-2">
            <Link
              href={`/works/${work.id}/edit`}
              className="inline-flex items-center gap-1.5 rounded-full border border-plane-light bg-white px-4 py-2 text-sm font-bold text-plane-dark transition hover:bg-sky-pale"
            >
              작품 정보 수정
            </Link>
            <button
              onClick={deleteWork}
              disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-full border border-error/30 bg-white px-4 py-2 text-sm font-bold text-error transition hover:bg-error/5 disabled:opacity-50"
            >
              삭제
            </button>
          </div>
          <div className="text-right text-sm text-ink-sub">
            <p>조회수 {work.viewCount}</p>
            <p>댓글 {work.commentCount}</p>
          </div>
        </div>
      </div>

      {/* 공개 관리 (작품 단위 마스터 + 회차별 공개) */}
      <Card className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="font-bold text-ink-main">
            공개 여부: {isPublic ? "공개" : "비공개"}
          </p>
          <p className="mt-1 text-sm text-ink-sub">
            {isPublic
              ? `공개된 회차 ${publicChapters}개를 독자가 링크로 읽을 수 있습니다.`
              : "작품을 공개하면 아래에서 공개한 회차를 독자가 읽을 수 있습니다."}
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
            onClick={toggleWorkPublic}
            disabled={busy}
          >
            {isPublic ? "작품 비공개로 전환" : "작품 공개하기"}
          </Button>
          {isPublic && publicUrl && (
            <Button variant="secondary" onClick={copyLink}>
              {copied ? "복사됨!" : "공개 링크 복사"}
            </Button>
          )}
        </div>
      </Card>

      {/* 회차 목록 */}
      <div className="mt-8 flex items-center justify-between">
        <h2 className="text-lg font-extrabold text-ink-main">
          회차 {work.chapters.length}개
        </h2>
        <Link
          href={`/works/${work.id}/chapters/new`}
          className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-plane-primary to-sky px-4 py-2 text-sm font-bold text-white shadow-plane transition hover:-translate-y-0.5"
        >
          + 회차 추가
        </Link>
      </div>

      {work.chapters.length === 0 ? (
        <Card className="mt-4 flex flex-col items-center gap-3 py-10 text-center">
          <p className="text-3xl opacity-40">✍️</p>
          <p className="font-bold text-ink-main">아직 작성한 회차가 없습니다.</p>
          <p className="text-sm text-ink-sub">
            첫 회차를 작성하면 AI가 번역본을 만들어 드립니다.
          </p>
          <Link
            href={`/works/${work.id}/chapters/new`}
            className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-plane-primary to-sky px-6 py-3 text-sm font-bold text-white shadow-plane transition hover:-translate-y-0.5"
          >
            첫 회차 작성하기
          </Link>
        </Card>
      ) : (
        <div className="mt-4 flex flex-col gap-3">
          {work.chapters.map((ch) => (
            <ChapterRow
              key={ch.id}
              workId={work.id}
              chapter={ch}
              workIsPublic={isPublic}
              publicSlug={publicSlug}
              appUrl={appUrl}
            />
          ))}
        </div>
      )}

      {/* 댓글 (창작자: 모든 댓글 삭제 가능) */}
      <Card className="mt-8">
        <h2 className="font-bold text-ink-main">댓글 {work.commentCount}</h2>
        {work.comments.length === 0 ? (
          <p className="mt-3 text-sm text-ink-muted">아직 댓글이 없습니다.</p>
        ) : (
          <ul className="mt-4 space-y-4">
            {work.comments.map((c) => (
              <li
                key={c.id}
                className="border-b border-paper-border pb-3 last:border-0"
              >
                <CreatorCommentRow comment={c} />
                {c.replies.length > 0 && (
                  <ul className="mt-3 space-y-3 border-l-2 border-sky-pale pl-4">
                    {c.replies.map((r) => (
                      <li key={r.id}>
                        <CreatorCommentRow comment={r} />
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </main>
  );
}

// 창작자용 댓글 행 (회차 표시 + 삭제). 답글에는 chapterOrder가 없다.
function CreatorCommentRow({
  comment,
}: {
  comment: {
    id: string;
    nickname: string;
    content: string;
    createdAt: string;
    chapterOrder?: number | null;
  };
}) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [deleted, setDeleted] = useState(false);

  async function handleDelete() {
    if (!confirm("이 댓글을 삭제할까요? (답글이 있으면 함께 삭제됩니다)")) return;
    setDeleting(true);
    const res = await fetch(`/api/comments/${comment.id}`, { method: "DELETE" });
    if (res.ok) {
      setDeleted(true);
      router.refresh();
    } else {
      setDeleting(false);
      alert("삭제에 실패했습니다.");
    }
  }

  if (deleted) return null;

  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-ink-main">{comment.nickname}</span>
          {comment.chapterOrder != null && (
            <span className="rounded-full bg-sky-pale px-2 py-0.5 text-xs text-plane-dark">
              {comment.chapterOrder}화
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-ink-muted">
            {comment.createdAt.slice(0, 10)}
          </span>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="text-xs font-semibold text-ink-muted hover:text-error disabled:opacity-50"
          >
            삭제
          </button>
        </div>
      </div>
      <p className="mt-1 whitespace-pre-wrap text-sm text-ink-sub">
        {comment.content}
      </p>
    </div>
  );
}

function ChapterRow({
  workId,
  chapter,
  workIsPublic,
  publicSlug,
  appUrl,
}: {
  workId: string;
  chapter: ChapterItem;
  workIsPublic: boolean;
  publicSlug: string | null;
  appUrl: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(chapter.translationStatus);
  const [isPublic, setIsPublic] = useState(chapter.isPublic);
  const [busy, setBusy] = useState(false);

  async function retranslate() {
    setBusy(true);
    setStatus("processing");
    const res = await fetch("/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chapterId: chapter.id }),
    });
    setStatus(res.ok ? "completed" : "failed");
    setBusy(false);
    router.refresh();
  }

  async function togglePublic() {
    setBusy(true);
    const res = await fetch(`/api/chapters/${chapter.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPublic: !isPublic }),
    });
    if (res.ok) {
      setIsPublic(!isPublic);
    } else {
      const data = await res.json().catch(() => null);
      alert(data?.error?.message ?? "변경에 실패했습니다.");
    }
    setBusy(false);
  }

  async function remove() {
    if (!confirm(`'${chapter.title}' 회차를 삭제할까요?`)) return;
    setBusy(true);
    const res = await fetch(`/api/chapters/${chapter.id}`, { method: "DELETE" });
    if (res.ok) {
      router.refresh();
    } else {
      setBusy(false);
      alert("삭제에 실패했습니다.");
    }
  }

  const canPublish = status === "completed";
  const readUrl =
    workIsPublic && isPublic && publicSlug && appUrl
      ? `${appUrl}/read/${publicSlug}/${chapter.order}`
      : "";

  return (
    <Card className="flex flex-wrap items-center justify-between gap-3">
      {/* 회차 제목 클릭 → 회차 보기(원문/번역문) */}
      <Link
        href={`/works/${workId}/chapters/${chapter.id}`}
        className="group flex min-w-0 flex-1 items-center gap-2"
      >
        <span className="text-xs font-bold text-plane-dark">
          {chapter.order}화
        </span>
        <span className="truncate font-bold text-ink-main group-hover:text-plane-dark group-hover:underline">
          {chapter.title}
        </span>
        <StatusBadge status={status} />
        {isPublic && (
          <span className="rounded-full bg-sky-soft px-2 py-0.5 text-xs text-plane-dark">
            공개
          </span>
        )}
      </Link>
      <div className="flex flex-wrap items-center gap-2">
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
        <button
          onClick={retranslate}
          disabled={busy || status === "processing"}
          className="rounded-lg px-3 py-1.5 text-sm font-semibold text-ink-sub hover:text-plane-dark disabled:opacity-50"
        >
          {status === "processing" ? "번역 중…" : "다시 번역"}
        </button>
        <Link
          href={`/works/${workId}/chapters/${chapter.id}/edit`}
          className="rounded-lg px-3 py-1.5 text-sm font-semibold text-ink-sub hover:text-plane-dark"
        >
          수정
        </Link>
        <button
          onClick={togglePublic}
          disabled={busy || (!isPublic && !canPublish)}
          title={!canPublish && !isPublic ? "번역 완료 후 공개할 수 있습니다." : ""}
          className="rounded-lg border border-plane-light px-3 py-1.5 text-sm font-bold text-plane-dark hover:bg-sky-pale disabled:opacity-40"
        >
          {isPublic ? "비공개" : "공개"}
        </button>
        <button
          onClick={remove}
          disabled={busy}
          className="rounded-lg px-3 py-1.5 text-sm font-semibold text-error hover:bg-error/5 disabled:opacity-50"
        >
          삭제
        </button>
      </div>
    </Card>
  );
}
