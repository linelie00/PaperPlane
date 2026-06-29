# CLAUDE.md

> **⚠️ 기획 변경 (2026-06-30 갱신)**
> PaperPlane은 "AI 번역 MVP"에서 **웹툰/웹소설 작가와 팬덤을 잇는 플랫폼**으로 전환했다.
> 아래 "## 현재 제품 방향"이 최우선이며, 그 뒤의 상세 스펙(번역 중심 흐름, `WorkContent` 1:1 모델 등)은
> **참조용**이다. 상세 스펙과 현재 방향/실제 코드가 충돌하면 **현재 방향과 코드가 우선**한다.

## 현재 제품 방향

PaperPlane은 **작품만 보고 떠나던 독자를 작가의 '코어 팬'으로 잇는 팬덤 플랫폼**이다.
핵심 메시지: **"작품은 끝나도, 팬심은 이어지니까."**

* 본편은 기존 플랫폼(네이버웹툰 등)에 그대로 두고, PaperPlane엔 팬을 위한 **'Papers'**
  — 외전·짧은 컷·낙서·작업 비하인드 — 를 올린다.
* 작가는 무료·독점계약 없이, 기존 SNS와 병행해 쓴다. 흩어진 독자를 다시 모으고,
  내 팬이 누구인지·무엇에 반응하는지 **조회/댓글 데이터**로 확인한다.
* **번역은 보조 기능**이다. 독자는 **원문을 기본**으로 보고, 원하면 일본어/영어 등 번역으로
  전환해 본다(뷰어의 원문↔언어 토글). 회차 공개에 번역 완료는 **필요 없다**(원문만으로 공개 가능).

### 데이터/도메인 모델 (실제 구현 기준)

* 작품(`Work`)은 **여러 회차(`Chapter`)**를 가진다(1:N). 회차마다 원문·번역문·공개 여부를 둔다.
  (초안의 `WorkContent` 1:1 모델은 폐기됨)
* 작품 생성과 글쓰기는 분리: `/works/new`에서 작품(프로젝트)을 만들고, 회차는 작품 안에서 추가한다.
* 인증은 이메일/비밀번호 + 이메일 인증(Resend) + 소셜 로그인(Google/Kakao/Naver, 직접 OAuth).
* 사용자에 프로필 사진(`image`)·배경(`coverImage`)·소개(`bio`)가 있고, 공개 **작가 홈** `/author/[id]`가 있다.
* 댓글은 **회차 단위**이며 답글(1단계)·삭제(창작자/익명 비밀번호)를 지원한다.
* 번역 제공자는 Upstage Solar(OpenAI 호환). `.env`의 `LLM_*` 값으로 교체.

서비스명은 임시로 `PaperPlane`을 사용한다.

UI를 구현할 때는 `docs/08_UI_DESIGN_GUIDE.md`를 기준으로 하며, 흰색 배경과 청록~하늘색 포인트 컬러를 사용한다.
랜딩 히어로 문구는 **"작품은 끝나도, 팬심은 이어지니까"**이다.
(옛 문구 "언어가 달라져도, 이야기가 주는 설렘은 같아야 한다"는 번역 보조 섹션에만 남긴다.)

---

## (참조) 초기 번역 MVP 개요

> 아래는 전환 이전의 초기 기획이다. 역사적 맥락/세부 스펙 참조용으로만 둔다.

이 프로젝트는 롱테일 창작자를 위한 AI 글로벌 창작물 현지화 MVP이다.

초기 MVP의 목표는 창작자가 웹소설 또는 웹툰 대사 텍스트를 업로드하면 AI가 자동으로 번역하고, 독자가 번역된 작품을 웹 뷰어에서 읽을 수 있도록 하는 것이다. 또한 창작자는 독자 유입 수와 댓글 반응을 확인하여 해외 독자 반응을 빠르게 검증할 수 있다.

## 참고 문서

코드를 구현하기 전에 다음 문서를 기준으로 한다. CLAUDE.md와 아래 문서의 내용이 충돌하면 CLAUDE.md를 우선한다.

* [docs/01_MVP_SCOPE.md](docs/01_MVP_SCOPE.md) — 프로젝트 목표, MVP 포함/제외 기능, 완료 기준, 개발 우선순위
* [docs/02_USER_FLOW.md](docs/02_USER_FLOW.md) — 창작자/독자 사용자 흐름, 업로드·번역·공개 흐름, 유입·댓글 확인 흐름
* [docs/03_PAGE_SPEC.md](docs/03_PAGE_SPEC.md) — 각 페이지의 목적과 필수 UI 요소
* [docs/04_API_SPEC.md](docs/04_API_SPEC.md) — API별 Method, Path, Auth, Request/Response, Error Case
* [docs/05_DB_SCHEMA.md](docs/05_DB_SCHEMA.md) — User, Work, WorkContent, Comment, ViewLog 모델 정의
* [docs/08_UI_DESIGN_GUIDE.md](docs/08_UI_DESIGN_GUIDE.md) — 컬러, 타이포그래피, 컴포넌트, 랜딩 구성 등 UI 디자인 가이드

