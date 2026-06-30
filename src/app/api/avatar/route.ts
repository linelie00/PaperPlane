import { NextRequest, NextResponse } from "next/server";
import { errorResponse } from "@/lib/api";
import { generateToken } from "@/lib/utils";
import { saveUpload } from "@/lib/storage";

// 프로필 사진 업로드. 회원가입(비로그인) 단계에서도 쓰므로 인증을 요구하지 않는다.
// 남용을 막기 위해 타입/용량을 엄격히 제한한다.
const ALLOWED: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
};
const MAX_SIZE = 2 * 1024 * 1024; // 2MB

export async function POST(req: NextRequest) {
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
    return errorResponse("FILE_TOO_LARGE", "이미지는 2MB 이하만 가능합니다.", 400);
  }

  const filename = `avatar_${generateToken()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const url = await saveUpload(filename, buffer, file.type);

  return NextResponse.json({ url }, { status: 201 });
}
