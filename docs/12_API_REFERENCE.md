# 12. API 레퍼런스 (현행)

모든 라우트는 `src/app/api/**/route.ts`. 인증은 `pp_session` httpOnly 쿠키(JWT).
오류는 `{ error: { code, message } }` 형식.

## 인증 (Auth)

### POST `/api/auth/signup`
회원가입. body `{ email, password, nickname, image? }`. 사용자 생성 후 인증 메일 발송.
응답 `{ userId, verificationSent }`.

### POST `/api/auth/login`
로그인. body `{ email, password }`.
- 소셜 전용 계정 → 409 `USE_SOCIAL_LOGIN`
- 미인증 → 403 `EMAIL_NOT_VERIFIED`
- 성공 시 세션 쿠키 발급, `{ token }`.

### POST `/api/auth/logout`
세션 쿠키 삭제.

### GET `/api/auth/verify?token=...`
이메일 인증. 성공 시 `emailVerified` 설정 후 `/login?verified=1`로 리다이렉트.

### POST `/api/auth/resend-verification`
body `{ email }`. 미인증 사용자에게 인증 메일 재발송. 존재 여부 노출 안 함(항상 200).

### GET `/api/auth/oauth/[provider]`
google|kakao|naver. state(CSRF) 발급 후 제공자 authorize로 리다이렉트.

### GET `/api/auth/oauth/[provider]/callback`
state 검증 → 토큰 교환 → 프로필 조회 → 계정 찾기/연결/생성 → 세션 발급 → `/dashboard`.
소셜 가입자는 `emailVerified` 자동 설정. (Kakao는 client secret 없이도 동작)

## 프로필

### PATCH `/api/profile` (인증)
body `{ nickname?, image?, coverImage?, bio? }`. 이미지/배경은 URL 또는 null(제거).
수정 후 세션 재발급(닉네임/이미지 최신화).

## 작품 (Works)

### POST `/api/works` (인증)
작품(프로젝트) 생성 — 메타데이터만. body `{ title, description?, genre?, tags?, sourceLanguage?, targetLanguages?, coverImage? }`.
`publicSlug` 생성. 응답 `{ workId }`.

### GET `/api/works` (인증)
내 작품 목록. 회차 수/공개 회차 수/조회·댓글 카운트 포함.

### GET `/api/works/[workId]` (인증·소유자)
작품 상세 + 회차(번역 포함) + 댓글(트리). `WorkDetail` 반환.

### PATCH `/api/works/[workId]` (인증·소유자)
메타/공개/번역 언어 수정. body `{ title?, description?, genre?, tags?, sourceLanguage?, targetLanguages?, coverImage?, isPublic? }`.
**번역 언어 구성이 바뀌면** 모든 회차를 비동기 재번역(추가 백필/제거 정리).

### DELETE `/api/works/[workId]` (인증·소유자)
작품 삭제. 회차/댓글/조회로그/번역 cascade.

## 회차 (Chapters)

### POST `/api/works/[workId]/chapters` (인증·소유자)
회차 추가. body `{ title?, originalText, isPublic?, coverImage?, category? }`.
원문 sanitize 저장, `order`=max+1. **번역은 비동기**(pending 표시 후 응답, 백그라운드 진행).
응답 `{ chapterId, order, isPublic }`.

### PATCH `/api/chapters/[chapterId]` (인증·소유자)
회차 수정. body `{ title?, originalText?, isPublic?, coverImage?, category? }`.
본문 변경 시 비동기 재번역.

### DELETE `/api/chapters/[chapterId]` (인증·소유자)
회차 삭제(번역/댓글 cascade).

### POST `/api/translate` (인증·소유자)
회차 번역 재생성. body `{ chapterId, language? }`. language 있으면 그 언어만, 없으면 전체.
**비동기**(pending 응답 후 백그라운드). `maxDuration=60`.

## 독자/공개

### GET `/api/read/[publicSlug]` (공개)
공개 작품 + 공개 회차 목록. 비공개/공개 회차 없음 → 403.
(독자 페이지는 서버 컴포넌트에서 직접 DB 조회하므로 이 API는 보조)

## 댓글 (Comments)

### POST `/api/comments` (공개)
회차 댓글/답글 작성. body `{ chapterId, parentId?, nickname, content, deletePassword? }`.
공개된 회차에만 가능. `deletePassword`는 숫자 4자리(선택). 답글은 1단계.

### GET `/api/comments?chapterId=...` (공개)
회차 댓글(답글 중첩) 조회.

### DELETE `/api/comments/[commentId]`
삭제. 작품 소유자는 인증만으로, 익명은 body `{ password }`로 본인 댓글 삭제. 부모 삭제 시 답글 cascade.

## 이미지 업로드

### POST `/api/upload` (인증)
에디터/작품·회차 커버 이미지. multipart `file`. PNG/JPG/WEBP/GIF, ≤5MB. 랜덤 파일명.
응답 `{ url }`. 저장소는 Blob(배포)/디스크(로컬) 자동 분기.

### POST `/api/avatar` (비인증)
프로필/배경 이미지(회원가입 단계에도 사용). ≤2MB. 응답 `{ url }`.

## 분석 (Analytics)

### GET `/api/analytics/dashboard` (인증)
대시보드 통계(총 조회/오늘/댓글/공개 작품, 작품별 카운트, 유입 경로, 최근 댓글).

### POST `/api/analytics/view` (공개)
조회 기록(보조). 독자 회차 페이지는 서버에서 직접 ViewLog를 남김.
