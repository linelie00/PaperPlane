import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { ApiError, errorResponse } from "@/lib/api";
import {
  MAX_ORIGINAL_TEXT_LENGTH,
  sanitizeHtml,
  isHtmlEmpty,
} from "@/lib/utils";
import { runChapterTranslation } from "@/lib/translation";

// 회차 + 소유자 확인 헬퍼. 실패 시 error에 응답을 담아 반환한다.
type ChapterWithWork = NonNullable<
  Awaited<ReturnType<typeof findChapterWithWork>>
>;

function findChapterWithWork(chapterId: string) {
  return db.chapter.findUnique({
    where: { id: chapterId },
    include: { work: { select: { authorId: true } } },
  });
}

async function getOwnedChapter(
  chapterId: string,
  userId: string,
): Promise<{ chapter: ChapterWithWork | null; error: NextResponse | null }> {
  const chapter = await findChapterWithWork(chapterId);
  if (!chapter) return { chapter: null, error: ApiError.workNotFound() };
  if (chapter.work.authorId !== userId) {
    return { chapter: null, error: ApiError.forbidden() };
  }
  return { chapter, error: null };
}

// PATCH /api/chapters/[chapterId] — 회차 제목/본문/공개 수정 (소유자만)
// 본문이 바뀌면 다시 번역한다. 공개는 번역 완료된 회차만 가능.
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ chapterId: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return ApiError.unauthorized();

  const { chapterId } = await params;
  const { chapter, error } = await getOwnedChapter(chapterId, user.userId);
  if (error || !chapter) return error ?? ApiError.workNotFound();

  let body: { title?: string; originalText?: string; isPublic?: boolean };
  try {
    body = await req.json();
  } catch {
    return errorResponse("INVALID_PAYLOAD", "잘못된 요청입니다.", 400);
  }

  const data: Record<string, unknown> = {};
  if (typeof body.title === "string" && body.title.trim()) {
    data.title = body.title.trim();
  }

  let contentChanged = false;
  if (typeof body.originalText === "string") {
    const originalText = sanitizeHtml(body.originalText);
    if (isHtmlEmpty(originalText)) {
      return errorResponse("MISSING_ORIGINAL_TEXT", "원문 텍스트를 입력해주세요.", 400);
    }
    if (originalText.length > MAX_ORIGINAL_TEXT_LENGTH) {
      return errorResponse(
        "TEXT_TOO_LONG",
        `원문 텍스트는 ${MAX_ORIGINAL_TEXT_LENGTH}자를 넘을 수 없습니다.`,
        400,
      );
    }
    if (originalText !== chapter.originalText) {
      data.originalText = originalText;
      contentChanged = true;
    }
  }

  if (typeof body.isPublic === "boolean") {
    // 원문만으로도 공개할 수 있다. (번역은 독자가 선택해서 보는 보조 기능)
    data.isPublic = body.isPublic;
  }

  await db.chapter.update({ where: { id: chapterId }, data });

  let translationStatus = chapter.translationStatus;
  if (contentChanged) {
    const r = await runChapterTranslation(chapterId);
    translationStatus = r.translationStatus;
  }

  return NextResponse.json({ success: true, translationStatus });
}

// DELETE /api/chapters/[chapterId] — 회차 삭제 (소유자만)
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ chapterId: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return ApiError.unauthorized();

  const { chapterId } = await params;
  const { error } = await getOwnedChapter(chapterId, user.userId);
  if (error) return error;

  await db.chapter.delete({ where: { id: chapterId } });

  return NextResponse.json({ success: true });
}
