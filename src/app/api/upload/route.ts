import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { ApiError, errorResponse } from "@/lib/api";
import { generateToken } from "@/lib/utils";
import { saveUpload } from "@/lib/storage";

// 허용 이미지 MIME → 확장자
const ALLOWED: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
};
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

// POST /api/upload — 에디터 이미지 업로드 (로그인 필수)
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return ApiError.unauthorized();

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return errorResponse("INVALID_PAYLOAD", "잘못된 요청입니다.", 400);
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return errorResponse("MISSING_FILE", "파일이 없습니다.", 400);
  }

  const ext = ALLOWED[file.type];
  if (!ext) {
    return errorResponse(
      "UNSUPPORTED_TYPE",
      "PNG, JPG, WEBP, GIF 이미지만 업로드할 수 있습니다.",
      400,
    );
  }
  if (file.size > MAX_SIZE) {
    return errorResponse("FILE_TOO_LARGE", "이미지는 5MB 이하만 가능합니다.", 400);
  }

  // 사용자 파일명을 쓰지 않고 랜덤 파일명을 생성한다. (경로 traversal 차단)
  const filename = `${generateToken()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const url = await saveUpload(filename, buffer, file.type);

  return NextResponse.json({ url }, { status: 201 });
}
