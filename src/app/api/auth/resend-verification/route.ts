import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { errorResponse } from "@/lib/api";
import { issueAndSendVerification } from "@/lib/verification";

// POST /api/auth/resend-verification — 인증 메일 재발송
// 사용자 존재 여부를 노출하지 않도록 항상 동일한 200 응답을 반환한다.
export async function POST(req: NextRequest) {
  let body: { email?: string };
  try {
    body = await req.json();
  } catch {
    return errorResponse("INVALID_PAYLOAD", "잘못된 요청입니다.", 400);
  }

  const email = body.email?.trim().toLowerCase();
  if (!email) {
    return errorResponse("MISSING_FIELD", "이메일을 입력해주세요.", 400);
  }

  const user = await db.user.findUnique({ where: { email } });
  // 미인증 + 비밀번호 계정에만 재발송 (소셜 전용 계정 제외)
  if (user && !user.emailVerified && user.passwordHash) {
    try {
      await issueAndSendVerification(user.id, user.email);
    } catch {
      // 발송 실패도 동일 응답 (정보 노출 방지). 로그만 남긴다.
      console.error("인증 메일 재발송 실패:", email);
    }
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
