import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  verifyPassword,
  createToken,
  setSessionCookie,
} from "@/lib/auth";
import { errorResponse } from "@/lib/api";

// POST /api/auth/login — 로그인 (docs/04_API_SPEC.md)
export async function POST(req: NextRequest) {
  let body: { email?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return errorResponse("INVALID_PAYLOAD", "잘못된 요청입니다.", 400);
  }

  const email = body.email?.trim().toLowerCase();
  const { password } = body;

  if (!email || !password) {
    return errorResponse("MISSING_FIELD", "이메일과 비밀번호를 입력해주세요.", 400);
  }

  const user = await db.user.findUnique({ where: { email } });

  // 소셜 전용 계정(비밀번호 없음)은 비밀번호 로그인을 막는다.
  if (user && !user.passwordHash) {
    return errorResponse(
      "USE_SOCIAL_LOGIN",
      "소셜 로그인으로 가입한 계정입니다. 간편 로그인을 이용해주세요.",
      409,
    );
  }

  if (
    !user ||
    !user.passwordHash ||
    !(await verifyPassword(password, user.passwordHash))
  ) {
    return errorResponse(
      "INVALID_CREDENTIALS",
      "이메일 또는 비밀번호가 올바르지 않습니다.",
      401,
    );
  }

  // 이메일 인증 전에는 로그인을 차단한다.
  if (!user.emailVerified) {
    return errorResponse(
      "EMAIL_NOT_VERIFIED",
      "이메일 인증이 필요합니다. 받은 메일의 링크로 인증을 완료해주세요.",
      403,
    );
  }

  const token = await createToken({
    userId: user.id,
    email: user.email,
    nickname: user.nickname,
  });
  await setSessionCookie(token);

  return NextResponse.json({ token }, { status: 200 });
}
