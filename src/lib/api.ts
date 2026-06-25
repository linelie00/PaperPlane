import { NextResponse } from "next/server";

// docs/04_API_SPEC.md 공통 에러 응답 형식
export function errorResponse(
  code: string,
  message: string,
  status: number,
): NextResponse {
  return NextResponse.json({ error: { code, message } }, { status });
}

export const ApiError = {
  unauthorized: () =>
    errorResponse("UNAUTHORIZED", "로그인이 필요합니다.", 401),
  forbidden: () =>
    errorResponse("FORBIDDEN", "권한이 없습니다.", 403),
  workNotFound: () =>
    errorResponse("WORK_NOT_FOUND", "작품을 찾을 수 없습니다.", 404),
};