## MVP 핵심 목표

> 아래는 초기 번역 MVP 기준이다. 현재 방향은 위 "## 현재 제품 방향"을 따른다.

초기 MVP는 복잡한 현지화 전체 파이프라인보다 “업로드 후 바로 번역본을 공개하고 독자 반응을 확인하는 흐름”에 집중한다.

### 핵심 사용자 (현재 방향 기준)

1. 창작자(작가)

   * 작품(프로젝트)을 만들고 회차(Papers)를 올린다.
   * 회차를 공개한다(원문만으로 공개 가능). 필요하면 번역을 함께 둔다.
   * 작가 홈으로 팬을 모으고, 조회 수·댓글로 반응을 확인한다.

2. 독자(팬)

   * 공개된 회차를 **원문**으로 읽고, 원하면 번역 언어로 전환해 읽는다.
   * 회차에 댓글·답글을 남긴다.

## MVP 기능 범위

### 포함 기능

* 회원가입
* 로그인
* 로그아웃
* 작품 업로드
* 작품 목록 조회
* 작품 상세 조회
* AI 자동 번역
* 번역 결과 저장
* 번역본 뷰어
* 공개 작품 링크 생성
* 독자 조회수 기록
* 유입 경로 기록
* 댓글 작성
* 댓글 조회
* 창작자 대시보드

### 제외 기능

초기 MVP에서는 다음 기능을 구현하지 않는다.

* 정교한 용어집 자동 생성
* 캐릭터 말투 유지 고도화
* 웹툰 이미지 OCR
* 식자 자동화
* 결제
* 후원
* 추천 알고리즘
* 다국어 동시 번역
* 번역 품질 점수화
* 관리자 페이지
* 복잡한 권한 관리
* 실시간 알림

단, 이후 확장을 고려하여 DB 구조와 API는 확장 가능하게 작성한다.

## 기술 스택

### Frontend

* Next.js
* TypeScript
* Tailwind CSS
* App Router 사용
* 서버 컴포넌트와 클라이언트 컴포넌트를 적절히 분리한다.

### Backend

* Next.js API Route 또는 FastAPI 중 하나를 사용한다.
* 초기 구현에서는 개발 속도를 위해 Next.js API Route 기반으로 구현해도 된다.
* AI 번역 요청은 서버에서 처리한다.
* 클라이언트에서 직접 LLM API Key를 호출하지 않는다.

### Database

* PostgreSQL 사용
* ORM은 Prisma 사용을 우선 고려한다.

### Auth

* 초기 MVP에서는 이메일/비밀번호 기반 로그인을 사용한다.
* 세션 또는 JWT 중 하나를 사용한다.
* 구현 복잡도를 낮추기 위해 NextAuth/Auth.js 또는 Supabase Auth 사용도 가능하다.

### AI

* LLM API를 사용하여 작품 텍스트를 번역한다.
* 초기 MVP에서는 한국어 → 영어 번역을 기본 대상으로 한다.
* 추후 일본어, 중국어 등으로 확장 가능하게 설계한다.

## 프로젝트 구조 예시

```txt
src/
  app/
    page.tsx
    login/
      page.tsx
    signup/
      page.tsx
    dashboard/
      page.tsx
    works/
      page.tsx
      new/
        page.tsx
      [workId]/
        page.tsx
        edit/
          page.tsx
    read/
      [publicSlug]/
        page.tsx
    api/
      auth/
      works/
      translate/
      comments/
      analytics/

  components/
    auth/
    layout/
    works/
    viewer/
    comments/
    dashboard/

  lib/
    db.ts
    auth.ts
    ai.ts
    utils.ts

  types/
    work.ts
    comment.ts
    analytics.ts
```

## 주요 페이지

### 1. 랜딩 페이지 `/`

서비스 소개 페이지이다.

필수 요소:

* 서비스 한 줄 소개
* 창작자 대상 가치 제안
* “작품 업로드하기” 버튼
* “번역 작품 보기” 예시 섹션

### 2. 로그인 페이지 `/login`

사용자가 이메일과 비밀번호로 로그인한다.

필수 요소:

* 이메일 입력
* 비밀번호 입력
* 로그인 버튼
* 회원가입 이동 링크

