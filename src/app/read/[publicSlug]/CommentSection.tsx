"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import { Avatar } from "@/components/ui/Avatar";
import { MAX_COMMENT_LENGTH } from "@/lib/utils";
import type { CommentItem } from "@/types";

type CurrentUser = {
  userId: string;
  nickname: string;
  image: string | null;
} | null;

export function CommentSection({
  chapterId,
  initialComments,
  currentUser,
}: {
  chapterId: string;
  initialComments: CommentItem[];
  currentUser: CurrentUser;
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

      {currentUser ? (
        <CommentForm
          chapterId={chapterId}
          currentUser={currentUser}
          onCreated={addComment}
        />
      ) : (
        <LoginPrompt />
      )}

      {comments.length > 0 && (
        <ul className="mt-6 space-y-5">
          {comments.map((c) => (
            <li
              key={c.id}
              className="border-b border-paper-border pb-5 last:border-0"
            >
              <CommentRow
                comment={c}
                currentUser={currentUser}
                onDeleted={removeComment}
              />

              {/* 답글 */}
              {c.replies.length > 0 && (
                <ul className="mt-3 space-y-3 border-l-2 border-sky-pale pl-4">
                  {c.replies.map((r) => (
                    <li key={r.id}>
                      <CommentRow
                        comment={r}
                        currentUser={currentUser}
                        onDeleted={removeComment}
                      />
                    </li>
                  ))}
                </ul>
              )}

              {currentUser && (
                <ReplyToggle
                  chapterId={chapterId}
                  parentId={c.id}
                  currentUser={currentUser}
                  onCreated={(reply) => addReply(c.id, reply)}
                />
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

// 비로그인 상태 안내
function LoginPrompt() {
  const pathname = usePathname();
  return (
    <div className="mt-4 flex flex-col items-center gap-3 rounded-3xl border border-paper-border bg-white p-6 text-center shadow-card">
      <p className="text-sm text-ink-sub">
        댓글을 남기려면 로그인이 필요해요.
      </p>
      <Link
        href={`/login?next=${encodeURIComponent(pathname)}`}
        className="rounded-full bg-gradient-to-r from-plane-primary to-sky px-5 py-2.5 text-sm font-bold text-white shadow-plane transition hover:-translate-y-0.5"
      >
        로그인하고 댓글 쓰기
      </Link>
    </div>
  );
}

// 단일 댓글/답글 행 (작성자·내용·삭제)
function CommentRow({
  comment,
  currentUser,
  onDeleted,
}: {
  comment: CommentItem;
  currentUser: CurrentUser;
  onDeleted: (id: string) => void;
}) {
  const [deleting, setDeleting] = useState(false);

  // 삭제 가능: 본인 계정 댓글이거나, (레거시) 비밀번호가 걸린 익명 댓글
  const isMine =
    !!currentUser &&
    comment.userId !== null &&
    comment.userId === currentUser.userId;
  const canDelete = isMine || comment.hasPassword;

  async function handleDelete() {
    const password =
      !isMine && comment.hasPassword
        ? prompt("댓글 삭제 비밀번호(숫자 4자리)를 입력하세요.")
        : "";
    if (!isMine && comment.hasPassword && !password) return;

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
        <span className="flex items-center gap-2 font-semibold text-ink-main">
          <Avatar src={comment.authorImage} name={comment.nickname} size={24} />
          {comment.nickname}
        </span>
        <div className="flex items-center gap-3">
          <span className="text-xs text-ink-muted">
            {comment.createdAt.slice(0, 10)}
          </span>
          {canDelete && (
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
  currentUser,
  onCreated,
}: {
  chapterId: string;
  parentId: string;
  currentUser: NonNullable<CurrentUser>;
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
        currentUser={currentUser}
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

// 댓글/답글 작성 폼 (로그인 사용자)
function CommentForm({
  chapterId,
  parentId,
  currentUser,
  compact,
  onCreated,
  onCancel,
}: {
  chapterId: string;
  parentId?: string;
  currentUser: NonNullable<CurrentUser>;
  compact?: boolean;
  onCreated: (c: CommentItem) => void;
  onCancel?: () => void;
}) {
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!content.trim()) {
      setError("내용을 입력해주세요.");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chapterId, parentId, content }),
    });

    if (res.ok) {
      const data = await res.json();
      onCreated({
        id: data.commentId,
        nickname: currentUser.nickname,
        content: content.trim(),
        createdAt: new Date().toISOString(),
        parentId: parentId ?? null,
        userId: currentUser.userId,
        authorImage: currentUser.image,
        hasPassword: false,
        replies: [],
      });
      setContent("");
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
      {!compact && (
        <div className="flex items-center gap-2 text-sm font-semibold text-ink-main">
          <Avatar src={currentUser.image} name={currentUser.nickname} size={28} />
          {currentUser.nickname} 님
        </div>
      )}
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
