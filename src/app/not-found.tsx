import { LinkButton } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-5 text-center">
      <p className="text-6xl opacity-30">✈</p>
      <h1 className="mt-4 text-2xl font-extrabold text-ink-main">
        페이지를 찾을 수 없습니다
      </h1>
      <p className="mt-2 text-sm text-ink-sub">
        요청하신 페이지가 존재하지 않거나 비공개 상태입니다.
      </p>
      <div className="mt-6">
        <LinkButton href="/">홈으로 돌아가기</LinkButton>
      </div>
    </main>
  );
}