### 3. 회원가입 페이지 `/signup`

사용자가 창작자 계정을 만든다.

필수 요소:

* 닉네임
* 이메일
* 비밀번호
* 비밀번호 확인
* 회원가입 버튼

### 4. 창작자 대시보드 `/dashboard`

창작자가 자신의 작품과 반응을 확인하는 페이지이다.

필수 요소:

* 전체 작품 수
* 전체 조회수
* 전체 댓글 수
* 최근 업로드 작품
* 최근 댓글
* 작품별 조회수 요약

### 5. 작품 목록 페이지 `/works`

창작자가 업로드한 작품 목록을 확인한다.

필수 요소:

* 작품 제목
* 원문 언어
* 번역 언어
* 공개 여부
* 조회수
* 댓글 수
* 생성일
* 상세 페이지 이동

### 6. 작품 업로드 페이지 `/works/new`

창작자가 작품을 업로드한다.

초기 MVP에서는 파일 업로드보다 텍스트 입력 방식을 우선한다.

필수 입력값:

* 작품 제목
* 작품 소개
* 장르
* 태그
* 원문 언어
* 번역 대상 언어
* 원문 텍스트

업로드 후 처리 흐름:

1. 작품 메타데이터 저장
2. 원문 텍스트 저장
3. AI 번역 요청
4. 번역 결과 저장
5. 작품 상세 페이지로 이동

### 7. 작품 상세 페이지 `/works/[workId]`

창작자가 업로드한 작품과 번역 결과를 확인한다.

필수 요소:

* 작품 제목
* 원문 텍스트
* 번역 텍스트
* 공개 여부 토글
* 공개 링크 복사
* 조회수
* 댓글 목록
* 번역 다시 생성 버튼

### 8. 독자 뷰어 페이지 `/read/[publicSlug]`

독자가 번역된 작품을 읽는 공개 페이지이다.

필수 요소:

* 작품 제목
* 작품 소개
* 번역된 본문
* 창작자 이름
* 댓글 목록
* 댓글 작성 폼

뷰어 접근 시 처리:

1. 공개 작품인지 확인한다.
2. 조회수를 1 증가시킨다.
3. referrer, utm_source, userAgent 등의 유입 정보를 저장한다.
4. 번역된 본문을 보여준다.

## 핵심 사용자 흐름

### 창작자 흐름

```txt
회원가입
→ 로그인
→ 작품 업로드
→ AI 자동 번역
→ 번역 결과 확인
→ 작품 공개
→ 공개 링크 공유
→ 대시보드에서 유입 및 댓글 확인
```

### 독자 흐름

```txt
공개 링크 접속
→ 번역 작품 읽기
→ 댓글 작성
```

## 데이터 모델

### User

```ts
type User = {
  id: string;
  email: string;
  passwordHash: string;
  nickname: string;
  createdAt: Date;
  updatedAt: Date;
};
```

### Work

```ts
type Work = {
  id: string;
  authorId: string;
  title: string;
  description: string;
  genre: string;
  tags: string[];
  sourceLanguage: string;
  targetLanguage: string;
  isPublic: boolean;
  publicSlug: string;
  createdAt: Date;
  updatedAt: Date;
};
```

### WorkContent

```ts
type WorkContent = {
  id: string;
  workId: string;
  originalText: string;
  translatedText: string | null;
  translationStatus: "pending" | "processing" | "completed" | "failed";
  createdAt: Date;
  updatedAt: Date;
};
```

### Comment

```ts
type Comment = {
  id: string;
  workId: string;
  nickname: string;
  content: string;
  createdAt: Date;
};
```

초기 MVP에서는 독자 로그인을 요구하지 않고 닉네임 기반 댓글을 허용한다.

### ViewLog

```ts
type ViewLog = {
  id: string;
  workId: string;
  referrer: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  userAgent: string | null;
  ipHash: string | null;
  createdAt: Date;
};
```

개인정보 보호를 위해 IP는 원문 저장하지 않고 해시 처리한다.

## API 설계

### Auth

#### POST `/api/auth/signup`

회원가입 API이다.

Request:

```json
{
  "email": "creator@example.com",
  "password": "password1234",
  "nickname": "creator"
}
```

Response:

```json
{
  "userId": "user_id"
}
```

#### POST `/api/auth/login`

로그인 API이다.

Request:

```json
{
  "email": "creator@example.com",
  "password": "password1234"
}
```

Response:

```json
{
  "token": "jwt_or_session_token"
}
```

### Works

#### POST `/api/works`

작품 업로드 API이다.

Request:

