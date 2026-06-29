// 댓글 개선 E2E: 회차별 댓글, 답글, 비밀번호 삭제, 창작자 삭제
import { PrismaClient } from "@prisma/client";

const B = "http://localhost:3000";
const db = new PrismaClient();
const out = {};
const setCookie = (r) =>
  (r.headers.getSetCookie?.() ?? []).map((c) => c.split(";")[0]).join("; ");

const email = `cmt_${Date.now()}@example.com`;
const password = "password1234";
await fetch(`${B}/api/auth/signup`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email, password, nickname: "댓글작가" }),
});
await db.user.update({ where: { email }, data: { emailVerified: new Date() } });
const cookie = setCookie(
  await fetch(`${B}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  }),
);

// 작품 + 1화, 작품/회차 공개
const { workId } = await (
  await fetch(`${B}/api/works`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({
      title: "댓글 작품",
      sourceLanguage: "ko",
      targetLanguage: "en",
    }),
  })
).json();
const ch = await (
  await fetch(`${B}/api/works/${workId}/chapters`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({ title: "1화", originalText: "<p>본문</p>" }),
  })
).json();
const chapter = await db.chapter.findFirst({ where: { workId } });
await fetch(`${B}/api/works/${workId}`, {
  method: "PATCH",
  headers: { "Content-Type": "application/json", Cookie: cookie },
  body: JSON.stringify({ isPublic: true }),
});
await fetch(`${B}/api/chapters/${chapter.id}`, {
  method: "PATCH",
  headers: { "Content-Type": "application/json", Cookie: cookie },
  body: JSON.stringify({ isPublic: true }),
});

// 1) 익명 댓글 작성 (삭제 비번 1234)
const c1 = await (
  await fetch(`${B}/api/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chapterId: chapter.id,
      nickname: "독자A",
      content: "재밌어요",
      deletePassword: "1234",
    }),
  })
).json();
out.commentCreated = !!c1.commentId;

// 2) 답글 작성
const r1 = await (
  await fetch(`${B}/api/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chapterId: chapter.id,
      parentId: c1.commentId,
      nickname: "작가",
      content: "감사합니다",
    }),
  })
).json();
out.replyCreated = !!r1.commentId;

// 3) 중첩 조회 확인
const list = await (
  await fetch(`${B}/api/comments?chapterId=${chapter.id}`)
).json();
out.rootCount = list.comments.length; // 1
out.replyCount = list.comments[0]?.replies.length; // 1
out.rootHasPassword = list.comments[0]?.hasPassword; // true

// 4) 비공개 회차엔 댓글 불가 확인 (회차 비공개로 전환 후 시도)
await fetch(`${B}/api/chapters/${chapter.id}`, {
  method: "PATCH",
  headers: { "Content-Type": "application/json", Cookie: cookie },
  body: JSON.stringify({ isPublic: false }),
});
const blocked = await fetch(`${B}/api/comments`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ chapterId: chapter.id, nickname: "x", content: "y" }),
});
out.privateBlocked = blocked.status === 403;
// 다시 공개로
await fetch(`${B}/api/chapters/${chapter.id}`, {
  method: "PATCH",
  headers: { "Content-Type": "application/json", Cookie: cookie },
  body: JSON.stringify({ isPublic: true }),
});

// 5) 비번 틀림 → 삭제 실패, 맞음 → 성공
const wrong = await fetch(`${B}/api/comments/${c1.commentId}`, {
  method: "DELETE",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ password: "0000" }),
});
out.wrongPwBlocked = wrong.status === 403;
const right = await fetch(`${B}/api/comments/${c1.commentId}`, {
  method: "DELETE",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ password: "1234" }),
});
out.rightPwDeleted = right.status === 200;
// 부모 삭제 시 답글도 cascade
out.replyCascaded =
  (await db.comment.count({ where: { id: r1.commentId } })) === 0;

// 6) 창작자 삭제 (비번 없는 새 댓글을 작가가 삭제)
const c2 = await (
  await fetch(`${B}/api/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chapterId: chapter.id,
      nickname: "독자B",
      content: "삭제될 댓글",
    }),
  })
).json();
const ownerDel = await fetch(`${B}/api/comments/${c2.commentId}`, {
  method: "DELETE",
  headers: { Cookie: cookie },
});
out.creatorDeleted = ownerDel.status === 200;
// 비번 없는 댓글을 익명이 삭제 시도 → 거부
const c3 = await (
  await fetch(`${B}/api/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chapterId: chapter.id,
      nickname: "독자C",
      content: "보호됨",
    }),
  })
).json();
const anonDel = await fetch(`${B}/api/comments/${c3.commentId}`, {
  method: "DELETE",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ password: "1234" }),
});
out.anonCannotDeleteNoPw = anonDel.status === 403;

await db.work.delete({ where: { id: workId } });
console.log(JSON.stringify(out, null, 2));
await db.$disconnect();
