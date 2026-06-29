import { db } from "@/lib/db";
import type { CommentItem } from "@/types";

// 회차 댓글을 부모/답글 트리(1단계)로 조회한다.
export async function getChapterCommentTree(
  chapterId: string,
): Promise<CommentItem[]> {
  const comments = await db.comment.findMany({
    where: { chapterId },
    orderBy: { createdAt: "asc" },
  });

  const repliesByParent = new Map<string, CommentItem[]>();
  const roots: CommentItem[] = [];

  // 먼저 답글을 부모별로 모은다.
  for (const c of comments) {
    if (!c.parentId) continue;
    const item: CommentItem = {
      id: c.id,
      nickname: c.nickname,
      content: c.content,
      createdAt: c.createdAt.toISOString(),
      parentId: c.parentId,
      hasPassword: c.deletePasswordHash !== null,
      replies: [],
    };
    const arr = repliesByParent.get(c.parentId) ?? [];
    arr.push(item);
    repliesByParent.set(c.parentId, arr);
  }

  // 최상위 댓글은 최신순으로, 답글은 작성순으로 붙인다.
  for (const c of comments) {
    if (c.parentId) continue;
    roots.push({
      id: c.id,
      nickname: c.nickname,
      content: c.content,
      createdAt: c.createdAt.toISOString(),
      parentId: null,
      hasPassword: c.deletePasswordHash !== null,
      replies: repliesByParent.get(c.id) ?? [],
    });
  }

  roots.reverse(); // 최신 댓글이 위로
  return roots;
}
