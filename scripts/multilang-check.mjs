// 다국어 번역 E2E: 작품에 여러 언어 지정 → 회차 언어별 번역 → 뷰어 언어 버튼 → 언어 추가 백필
import { PrismaClient } from "@prisma/client";

const B = "http://localhost:3000";
const db = new PrismaClient();
const out = {};
const setCookie = (r) =>
  (r.headers.getSetCookie?.() ?? []).map((c) => c.split(";")[0]).join("; ");

const email = `ml_${Date.now()}@example.com`;
await fetch(`${B}/api/auth/signup`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email, password: "password1234", nickname: "다국어" }),
});
await db.user.update({ where: { email }, data: { emailVerified: new Date() } });
const cookie = setCookie(
  await fetch(`${B}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: "password1234" }),
  }),
);

// 1) 작품: 한국어 → en, ja
const { workId } = await (
  await fetch(`${B}/api/works`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({
      title: "다국어작품",
      sourceLanguage: "ko",
      targetLanguages: ["en", "ja"],
    }),
  })
).json();
const w = await db.work.findUnique({ where: { id: workId } });
out.targetLanguages = JSON.stringify(w.targetLanguages); // ["en","ja"]

// 2) 회차 추가(공개) → en, ja 번역 생성
const ch = await (
  await fetch(`${B}/api/works/${workId}/chapters`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({
      title: "1화",
      originalText: "<p>그는 하늘을 보았다.</p>",
      isPublic: true,
    }),
  })
).json();
const trans = await db.chapterTranslation.findMany({
  where: { chapterId: ch.chapterId },
  orderBy: { language: "asc" },
});
out.translationCount = trans.length; // 2
out.langs = trans.map((t) => `${t.language}:${t.status}`).join(",");
out.bothCompleted = trans.every((t) => t.status === "completed" && t.text);

// 3) 작품 공개 후 뷰어: 원문 + en/ja 버튼
await fetch(`${B}/api/works/${workId}`, {
  method: "PATCH",
  headers: { "Content-Type": "application/json", Cookie: cookie },
  body: JSON.stringify({ isPublic: true }),
});
const readHtml = await (
  await fetch(`${B}/read/${w.publicSlug}/1`)
).text();
out.viewerHasOriginalBtn = readHtml.includes("원문 ·");
out.viewerHasEnBtn = readHtml.includes("English");
out.viewerHasJaBtn = readHtml.includes("日本語");
out.viewerShowsOriginalFirst = readHtml.includes("그는 하늘을 보았다");

// 4) 언어 추가(zh) → 기존 회차 백필
await fetch(`${B}/api/works/${workId}`, {
  method: "PATCH",
  headers: { "Content-Type": "application/json", Cookie: cookie },
  body: JSON.stringify({ targetLanguages: ["en", "ja", "zh"] }),
});
const after = await db.chapterTranslation.findMany({
  where: { chapterId: ch.chapterId },
});
out.afterAddCount = after.length; // 3
out.hasZh = after.some((t) => t.language === "zh" && t.status === "completed");

// 5) 언어 제거(ja 빼기) → ja 번역 정리
await fetch(`${B}/api/works/${workId}`, {
  method: "PATCH",
  headers: { "Content-Type": "application/json", Cookie: cookie },
  body: JSON.stringify({ targetLanguages: ["en", "zh"] }),
});
const afterRemove = await db.chapterTranslation.findMany({
  where: { chapterId: ch.chapterId },
});
out.afterRemoveLangs = afterRemove
  .map((t) => t.language)
  .sort()
  .join(",");

await db.work.delete({ where: { id: workId } });
await db.user.delete({ where: { email } });
console.log(JSON.stringify(out, null, 2));
await db.$disconnect();