```json
{
  "title": "작품 제목",
  "description": "작품 소개",
  "genre": "fantasy",
  "tags": ["romance", "fantasy"],
  "sourceLanguage": "ko",
  "targetLanguage": "en",
  "originalText": "원문 텍스트"
}
```

처리:

1. 로그인 사용자 확인
2. 작품 정보 저장
3. 원문 저장
4. 번역 상태를 `processing`으로 변경
5. AI 번역 실행
6. 번역 성공 시 `completed`
7. 번역 실패 시 `failed`

Response:

```json
{
  "workId": "work_id",
  "translationStatus": "completed"
}
```

#### GET `/api/works`

로그인 사용자의 작품 목록을 조회한다.

Response:

```json
{
  "works": [
    {
      "id": "work_id",
      "title": "작품 제목",
      "isPublic": true,
      "viewCount": 120,
      "commentCount": 4,
      "createdAt": "2026-06-24T00:00:00.000Z"
    }
  ]
}
```

#### GET `/api/works/[workId]`

작품 상세 정보를 조회한다.

Response:

```json
{
  "id": "work_id",
  "title": "작품 제목",
  "description": "작품 소개",
  "originalText": "원문",
  "translatedText": "번역문",
  "translationStatus": "completed",
  "isPublic": true,
  "publicSlug": "public_slug",
  "viewCount": 120,
  "comments": []
}
```

#### PATCH `/api/works/[workId]`

작품 공개 여부 또는 메타데이터를 수정한다.

Request:

```json
{
  "isPublic": true
}
```

Response:

```json
{
  "success": true
}
```

### Translate

#### POST `/api/translate`

기존 작품의 번역을 다시 생성한다.

Request:

```json
{
  "workId": "work_id"
}
```

Response:

```json
{
  "translationStatus": "completed",
  "translatedText": "번역 결과"
}
```

## AI 번역 프롬프트 기본 방향

AI 번역은 단순 직역이 아니라 웹소설/웹툰 독자가 자연스럽게 읽을 수 있는 번역을 목표로 한다.

### 기본 시스템 프롬프트

```txt
You are a professional literary translator specialized in Korean web novels and webtoon scripts.

Translate the given Korean text into natural English for global readers.

Rules:
- Preserve the original meaning.
- Preserve character emotions and tone.
- Do not summarize.
- Do not omit sentences.
- Keep line breaks when possible.
- Translate dialogue naturally.
- Avoid overly literal translation.
- If a term is ambiguous, choose the most contextually natural expression.
```

### 사용자 프롬프트 예시

```txt
Source language: Korean
Target language: English
Genre: {genre}
Title: {title}
Description: {description}

Original text:
{originalText}
```

## 댓글 기능

초기 MVP 댓글은 로그인 없는 독자도 작성할 수 있게 한다.

### 댓글 작성 규칙

* 닉네임 필수
* 댓글 내용 필수
* 댓글 길이 제한: 500자
* XSS 방지를 위해 HTML 태그 제거
* 욕설 필터링은 초기에는 구현하지 않아도 된다.
* 삭제 기능은 MVP 이후로 미룬다.

### POST `/api/comments`

Request:

```json
{
  "workId": "work_id",
  "nickname": "reader",
  "content": "재밌게 읽었습니다."
}
```

Response:

```json
{
  "commentId": "comment_id"
}
```

### GET `/api/comments?workId=work_id`

Response:

```json
{
  "comments": [
    {
      "id": "comment_id",
      "nickname": "reader",
      "content": "재밌게 읽었습니다.",
      "createdAt": "2026-06-24T00:00:00.000Z"
    }
  ]
}
```

## 독자 유입 확인 기능

초기 MVP에서는 복잡한 분석보다 최소 지표를 제공한다.

### 수집 지표

* 작품별 조회수
* 날짜별 조회수
* 유입 경로 referrer
* UTM source
* UTM medium
* UTM campaign
* 댓글 수

### 대시보드 표시 지표

* 전체 조회수
* 오늘 조회수
* 작품별 조회수
* 작품별 댓글 수
* 최근 댓글
* 주요 유입 경로

### GET `/api/analytics/dashboard`

Response:

```json
{
  "totalViews": 1200,
  "todayViews": 45,
  "totalComments": 32,
  "works": [
    {
      "workId": "work_id",
      "title": "작품 제목",
      "viewCount": 120,
      "commentCount": 4
    }
  ],
  "referrers": [
    {
      "source": "twitter.com",
      "count": 40
    }
  ]
}
```

## UI 원칙

### 전체 톤

* 창작자에게는 신뢰감 있는 작업 도구처럼 보여야 한다.
* 독자에게는 편안한 독서 뷰어처럼 보여야 한다.
* 과도하게 복잡한 관리자 화면처럼 만들지 않는다.

