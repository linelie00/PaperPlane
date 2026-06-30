import { put } from "@vercel/blob";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

// 이미지 업로드 저장.
// - Vercel(서버리스): BLOB_READ_WRITE_TOKEN이 있으면 Vercel Blob에 저장하고 절대 URL 반환.
// - 로컬 개발: 토큰이 없으면 public/uploads에 저장하고 /uploads/... 경로 반환.
export async function saveUpload(
  filename: string,
  data: Buffer,
  contentType: string,
): Promise<string> {
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(filename, data, {
      access: "public",
      contentType,
      addRandomSuffix: false, // 파일명이 이미 랜덤이라 접미사 불필요
    });
    return blob.url;
  }

  const dir = path.join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, filename), data);
  return `/uploads/${filename}`;
}
