# 10. 개요 (현행)

## 제품 방향

PaperPlane은 **작품만 보고 떠나던 독자를 작가의 '코어 팬'으로 잇는 팬덤 플랫폼**이다.
핵심 메시지: **"작품은 끝나도, 팬심은 이어지니까."**

- 본편은 기존 플랫폼(네이버웹툰 등)에 두고, PaperPlane엔 팬을 위한 **'Papers'**
  — 외전·짧은 컷·낙서·작업 비하인드 — 를 올린다.
- 작가는 무료·비독점으로 기존 SNS와 병행해 쓴다. 흩어진 독자를 다시 모으고,
  조회/댓글 데이터로 내 팬이 누구인지·무엇에 반응하는지 확인한다.
- **번역은 보조 기능**이다. 독자는 **원문을 기본**으로 보고, 원하면 일본어/영어 등으로
  전환해 읽는다. 회차 공개에 번역 완료는 필요 없다.

## 기술 스택

- **프레임워크**: Next.js 16 (App Router, Turbopack), React 19, TypeScript
- **스타일**: Tailwind CSS v3 (흰 배경 + 청록~하늘 포인트, `08_UI_DESIGN_GUIDE` 참조)
- **DB/ORM**: PostgreSQL + Prisma
  - 로컬: 로컬 Postgres / 배포: Neon (서버리스, 풀링)
- **인증**: 자체 JWT 세션(`jose`, httpOnly 쿠키 `pp_session`) + `bcryptjs`
  - 이메일/비밀번호 + 이메일 인증 + 소셜 로그인(Google/Kakao/Naver, 직접 OAuth)
- **번역(보조)**: Upstage Solar(OpenAI 호환 `chat/completions`). `.env`의 `LLM_*`로 교체.
- **이미지 저장**: Vercel Blob(배포) / `public/uploads` 디스크(로컬). 자동 분기.
- **이메일**: Gmail SMTP(nodemailer) 또는 Resend. 환경변수로 분기.
- **호스팅**: Vercel

## 사용자

1. **작가(창작자)** — 작품(프로젝트)을 만들고 회차를 올린다. 회차별로 공개/번역 언어/종류를
   설정하고, 작가 홈으로 팬을 모으며 조회·댓글로 반응을 본다.
2. **독자(팬)** — 공개 회차를 원문으로 읽고(원하면 번역 전환), 회차에 댓글·답글을 남긴다.
   작가 홈에서 그 작가의 다른 공개 작품을 둘러본다.

## 프로젝트 구조 (요약)

```txt
src/
  app/
    page.tsx                      랜딩
    login/ signup/ profile/       인증·프로필
    dashboard/                    창작자 대시보드
    works/                        작품 목록/생성/상세/수정
      [workId]/chapters/...       회차 생성/보기/수정
    read/[publicSlug]/            독자 뷰어(회차 목록)
      [order]/                    회차 본문
    author/[authorId]/            공개 작가 홈
    api/                          API 라우트 (12_API_REFERENCE 참조)
    opengraph-image.tsx           기본 OG 이미지
    icon.svg                      파비콘
  components/                     UI/도메인 컴포넌트
  lib/                            db, auth, ai, translation, email, oauth,
                                  storage, lang, chapter, meta, utils, html
  types/                          공용 타입
prisma/schema.prisma             데이터 모델
docs/                            문서
```

## 주요 라이브러리(`src/lib`)

- `db.ts` — Prisma 클라이언트(싱글턴)
- `auth.ts` — JWT 발급/검증, 세션 쿠키, `getCurrentUser`
- `oauth.ts` — Google/Kakao/Naver OAuth(직접 구현, fetch)
- `email.ts` — SMTP/Resend 분기 메일 발송 + 인증 메일
- `verification.ts` — 이메일 인증 토큰 발급·발송
- `ai.ts` — LLM 번역 호출(OpenAI 호환)
- `translation.ts` — 회차 다국어 번역(비동기), pending 표시
- `storage.ts` — 이미지 업로드(Blob/디스크 분기)
- `lang.ts` — 지원 언어/라벨/정규화
- `chapter.ts` — 회차 종류(카테고리) 프리셋
- `meta.ts` — OG/Twitter 메타 헬퍼
- `utils.ts` — slug/토큰/해시/sanitize(HTML·텍스트)/이미지 URL 검증
- `html.ts` — 렌더 시 이미지 lazy 로딩 주입
- `comments.ts` — 회차 댓글 트리 구성
