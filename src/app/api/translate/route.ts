import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { ApiError, errorResponse } from "@/lib/api";
import { runChapterTranslation } from "@/lib/translation";

// POST /api/translate — 회차 번역 재생성 (소유자만, docs/04_API_SPEC.md)
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return ApiError.unauthorized();

  let body: { chapterId?: string };
  try {
    body = await req.json();
  } catch {
    return errorResponse("INVALID_PAYLOAD", "잘못된 요청입니다.", 400);
  }

  if (!body.chapterId) {
    return errorResponse("MISSING_CHAPTER_ID", "chapterId가 필요합니다.", 400);
  }

  const chapter = await db.chapter.findUnique({
    where: { id: body.chapterId },
    include: { work: { select: { authorId: true } } },
  });
  if (!chapter) return ApiError.workNotFound();
  if (chapter.work.authorId !== user.userId) return ApiError.forbidden();

  const { translationStatus, translatedText } = await runChapterTranslation(
    chapter.id,
  );

  if (translationStatus === "failed") {
    return errorResponse("TRANSLATION_FAILED", "번역에 실패했습니다.", 502);
  }

  return NextResponse.json({ translationStatus, translatedText });
}
