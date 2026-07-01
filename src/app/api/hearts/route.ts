import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { ApiError, errorResponse } from "@/lib/api";

type TargetType = "author" | "work";

function parseBody(body: { targetType?: string; targetId?: string }) {
  const targetType = body.targetType as TargetType | undefined;
  const targetId = body.targetId?.trim();
  if ((targetType !== "author" && targetType !== "work") || !targetId) {
    return null;
  }
  return { targetType, targetId };
}

async function heartCount(targetType: TargetType, targetId: string) {
  return targetType === "author"
    ? db.authorHeart.count({ where: { authorId: targetId } })
    : db.workHeart.count({ where: { workId: targetId } });
}

// POST /api/hearts — 작가/작품 하트 (멱등)
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return ApiError.unauthorized();

  let raw: { targetType?: string; targetId?: string };
  try {
    raw = await req.json();
  } catch {
    return errorResponse("INVALID_PAYLOAD", "잘못된 요청입니다.", 400);
  }
  const parsed = parseBody(raw);
  if (!parsed) {
    return errorResponse("INVALID_TARGET", "잘못된 대상입니다.", 400);
  }
  const { targetType, targetId } = parsed;

  if (targetType === "author") {
    const author = await db.user.findUnique({
      where: { id: targetId },
      select: { id: true },
    });
    if (!author) {
      return errorResponse("TARGET_NOT_FOUND", "대상을 찾을 수 없습니다.", 404);
    }
    await db.authorHeart.upsert({
      where: { userId_authorId: { userId: user.userId, authorId: targetId } },
      create: { userId: user.userId, authorId: targetId },
      update: {},
    });
  } else {
    const work = await db.work.findUnique({
      where: { id: targetId },
      select: { id: true },
    });
    if (!work) {
      return errorResponse("TARGET_NOT_FOUND", "대상을 찾을 수 없습니다.", 404);
    }
    await db.workHeart.upsert({
      where: { userId_workId: { userId: user.userId, workId: targetId } },
      create: { userId: user.userId, workId: targetId },
      update: {},
    });
  }

  const count = await heartCount(targetType, targetId);
  return NextResponse.json({ hearted: true, count });
}

// DELETE /api/hearts — 하트 취소
export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return ApiError.unauthorized();

  let raw: { targetType?: string; targetId?: string };
  try {
    raw = await req.json();
  } catch {
    return errorResponse("INVALID_PAYLOAD", "잘못된 요청입니다.", 400);
  }
  const parsed = parseBody(raw);
  if (!parsed) {
    return errorResponse("INVALID_TARGET", "잘못된 대상입니다.", 400);
  }
  const { targetType, targetId } = parsed;

  if (targetType === "author") {
    await db.authorHeart.deleteMany({
      where: { userId: user.userId, authorId: targetId },
    });
  } else {
    await db.workHeart.deleteMany({
      where: { userId: user.userId, workId: targetId },
    });
  }

  const count = await heartCount(targetType, targetId);
  return NextResponse.json({ hearted: false, count });
}
