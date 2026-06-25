import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { ApiError, errorResponse } from "@/lib/api";
import { runTranslation } from "@/lib/translation";

// POST /api/translate — 기존 작품 번역 재생성 (소유자만, docs/04_API_SPEC.md)
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return ApiError.unauthorized();

  let body: { workId?: string };
  try {
    body = await req.json();
  } catch {
    return errorResponse("INVALID_PAYLOAD", "잘못된 요청입니다.", 400);
  }

  if (!body.workId) {
    return errorResponse("MISSING_WORK_ID", "workId가 필요합니다.", 400);
  }

  const work = await db.work.findUnique({ where: { id: body.workId } });
  if (!work) return ApiError.workNotFound();
  if (work.authorId !== user.userId) return ApiError.forbidden();

  const { translationStatus, translatedText } = await runTranslation(work.id);

  if (translationStatus === "failed") {
    return errorResponse("TRANSLATION_FAILED", "번역에 실패했습니다.", 502);
  }

  return NextResponse.json({ translationStatus, translatedText });
}
