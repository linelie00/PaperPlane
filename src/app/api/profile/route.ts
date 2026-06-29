import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  getCurrentUser,
  createToken,
  setSessionCookie,
} from "@/lib/auth";
import { ApiError, errorResponse } from "@/lib/api";
import { sanitizeText, isSafeImageUrl } from "@/lib/utils";

// PATCH /api/profile — 닉네임/프로필 사진 수정 (로그인 필수)
// 닉네임이 세션 토큰에 들어가므로 수정 후 세션을 다시 발급한다.
export async function PATCH(req: NextRequest) {
  const session = await getCurrentUser();
  if (!session) return ApiError.unauthorized();

  let body: { nickname?: string; image?: string | null };
  try {
    body = await req.json();
  } catch {
    return errorResponse("INVALID_PAYLOAD", "잘못된 요청입니다.", 400);
  }

  const data: { nickname?: string; image?: string | null } = {};

  if (typeof body.nickname === "string") {
    const nickname = sanitizeText(body.nickname);
    if (!nickname) {
      return errorResponse("MISSING_NICKNAME", "닉네임을 입력해주세요.", 400);
    }
    if (nickname.length > 40) {
      return errorResponse("NICKNAME_TOO_LONG", "닉네임은 40자 이하여야 합니다.", 400);
    }
    data.nickname = nickname;
  }

  // image: 문자열 URL(자체 업로드/외부) 또는 null(제거)
  if (body.image === null) {
    data.image = null;
  } else if (typeof body.image === "string" && body.image) {
    if (!isSafeImageUrl(body.image)) {
      return errorResponse("INVALID_IMAGE", "허용되지 않은 이미지 주소입니다.", 400);
    }
    data.image = body.image;
  }

  const user = await db.user.update({
    where: { id: session.userId },
    data,
  });

  // 세션 토큰 재발급 (닉네임/이미지 최신화)
  const token = await createToken({
    userId: user.id,
    email: user.email,
    nickname: user.nickname,
    image: user.image,
  });
  await setSessionCookie(token);

  return NextResponse.json({
    success: true,
    nickname: user.nickname,
    image: user.image,
  });
}
