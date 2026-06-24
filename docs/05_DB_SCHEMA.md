# 05_DB_SCHEMA.md

# PaperPlane DB 스키마

이 문서는 PaperPlane 초기 MVP에 필요한 DB 모델을 정의한다.
DB는 PostgreSQL, ORM은 Prisma 사용을 우선 고려한다.
초기 MVP 범위를 넘는 기능은 구현하지 않되, 이후 확장을 고려하여 구조는 확장 가능하게 설계한다.

## 모델 목록

| 모델 | 설명 |
|------|------|
| User | 창작자 계정 |
| Work | 작품 메타데이터 |
| WorkContent | 작품 원문/번역문 본문 |
| Comment | 독자 댓글 (로그인 불필요) |
| ViewLog | 독자 유입/조회 로그 |

## 관계 요약

```txt
User 1 ── N Work
Work 1 ── 1 WorkContent
Work 1 ── N Comment
Work 1 ── N ViewLog
```

* User : Work = 1 : N (한 창작자가 여러 작품을 가진다)
* Work : WorkContent = 1 : 1 (한 작품은 하나의 본문을 가진다)
* Work : Comment = 1 : N
* Work : ViewLog = 1 : N

---

## 1. User

창작자 계정 모델이다. 초기 MVP에서 독자는 계정을 만들지 않는다.

| 필드명 | 타입 | 설명 | 관계 |
|--------|------|------|------|
| id | String (cuid/uuid) | PK, 사용자 고유 ID | - |
| email | String | 로그인 이메일, 고유값(unique) | - |
| passwordHash | String | 해시된 비밀번호 | - |
| nickname | String | 창작자 표시 이름 | - |
| createdAt | DateTime | 생성 시각 | - |
| updatedAt | DateTime | 수정 시각 | - |
| works | Work[] | 작성한 작품 목록 | Work.authorId 와 연결 |

### 주의사항

* `email`은 unique 제약을 둔다.
* `passwordHash`만 저장하고 평문 비밀번호는 절대 저장하지 않는다.
* 비밀번호 해시는 bcrypt 등 단방향 해시를 사용한다.

---

## 2. Work

작품 메타데이터 모델이다. 본문은 WorkContent에 분리 저장한다.

| 필드명 | 타입 | 설명 | 관계 |
|--------|------|------|------|
| id | String | PK, 작품 고유 ID | - |
| authorId | String | 작성 창작자 ID | FK → User.id |
| title | String | 작품 제목 (필수) | - |
| description | String | 작품 소개 | - |
| genre | String | 장르 | - |
| tags | String[] | 태그 배열 | - |
| sourceLanguage | String | 원문 언어 (기본 "ko") | - |
| targetLanguage | String | 번역 대상 언어 (기본 "en") | - |
| isPublic | Boolean | 공개 여부 (기본 false) | - |
| publicSlug | String? | 공개 링크 슬러그, 고유값(unique) | - |
| createdAt | DateTime | 생성 시각 | - |
| updatedAt | DateTime | 수정 시각 | - |
| author | User | 작성자 | User 1:N |
| content | WorkContent | 본문 (1:1) | WorkContent.workId |
| comments | Comment[] | 댓글 목록 | Comment.workId |
| viewLogs | ViewLog[] | 조회 로그 목록 | ViewLog.workId |

### 주의사항

* `publicSlug`는 예측하기 어렵게 생성하고 unique 제약을 둔다.
* `publicSlug`는 공개 전에는 null일 수 있다. 공개(`isPublic = true`) 시 생성한다.
* `title`은 비어 있으면 저장하지 않는다.
* 작품 수정은 소유자(`authorId`)만 가능하도록 애플리케이션에서 권한 체크한다.
* `tags`는 Postgres 배열 또는 별도 정규화 테이블로 확장 가능하나, MVP에서는 배열로 단순화한다.
* 조회수/댓글 수는 ViewLog/Comment 집계로 계산하거나, 성능을 위해 캐시 컬럼(`viewCount` 등) 추가를 확장으로 고려한다.

---

## 3. WorkContent

작품의 원문과 번역문을 저장한다. 본문 텍스트가 길 수 있어 Work와 분리한다.

| 필드명 | 타입 | 설명 | 관계 |
|--------|------|------|------|
| id | String | PK | - |
| workId | String | 대상 작품 ID, 고유값(unique) | FK → Work.id |
| originalText | String (Text) | 원문 텍스트 | - |
| translatedText | String? (Text) | 번역문 텍스트 (번역 전 null) | - |
| translationStatus | Enum | 번역 상태 | - |
| createdAt | DateTime | 생성 시각 | - |
| updatedAt | DateTime | 수정 시각 | - |
| work | Work | 소속 작품 | Work 1:1 |

### translationStatus Enum

```ts
type TranslationStatus = "pending" | "processing" | "completed" | "failed";
```

