// 한글 입력이 UTF-8로 정상 처리되는지 검증하는 E2E 스크립트 (콘솔 인코딩 영향 없음)
import { PrismaClient } from "@prisma/client";

const B = "http://localhost:3000";
const db = new PrismaClient();

function setCookieToHeader(res) {
  const cookies = res.headers.getSetCookie?.() ?? [];
  return cookies.map((c) => c.split(";")[0]).join("; ");
}

const email = `e2e_${Date.now()}@example.com`;
const title = "종이비행기 ✈ 테스트";
const nickname = "한글창작자";

// 1) 회원가입
await fetch(`${B}/api/auth/signup`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email, password: "password1234", nickname }),
});

// 2) 로그인 → 쿠키 확보
const loginRes = await fetch(`${B}/api/auth/login`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email, password: "password1234" }),
});
const cookie = setCookieToHeader(loginRes);

// 3) 한글 작품 생성
const createRes = await fetch(`${B}/api/works`, {
  method: "POST",
  headers: { "Content-Type": "application/json", Cookie: cookie },
  body: JSON.stringify({
    title,
    description: "한글 소개입니다",
    genre: "판타지",
    tags: ["로맨스", "판타지"],
    sourceLanguage: "ko",
    targetLanguage: "en",
    originalText: "그는 종이비행기를 하늘로 날렸다.",
  }),
});
const created = await createRes.json();

// 4) DB에서 실제 저장된 값 검증
const work = await db.work.findUnique({
  where: { id: created.workId },
  include: { author: true, content: true },
});

const titleOk = work.title === title;
const nickOk = work.author.nickname === nickname;
const tagsOk = JSON.stringify(work.tags) === JSON.stringify(["로맨스", "판타지"]);

console.log(
  JSON.stringify(
    {
      titleMatchesInput: titleOk,
      nicknameMatchesInput: nickOk,
      tagsMatchInput: tagsOk,
      storedTitleHex: Buffer.from(work.title, "utf8").toString("hex"),
      expectedTitleHex: Buffer.from(title, "utf8").toString("hex"),
      translationStatus: created.translationStatus,
      originalText: work.content?.originalText,
      translatedText: work.content?.translatedText,
    },
    null,
    2,
  ),
);

await db.$disconnect();
