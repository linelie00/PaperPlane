import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { ApiError, errorResponse } from "@/lib/api";
import { runTranslation } from "@/lib/translation";
import { MAX_ORIGINAL_TEXT_LENGTH } from "@/lib/utils";
import type { WorkListItem } from "@/types";

// POST /api/works — 작품 생성 + AI 번역 (docs/04_API_SPEC.md)
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
    originalText?: string;
  };
  try {
    body = await req.json();
  } catch {
    return errorResponse("INVALID_PAYLOAD", "잘못된 요청입니다.", 400);
  }

  const title = body.title?.trim();
  const originalText = body.originalText?.trim();

  if (!title) {
    return errorResponse("MISSING_TITLE", "작품 제목을 입력해주세요.", 400);
  }
  if (!originalText) {
    return errorResponse("MISSING_ORIGINAL_TEXT", "원문 텍스트를 입력해주세요.", 400);
  }
  if (originalText.length > MAX_ORIGINAL_TEXT_LENGTH) {
    return errorResponse(
      "TEXT_TOO_LONG",
      `원문 텍스트는 ${MAX_ORIGINAL_TEXT_LENGTH}자를 넘을 수 없습니다.`,
      400,
    );
  }

  // 작품 메타데이터 + 원문 저장 (번역 상태 pending)
  const work = await db.work.create({
    data: {
      authorId: user.userId,
      title,
      description: body.description?.trim() ?? "",
      genre: body.genre?.trim() ?? "",
      tags: Array.isArray(body.tags) ? body.tags : [],
      sourceLanguage: body.sourceLanguage ?? "ko",
      targetLanguage: body.targetLanguage ?? "en",
      content: {
        create: {
          originalText,
          translationStatus: "pending",
        },
      },
    },
  });

  // AI 번역 실행 (서버에서 처리)
  const { translationStatus } = await runTranslation(work.id);

  return NextResponse.json(
    { workId: work.id, translationStatus },
    { status: 201 },
  );
}

// GET /api/works — 로그인 사용자의 작품 목록 (docs/04_API_SPEC.md)
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return ApiError.unauthorized();

  const works = await db.work.findMany({
    where: { authorId: user.userId },
    orderBy: { createdAt: "desc" },
    include: {
      content: { select: { translationStatus: true } },
      _count: { select: { comments: true, viewLogs: true } },
    },
  });

  const result: WorkListItem[] = works.map((w) => ({
    id: w.id,
    title: w.title,
    sourceLanguage: w.sourceLanguage,
    targetLanguage: w.targetLanguage,
    translationStatus: w.content?.translationStatus ?? "pending",
    isPublic: w.isPublic,
    viewCount: w._count.viewLogs,
    commentCount: w._count.comments,
    createdAt: w.createdAt.toISOString(),
  }));

  return NextResponse.json({ works: result });
}
