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
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return errorResponse(
      "INVALID_CREDENTIALS",
      "이메일 또는 비밀번호가 올바르지 않습니다.",
      401,
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
