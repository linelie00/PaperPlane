# PaperPlane

작품만 보고 떠나던 독자를 작가의 **코어 팬**으로 잇는 웹툰/웹소설 팬덤 플랫폼

> 작품은 끝나도, 팬심은 이어지니까.

## 📖 프로젝트 소개

**PaperPlane**은 흩어진 독자를 다시 모아 작가의 코어 팬으로 잇는 팬덤 플랫폼입니다.

* 본편은 기존 플랫폼(네이버웹툰 등)에 그대로 두고, PaperPlane엔 팬을 위한 **'Papers'** — 외전·짧은 컷·낙서·작업 비하인드 — 를 올립니다.
* 작가는 무료·비독점으로 기존 SNS와 병행해 씁니다. 흩어진 독자를 다시 모으고, **조회/댓글 데이터**로 내 팬이 누구인지·무엇에 반응하는지 확인합니다.
* **번역은 보조 기능**입니다. 독자는 **원문을 기본**으로 보고, 원하면 일본어/영어 등 번역으로 전환해 읽습니다(원문↔언어 토글). 회차 공개에 번역 완료는 **필요 없습니다**(원문만으로 공개 가능).

> (번역 보조) *언어가 달라져도, 이야기가 주는 설렘은 같아야 한다.*

## ✨ 핵심 기능

| 영역 | 기능 |
|------|------|
| 인증 | 이메일/비밀번호 + **이메일 인증**, **소셜 로그인**(Google/Kakao/Naver, 자체 OAuth) |
| 프로필 / 작가 홈 | 프로필 사진·배경·소개(bio) 수정, 공개 **작가 홈** `/author/[id]` |
| 작품 / 회차 | 작품(프로젝트) 생성과 **회차(Papers)** 작성 분리, 회차 종류(본편/외전/짧은 컷/낙서/작업 비하인드) 칩 |
| 에디터 | **Tiptap 리치 텍스트**(볼드·목록·인용·이미지 삽입/크기 조절), 저장 시 서버 sanitize |
| 이미지 / 웹툰 | 작품·회차 메인 이미지, 세로로 긴 웹툰 반응형, **lazy 로딩**, Vercel Blob/디스크 저장 |
| 번역(보조) | 작품별 **다국어** 대상 언어, **비동기** 번역, 뷰어에서 **원문↔언어 토글** |
| 독자 뷰어 | 회차 목록/본문, 이전·다음 회차, 조회수·유입(referrer·UTM) 기록 |
| 공유 / OG | **작품·회차 단위 공유**, Open Graph / Twitter Card 동적 생성 |
| 댓글 | **회차 단위** 댓글 + 답글(1단계), 익명 4자리 비밀번호 삭제 |
| 대시보드 | 총/오늘 조회수, 댓글 수, 작품별 조회·댓글, 주요 유입 경로, 최근 댓글 |

## 🗂️ 데이터 모델 (요약)

```
User ──1:N── Work ──1:N── Chapter ──1:N── ChapterTranslation (언어별 번역)
                                └──1:N── Comment (회차 단위, 답글 1단계)
              └──1:N── ViewLog (조회/유입, IP는 해시만 저장)
```

* `User`: `image`(프로필)·`coverImage`(작가 홈 배경)·`bio`·`emailVerified`
* `Work`(작품/프로젝트) → `Chapter`(회차, `order`·`category`·`isPublic`) → `ChapterTranslation`(언어별)
* **독자 노출 조건**: `work.isPublic && chapter.isPublic`. 번역은 있으면 토글 제공(없어도 공개 가능).

> 초기 스펙의 `WorkContent`(작품당 본문 1:1)와 단일 번역(`targetLanguage`)은 **폐기**되고, `Chapter`(1:N)와 `ChapterTranslation`(다국어)로 대체되었습니다. 상세는 [docs/11_DATA_MODEL.md](docs/11_DATA_MODEL.md) 참조.

## 🚀 빠르게 시작하기

### 사전 요구사항

* Node.js 18+
* PostgreSQL (로컬 또는 Neon 등 클라우드)
* (선택) LLM API Key(번역) · Vercel Blob 토큰(이미지) · Gmail SMTP/Resend(이메일 인증)

### 개발 환경 설정

```bash
# 1. 저장소 클론
git clone <repo-url>
cd PaperPlane

# 2. 의존성 설치
npm install

# 3. 환경 변수 설정
cp .env.example .env
# .env 수정 (DATABASE_URL, AUTH_SECRET 등 — 아래 "환경 변수" 참고)

# 4. DB 스키마 반영
npm run db:push       # 또는 npm run db:migrate

# 5. 개발 서버 실행
npm run dev
```

브라우저에서 `http://localhost:3000` 접속.

## 📚 프로젝트 구조

```txt
src/
  app/
    page.tsx                      랜딩
    login/ signup/ profile/       인증·프로필
    dashboard/                    창작자 대시보드
    works/                        작품 목록/생성/상세/수정
      [workId]/chapters/...       회차 생성/보기/수정
    read/[publicSlug]/            독자 뷰어(회차 목록)
      [order]/                    회차 본문(원문/번역 토글)
    author/[authorId]/            공개 작가 홈
    api/                          API 라우트 (docs/12 참조)
    opengraph-image.tsx           기본 OG 이미지
    icon.svg                      파비콘
  components/                     UI/도메인 컴포넌트
  lib/                            db, auth, oauth, email, verification, ai,
                                  translation, storage, lang, chapter, meta,
                                  utils, html, comments
  types/                          공용 타입
prisma/schema.prisma             데이터 모델
docs/                            문서
```

## 🛠️ 기술 스택

