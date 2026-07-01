# 11. 데이터 모델 (현행)

기준: `prisma/schema.prisma`. DB는 PostgreSQL. enum `TranslationStatus = pending | processing | completed | failed`.

> 초기 스펙의 `WorkContent`(작품당 본문 1개)는 **폐기**되고 `Chapter`(작품당 여러 회차)로 대체됨.
> 단일 번역(`Work.targetLanguage`, `Chapter.translatedText/translationStatus`)도
> 다국어(`Work.targetLanguages`, `ChapterTranslation`)로 대체됨. 구 필드는 호환용으로만 남음.

## User
| 필드 | 타입 | 설명 |
|------|------|------|
| id | String @id cuid | |
| email | String @unique | |
| passwordHash | String? | 소셜 전용 계정은 null |
| nickname | String | |
| image | String? | 프로필 사진 URL |
| coverImage | String? | 작가 홈 배경 사진 |
| bio | String? | 작가 소개 |
| emailVerified | DateTime? | null = 미인증 |
| createdAt/updatedAt | DateTime | |

관계: `works Work[]`, `accounts OAuthAccount[]`, `verificationTokens EmailVerificationToken[]`,
`comments Comment[]`, `links AuthorLink[]`, `subscriptions`/`subscribers Subscription[]`,
`authorHearts`/`authorHeartsReceived AuthorHeart[]`, `workHearts WorkHeart[]`

## OAuthAccount
소셜 로그인 계정 연결. `provider`("google"|"kakao"|"naver") + `providerAccountId`.
`@@unique([provider, providerAccountId])`, `@@index([userId])`. 작품/유저 삭제 시 cascade.

## EmailVerificationToken
이메일 인증용. `tokenHash`(원본 토큰의 SHA-256, `@unique`), `expiresAt`(24h). 원본 토큰은 메일 링크로만 전달.

## Work (작품/프로젝트)
| 필드 | 타입 | 설명 |
|------|------|------|
| id | String @id cuid | |
| authorId | String | → User |
| title | String | |
| description | String "" | |
| genre | String "" | |
| tags | String[] | |
| sourceLanguage | String "ko" | 원문 언어 |
| targetLanguage | String "en" | (구) 단일 번역 언어 — 호환용 |
| targetLanguages | String[] | **번역 대상 언어 목록(다국어)** |
| coverImage | String? | 작품 메인 이미지 |
| isPublic | Boolean false | 작품 공개 마스터 스위치 |
| publicSlug | String? @unique | 공개 링크 슬러그(생성 시 발급) |
| createdAt/updatedAt | DateTime | |

관계: `author`, `chapters Chapter[]`, `comments Comment[]`, `viewLogs ViewLog[]`

## Chapter (회차)
| 필드 | 타입 | 설명 |
|------|------|------|
| id | String @id cuid | |
| workId | String | → Work |
| order | Int | 정렬 순서(1부터). 공개 URL `/read/[slug]/[order]` |
| title | String | 자유 입력("외전 1화","낙서" 등) |
| category | String? | 종류(본편/외전/짧은 컷/낙서/작업 비하인드) |
| originalText | String | 원문 HTML(sanitize 저장) |
| translatedText | String? | (구) 단일 번역 — 호환용 |
| translationStatus | TranslationStatus | (구) — 호환용 |
| coverImage | String? | 회차 메인 이미지 |
| isPublic | Boolean false | 회차 공개 여부 |
| createdAt/updatedAt | DateTime | |

`@@unique([workId, order])`, `@@index([workId])`
관계: `work`, `comments Comment[]`, `translations ChapterTranslation[]`

**독자 노출 조건**: `work.isPublic && chapter.isPublic`. 번역은 있으면 토글로 제공(없어도 공개 가능).

## ChapterTranslation (회차×언어 번역)
| 필드 | 타입 | 설명 |
|------|------|------|
| id | String @id cuid | |
| chapterId | String | → Chapter |
| language | String | "en"\|"ja"\|"zh"\|"ko" 등 |
| text | String? | 번역 HTML(sanitize) |
| status | TranslationStatus | pending→processing→completed/failed |
| createdAt/updatedAt | DateTime | |

`@@unique([chapterId, language])`, `@@index([chapterId])`

## Comment (회차 댓글)
| 필드 | 타입 | 설명 |
|------|------|------|
| id | String @id cuid | |
| workId | String | → Work |
| chapterId | String? | → Chapter (회차별 댓글; null=레거시) |
| parentId | String? | 답글이면 부모 댓글 id(1단계) |
| userId | String? | **로그인 작성자**(null=레거시 익명). 삭제 시 SetNull |
| nickname | String | 표시용 닉네임 스냅샷(로그인 시 세션 닉네임) |
| content | String | sanitize(태그 제거) |
| deletePasswordHash | String? | (레거시) 익명 본인 삭제용 4자리 해시 — 신규 미사용 |
| createdAt | DateTime | |

`@@index([workId])`, `@@index([chapterId])`, `@@index([parentId])`, `@@index([userId])`
관계: `work`, `chapter Chapter?`, `parent/replies`(self-relation, cascade), `user User?`
**작성은 로그인 필수**(POST 401). 삭제는 작품 소유자 또는 댓글 작성자 본인.

## Subscription / AuthorHeart / WorkHeart (독자 반응)
- **Subscription**: `subscriberId`+`authorId`, `@@unique([subscriberId, authorId])`, `@@index([authorId])`. 독자→작가 팔로우(피드 반영).
- **AuthorHeart**: `userId`+`authorId`, `@@unique([userId, authorId])`. 작가 홈 하트(구독과 별개).
- **WorkHeart**: `userId`+`workId`, `@@unique([userId, workId])`. 작품 하트.
- 모두 cuid id + createdAt, 관계는 User/Work에 cascade.

## AuthorLink / LinkClick (작가 SNS + 클릭 추적)
- **AuthorLink**: `userId`, `platform`(자유 라벨), `url`(http/https), `order`. `@@index([userId])`. 프로필에서 전체 교체(최대 8).
- **LinkClick**: `linkId`, `userId?`, `ipHash?`, `referrer?`, `createdAt`. `@@index([linkId])`, `@@index([createdAt])`.
  `/api/links/[id]/go`가 클릭 기록 후 리다이렉트. 대시보드/관리자 클릭률 지표 원천.

## ViewLog (조회/유입)
`workId`, `referrer?`, `utmSource/Medium/Campaign?`, `userAgent?`, `ipHash?`(SHA-256 솔트), `createdAt`.
회차 열람 시 작품 단위로 1건 기록. IP는 해시만 저장.
