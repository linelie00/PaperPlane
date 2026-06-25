import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { ApiError, errorResponse } from "@/lib/api";
import { generatePublicSlug } from "@/lib/utils";
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

// PATCH /api/works/[workId] — 공개 여부 / 메타데이터 수정 (소유자만)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ workId: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return ApiError.unauthorized();

  const { workId } = await params;
  const work = await db.work.findUnique({ where: { id: workId } });
  if (!work) return ApiError.workNotFound();
  if (work.authorId !== user.userId) return ApiError.forbidden();

  let body: {
    isPublic?: boolean;
    title?: string;
    description?: string;
    genre?: string;
    tags?: string[];
  };
  try {
    body = await req.json();
  } catch {
    return errorResponse("INVALID_PAYLOAD", "잘못된 요청입니다.", 400);
  }

  const data: Record<string, unknown> = {};
  if (typeof body.title === "string") data.title = body.title.trim();
  if (typeof body.description === "string") data.description = body.description.trim();
  if (typeof body.genre === "string") data.genre = body.genre.trim();
  if (Array.isArray(body.tags)) data.tags = body.tags;

  if (typeof body.isPublic === "boolean") {
    data.isPublic = body.isPublic;
    // 공개로 전환 시 publicSlug가 없으면 예측 어려운 값으로 생성한다.
    if (body.isPublic && !work.publicSlug) {
      data.publicSlug = generatePublicSlug();
    }
  }

  const updated = await db.work.update({
    where: { id: workId },
    data,
  });

  return NextResponse.json({
    success: true,
    isPublic: updated.isPublic,
    publicSlug: updated.publicSlug,
  });
}
