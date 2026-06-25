import Link from "next/link";
import { LogoutButton } from "./LogoutButton";
import { LinkButton } from "@/components/ui/Button";

type HeaderProps = {
  // 로그인 사용자일 때만 전달
  nickname?: string | null;
};

export function Header({ nickname }: HeaderProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-paper-border/60 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <Link
          href={nickname ? "/dashboard" : "/"}
          className="text-xl font-extrabold tracking-tight text-ink-main"
        >
          <span className="text-plane-primary">✈</span> PaperPlane
        </Link>

        <nav className="flex items-center gap-5">
          {nickname ? (
            <>
              <Link
                href="/dashboard"
                className="hidden text-sm font-semibold text-ink-sub transition hover:text-plane-dark sm:block"
              >
                대시보드
              </Link>
              <Link
                href="/works"
                className="hidden text-sm font-semibold text-ink-sub transition hover:text-plane-dark sm:block"
              >
                내 작품
              </Link>
              <span className="hidden text-sm text-ink-muted sm:block">
                {nickname} 님
              </span>
              <LogoutButton />
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm font-semibold text-ink-sub transition hover:text-plane-dark"
              >
                로그인
              </Link>
              <LinkButton href="/signup" className="px-5 py-2 text-sm">
                시작하기
              </LinkButton>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
