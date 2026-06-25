import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { errorResponse } from "@/lib/api";

// GET /api/read/[publicSlug] — 공개 작품 조회 (로그인 불필요, docs/04_API_SPEC.md)
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ publicSlug: string }> },
) {
  const { publicSlug } = await params;

  const work = await db.work.findUnique({
    where: { publicSlug },
    include: {
      content: true,
      author: { select: { nickname: true } },
      _count: { select: { viewLogs: true } },
    },
  });

  if (!work) {
    return errorResponse("SLUG_NOT_FOUND", "작품을 찾을 수 없습니다.", 404);
  }
  if (!work.isPublic) {
    return errorResponse("WORK_NOT_PUBLIC", "비공개 작품입니다.", 403);
  }
  if (work.content?.translationStatus !== "completed") {
    return errorResponse(
      "TRANSLATION_NOT_READY",
      "번역이 아직 완료되지 않았습니다.",
      409,
    );
  }

  return NextResponse.json({
    title: work.title,
    description: work.description,
    authorNickname: work.author.nickname,
    targetLanguage: work.targetLanguage,
    translatedText: work.content.translatedText,
    viewCount: work._count.viewLogs,
  });
}
