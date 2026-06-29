"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/Input";
import { MAX_COMMENT_LENGTH } from "@/lib/utils";
import type { CommentItem } from "@/types";

export function CommentSection({
  chapterId,
  initialComments,
}: {
  chapterId: string;
  initialComments: CommentItem[];
}) {
  const [comments, setComments] = useState<CommentItem[]>(initialComments);

  const total = comments.reduce((n, c) => n + 1 + c.replies.length, 0);

  function addComment(c: CommentItem) {
    setComments((prev) => [c, ...prev]);
  }
  function addReply(parentId: string, reply: CommentItem) {
    setComments((prev) =>
      prev.map((c) =>
        c.id === parentId ? { ...c, replies: [...c.replies, reply] } : c,
      ),
    );
  }
  function removeComment(id: string) {
    setComments((prev) =>
      prev
        .filter((c) => c.id !== id)
        .map((c) => ({ ...c, replies: c.replies.filter((r) => r.id !== id) })),
    );
  }

  return (
    <section className="mt-12">
      <h2 className="text-lg font-bold text-ink-main">댓글 {total}</h2>

      <CommentForm chapterId={chapterId} onCreated={addComment} />

      {comments.length > 0 && (
        <ul className="mt-6 space-y-5">
          {comments.map((c) => (
            <li
              key={c.id}
              className="border-b border-paper-border pb-5 last:border-0"
            >
              <CommentRow comment={c} onDeleted={removeComment} />

              {/* 답글 */}
              {c.replies.length > 0 && (
                <ul className="mt-3 space-y-3 border-l-2 border-sky-pale pl-4">
                  {c.replies.map((r) => (
                    <li key={r.id}>
                      <CommentRow comment={r} onDeleted={removeComment} />
                    </li>
                  ))}
                </ul>
              )}

              <ReplyToggle
                chapterId={chapterId}
                parentId={c.id}
                onCreated={(reply) => addReply(c.id, reply)}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

// 단일 댓글/답글 행 (작성자·내용·삭제)
function CommentRow({
  comment,
  onDeleted,
}: {
  comment: CommentItem;
  onDeleted: (id: string) => void;
}) {
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    const password = comment.hasPassword
      ? prompt("댓글 삭제 비밀번호(숫자 4자리)를 입력하세요.")
      : "";
    if (comment.hasPassword && !password) return;

    setDeleting(true);
    const res = await fetch(`/api/comments/${comment.id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      onDeleted(comment.id);
    } else {
      const data = await res.json().catch(() => null);
      alert(data?.error?.message ?? "삭제에 실패했습니다.");
      setDeleting(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="font-semibold text-ink-main">{comment.nickname}</span>
        <div className="flex items-center gap-3">
          <span className="text-xs text-ink-muted">
            {comment.createdAt.slice(0, 10)}
          </span>
          {comment.hasPassword && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="text-xs font-semibold text-ink-muted hover:text-error disabled:opacity-50"
            >
              삭제
            </button>
          )}
        </div>
      </div>
      <p className="mt-1 whitespace-pre-wrap text-ink-sub">{comment.content}</p>
    </div>
  );
}

// 답글 작성 토글
function ReplyToggle({
  chapterId,
  parentId,
  onCreated,
}: {
  chapterId: string;
  parentId: string;
  onCreated: (c: CommentItem) => void;
}) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="mt-2 text-sm font-semibold text-plane-dark hover:underline"
      >
        답글 달기
      </button>
    );
  }

  return (
    <div className="mt-3 border-l-2 border-sky-pale pl-4">
      <CommentForm
        chapterId={chapterId}
        parentId={parentId}
        compact
        onCreated={(c) => {
          onCreated(c);
          setOpen(false);
        }}
        onCancel={() => setOpen(false)}
      />
    </div>
  );
}

// 댓글/답글 작성 폼
function CommentForm({
  chapterId,
  parentId,
  compact,
  onCreated,
  onCancel,
}: {
  chapterId: string;
  parentId?: string;
  compact?: boolean;
  onCreated: (c: CommentItem) => void;
  onCancel?: () => void;
}) {
  const [nickname, setNickname] = useState("");
  const [content, setContent] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!nickname.trim() || !content.trim()) {
      setError("닉네임과 내용을 입력해주세요.");
      return;
    }
    if (password && !/^\d{4}$/.test(password)) {
      setError("삭제 비밀번호는 숫자 4자리여야 합니다.");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chapterId,
        parentId,
        nickname,
        content,
        deletePassword: password || undefined,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      onCreated({
        id: data.commentId,
        nickname: nickname.trim(),
        content: content.trim(),
        createdAt: new Date().toISOString(),
        parentId: parentId ?? null,
        hasPassword: !!password,
        replies: [],
      });
      setContent("");
      setPassword("");
      if (!parentId) setNickname("");
    } else {
      const data = await res.json().catch(() => null);
      setError(data?.error?.message ?? "작성에 실패했습니다.");
    }
    setLoading(false);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={
        compact
          ? "flex flex-col gap-2"
          : "mt-4 flex flex-col gap-3 rounded-3xl border border-paper-border bg-white p-5 shadow-card"
      }
    >
      <div className="grid gap-2 sm:grid-cols-2">
        <Input
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder="닉네임"
          maxLength={40}
        />
        <Input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="삭제 비밀번호(숫자 4자리, 선택)"
          inputMode="numeric"
          maxLength={4}
        />
      </div>
      <Textarea
        rows={compact ? 2 : 3}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={parentId ? "답글을 입력하세요" : "작품에 대한 감상을 남겨주세요"}
        maxLength={MAX_COMMENT_LENGTH}
      />
      {error && <p className="text-sm font-medium text-error">{error}</p>}
      <div className="flex justify-end gap-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full px-4 py-2 text-sm font-semibold text-ink-sub hover:text-plane-dark"
          >
            취소
          </button>
        )}
        <Button type="submit" disabled={loading} className="px-5 py-2 text-sm">
          {loading ? "작성 중…" : parentId ? "답글 작성" : "댓글 작성"}
        </Button>
      </div>
    </form>
  );
}
