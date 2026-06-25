import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sha256 } from "@/lib/utils";

// GET /api/auth/verify?token=... — 이메일 인증 링크 처리
export async function GET(req: NextRequest) {
  const token = new URL(req.url).searchParams.get("token");
  if (!token) {
    return NextResponse.redirect(new URL("/login?error=verify", req.url));
  }

  const record = await db.emailVerificationToken.findUnique({
    where: { tokenHash: sha256(token) },
  });

  if (!record || record.expiresAt < new Date()) {
    // 만료/무효 토큰은 정리하고 안내
    if (record) {
      await db.emailVerificationToken.delete({ where: { id: record.id } });
    }
    return NextResponse.redirect(new URL("/login?error=verify", req.url));
  }

  await db.user.update({
    where: { id: record.userId },
    data: { emailVerified: new Date() },
  });
  await db.emailVerificationToken.deleteMany({
    where: { userId: record.userId },
  });

  return NextResponse.redirect(new URL("/login?verified=1", req.url));
}
