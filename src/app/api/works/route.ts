import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { ApiError, errorResponse } from "@/lib/api";
import { generatePublicSlug, isSafeImageUrl } from "@/lib/utils";
import type { WorkListItem } from "@/types";

// POST /api/works — 작품(프로젝트) 생성. 회차(본문)는 이후 따로 추가한다.
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return ApiError.unauthorized();

  let body: {
    title?: string;
    description?: string;
    genre?: string;
    tags?: string[];
    sourceLanguage?: string;
    targetLanguage?: string;
    coverImage?: string | null;
  };
  try {
    body = await req.json();
  } catch {
    return errorResponse("INVALID_PAYLOAD", "잘못된 요청입니다.", 400);
  }

  const title = body.title?.trim();
  if (!title) {
    return errorResponse("MISSING_TITLE", "작품 제목을 입력해주세요.", 400);
  }
  const coverImage =
    typeof body.coverImage === "string" && isSafeImageUrl(body.coverImage)
      ? body.coverImage
      : null;

  // 작품 메타데이터만 저장. 공개 링크(slug)는 생성 시점에 발급한다.
  const work = await db.work.create({
    data: {
      authorId: user.userId,
      title,
      description: body.description?.trim() ?? "",
      genre: body.genre?.trim() ?? "",
      tags: Array.isArray(body.tags) ? body.tags : [],
      sourceLanguage: body.sourceLanguage ?? "ko",
      targetLanguage: body.targetLanguage ?? "en",
      coverImage,
      publicSlug: generatePublicSlug(),
    },
  });

  return NextResponse.json({ workId: work.id }, { status: 201 });
}

// GET /api/works — 로그인 사용자의 작품 목록 (docs/04_API_SPEC.md)
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return ApiError.unauthorized();

  const works = await db.work.findMany({
    where: { authorId: user.userId },
    orderBy: { createdAt: "desc" },
    include: {
      chapters: { select: { isPublic: true } },
      _count: { select: { comments: true, viewLogs: true } },
    },
  });

  const result: WorkListItem[] = works.map((w) => ({
    id: w.id,
    title: w.title,
    sourceLanguage: w.sourceLanguage,
    targetLanguage: w.targetLanguage,
    isPublic: w.isPublic,
    chapterCount: w.chapters.length,
    publicChapterCount: w.chapters.filter((c) => c.isPublic).length,
    viewCount: w._count.viewLogs,
    commentCount: w._count.comments,
    createdAt: w.createdAt.toISOString(),
  }));

  return NextResponse.json({ works: result });
}
