import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { ApiError, errorResponse } from "@/lib/api";
import { generatePublicSlug } from "@/lib/utils";
import { runChapterTranslation } from "@/lib/translation";
import type { WorkDetail } from "@/types";

// GET /api/works/[workId] — 작품 상세 + 회차 목록 (소유자만)
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
      chapters: { orderBy: { order: "asc" } },
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
    isPublic: work.isPublic,
    publicSlug: work.publicSlug,
    viewCount: work._count.viewLogs,
    chapters: work.chapters.map((c) => ({
      id: c.id,
      order: c.order,
      title: c.title,
      isPublic: c.isPublic,
      translationStatus: c.translationStatus,
      originalText: c.originalText,
      translatedText: c.translatedText,
    })),
    comments: work.comments.map((c) => ({
      id: c.id,
      nickname: c.nickname,
      content: c.content,
      createdAt: c.createdAt.toISOString(),
    })),
  };

  return NextResponse.json(result);
}

// PATCH /api/works/[workId] — 공개 여부 / 메타데이터 / 번역 언어 수정 (소유자만)
// 번역 언어가 바뀌면 모든 회차를 다시 번역한다.
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ workId: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return ApiError.unauthorized();

  const { workId } = await params;
  const work = await db.work.findUnique({
    where: { id: workId },
    include: { chapters: { select: { id: true } } },
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
    if (body.isPublic && !work.publicSlug) {
      data.publicSlug = generatePublicSlug();
    }
  }

  const langChanged =
    ("sourceLanguage" in data && data.sourceLanguage !== work.sourceLanguage) ||
    ("targetLanguage" in data && data.targetLanguage !== work.targetLanguage);

  const updated = await db.work.update({ where: { id: workId }, data });

  // 번역 언어가 바뀌면 모든 회차를 다시 번역한다.
  if (langChanged) {
    for (const ch of work.chapters) {
      await runChapterTranslation(ch.id);
    }
  }

  return NextResponse.json({
    success: true,
    isPublic: updated.isPublic,
    publicSlug: updated.publicSlug,
  });
}

// DELETE /api/works/[workId] — 작품 삭제 (소유자만)
// 회차/댓글/조회로그는 onDelete: Cascade로 함께 삭제된다.
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ workId: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return ApiError.unauthorized();

  const { workId } = await params;
  const work = await db.work.findUnique({ where: { id: workId } });
  if (!work) return ApiError.workNotFound();
  if (work.authorId !== user.userId) return ApiError.forbidden();

  await db.work.delete({ where: { id: workId } });

  return NextResponse.json({ success: true });
}
