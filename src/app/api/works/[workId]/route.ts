import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { ApiError, errorResponse } from "@/lib/api";
import {
  generatePublicSlug,
  sanitizeHtml,
  isHtmlEmpty,
  MAX_ORIGINAL_TEXT_LENGTH,
} from "@/lib/utils";
import { runTranslation } from "@/lib/translation";
import type { WorkDetail } from "@/types";

// GET /api/works/[workId] — 작품 상세 (소유자만, docs/04_API_SPEC.md)
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ workId: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return ApiError.unauthorized();

  const { workId } = await params;
  const work = await db.work.findUnique({
    where: { id: workId },
    include: {
      content: true,
      comments: { orderBy: { createdAt: "desc" } },
      _count: { select: { viewLogs: true } },
    },
  });

  if (!work) return ApiError.workNotFound();
  if (work.authorId !== user.userId) return ApiError.forbidden();

  const result: WorkDetail = {
    id: work.id,
    title: work.title,
    description: work.description,
    genre: work.genre,
    tags: work.tags,
    sourceLanguage: work.sourceLanguage,
    targetLanguage: work.targetLanguage,
    originalText: work.content?.originalText ?? "",
    translatedText: work.content?.translatedText ?? null,
    translationStatus: work.content?.translationStatus ?? "pending",
    isPublic: work.isPublic,
    publicSlug: work.publicSlug,
    viewCount: work._count.viewLogs,
    comments: work.comments.map((c) => ({
      id: c.id,
      nickname: c.nickname,
      content: c.content,
      createdAt: c.createdAt.toISOString(),
    })),
  };

  return NextResponse.json(result);
}

// PATCH /api/works/[workId] — 공개 여부 / 메타데이터 / 본문 수정 (소유자만)
// 본문 또는 번역 언어가 바뀌면 번역을 다시 생성한다.
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ workId: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return ApiError.unauthorized();

  const { workId } = await params;
  const work = await db.work.findUnique({
    where: { id: workId },
    include: { content: true },
  });
  if (!work) return ApiError.workNotFound();
  if (work.authorId !== user.userId) return ApiError.forbidden();

  let body: {
    isPublic?: boolean;
    title?: string;
    description?: string;
    genre?: string;
    tags?: string[];
    sourceLanguage?: string;
    targetLanguage?: string;
    originalText?: string;
  };
  try {
    body = await req.json();
  } catch {
    return errorResponse("INVALID_PAYLOAD", "잘못된 요청입니다.", 400);
  }

  const data: Record<string, unknown> = {};
  if (typeof body.title === "string") {
    const title = body.title.trim();
    if (!title) return errorResponse("MISSING_TITLE", "작품 제목을 입력해주세요.", 400);
    data.title = title;
  }
  if (typeof body.description === "string") data.description = body.description.trim();
  if (typeof body.genre === "string") data.genre = body.genre.trim();
  if (Array.isArray(body.tags)) data.tags = body.tags;
  if (typeof body.sourceLanguage === "string") data.sourceLanguage = body.sourceLanguage;
  if (typeof body.targetLanguage === "string") data.targetLanguage = body.targetLanguage;

  if (typeof body.isPublic === "boolean") {
    data.isPublic = body.isPublic;
    // 공개로 전환 시 publicSlug가 없으면 예측 어려운 값으로 생성한다.
    if (body.isPublic && !work.publicSlug) {
      data.publicSlug = generatePublicSlug();
    }
  }

  // 본문(HTML)은 저장 전에 sanitize한다.
  let newOriginal: string | undefined;
  if (typeof body.originalText === "string") {
    newOriginal = sanitizeHtml(body.originalText);
    if (isHtmlEmpty(newOriginal)) {
      return errorResponse("MISSING_ORIGINAL_TEXT", "원문 텍스트를 입력해주세요.", 400);
    }
    if (newOriginal.length > MAX_ORIGINAL_TEXT_LENGTH) {
      return errorResponse(
        "TEXT_TOO_LONG",
        `원문 텍스트는 ${MAX_ORIGINAL_TEXT_LENGTH}자를 넘을 수 없습니다.`,
        400,
      );
    }
  }

  // 본문/언어 변경 여부 → 번역 재생성 필요 판정
  const contentChanged =
    newOriginal !== undefined && newOriginal !== work.content?.originalText;
  const langChanged =
    ("sourceLanguage" in data && data.sourceLanguage !== work.sourceLanguage) ||
    ("targetLanguage" in data && data.targetLanguage !== work.targetLanguage);

  const updated = await db.work.update({ where: { id: workId }, data });
  if (newOriginal !== undefined) {
    await db.workContent.update({
      where: { workId },
      data: { originalText: newOriginal },
    });
  }

  // 번역 재생성 (변경 시에만). runTranslation은 갱신된 DB 값을 읽는다.
  let translationStatus = work.content?.translationStatus ?? "pending";
  if (contentChanged || langChanged) {
    const r = await runTranslation(workId);
    translationStatus = r.translationStatus;
  }

  return NextResponse.json({
    success: true,
    isPublic: updated.isPublic,
    publicSlug: updated.publicSlug,
    translationStatus,
  });
}
