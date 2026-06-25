// 간편 로그인 버튼 (Google / Kakao / Naver).
// 각 버튼은 서버의 OAuth 시작 라우트로 이동하는 단순 링크다.

type Provider = {
  id: "google" | "kakao" | "naver";
  label: string;
  className: string;
  mark: React.ReactNode;
};

const PROVIDERS: Provider[] = [
  {
    id: "google",
    label: "Google로 계속하기",
    className: "border border-gray-200 bg-white text-ink-main hover:bg-gray-50",
    mark: (
      <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
        <path
          fill="#4285F4"
          d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z"
        />
        <path
          fill="#34A853"
          d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18z"
        />
        <path
          fill="#FBBC05"
          d="M3.97 10.72A5.4 5.4 0 0 1 3.68 9c0-.6.1-1.18.29-1.72V4.95H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.05l3.01-2.33z"
        />
        <path
          fill="#EA4335"
          d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z"
        />
      </svg>
    ),
  },
  {
    id: "kakao",
    label: "카카오로 계속하기",
    className: "bg-[#FEE500] text-[#191600] hover:brightness-95",
    mark: (
      <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
        <path
          fill="#191600"
          d="M12 3C6.48 3 2 6.48 2 10.77c0 2.78 1.86 5.22 4.65 6.6-.2.73-.74 2.66-.85 3.07-.13.51.19.5.4.37.16-.11 2.57-1.75 3.62-2.46.71.1 1.44.16 2.18.16 5.52 0 10-3.48 10-7.77S17.52 3 12 3z"
        />
      </svg>
    ),
  },
  {
    id: "naver",
    label: "네이버로 계속하기",
    className: "bg-[#03C75A] text-white hover:brightness-95",
    mark: (
      <svg width="14" height="14" viewBox="0 0 20 20" aria-hidden="true">
        <path
          fill="#ffffff"
          d="M13.56 10.7 6.16 0H0v20h6.44V9.3l7.4 10.7H20V0h-6.44v10.7z"
        />
      </svg>
    ),
  },
];

export function SocialButtons() {
  return (
    <div className="flex flex-col gap-2.5">
      {PROVIDERS.map((p) => (
        <a
          key={p.id}
          href={`/api/auth/oauth/${p.id}`}
          className={`inline-flex items-center justify-center gap-2.5 rounded-full px-6 py-3 text-sm font-bold transition ${p.className}`}
        >
          {p.mark}
          {p.label}
        </a>
      ))}
    </div>
  );
}
