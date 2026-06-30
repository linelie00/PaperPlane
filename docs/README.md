# PaperPlane 문서

> **현행 문서는 `10_`번대입니다.** `01_`~`08_`은 초기 "AI 번역 MVP" 기획의 기록으로,
> 현재 팬덤 플랫폼 방향과 충돌하면 **현행 문서(10번대)와 실제 코드가 우선**합니다.

## 현행 문서 (현재 구현 기준)

| 문서 | 내용 |
|------|------|
| [10_OVERVIEW.md](10_OVERVIEW.md) | 제품 방향, 기술 스택, 프로젝트 구조 |
| [11_DATA_MODEL.md](11_DATA_MODEL.md) | Prisma 데이터 모델 (User/Work/Chapter/번역/댓글 등) |
| [12_API_REFERENCE.md](12_API_REFERENCE.md) | API 라우트 레퍼런스 |
| [13_FEATURES.md](13_FEATURES.md) | 기능 카탈로그 (인증·작품·번역·댓글·이미지·공유…) |
| [14_DEPLOYMENT.md](14_DEPLOYMENT.md) | 배포(Vercel/Neon/Blob), 환경변수, 이메일, OAuth |

## 초기 기획 (참조용 / 역사적 맥락)

`01_MVP_SCOPE` · `02_USER_FLOW` · `03_PAGE_SPEC` · `04_API_SPEC` · `05_DB_SCHEMA` · `08_UI_DESIGN_GUIDE`
— 초기 번역 MVP 스펙. 일부는 더 이상 코드와 맞지 않습니다(예: `WorkContent` 1:1 모델 → `Chapter` 1:N로 대체).
UI 컬러/타이포 가이드(`08`)는 여전히 유효합니다.
