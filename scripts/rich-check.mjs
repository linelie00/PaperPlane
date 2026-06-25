// 리치 텍스트/이미지 업로드 E2E 검증.
// 1) 인증 사용자 준비 → 로그인 쿠키
// 2) 이미지 업로드 → /uploads URL 반환 + 파일 생성 확인
// 3) 악성+서식 HTML로 작품 생성 → 저장값 sanitize(스크립트 제거)·서식 보존·번역 확인
import { PrismaClient } from "@prisma/client";
import { createHash } from "crypto";
import { existsSync } from "fs";
import path from "path";

const B = "http://localhost:3000";
const db = new PrismaClient();
const out = {};
const setCookie = (res) =>
  (res.headers.getSetCookie?.() ?? []).map((c) => c.split(";")[0]).join("; ");

const email = `rich_${Date.now()}@example.com`;
const password = "password1234";

// 1) 가입 후 DB에서 바로 인증 처리 → 로그인
await fetch(`${B}/api/auth/signup`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email, password, nickname: "서식테스트" }),
});
await db.user.update({
  where: { email },
  data: { emailVerified: new Date() },
});
const loginRes = await fetch(`${B}/api/auth/login`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email, password }),
});
const cookie = setCookie(loginRes);
out.loginOk = loginRes.status === 200 && cookie.includes("pp_session");

// 2) 이미지 업로드 (1x1 PNG)
const pngBase64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
const pngBuf = Buffer.from(pngBase64, "base64");
const fd = new FormData();
fd.append("file", new Blob([pngBuf], { type: "image/png" }), "test.png");
const upRes = await fetch(`${B}/api/upload`, {
  method: "POST",
  headers: { Cookie: cookie },
  body: fd,
});
const up = await upRes.json().catch(() => null);
out.uploadStatus = upRes.status;
out.uploadUrl = up?.url;
out.uploadFileExists =
  !!up?.url &&
  existsSync(path.join(process.cwd(), "public", up.url.replace(/^\//, "")));

// 3) 악성 + 서식 HTML 작품 생성
const dirtyHtml = `<h2>1화: 시작</h2><p><strong>그는</strong> <em>종이비행기</em>를 날렸다.</p><script>alert('xss')</script><img src="${up?.url ?? "/uploads/x.png"}" alt="삽화"><img src="x" onerror="alert(1)"><ul><li>첫째</li><li>둘째</li></ul>`;
const createRes = await fetch(`${B}/api/works`, {
  method: "POST",
  headers: { "Content-Type": "application/json", Cookie: cookie },
  body: JSON.stringify({
    title: "서식 작품",
    description: "리치 텍스트 테스트",
    genre: "판타지",
    tags: ["test"],
    sourceLanguage: "ko",
    targetLanguage: "en",
    originalText: dirtyHtml,
  }),
});
const created = await createRes.json();
out.createStatus = createRes.status;
out.translationStatus = created.translationStatus;

const work = await db.work.findUnique({
  where: { id: created.workId },
  include: { content: true },
});
const orig = work.content.originalText;
const trans = work.content.translatedText ?? "";
out.stored_hasScript = /<script/i.test(orig); // false 기대
out.stored_hasOnerror = /onerror/i.test(orig); // false 기대
out.stored_keptStrong = /<strong>/i.test(orig); // true 기대
out.stored_keptH2 = /<h2>/i.test(orig); // true 기대
out.stored_keptImg = /<img[^>]+src="\/uploads\//i.test(orig); // true 기대
out.translated_keptSomeTag = /<(h2|p|strong|ul|img)/i.test(trans); // true 기대
out.translated_hasScript = /<script/i.test(trans); // false 기대

console.log(JSON.stringify(out, null, 2));
await db.$disconnect();
