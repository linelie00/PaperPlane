import { NextRequest, NextResponse, after } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { ApiError, errorResponse } from "@/lib/api";
import {
  markChapterTranslationsPending,
  runChapterTranslations,
  runChapterTranslationFor,
} from "@/lib/translation";

// 다국어 번역으로 LLM을 여러 번 호출하므로 함수 실행 시간을 넉넉히 둔다.
export const maxDuration = 60;

// POST /api/translate — 회차 번역 재생성 (소유자만)
// 비동기: 즉시 pending으로 응답하고 실제 번역은 백그라운드에서 진행한다.
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

  const chapterId = chapter.id;
  const language = body.language;

  if (language) {
    await db.chapterTranslation.upsert({
      where: { chapterId_language: { chapterId, language } },
      create: { chapterId, language, status: "pending" },
      update: { status: "pending" },
    });
    after(() =>
      runChapterTranslationFor(chapterId, language).catch((e) =>
        console.error("[translate:bg] one", e),
      ),
    );
  } else {
    await markChapterTranslationsPending(chapterId);
    after(() =>
      runChapterTranslations(chapterId).catch((e) =>
        console.error("[translate:bg] all", e),
      ),
    );
  }

  const translations = await db.chapterTranslation.findMany({
    where: { chapterId },
    select: { language: true, status: true, text: true },
  });

  return NextResponse.json({ translations });
}
