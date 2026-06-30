import Link from "next/link";
import { LogoutButton } from "./LogoutButton";
import { LinkButton } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { Logo } from "@/components/ui/Logo";

type HeaderProps = {
  // 로그인 사용자일 때만 전달
  nickname?: string | null;
  image?: string | null;
};

export function Header({ nickname, image }: HeaderProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-paper-border/60 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <Link href="/" aria-label="PaperPlane 홈">
          <Logo size={26} />
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
              <Link
                href="/profile"
                className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 transition hover:bg-sky-pale"
                title="프로필 설정"
              >
                <Avatar src={image} name={nickname ?? "?"} size={32} />
                <span className="hidden text-sm font-semibold text-ink-sub sm:block">
                  {nickname} 님
                </span>
              </Link>
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
