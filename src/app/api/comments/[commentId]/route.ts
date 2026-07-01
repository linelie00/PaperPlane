import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { errorResponse } from "@/lib/api";
import { hashDeletePassword } from "@/lib/utils";

// DELETE /api/comments/[commentId] — 댓글 삭제
// 창작자(작품 소유자)는 모든 댓글 삭제 가능. 익명 작성자는 삭제 비밀번호로 본인 댓글 삭제.
// 답글이 달린 댓글을 지우면 답글도 함께 삭제된다(cascade).
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ commentId: string }> },
) {
  const { commentId } = await params;
  const comment = await db.comment.findUnique({
    where: { id: commentId },
    include: { work: { select: { authorId: true } } },
  });
  if (!comment) {
    return errorResponse("COMMENT_NOT_FOUND", "댓글을 찾을 수 없습니다.", 404);
  }

  // 1) 작품 창작자 또는 댓글 작성자 본인
  const user = await getCurrentUser();
  const isWorkOwner = user && user.userId === comment.work.authorId;
  const isCommentAuthor =
    user && comment.userId !== null && user.userId === comment.userId;

  if (!isWorkOwner && !isCommentAuthor) {
    // 2) (레거시) 익명 작성자: 삭제 비밀번호 확인
    let password = "";
    try {
      const body = (await req.json()) as { password?: string };
      password = body.password ?? "";
    } catch {
      // body 없음
    }
    if (!comment.deletePasswordHash) {
      return errorResponse(
        "NOT_DELETABLE",
        "삭제 권한이 없는 댓글입니다.",
        403,
      );
    }
    if (
      !password ||
      hashDeletePassword(password) !== comment.deletePasswordHash
    ) {
      return errorResponse("WRONG_PASSWORD", "비밀번호가 일치하지 않습니다.", 403);
    }
  }

  await db.comment.delete({ where: { id: commentId } });

  return NextResponse.json({ success: true });
}
