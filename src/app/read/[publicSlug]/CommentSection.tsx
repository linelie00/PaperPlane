"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/Input";
import { MAX_COMMENT_LENGTH } from "@/lib/utils";
import type { CommentItem } from "@/types";

export function CommentSection({
  workId,
  initialComments,
}: {
  workId: string;
  initialComments: CommentItem[];
}) {
  const [comments, setComments] = useState<CommentItem[]>(initialComments);
  const [nickname, setNickname] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!nickname.trim() || !content.trim()) {
      setError("닉네임과 댓글 내용을 입력해주세요.");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workId, nickname, content }),
    });

    if (res.ok) {
      const data = await res.json();
      setComments((prev) => [
        {
          id: data.commentId,
          nickname: nickname.trim(),
          content: content.trim(),
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ]);
      setContent("");
    } else {
      const data = await res.json().catch(() => null);
      setError(data?.error?.message ?? "댓글 작성에 실패했습니다.");
    }
    setLoading(false);
  }

  return (
    <section className="mt-12">
      <h2 className="text-lg font-bold text-ink-main">댓글 {comments.length}</h2>

      <form
        onSubmit={handleSubmit}
        className="mt-4 flex flex-col gap-3 rounded-3xl border border-paper-border bg-white p-5 shadow-card"
      >
        <Field label="닉네임" htmlFor="nickname">
          <Input
            id="nickname"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="닉네임"
            maxLength={40}
          />
        </Field>
        <Field label="댓글" htmlFor="content">
          <Textarea
            id="content"
            rows={3}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="작품에 대한 감상을 남겨주세요"
            maxLength={MAX_COMMENT_LENGTH}
          />
        </Field>
        {error && <p className="text-sm font-medium text-error">{error}</p>}
        <div className="flex justify-end">
          <Button type="submit" disabled={loading} className="px-5 py-2 text-sm">
            {loading ? "작성 중…" : "댓글 작성"}
          </Button>
        </div>
      </form>

      {comments.length > 0 && (
        <ul className="mt-6 space-y-4">
          {comments.map((c) => (
            <li
              key={c.id}
              className="border-b border-paper-border pb-4 last:border-0"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-ink-main">{c.nickname}</span>
                <span className="text-xs text-ink-muted">
                  {c.createdAt.slice(0, 10)}
                </span>
              </div>
              <p className="mt-1 text-ink-sub">{c.content}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
