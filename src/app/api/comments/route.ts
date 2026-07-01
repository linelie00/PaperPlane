import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { ApiError, errorResponse } from "@/lib/api";
import { sanitizeText, MAX_COMMENT_LENGTH } from "@/lib/utils";

// POST /api/comments — 회차 댓글/답글 작성 (로그인 필수, 계정 연동)
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return ApiError.unauthorized();

  let body: {
    chapterId?: string;
    parentId?: string;
    content?: string;
  };
  try {
    body = await req.json();
  } catch {
    return errorResponse("INVALID_PAYLOAD", "잘못된 요청입니다.", 400);
  }

  const content = sanitizeText(body.content ?? "");

  if (!body.chapterId) {
    return errorResponse("MISSING_CHAPTER_ID", "chapterId가 필요합니다.", 400);
  }
  if (!content) {
    return errorResponse("MISSING_CONTENT", "댓글 내용을 입력해주세요.", 400);
  }
  if (content.length > MAX_COMMENT_LENGTH) {
    return errorResponse(
      "CONTENT_TOO_LONG",
      `댓글은 ${MAX_COMMENT_LENGTH}자를 넘을 수 없습니다.`,
      400,
    );
  }

  // 공개된 회차에만 댓글을 작성할 수 있다.
  const chapter = await db.chapter.findUnique({
    where: { id: body.chapterId },
    include: { work: { select: { isPublic: true } } },
  });
  if (!chapter) {
    return errorResponse("CHAPTER_NOT_FOUND", "회차를 찾을 수 없습니다.", 404);
  }
  if (!chapter.work.isPublic || !chapter.isPublic) {
    return errorResponse("CHAPTER_NOT_PUBLIC", "공개된 회차가 아닙니다.", 403);
  }

  // 답글이면 부모 댓글이 같은 회차에 있어야 한다. (1단계 답글만 허용)
  if (body.parentId) {
    const parent = await db.comment.findUnique({ where: { id: body.parentId } });
    if (!parent || parent.chapterId !== chapter.id) {
      return errorResponse("PARENT_NOT_FOUND", "원댓글을 찾을 수 없습니다.", 400);
    }
    if (parent.parentId) {
      return errorResponse("NESTED_TOO_DEEP", "답글에는 답글을 달 수 없습니다.", 400);
    }
  }

  const comment = await db.comment.create({
    data: {
      workId: chapter.workId,
      chapterId: chapter.id,
      parentId: body.parentId ?? null,
      userId: user.userId,
      nickname: user.nickname, // 표시용 스냅샷
      content,
    },
  });

  return NextResponse.json({ commentId: comment.id }, { status: 201 });
}

// GET /api/comments?chapterId=... — 회차 댓글 조회 (답글 중첩, 로그인 불필요)
export async function GET(req: NextRequest) {
  const chapterId = req.nextUrl.searchParams.get("chapterId");
  if (!chapterId) {
    return errorResponse("MISSING_CHAPTER_ID", "chapterId가 필요합니다.", 400);
  }

  const comments = await db.comment.findMany({
    where: { chapterId },
    orderBy: { createdAt: "asc" },
    include: { user: { select: { image: true } } },
  });

  // 부모/답글 트리로 구성
  const byParent = new Map<string, typeof comments>();
  const roots: typeof comments = [];
  for (const c of comments) {
    if (c.parentId) {
      const arr = byParent.get(c.parentId) ?? [];
      arr.push(c);
      byParent.set(c.parentId, arr);
    } else {
      roots.push(c);
    }
  }

  const toItem = (c: (typeof comments)[number]) => ({
    id: c.id,
    nickname: c.nickname,
    content: c.content,
    createdAt: c.createdAt.toISOString(),
    parentId: c.parentId,
    userId: c.userId,
    authorImage: c.user?.image ?? null,
    hasPassword: c.deletePasswordHash !== null,
    replies: (byParent.get(c.id) ?? []).map((r) => ({
      id: r.id,
      nickname: r.nickname,
      content: r.content,
      createdAt: r.createdAt.toISOString(),
      parentId: r.parentId,
      userId: r.userId,
      authorImage: r.user?.image ?? null,
      hasPassword: r.deletePasswordHash !== null,
      replies: [],
    })),
  });

  return NextResponse.json({ comments: roots.map(toItem) });
}
