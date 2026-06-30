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

  // 서버리스(Vercel)에선 디스크가 읽기전용이라 디스크 저장이 불가능하다.
  // Blob 미연결 상태면 디스크 폴백을 시도하지 말고 명확한 에러를 던진다.
  if (process.env.VERCEL) {
    throw new Error(
      "이미지 저장소(Vercel Blob)가 연결되지 않았습니다. 프로젝트에 Blob 스토어를 연결하고 재배포해주세요.",
    );
  }

  const dir = path.join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, filename), data);
  return `/uploads/${filename}`;
}
