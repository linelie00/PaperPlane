import { NextRequest, NextResponse, after } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { ApiError, errorResponse } from "@/lib/api";
import {
  MAX_ORIGINAL_TEXT_LENGTH,
  sanitizeHtml,
  isHtmlEmpty,
  isSafeImageUrl,
} from "@/lib/utils";
import {
  markChapterTranslationsPending,
  runChapterTranslations,
} from "@/lib/translation";
import { normalizeCategory } from "@/lib/chapter";

// 다국어 번역으로 LLM을 여러 번 호출하므로 함수 실행 시간을 넉넉히 둔다.
export const maxDuration = 60;

// POST /api/works/[workId]/chapters — 회차 추가 (소유자만)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ workId: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return ApiError.unauthorized();

  const { workId } = await params;
  const work = await db.work.findUnique({
    where: { id: workId },
    include: { chapters: { orderBy: { order: "desc" }, take: 1 } },
  });
  if (!work) return ApiError.workNotFound();
  if (work.authorId !== user.userId) return ApiError.forbidden();

  let body: {
    title?: string;
    originalText?: string;
    isPublic?: boolean;
    coverImage?: string | null;
    category?: string | null;
  };
  try {
    body = await req.json();
  } catch {
    return errorResponse("INVALID_PAYLOAD", "잘못된 요청입니다.", 400);
  }
  const coverImage =
    typeof body.coverImage === "string" && isSafeImageUrl(body.coverImage)
      ? body.coverImage
      : null;

  const originalText = sanitizeHtml(body.originalText ?? "");
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

  const nextOrder = (work.chapters[0]?.order ?? 0) + 1;
  const chapter = await db.chapter.create({
    data: {
      workId,
      order: nextOrder,
      title: body.title?.trim() || `${nextOrder}화`,
      category: normalizeCategory(body.category),
      originalText,
      coverImage,
      // 공개 요청 시: 원문만으로도 공개할 수 있다. (번역은 보조 기능)
      isPublic: body.isPublic === true,
    },
  });

  // 번역은 비동기: 먼저 pending으로 표시하고 즉시 응답, 실제 번역은 응답 후 백그라운드에서.
  await markChapterTranslationsPending(chapter.id);
  after(() =>
    runChapterTranslations(chapter.id).catch((e) =>
      console.error("[translate:bg] chapter create", e),
    ),
  );

  return NextResponse.json(
    { chapterId: chapter.id, order: chapter.order, isPublic: chapter.isPublic },
    { status: 201 },
  );
}
