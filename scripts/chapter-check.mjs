// 회차 관리 E2E 검증.
// 작품 생성(1화) → 회차 추가(2화) → 회차별 공개 → 독자 목록/회차 열람 → 회차 삭제 → 작품 삭제
import { PrismaClient } from "@prisma/client";

const B = "http://localhost:3000";
const db = new PrismaClient();
const out = {};
const setCookie = (res) =>
  (res.headers.getSetCookie?.() ?? []).map((c) => c.split(";")[0]).join("; ");

const email = `chap_${Date.now()}@example.com`;
const password = "password1234";

await fetch(`${B}/api/auth/signup`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email, password, nickname: "회차테스트" }),
});
await db.user.update({ where: { email }, data: { emailVerified: new Date() } });
const cookie = setCookie(
  await fetch(`${B}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  }),
);

// 1) 작품 생성 (1화 포함)
const created = await (
  await fetch(`${B}/api/works`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({
      title: "회차 작품",
      description: "테스트",
      genre: "판타지",
      tags: ["t"],
      sourceLanguage: "ko",
      targetLanguage: "en",
      originalText: "<p>첫 번째 회차입니다.</p>",
    }),
  })
).json();
const workId = created.workId;
out.created = !!workId;

// 2) 회차 추가 (2화)
const ch2 = await (
  await fetch(`${B}/api/works/${workId}/chapters`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({
      title: "2화: 다음 이야기",
      originalText: "<p>두 번째 회차입니다.</p>",
    }),
  })
).json();
out.chapter2Order = ch2.order; // 2 기대
out.chapter2Translated = ch2.translationStatus;

const work = await db.work.findUnique({
  where: { id: workId },
  include: { chapters: { orderBy: { order: "asc" } } },
});
out.chapterCount = work.chapters.length; // 2 기대
const [c1, c2] = work.chapters;
const slug = work.publicSlug;

// 3) 작품 공개 + 1화만 공개
await fetch(`${B}/api/works/${workId}`, {
  method: "PATCH",
  headers: { "Content-Type": "application/json", Cookie: cookie },
  body: JSON.stringify({ isPublic: true }),
});
await fetch(`${B}/api/chapters/${c1.id}`, {
  method: "PATCH",
  headers: { "Content-Type": "application/json", Cookie: cookie },
  body: JSON.stringify({ isPublic: true }),
});

// 4) 독자: 목록 페이지 200, 1화 열람 200, 2화(비공개) 접근 시 "공개되지 않은" 메시지
const listHtml = await (await fetch(`${B}/read/${slug}`)).text();
out.listShowsChapter = /1화|회차/.test(listHtml);
const ch1Res = await fetch(`${B}/read/${slug}/1`);
out.readChapter1Status = ch1Res.status; // 200
const ch1Html = await ch1Res.text();
out.chapter1HasTranslation = /<article/.test(ch1Html);
const ch2Html = await (await fetch(`${B}/read/${slug}/2`)).text();
out.chapter2Blocked = /공개되지 않은 회차/.test(ch2Html); // 비공개라 차단

// 5) 비공개 회차 공개 시도(번역 완료라 가능) 후 다시 비공개
// 6) 회차 삭제 (2화)
const delCh = await fetch(`${B}/api/chapters/${c2.id}`, {
  method: "DELETE",
  headers: { Cookie: cookie },
});
out.chapterDeleteStatus = delCh.status;
out.chapterCountAfterDelete = await db.chapter.count({ where: { workId } }); // 1

// 7) 작품 삭제 → 회차도 cascade 삭제
const delWork = await fetch(`${B}/api/works/${workId}`, {
  method: "DELETE",
  headers: { Cookie: cookie },
});
out.workDeleteStatus = delWork.status;
out.workGone = (await db.work.findUnique({ where: { id: workId } })) === null;
out.chaptersGone = (await db.chapter.count({ where: { workId } })) === 0;

console.log(JSON.stringify(out, null, 2));
await db.$disconnect();
