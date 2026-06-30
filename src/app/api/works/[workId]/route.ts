import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { ApiError, errorResponse } from "@/lib/api";
import { generatePublicSlug, isSafeImageUrl } from "@/lib/utils";
import { normalizeLanguages } from "@/lib/lang";
import { runChapterTranslations } from "@/lib/translation";
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
      chapters: {
        orderBy: { order: "asc" },
        include: { translations: true },
      },
      comments: {
        orderBy: { createdAt: "asc" },
        include: { chapter: { select: { order: true } } },
      },
      _count: { select: { viewLogs: true } },
    },
  });

  if (!work) return ApiError.workNotFound();
  if (work.authorId !== user.userId) return ApiError.forbidden();

  // 댓글을 부모/답글 트리(1단계)로 구성한다.
  const repliesByParent = new Map<string, typeof work.comments>();
  for (const c of work.comments) {
    if (!c.parentId) continue;
    const arr = repliesByParent.get(c.parentId) ?? [];
    arr.push(c);
    repliesByParent.set(c.parentId, arr);
  }

  const result: WorkDetail = {
    id: work.id,
    title: work.title,
    description: work.description,
    genre: work.genre,
    tags: work.tags,
    sourceLanguage: work.sourceLanguage,
    targetLanguages: work.targetLanguages,
    coverImage: work.coverImage,
    isPublic: work.isPublic,
    publicSlug: work.publicSlug,
    viewCount: work._count.viewLogs,
    commentCount: work.comments.length,
    chapters: work.chapters.map((c) => ({
      id: c.id,
      order: c.order,
      title: c.title,
      isPublic: c.isPublic,
      coverImage: c.coverImage,
      originalText: c.originalText,
      translations: c.translations.map((t) => ({
        language: t.language,
        status: t.status,
        text: t.text,
      })),
    })),
    comments: work.comments
      .filter((c) => !c.parentId)
      .reverse()
      .map((c) => ({
        id: c.id,
        nickname: c.nickname,
        content: c.content,
        createdAt: c.createdAt.toISOString(),
        chapterOrder: c.chapter?.order ?? null,
        replies: (repliesByParent.get(c.id) ?? []).map((r) => ({
          id: r.id,
          nickname: r.nickname,
          content: r.content,
          createdAt: r.createdAt.toISOString(),
        })),
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
    targetLanguages?: string[];
    coverImage?: string | null;
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

  const source =
    typeof body.sourceLanguage === "string" ? body.sourceLanguage : work.sourceLanguage;
  let langChanged = "sourceLanguage" in data && data.sourceLanguage !== work.sourceLanguage;
  if (Array.isArray(body.targetLanguages)) {
    const langs = normalizeLanguages(body.targetLanguages, source);
    data.targetLanguages = langs;
    data.targetLanguage = langs[0] ?? ""; // 구 필드 호환
    if (JSON.stringify(langs) !== JSON.stringify(work.targetLanguages)) {
      langChanged = true;
    }
  }

  // 메인 이미지: URL(자체 업로드/외부) 또는 null(제거)
  if (body.coverImage === null) {
    data.coverImage = null;
  } else if (typeof body.coverImage === "string" && isSafeImageUrl(body.coverImage)) {
    data.coverImage = body.coverImage;
  }

  if (typeof body.isPublic === "boolean") {
    data.isPublic = body.isPublic;
    if (body.isPublic && !work.publicSlug) {
      data.publicSlug = generatePublicSlug();
    }
  }

  const updated = await db.work.update({ where: { id: workId }, data });

  // 번역 언어 구성이 바뀌면 모든 회차를 다시 번역한다(추가 언어 백필 + 제거 정리).
  if (langChanged) {
    for (const ch of work.chapters) {
      await runChapterTranslations(ch.id);
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
