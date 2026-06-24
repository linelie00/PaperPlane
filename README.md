# PaperPlane

AI를 통한 글로벌 창작물 현지화 MVP

> 언어가 달라져도, 이야기가 주는 설렘은 같아야 한다

## 📖 프로젝트 소개

**PaperPlane**은 롱테일 창작자를 위한 AI 글로벌 창작물 현지화 서비스입니다.

창작자가 웹소설 또는 웹툰 대사를 업로드하면 AI가 자동으로 번역하고, 독자가 공개된 번역본을 웹 뷰어에서 읽을 수 있습니다. 창작자는 조회수와 댓글로 해외 독자 반응을 빠르게 검증할 수 있습니다.

## 🎯 MVP 핵심 목표

초기 MVP는 복잡한 현지화 파이프라인이 아닌, 다음 흐름의 완성을 우선합니다.

```
작품 업로드 → AI 자동 번역 → 공개 → 독자 반응 확인
```

## ✨ 핵심 기능 (11개)

| # | 기능 | 설명 |
|----|------|------|
| 1 | 회원가입 | 이메일/비밀번호 기반 창작자 계정 생성 |
| 2 | 로그인 | 이메일/비밀번호 인증 |
| 3 | 로그아웃 | 세션/토큰 만료 처리 |
| 4 | 작품 업로드 | 텍스트 입력 방식 업로드 |
| 5 | AI 자동 번역 | 한국어 → 영어 자동 번역 |
| 6 | 작품 목록 | 창작자 작품 목록 조회 |
| 7 | 작품 상세 | 원문/번역문 확인, 공개 토글 |
| 8 | 공개 독자 뷰어 | 로그인 없이 번역본 읽기 |
| 9 | 조회수 기록 | 뷰어 접근 시 조회/유입 저장 |
| 10 | 댓글 | 로그인 없이 닉네임 기반 댓글 작성/조회 |
| 11 | 대시보드 | 조회수, 댓글, 유입 경로 확인 |

## 🚀 빠르게 시작하기

### 사전 요구사항

* Node.js 18+
* PostgreSQL
* LLM API Key (Claude, GPT 등)

### 개발 환경 설정

```bash
# 1. 저장소 클론
git clone <repo-url>
cd PaperPlane

# 2. 의존성 설치
npm install

# 3. 환경 변수 설정
cp .env.example .env.local
# .env.local 파일 수정 (DATABASE_URL, LLM_API_KEY 등)

# 4. DB 마이그레이션
npx prisma migrate dev

# 5. 개발 서버 실행
npm run dev
```

브라우저에서 `http://localhost:3000` 접속

## 📚 프로젝트 구조

```
src/
├── app/                    # Next.js App Router
│   ├── page.tsx            # 랜딩 페이지
│   ├── login/              # 로그인
│   ├── signup/             # 회원가입
│   ├── dashboard/          # 창작자 대시보드
│   ├── works/              # 작품 목록/업로드/상세
│   ├── read/               # 공개 독자 뷰어
│   └── api/                # API 라우트
│       ├── auth/           # 인증 API
│       ├── works/          # 작품 API
│       ├── translate/      # 번역 API
│       ├── comments/       # 댓글 API
│       └── analytics/      # 통계 API
├── components/             # React 컴포넌트
│   ├── auth/
│   ├── layout/
│   ├── works/
│   ├── viewer/
│   ├── comments/
│   └── dashboard/
├── lib/                    # 유틸리티
│   ├── db.ts              # DB 클라이언트
│   ├── auth.ts            # 인증 로직
│   ├── ai.ts              # AI 번역 로직
│   └── utils.ts           # 공용 유틸
├── types/                 # TypeScript 타입 정의
│   ├── work.ts
│   ├── comment.ts
│   ├── analytics.ts
│   └── user.ts
├── prisma/
│   └── schema.prisma      # DB 스키마
└── public/
    └── images/
```

## 🛠️ 기술 스택

### Frontend
* **Framework**: Next.js 15+ (App Router)
* **Language**: TypeScript
* **Styling**: Tailwind CSS
* **Component**: React 19+

### Backend
* **API**: Next.js API Route
* **Auth**: NextAuth/Auth.js 또는 JWT
* **AI**: LLM API (Claude, GPT 등)