| 값 | 의미 |
|----|------|
| `pending` | 번역 대기 중 |
| `processing` | 번역 진행 중 |
| `completed` | 번역 완료 |
| `failed` | 번역 실패 |

### 주의사항

* `workId`에 unique 제약을 두어 Work : WorkContent = 1 : 1을 보장한다.
* 번역 실패 시에도 `originalText`는 유지하고 `translationStatus`만 `failed`로 둔다.
* `translatedText`는 번역 완료 전까지 null이다.
* 본문은 길이가 클 수 있으므로 Text 타입을 사용한다.

---

## 4. Comment

독자 댓글 모델이다. 초기 MVP에서는 독자 로그인을 요구하지 않고 닉네임 기반으로 작성한다.

| 필드명 | 타입 | 설명 | 관계 |
|--------|------|------|------|
| id | String | PK | - |
| workId | String | 대상 작품 ID | FK → Work.id |
| nickname | String | 작성자 닉네임 (필수) | - |
| content | String | 댓글 내용 (필수, 최대 500자) | - |
| createdAt | DateTime | 작성 시각 | - |
| work | Work | 소속 작품 | Work 1:N |

### 주의사항

* `nickname`과 `content`는 필수이다.
* `content`는 최대 500자로 제한한다.
* 저장 전 HTML 태그를 제거(sanitize)하여 XSS를 방지한다.
* 욕설 필터링과 댓글 삭제 기능은 MVP 이후로 미룬다.
* 댓글은 공개 작품에만 작성 가능하도록 애플리케이션에서 확인한다.

---

## 5. ViewLog

독자 유입 및 조회 로그 모델이다. 대시보드의 조회수/유입 경로 통계에 사용된다.

| 필드명 | 타입 | 설명 | 관계 |
|--------|------|------|------|
| id | String | PK | - |
| workId | String | 대상 작품 ID | FK → Work.id |
| referrer | String? | 유입 referrer | - |
| utmSource | String? | UTM source | - |
| utmMedium | String? | UTM medium | - |
| utmCampaign | String? | UTM campaign | - |
| userAgent | String? | 브라우저 User-Agent | - |
| ipHash | String? | 해시 처리된 IP | - |
| createdAt | DateTime | 조회 시각 | - |
| work | Work | 소속 작품 | Work 1:N |

### 주의사항

* 개인정보 보호를 위해 IP는 원문 저장하지 않고 `ipHash`로 해시 처리한다.
* 모든 유입 필드는 nullable이다 (값이 없을 수 있음).
* 날짜별 조회수는 `createdAt` 기준으로 집계한다.
* 조회수 중복 방지는 초기 MVP에서 엄격하게 구현하지 않는다.
* 로그가 빠르게 쌓이므로 `workId`와 `createdAt`에 인덱스를 고려한다.

---

## Prisma 스키마 예시 (참고)

```prisma
model User {
  id           String   @id @default(cuid())
  email        String   @unique
  passwordHash String
  nickname     String
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  works        Work[]
}

model Work {
  id             String       @id @default(cuid())
  authorId       String
  title          String
  description    String       @default("")
  genre          String       @default("")
  tags           String[]
  sourceLanguage String       @default("ko")
  targetLanguage String       @default("en")
  isPublic       Boolean      @default(false)
  publicSlug     String?      @unique
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt
  author         User         @relation(fields: [authorId], references: [id])
  content        WorkContent?
  comments       Comment[]
  viewLogs       ViewLog[]

  @@index([authorId])
}

model WorkContent {
  id                String            @id @default(cuid())
  workId            String            @unique
  originalText      String
  translatedText    String?
  translationStatus TranslationStatus @default(pending)
  createdAt         DateTime          @default(now())
  updatedAt         DateTime          @updatedAt
  work              Work              @relation(fields: [workId], references: [id], onDelete: Cascade)
}

model Comment {
  id        String   @id @default(cuid())
  workId    String
  nickname  String
  content   String
  createdAt DateTime @default(now())
  work      Work     @relation(fields: [workId], references: [id], onDelete: Cascade)

  @@index([workId])
}

model ViewLog {
  id          String   @id @default(cuid())
  workId      String
  referrer    String?
  utmSource   String?
  utmMedium   String?
  utmCampaign String?
  userAgent   String?
  ipHash      String?
  createdAt   DateTime @default(now())
  work        Work     @relation(fields: [workId], references: [id], onDelete: Cascade)

  @@index([workId])
  @@index([createdAt])
}

enum TranslationStatus {
  pending
  processing
  completed
  failed
}
```

> 위 Prisma 예시는 참고용이다. 실제 구현 시 데이터 모델 정의(CLAUDE.md)와 본 문서를 기준으로 작성한다.

## 관련 문서

* [01_MVP_SCOPE.md](01_MVP_SCOPE.md) — MVP 범위
* [02_USER_FLOW.md](02_USER_FLOW.md) — 사용자 흐름
* [04_API_SPEC.md](04_API_SPEC.md) — API 명세
