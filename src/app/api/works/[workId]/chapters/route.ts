import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { ApiError, errorResponse } from "@/lib/api";
import {
  MAX_ORIGINAL_TEXT_LENGTH,
  sanitizeHtml,
  isHtmlEmpty,
  isSafeImageUrl,
} from "@/lib/utils";
import { runChapterTranslations } from "@/lib/translation";

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
      originalText,
      coverImage,
      // 공개 요청 시: 원문만으로도 공개할 수 있다. (번역은 보조 기능)
      isPublic: body.isPublic === true,
    },
  });

  // 작품의 모든 대상 언어로 번역 생성 (대상 언어가 없으면 건너뜀)
  await runChapterTranslations(chapter.id);

  return NextResponse.json(
    { chapterId: chapter.id, order: chapter.order, isPublic: chapter.isPublic },
    { status: 201 },
  );
}