### Frontend
* **Framework**: Next.js 16 (App Router, Turbopack)
* **Language**: TypeScript / React 19
* **Styling**: Tailwind CSS v3 (흰 배경 + 청록~하늘 포인트)
* **Editor**: Tiptap (리치 텍스트 + 이미지)

### Backend
* **API**: Next.js API Route
* **Auth**: 자체 JWT 세션(`jose`, httpOnly 쿠키 `pp_session`) + `bcryptjs`, 소셜 OAuth 직접 구현
* **번역(보조)**: Upstage Solar(OpenAI 호환 `chat/completions`) — `LLM_*`로 교체 가능
* **이미지**: Vercel Blob(배포) / `public/uploads` 디스크(로컬) 자동 분기
* **이메일**: Gmail SMTP(nodemailer) 또는 Resend

### Database
* **DB**: PostgreSQL (로컬 / Neon)
* **ORM**: Prisma

### Hosting
* **Vercel**

## 📋 참고 문서

**현행 문서(`10`~`14`)와 실제 코드가 우선입니다.** 아래 `01`~`08`은 초기 "AI 번역 MVP" 기획의 기록으로 참조용입니다.

### 현행 (현재 구현 기준)
* [docs/README.md](docs/README.md) — 문서 인덱스
* [docs/10_OVERVIEW.md](docs/10_OVERVIEW.md) — 제품 방향, 기술 스택, 프로젝트 구조
* [docs/11_DATA_MODEL.md](docs/11_DATA_MODEL.md) — Prisma 데이터 모델(User/Work/Chapter/번역/댓글)
* [docs/12_API_REFERENCE.md](docs/12_API_REFERENCE.md) — API 라우트 레퍼런스
* [docs/13_FEATURES.md](docs/13_FEATURES.md) — 기능 카탈로그
* [docs/14_DEPLOYMENT.md](docs/14_DEPLOYMENT.md) — 배포(Vercel/Neon/Blob), 환경변수, 이메일, OAuth
* [docs/08_UI_DESIGN_GUIDE.md](docs/08_UI_DESIGN_GUIDE.md) — 컬러·타이포·컴포넌트(여전히 유효)

### 초기 기획 (참조용 / 역사적 맥락)
* `docs/01_MVP_SCOPE` · `02_USER_FLOW` · `03_PAGE_SPEC` · `04_API_SPEC` · `05_DB_SCHEMA` — 초기 번역 MVP 스펙(일부는 현재 코드와 다름)

## 🎨 UI/UX 원칙

* **색상**: 흰색 배경 + 청록색(`#22C7C7`)·하늘색(`#38BDF8`) 포인트, 텍스트 `#102A43`/`#627D98`
* **톤**: 작가에겐 신뢰감 있는 작업 도구, 독자에겐 편안한 독서 뷰어
* **반응형**: 모바일 우선(세로로 긴 웹툰도 비율 유지)

## 🔒 보안 및 개인정보

* 비밀번호는 `bcryptjs`로 해시 처리
* 이메일 인증(인증 전 로그인 차단) + 소셜 OAuth는 인가코드 흐름
* LLM API Key는 서버 환경 변수에만 저장 (클라이언트 노출 금지)
* 사용자 입력·LLM 출력·댓글 모두 **sanitize** (XSS 방지)
* IP 주소는 해시(`ipHash`)로만 저장, 원문 저장 금지
* `publicSlug`는 예측 불가하게 생성, 작품 수정은 소유자만

## 📝 환경 변수

`.env.example`을 복사해 채웁니다. 자세한 설명은 [docs/14_DEPLOYMENT.md](docs/14_DEPLOYMENT.md) 참조.

```env
# Database (PostgreSQL) — 배포는 Neon 권장
DATABASE_URL="postgresql://user:password@localhost:5432/paperplane"  # 런타임(Neon은 풀링 URL)
DIRECT_URL="postgresql://user:password@localhost:5432/paperplane"    # 마이그레이션/db push(직접 연결)

# Auth
AUTH_SECRET="change-this-to-a-long-random-secret"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# LLM 번역 (OpenAI 호환 — 기본 Upstage Solar. Groq/Gemini/Ollama로 교체 가능)
LLM_API_KEY="up_your-upstage-api-key"
LLM_BASE_URL="https://api.upstage.ai/v1"
LLM_MODEL="solar-pro2"

# 이미지 저장 (비우면 로컬 public/uploads, 배포는 Vercel Blob 연결 시 자동 주입)
BLOB_READ_WRITE_TOKEN=""

# 소셜 로그인
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
KAKAO_CLIENT_ID=""
KAKAO_CLIENT_SECRET=""   # 사용 시
NAVER_CLIENT_ID=""
NAVER_CLIENT_SECRET=""

# 이메일 인증 — (A) Gmail SMTP 또는 (B) Resend 중 하나
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="465"
SMTP_USER="paperplane.asm@gmail.com"
SMTP_PASS=""                                      # Google 앱 비밀번호 16자리
EMAIL_FROM="PaperPlane <paperplane.asm@gmail.com>"
RESEND_API_KEY=""                                 # SMTP_* 가 비어 있을 때만
```

## 🚦 핵심 사용자 흐름

```txt
[작가] 회원가입(이메일 인증/소셜)
     → 작품(프로젝트) 생성
     → 회차(Papers) 작성 · 공개(원문만으로 가능)
     → 작가 홈 / 공유 링크로 팬 모으기
     → 대시보드에서 조회수·댓글 확인

[독자] 공개 링크 접속
     → 회차를 원문으로 읽기(원하면 번역 언어로 전환)
     → 댓글·답글 작성
```

## 📄 라이선스

MIT License
