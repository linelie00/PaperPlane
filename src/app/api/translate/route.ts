import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { ApiError, errorResponse } from "@/lib/api";
import {
  runChapterTranslations,
  runChapterTranslationFor,
} from "@/lib/translation";

// 다국어 번역으로 LLM을 여러 번 호출하므로 함수 실행 시간을 넉넉히 둔다.
export const maxDuration = 60;

// POST /api/translate — 회차 번역 재생성 (소유자만)
// language를 주면 해당 언어만, 없으면 작품의 모든 대상 언어를 다시 번역한다.
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return ApiError.unauthorized();

  let body: { chapterId?: string; language?: string };
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

  if (body.language) {
    await runChapterTranslationFor(chapter.id, body.language);
  } else {
    await runChapterTranslations(chapter.id);
  }

  const translations = await db.chapterTranslation.findMany({
    where: { chapterId: chapter.id },
    select: { language: true, status: true, text: true },
  });

  return NextResponse.json({ translations });
}
