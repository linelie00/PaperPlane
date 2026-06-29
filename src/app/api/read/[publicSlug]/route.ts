import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { errorResponse } from "@/lib/api";

// GET /api/read/[publicSlug] — 공개 작품 + 공개 회차 목록 (로그인 불필요)
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ publicSlug: string }> },
) {
  const { publicSlug } = await params;

  const work = await db.work.findUnique({
    where: { publicSlug },
    include: {
      author: { select: { nickname: true } },
      chapters: {
        where: { isPublic: true },
        orderBy: { order: "asc" },
        select: { order: true, title: true },
      },
      _count: { select: { viewLogs: true } },
    },
  });

  if (!work) {
    return errorResponse("SLUG_NOT_FOUND", "작품을 찾을 수 없습니다.", 404);
  }
  if (!work.isPublic || work.chapters.length === 0) {
    return errorResponse("WORK_NOT_PUBLIC", "아직 공개된 회차가 없습니다.", 403);
  }

  return NextResponse.json({
    title: work.title,
    description: work.description,
    authorNickname: work.author.nickname,
    targetLanguage: work.targetLanguage,
    viewCount: work._count.viewLogs,
    chapters: work.chapters,
  });
}
