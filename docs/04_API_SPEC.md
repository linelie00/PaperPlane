# 04_API_SPEC.md

# PaperPlane API 명세

이 문서는 PaperPlane 초기 MVP의 API 요청/응답 구조를 정의한다.
초기 구현은 Next.js API Route 기반으로 한다. AI 번역 요청은 반드시 서버에서 처리하며, 클라이언트에서 직접 LLM API Key를 호출하지 않는다.

## 공통 규칙

* 모든 요청/응답 본문은 JSON이다.
* 인증이 필요한 API는 세션 또는 `Authorization: Bearer <token>` 헤더로 인증한다.
* 인증 실패 시 `401 Unauthorized`를 반환한다.
* 권한 없는 리소스 접근 시 `403 Forbidden`을 반환한다.
* 존재하지 않는 리소스는 `404 Not Found`를 반환한다.
* 입력값 검증 실패는 `400 Bad Request`를 반환한다.

### 공통 에러 응답 형식

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "사람이 읽을 수 있는 에러 메시지"
  }
}
```

## API 목록

| # | 기능 | Method | Path | Auth |
|---|------|--------|------|------|
| 1 | 회원가입 | POST | `/api/auth/signup` | 불필요 |
| 2 | 로그인 | POST | `/api/auth/login` | 불필요 |
| 3 | 로그아웃 | POST | `/api/auth/logout` | 필요 |
| 4 | 작품 생성 | POST | `/api/works` | 필요 |
| 5 | 작품 목록 조회 | GET | `/api/works` | 필요 |
| 6 | 작품 상세 조회 | GET | `/api/works/[workId]` | 필요(소유자) |
| 7 | 작품 공개 여부 수정 | PATCH | `/api/works/[workId]` | 필요(소유자) |
| 8 | AI 번역 요청 | POST | `/api/translate` | 필요(소유자) |
| 9 | 공개 작품 조회 | GET | `/api/read/[publicSlug]` | 불필요 |
| 10 | 조회수 기록 | POST | `/api/analytics/view` | 불필요 |
| 11 | 댓글 작성 | POST | `/api/comments` | 불필요 |
| 12 | 댓글 조회 | GET | `/api/comments?workId=` | 불필요 |
| 13 | 대시보드 통계 조회 | GET | `/api/analytics/dashboard` | 필요 |

---

## 1. 회원가입

* **Method**: POST
* **Path**: `/api/auth/signup`
* **Auth**: 불필요

### Request Body

```json
{
  "email": "creator@example.com",
  "password": "password1234",
  "nickname": "creator"
}
```

### Response Body (201)

```json
{
  "userId": "user_id"
}
```

### Error Case

| 코드 | 상태 | 설명 |
|------|------|------|
| `INVALID_EMAIL` | 400 | 이메일 형식 오류 |
| `WEAK_PASSWORD` | 400 | 비밀번호 규칙 미달 |
| `MISSING_FIELD` | 400 | 필수 입력값 누락 |
| `EMAIL_ALREADY_EXISTS` | 409 | 이미 가입된 이메일 |

* 비밀번호는 서버에서 해시 처리하여 저장한다.

---

## 2. 로그인

* **Method**: POST
* **Path**: `/api/auth/login`
* **Auth**: 불필요

### Request Body

```json
{
  "email": "creator@example.com",
  "password": "password1234"
}
```

### Response Body (200)

```json
{
  "token": "jwt_or_session_token"
}
```

### Error Case

| 코드 | 상태 | 설명 |
|------|------|------|
| `MISSING_FIELD` | 400 | 이메일/비밀번호 누락 |
| `INVALID_CREDENTIALS` | 401 | 이메일 또는 비밀번호 불일치 |

---

## 3. 로그아웃

* **Method**: POST
* **Path**: `/api/auth/logout`
* **Auth**: 필요

### Request Body

```json
{}
```

### Response Body (200)

```json
{
  "success": true
}
```

### Error Case

| 코드 | 상태 | 설명 |
|------|------|------|
| `UNAUTHORIZED` | 401 | 로그인 상태가 아님 |

* 세션 또는 토큰을 만료시킨다.

---

## 4. 작품 생성

* **Method**: POST
* **Path**: `/api/works`
* **Auth**: 필요

### Request Body

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

### 처리 순서

```txt
1. 로그인 사용자 확인
2. 작품 정보 저장 (Work)
3. 원문 저장 (WorkContent.originalText)
4. 번역 상태를 processing 으로 변경
5. AI 번역 실행
6. 성공 시 completed, 실패 시 failed
```

### Response Body (201)

```json
{
  "workId": "work_id",
  "translationStatus": "completed"
}
```

### Error Case

| 코드 | 상태 | 설명 |
|------|------|------|
| `UNAUTHORIZED` | 401 | 미로그인 |
| `MISSING_TITLE` | 400 | 작품 제목 없음 |
| `MISSING_ORIGINAL_TEXT` | 400 | 원문 텍스트 없음 |
| `TEXT_TOO_LONG` | 400 | 원문 텍스트 길이 초과 |
| `TRANSLATION_FAILED` | 200/502 | 작품/원문은 저장되나 번역 상태는 `failed` |

* 번역 실패 시에도 작품 정보와 원문은 유지되며 다시 시도할 수 있다.

---

## 5. 작품 목록 조회

* **Method**: GET
* **Path**: `/api/works`
* **Auth**: 필요

### Request Body

없음 (로그인 사용자 기준 조회)

### Response Body (200)

```json
{
  "works": [
    {
      "id": "work_id",
      "title": "작품 제목",
      "sourceLanguage": "ko",
      "targetLanguage": "en",
      "translationStatus": "completed",
      "isPublic": true,
      "viewCount": 120,
      "commentCount": 4,
      "createdAt": "2026-06-24T00:00:00.000Z"
    }
  ]
}
```

### Error Case

| 코드 | 상태 | 설명 |
|------|------|------|
| `UNAUTHORIZED` | 401 | 미로그인 |

---

## 6. 작품 상세 조회

* **Method**: GET
* **Path**: `/api/works/[workId]`
* **Auth**: 필요 (소유자만)

### Request Body

없음

### Response Body (200)

```json
{
  "id": "work_id",
  "title": "작품 제목",
  "description": "작품 소개",
  "genre": "fantasy",
  "tags": ["romance", "fantasy"],
  "sourceLanguage": "ko",
  "targetLanguage": "en",
  "originalText": "원문",
  "translatedText": "번역문",
  "translationStatus": "completed",
  "isPublic": true,
  "publicSlug": "public_slug",
  "viewCount": 120,
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

### Error Case

| 코드 | 상태 | 설명 |
|------|------|------|
| `UNAUTHORIZED` | 401 | 미로그인 |
| `FORBIDDEN` | 403 | 소유자가 아님 |
| `WORK_NOT_FOUND` | 404 | 작품 없음 |

---

## 7. 작품 공개 여부 수정

* **Method**: PATCH
* **Path**: `/api/works/[workId]`
* **Auth**: 필요 (소유자만)

### Request Body

```json
{
  "isPublic": true
}
```

> 메타데이터(title, description, genre, tags 등) 수정도 같은 엔드포인트에서 부분 업데이트로 처리할 수 있다.

### Response Body (200)

```json
{
  "success": true,
  "isPublic": true,
  "publicSlug": "public_slug"
}
```

* `isPublic`을 `true`로 변경할 때 publicSlug가 없으면 예측하기 어려운 값으로 생성한다.

### Error Case

| 코드 | 상태 | 설명 |
|------|------|------|
| `UNAUTHORIZED` | 401 | 미로그인 |
| `FORBIDDEN` | 403 | 소유자가 아님 |
| `WORK_NOT_FOUND` | 404 | 작품 없음 |
| `INVALID_PAYLOAD` | 400 | 잘못된 요청 본문 |

---

## 8. AI 번역 요청 (재번역)

* **Method**: POST
* **Path**: `/api/translate`
* **Auth**: 필요 (소유자만)

### Request Body

```json
{
  "workId": "work_id"
}
```

### 처리

```txt
1. 소유자 확인
2. 번역 상태를 processing 으로 변경
3. 서버에서 LLM API 호출
4. 성공 시 translatedText 저장 및 completed
5. 실패 시 failed (원문 유지)
```

### Response Body (200)

```json
{
  "translationStatus": "completed",
  "translatedText": "번역 결과"
}
```

### Error Case

| 코드 | 상태 | 설명 |
|------|------|------|
| `UNAUTHORIZED` | 401 | 미로그인 |
| `FORBIDDEN` | 403 | 소유자가 아님 |
| `WORK_NOT_FOUND` | 404 | 작품 없음 |
| `TRANSLATION_FAILED` | 502 | 번역 실패, 상태 `failed` 저장 |

---

## 9. 공개 작품 조회

* **Method**: GET
* **Path**: `/api/read/[publicSlug]`
* **Auth**: 불필요

### Request Body

없음

### Response Body (200)

```json
{
  "title": "작품 제목",
  "description": "작품 소개",
  "authorNickname": "creator",
  "targetLanguage": "en",
  "translatedText": "번역된 본문",
  "viewCount": 121
}
```

* 원문 텍스트와 비공개 메타데이터는 노출하지 않는다.

### Error Case

| 코드 | 상태 | 설명 |
|------|------|------|
| `SLUG_NOT_FOUND` | 404 | 존재하지 않는 publicSlug |
| `WORK_NOT_PUBLIC` | 403 | 비공개 작품 |
| `TRANSLATION_NOT_READY` | 409 | 번역 미완료 작품 |

---

## 10. 조회수 기록

* **Method**: POST
* **Path**: `/api/analytics/view`
* **Auth**: 불필요

> 공개 뷰어 접근 시 호출된다. 서버는 publicSlug로 작품을 찾아 조회수를 1 증가시키고 ViewLog를 저장한다.

### Request Body

```json
{
  "publicSlug": "public_slug",
  "referrer": "https://twitter.com",
  "utmSource": "twitter",
  "utmMedium": "social",
  "utmCampaign": "launch"
}
```

* `userAgent`와 IP는 서버에서 요청 헤더로부터 수집한다. IP는 해시(ipHash)로 저장한다.

### Response Body (200)

```json
{
  "success": true,
  "viewCount": 121
}
```

### Error Case

| 코드 | 상태 | 설명 |
|------|------|------|
| `SLUG_NOT_FOUND` | 404 | 존재하지 않는 publicSlug |
| `WORK_NOT_PUBLIC` | 403 | 비공개 작품 |

* 조회수 중복 방지는 초기 MVP에서 엄격하게 구현하지 않는다.

---

## 11. 댓글 작성

* **Method**: POST
* **Path**: `/api/comments`
* **Auth**: 불필요 (닉네임 기반)

### Request Body

```json
{
  "workId": "work_id",
  "nickname": "reader",
  "content": "재밌게 읽었습니다."
}
```

### Response Body (201)

```json
{
  "commentId": "comment_id"
}
```

### 규칙 / Error Case

| 코드 | 상태 | 설명 |
|------|------|------|
| `MISSING_NICKNAME` | 400 | 닉네임 없음 |
| `MISSING_CONTENT` | 400 | 댓글 내용 없음 |
| `CONTENT_TOO_LONG` | 400 | 500자 초과 |
| `WORK_NOT_FOUND` | 404 | 작품 없음 |
| `WORK_NOT_PUBLIC` | 403 | 비공개 작품에는 댓글 불가 |

* HTML 태그는 제거(sanitize)하여 저장한다.

---

## 12. 댓글 조회

* **Method**: GET
* **Path**: `/api/comments?workId=work_id`
* **Auth**: 불필요

### Request

쿼리 파라미터: `workId`

### Response Body (200)

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

### Error Case

| 코드 | 상태 | 설명 |
|------|------|------|
| `MISSING_WORK_ID` | 400 | workId 누락 |
| `WORK_NOT_FOUND` | 404 | 작품 없음 |

---

## 13. 대시보드 통계 조회

* **Method**: GET
* **Path**: `/api/analytics/dashboard`
* **Auth**: 필요

### Request Body

없음 (로그인 사용자 기준)

### Response Body (200)

```json
{
  "totalWorks": 5,
  "totalViews": 1200,
  "todayViews": 45,
  "totalComments": 32,
  "publicWorks": 3,
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
  ],
  "recentComments": [
    {
      "id": "comment_id",
      "workId": "work_id",
      "nickname": "reader",
      "content": "재밌게 읽었습니다.",
      "createdAt": "2026-06-24T00:00:00.000Z"
    }
  ]
}
```

### Error Case

| 코드 | 상태 | 설명 |
|------|------|------|
| `UNAUTHORIZED` | 401 | 미로그인 |

## 관련 문서

* [01_MVP_SCOPE.md](01_MVP_SCOPE.md) — MVP 범위
* [02_USER_FLOW.md](02_USER_FLOW.md) — 사용자 흐름
* [03_PAGE_SPEC.md](03_PAGE_SPEC.md) — 페이지 명세
* [05_DB_SCHEMA.md](05_DB_SCHEMA.md) — DB 스키마
