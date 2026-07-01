# 14. 배포 · 환경변수 (현행)

호스팅: **Vercel** / DB: **Neon(Postgres)** / 이미지: **Vercel Blob** / 이메일: **Gmail SMTP 또는 Resend**.

## 환경변수

| 키 | 용도 | 비고 |
|----|------|------|
| `DATABASE_URL` | 런타임 DB | Neon **풀링** URL(host에 `-pooler`) |
| `DIRECT_URL` | 마이그레이션/`db push` | Neon **직접** URL(풀러 없음). 로컬은 `DATABASE_URL`과 동일 가능 |
| `AUTH_SECRET` | JWT 서명·IP/비번 해시 솔트 | 긴 랜덤 문자열 |
| `NEXT_PUBLIC_APP_URL` | 절대 URL 기준 | 배포 도메인(끝 슬래시 X). 이메일 링크·OAuth·OG에 사용 |
| `ADMIN_EMAILS` | `/admin` 접근 허용 | 콤마 구분 이메일 목록. 비우면 아무도 접근 불가 |
| `LLM_API_KEY` / `LLM_BASE_URL` / `LLM_MODEL` | 번역 LLM | 기본 Upstage Solar |
| `BLOB_READ_WRITE_TOKEN` | 이미지 저장(Blob) | Blob 스토어 연결 시 자동 주입. 없으면 로컬 디스크 |
| **이메일 — (A) SMTP** | | 셋 다 있으면 SMTP 사용(우선) |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` | Gmail SMTP | 465(SSL). `SMTP_PASS`=Google 앱 비밀번호 |
| `EMAIL_FROM` | 발신자 | 예 `PaperPlane <paperplane.asm@gmail.com>` |
| **이메일 — (B) Resend** | | SMTP가 없을 때만 |
| `RESEND_API_KEY` | Resend | 테스트 발신은 본인 메일로만 |
| `GOOGLE_CLIENT_ID/SECRET` | 소셜 로그인 | |
| `KAKAO_CLIENT_ID` (`KAKAO_CLIENT_SECRET` 선택) | 소셜 로그인 | Kakao는 secret 미사용 가능 |
| `NAVER_CLIENT_ID/SECRET` | 소셜 로그인 | |

> `.env.example`에 자리표시자/안내가 정리돼 있다. 비밀값은 절대 커밋 금지(`.env`는 gitignore).

## 1) Neon(DB)
1. Neon 프로젝트 생성(Vercel과 가까운 리전 권장).
2. **Pooled** 연결 → `DATABASE_URL`, **Direct** 연결 → `DIRECT_URL`.
3. 스키마 반영(둘 중 한 번):
   ```bash
   # 로컬에서 클라우드로
   DATABASE_URL="<pooled>" DIRECT_URL="<direct>" npx prisma db push
   ```
   - Neon 무료 컴퓨트는 휴면됨 → 직접 연결이 P1001이면 풀링으로 한번 깨운 뒤 재시도.

## 2) Vercel(앱)
1. GitHub 저장소 import. Framework는 Next.js 자동 인식.
2. **Build Command는 `package.json` 기본**(`prisma generate && next build`).
3. 환경변수 입력(Settings → Environment Variables) 후 **재배포**.
   - 환경변수 변경은 **새 배포부터** 적용됨.

## 3) Vercel Blob(이미지)
1. 프로젝트 → Storage → Create → **Blob**. **반드시 Public 스토어**로(공개 URL 필요).
   - Private 스토어면 업로드 시 *"Cannot use public access on a private store"* 에러.
2. 프로젝트에 Connect → `BLOB_READ_WRITE_TOKEN` 자동 추가(없으면 스토어 `.env.local` 탭의 값을 수동 입력).
3. **재배포**.
- 코드(`src/lib/storage.ts`)는 토큰이 있으면 Blob, 없으면 로컬 디스크에 저장. 디스크는 Vercel(서버리스)에서 불가하므로 배포엔 Blob 필수.

## 4) OAuth 콜백
각 제공자 콘솔에 운영 도메인 콜백 추가(로컬 콜백과 병행):
```
https://<도메인>/api/auth/oauth/google/callback
https://<도메인>/api/auth/oauth/kakao/callback
https://<도메인>/api/auth/oauth/naver/callback
```
Google은 "승인된 JavaScript 원본"에 도메인도 추가. Kakao/Naver는 사이트/서비스 URL 등록.

## 5) 이메일
- **권장: Gmail SMTP** — Google 계정 2단계 인증 후 앱 비밀번호 발급 → `SMTP_*`/`EMAIL_FROM` 설정.
  도메인 없이 누구에게나 발송 가능(하루 ~500통).
- 대안: Resend(도메인 검증 전엔 본인 메일로만 발송).

## 운영 메모
- 번역은 비동기지만 백그라운드도 함수 `maxDuration=60` 안에서 동작 → 언어가 많고 글이 길면 일부 `failed` 가능(회차 보기에서 "다시 번역").
- 카카오 등 SNS는 OG 미리보기를 캐시함 → 변경 후 `?v=2` 같은 쿼리로 재스크랩.
- 로컬 `.env`가 Neon을 가리키면 로컬·배포가 같은 DB를 씀(스키마 push도 즉시 양쪽 반영).
