import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { errorResponse } from "@/lib/api";
import { sanitizeText, MAX_COMMENT_LENGTH } from "@/lib/utils";

// POST /api/comments — 댓글 작성 (로그인 불필요, 닉네임 기반)
export async function POST(req: NextRequest) {
  let body: { workId?: string; nickname?: string; content?: string };
  try {
    body = await req.json();
  } catch {
    return errorResponse("INVALID_PAYLOAD", "잘못된 요청입니다.", 400);
  }

  const nickname = sanitizeText(body.nickname ?? "");
  const content = sanitizeText(body.content ?? "");

  if (!body.workId) {
    return errorResponse("MISSING_WORK_ID", "workId가 필요합니다.", 400);
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

  const work = await db.work.findUnique({ where: { id: body.workId } });
  if (!work) {
    return errorResponse("WORK_NOT_FOUND", "작품을 찾을 수 없습니다.", 404);
  }
  // 비공개 작품에는 댓글을 작성할 수 없다.
  if (!work.isPublic) {
    return errorResponse("WORK_NOT_PUBLIC", "비공개 작품입니다.", 403);
  }

  const comment = await db.comment.create({
    data: { workId: work.id, nickname, content },
  });

  return NextResponse.json({ commentId: comment.id }, { status: 201 });
}

// GET /api/comments?workId=... — 댓글 조회 (로그인 불필요)
export async function GET(req: NextRequest) {
  const workId = req.nextUrl.searchParams.get("workId");
  if (!workId) {
    return errorResponse("MISSING_WORK_ID", "workId가 필요합니다.", 400);
  }

  const work = await db.work.findUnique({ where: { id: workId } });
  if (!work) {
    return errorResponse("WORK_NOT_FOUND", "작품을 찾을 수 없습니다.", 404);
  }

  const comments = await db.comment.findMany({
    where: { workId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    comments: comments.map((c) => ({
      id: c.id,
      nickname: c.nickname,
      content: c.content,
      createdAt: c.createdAt.toISOString(),
    })),
  });
}
