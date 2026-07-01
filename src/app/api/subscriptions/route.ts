import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { ApiError, errorResponse } from "@/lib/api";

// POST /api/subscriptions — 작가 구독 (멱등)
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return ApiError.unauthorized();

  let body: { authorId?: string };
  try {
    body = await req.json();
  } catch {
    return errorResponse("INVALID_PAYLOAD", "잘못된 요청입니다.", 400);
  }

  const authorId = body.authorId?.trim();
  if (!authorId) {
    return errorResponse("MISSING_AUTHOR_ID", "authorId가 필요합니다.", 400);
  }
  if (authorId === user.userId) {
    return errorResponse("SELF_SUBSCRIBE", "자신을 구독할 수 없습니다.", 400);
  }

  const author = await db.user.findUnique({
    where: { id: authorId },
    select: { id: true },
  });
  if (!author) {
    return errorResponse("AUTHOR_NOT_FOUND", "작가를 찾을 수 없습니다.", 404);
  }

  await db.subscription.upsert({
    where: {
      subscriberId_authorId: { subscriberId: user.userId, authorId },
    },
    create: { subscriberId: user.userId, authorId },
    update: {},
  });

  const count = await db.subscription.count({ where: { authorId } });
  return NextResponse.json({ subscribed: true, count });
}

// DELETE /api/subscriptions — 구독 해제
export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return ApiError.unauthorized();

  let body: { authorId?: string };
  try {
    body = await req.json();
  } catch {
    return errorResponse("INVALID_PAYLOAD", "잘못된 요청입니다.", 400);
  }

  const authorId = body.authorId?.trim();
  if (!authorId) {
    return errorResponse("MISSING_AUTHOR_ID", "authorId가 필요합니다.", 400);
  }

  await db.subscription.deleteMany({
    where: { subscriberId: user.userId, authorId },
  });

  const count = await db.subscription.count({ where: { authorId } });
  return NextResponse.json({ subscribed: false, count });
}
