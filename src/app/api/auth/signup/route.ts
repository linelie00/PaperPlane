import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { errorResponse } from "@/lib/api";
import { isValidEmail } from "@/lib/utils";
import { issueAndSendVerification } from "@/lib/verification";

// POST /api/auth/signup — 회원가입 (docs/04_API_SPEC.md)
export async function POST(req: NextRequest) {
  let body: { email?: string; password?: string; nickname?: string };
  try {
    body = await req.json();
  } catch {
    return errorResponse("INVALID_PAYLOAD", "잘못된 요청입니다.", 400);
  }

  const email = body.email?.trim().toLowerCase();
  const { password, nickname } = body;

  if (!email || !password || !nickname?.trim()) {
    return errorResponse("MISSING_FIELD", "필수 입력값이 누락되었습니다.", 400);
  }
  if (!isValidEmail(email)) {
    return errorResponse("INVALID_EMAIL", "이메일 형식이 올바르지 않습니다.", 400);
  }
  if (password.length < 8) {
    return errorResponse("WEAK_PASSWORD", "비밀번호는 8자 이상이어야 합니다.", 400);
  }

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return errorResponse(
      "EMAIL_ALREADY_EXISTS",
      "이미 가입된 이메일입니다.",
      409,
    );
  }

  const user = await db.user.create({
    data: {
      email,
      passwordHash: await hashPassword(password),
      nickname: nickname.trim(),
    },
  });

  // 인증 메일 발송. 발송에 실패해도 가입은 유지하고, 재발송으로 복구할 수 있다.
  let verificationSent = true;
  try {
    await issueAndSendVerification(user.id, user.email);
  } catch (err) {
    verificationSent = false;
    console.error("인증 메일 발송 실패:", err);
  }

  return NextResponse.json(
    { userId: user.id, verificationSent },
    { status: 201 },
  );
}