### 창작자 화면

* 업로드 흐름은 최대한 단순하게 만든다.
* 번역 상태를 명확히 보여준다.
* 공개 링크를 쉽게 복사할 수 있게 한다.
* 조회수와 댓글을 한눈에 볼 수 있게 한다.

### 독자 뷰어

* 본문 가독성을 최우선으로 한다.
* 모바일 화면에서도 읽기 편해야 한다.
* 댓글 영역은 본문 아래에 배치한다.
* 광고, 추천 등은 초기 MVP에서 제외한다.

## 번역 상태 처리

번역 상태는 다음 네 가지로 관리한다.

```ts
type TranslationStatus = "pending" | "processing" | "completed" | "failed";
```

### 상태별 UI

* `pending`: 번역 대기 중
* `processing`: 번역 중
* `completed`: 번역 완료
* `failed`: 번역 실패, 다시 시도 버튼 표시

## 에러 처리

### 업로드 실패

* 작품 제목이 비어 있으면 저장하지 않는다.
* 원문 텍스트가 비어 있으면 저장하지 않는다.
* 너무 긴 텍스트는 제한 메시지를 보여준다.

### 번역 실패

* 작품 정보와 원문은 유지한다.
* 번역 상태를 `failed`로 저장한다.
* 사용자가 다시 번역을 시도할 수 있게 한다.

### 공개 작품 접근 실패

* 존재하지 않는 publicSlug이면 404 페이지를 보여준다.
* 비공개 작품이면 접근 불가 메시지를 보여준다.

## 보안 및 개인정보

* 비밀번호는 반드시 해시 처리한다.
* LLM API Key는 서버 환경변수에 저장한다.
* 클라이언트에 API Key를 노출하지 않는다.
* 댓글 입력값은 sanitize 처리한다.
* IP 주소는 원문 저장하지 않는다.
* 조회수 중복 방지는 초기에는 엄격하게 구현하지 않는다.

## 환경변수 예시

```env
DATABASE_URL="postgresql://user:password@localhost:5432/paperplane"
AUTH_SECRET="your-auth-secret"
LLM_API_KEY="your-llm-api-key"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

## 개발 우선순위

### 1단계: 기본 인증

* 회원가입
* 로그인
* 로그아웃
* 로그인 사용자 보호 라우팅

### 2단계: 작품 업로드

* 작품 업로드 폼
* 작품 저장
* 작품 목록
* 작품 상세

### 3단계: AI 번역

* 서버에서 LLM API 호출
* 번역 결과 저장
* 번역 상태 표시
* 번역 실패 처리

### 4단계: 독자 뷰어

* 공개 링크 생성
* 공개 작품 조회
* 번역문 뷰어
* 모바일 가독성 개선

### 5단계: 댓글

* 댓글 작성
* 댓글 조회
* 작품 상세에서 댓글 확인

### 6단계: 유입 확인

* 조회수 저장
* referrer 저장
* 작품별 조회수 표시
* 대시보드 구현

## 개발 시 주의사항

* MVP 범위를 벗어나는 기능을 먼저 구현하지 않는다.
* 이미지 OCR, 식자, 결제, 추천 기능은 나중으로 미룬다.
* 번역 품질 고도화보다 전체 사용 흐름 완성을 우선한다.
* API Key는 절대 프론트엔드에 노출하지 않는다.
* publicSlug는 예측하기 어렵게 생성한다.
* 창작자가 자신의 작품만 수정할 수 있도록 권한 체크를 반드시 한다.
* 공개 뷰어는 로그인 없이 접근 가능해야 한다.

## 완료 기준

초기 MVP는 다음 흐름이 정상 동작하면 완료로 본다.

```txt
창작자가 회원가입한다.
창작자가 로그인한다.
창작자가 작품 텍스트를 업로드한다.
AI가 작품을 영어로 자동 번역한다.
창작자가 번역 결과를 확인한다.
창작자가 작품을 공개한다.
독자가 공개 링크로 접속한다.
독자가 번역 작품을 읽는다.
독자가 댓글을 남긴다.
창작자가 조회수와 댓글을 확인한다.
```

## 향후 확장 후보

* 용어집 자동 생성
* 캐릭터별 말투 유지
* 회차별 작품 관리
* 웹툰 이미지 OCR
* 말풍선 텍스트 추출
* 식자 자동화
* 번역 품질 점검
* 독자 선호 태그 분석
* 작품 추천
* 다국어 번역
* 창작자 후원
* 유료 회차
* 중소 CP용 B2B 관리 기능