### Database
* **DB**: PostgreSQL
* **ORM**: Prisma

## 📋 개발 가이드

### 1. 참고 문서

실제 코드 작성 전에 다음 문서를 참고합니다.

* [docs/01_MVP_SCOPE.md](docs/01_MVP_SCOPE.md) — MVP 범위, 포함/제외 기능, 완료 기준
* [docs/02_USER_FLOW.md](docs/02_USER_FLOW.md) — 사용자 흐름, 업로드·번역·공개 흐름
* [docs/03_PAGE_SPEC.md](docs/03_PAGE_SPEC.md) — 페이지 목적, 필수 UI 요소
* [docs/04_API_SPEC.md](docs/04_API_SPEC.md) — API 명세 (Method, Request/Response, Error Case)
* [docs/05_DB_SCHEMA.md](docs/05_DB_SCHEMA.md) — DB 스키마 (User, Work, WorkContent, Comment, ViewLog)
* [docs/08_UI_DESIGN_GUIDE.md](docs/08_UI_DESIGN_GUIDE.md) — 컬러, 타이포그래피, 컴포넌트, 디자인 규칙

### 2. 개발 우선순위

```
1단계: 기본 인증 (회원가입, 로그인, 로그아웃)
2단계: 작품 업로드 (작품 저장, 목록, 상세)
3단계: AI 번역 (서버 LLM 호출, 결과 저장, 상태 표시)
4단계: 독자 뷰어 (공개 링크, 뷰어, 모바일 최적화)
5단계: 댓글 (댓글 작성, 조회)
6단계: 유입 확인 (조회수 저장, 대시보드)
```

## 🎨 UI/UX 원칙

### 색상
* **배경**: 흰색 + 옅은 하늘색 그라데이션
* **포인트**: 청록색(`#22C7C7`), 하늘색(`#38BDF8`)
* **텍스트**: `#102A43` (메인), `#627D98` (서브)

### 톤
* 창작자에게: 신뢰감 있는 작업 도구
* 독자에게: 편안한 독서 경험
* 과도하게 복잡한 관리자 화면처럼 보이지 않기

### 반응형
* 모바일 375px 이상 지원
* 태블릿 768px
* 데스크톱 1024px 이상

## ⚠️ MVP 범위 제외 기능

다음은 초기 MVP에서 구현하지 않습니다.

* 웹툰 이미지 OCR
* 식자 자동화
* 결제 / 후원
* 추천 알고리즘
* 관리자 페이지
* 다국어 동시 번역
* 정교한 용어집 자동 생성
* 캐릭터 말투 유지 고도화
* 실시간 알림

단, DB 구조와 API는 이후 확장을 고려하여 설계합니다.

## 🔒 보안 및 개인정보

* 비밀번호는 bcrypt 등으로 해시 처리
* LLM API Key는 서버 환경 변수에만 저장 (클라이언트 노출 금지)
* 댓글은 HTML 태그 제거(sanitize)로 XSS 방지
* IP 주소는 해시(ipHash)로 저장, 원문 저장 금지
* publicSlug는 예측 불가하게 생성

## 📝 환경 변수 예시

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/paperplane"

# Auth
AUTH_SECRET="your-auth-secret"
NEXTAUTH_URL="http://localhost:3000"

# LLM API
LLM_API_KEY="your-llm-api-key"
LLM_PROVIDER="anthropic"  # or openai, etc.

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NODE_ENV="development"
```

## 🚦 완료 기준

초기 MVP는 다음 흐름이 정상 동작하면 완료로 봅니다.

```
1. 창작자 회원가입
2. 창작자 로그인
3. 작품 텍스트 업로드
4. AI 자동 번역
5. 번역 결과 확인
6. 작품 공개
7. 독자가 공개 링크로 접속
8. 독자가 번역 작품 읽기
9. 독자 댓글 작성
10. 창작자가 조회수/댓글 확인
```

## 🤝 기여

이 프로젝트는 현재 MVP 개발 중입니다. 각 개발 단계에서의 기여는 [docs/01_MVP_SCOPE.md](docs/01_MVP_SCOPE.md)의 개발 우선순위를 따릅니다.

## 📄 라이선스

MIT License

---

**아직 개발 초기 단계입니다. 문서와 가이드를 참고하여 단계적으로 개발을 진행합니다.**
