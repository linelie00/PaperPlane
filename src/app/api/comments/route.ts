import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { errorResponse } from "@/lib/api";
import {
  sanitizeText,
  hashDeletePassword,
  MAX_COMMENT_LENGTH,
} from "@/lib/utils";

// POST /api/comments — 회차 댓글/답글 작성 (로그인 불필요, 닉네임 기반)
export async function POST(req: NextRequest) {
  let body: {
    chapterId?: string;
    parentId?: string;
    nickname?: string;
    content?: string;
    deletePassword?: string;
  };
  try {
    body = await req.json();
  } catch {
    return errorResponse("INVALID_PAYLOAD", "잘못된 요청입니다.", 400);
  }

  const nickname = sanitizeText(body.nickname ?? "");
  const content = sanitizeText(body.content ?? "");

  if (!body.chapterId) {
    return errorResponse("MISSING_CHAPTER_ID", "chapterId가 필요합니다.", 400);
  }
  if (!nickname) {
    return errorResponse("MISSING_NICKNAME", "닉네임을 입력해주세요.", 400);
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

  // 4자리 숫자 삭제 비밀번호(선택)
  let deletePasswordHash: string | null = null;
  if (body.deletePassword) {
    if (!/^\d{4}$/.test(body.deletePassword)) {
      return errorResponse(
        "INVALID_PASSWORD",
        "삭제 비밀번호는 숫자 4자리여야 합니다.",
        400,
      );
    }
    deletePasswordHash = hashDeletePassword(body.deletePassword);
  }

  const comment = await db.comment.create({
    data: {
      workId: chapter.workId,
      chapterId: chapter.id,
      parentId: body.parentId ?? null,
      nickname,
      content,
      deletePasswordHash,
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
    hasPassword: c.deletePasswordHash !== null,
    replies: (byParent.get(c.id) ?? []).map((r) => ({
      id: r.id,
      nickname: r.nickname,
      content: r.content,
      createdAt: r.createdAt.toISOString(),
      parentId: r.parentId,
      hasPassword: r.deletePasswordHash !== null,
      replies: [],
    })),
  });

  return NextResponse.json({ comments: roots.map(toItem) });
}
