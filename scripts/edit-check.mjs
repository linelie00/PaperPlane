// 작품 수정 E2E 검증.
// 1) 인증 사용자 + 작품 생성
// 2) 메타데이터만 수정 → 번역 재생성 안 함(빠른 경로), 제목 반영
// 3) 본문 수정 → 번역 재생성됨, 저장값 sanitize·서식 보존
import { PrismaClient } from "@prisma/client";

const B = "http://localhost:3000";
const db = new PrismaClient();
const out = {};
const setCookie = (res) =>
  (res.headers.getSetCookie?.() ?? []).map((c) => c.split(";")[0]).join("; ");

const email = `edit_${Date.now()}@example.com`;
const password = "password1234";

await fetch(`${B}/api/auth/signup`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email, password, nickname: "수정테스트" }),
});
await db.user.update({ where: { email }, data: { emailVerified: new Date() } });
const loginRes = await fetch(`${B}/api/auth/login`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email, password }),
});
const cookie = setCookie(loginRes);

// 1) 작품 생성
const createRes = await fetch(`${B}/api/works`, {
  method: "POST",
  headers: { "Content-Type": "application/json", Cookie: cookie },
  body: JSON.stringify({
    title: "원래 제목",
    description: "원래 소개",
    genre: "판타지",
    tags: ["a"],
    sourceLanguage: "ko",
    targetLanguage: "en",
    originalText: "<p>그는 종이비행기를 날렸다.</p>",
  }),
});
const { workId } = await createRes.json();
const before = await db.work.findUnique({
  where: { id: workId },
  include: { content: true },
});
out.created = createRes.status === 201;
out.firstTranslated = before.content.translatedText;

// 2) 메타데이터만 수정 (본문/언어 동일) → 번역 재생성 안 됨
const metaRes = await fetch(`${B}/api/works/${workId}`, {
  method: "PATCH",
  headers: { "Content-Type": "application/json", Cookie: cookie },
  body: JSON.stringify({
    title: "바뀐 제목",
    description: "원래 소개",
    genre: "판타지",
    tags: ["a"],
    sourceLanguage: "ko",
    targetLanguage: "en",
    originalText: "<p>그는 종이비행기를 날렸다.</p>",
  }),
});
await metaRes.json();
const afterMeta = await db.work.findUnique({
  where: { id: workId },
  include: { content: true },
});
out.titleUpdated = afterMeta.title === "바뀐 제목";
out.translationUnchangedOnMetaEdit =
  afterMeta.content.translatedText === before.content.translatedText;

// 3) 본문 수정 → 번역 재생성, 서식 보존, sanitize
const editRes = await fetch(`${B}/api/works/${workId}`, {
  method: "PATCH",
  headers: { "Content-Type": "application/json", Cookie: cookie },
  body: JSON.stringify({
    title: "바뀐 제목",
    sourceLanguage: "ko",
    targetLanguage: "en",
    originalText:
      "<h2>새 장면</h2><p><strong>그녀</strong>가 미소지었다.</p><script>alert(1)</script>",
  }),
});
const edited = await editRes.json();
out.editStatus = editRes.status;
out.editTranslationStatus = edited.translationStatus;
const afterEdit = await db.work.findUnique({
  where: { id: workId },
  include: { content: true },
});
out.contentSanitized = !/<script/i.test(afterEdit.content.originalText);
out.contentKeptH2 = /<h2>/i.test(afterEdit.content.originalText);
out.translationRegenerated =
  afterEdit.content.translatedText !== before.content.translatedText;
out.translationKeptTag = /<(h2|p|strong)/i.test(
  afterEdit.content.translatedText ?? "",
);

console.log(JSON.stringify(out, null, 2));
await db.$disconnect();
