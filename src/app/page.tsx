import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/Card";
import { LinkButton } from "@/components/ui/Button";
import { getCurrentUser } from "@/lib/auth";

export default async function LandingPage() {
  const user = await getCurrentUser();

  return (
    <div className="min-h-screen">
      <Header nickname={user?.nickname} image={user?.image} />

      {/* Hero Section — 캐치프레이즈 필수 (docs/08_UI_DESIGN_GUIDE.md) */}
      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-20 md:grid-cols-2 md:py-28">
          <div className="fade-up">
            <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-ink-main md:text-5xl lg:text-[56px] lg:leading-[1.15]">
              언어가 달라져도,
              <br />
              이야기가 주는 설렘은
              <br />
              같아야 한다
            </h1>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-ink-sub">
              PaperPlane은 창작자의 이야기를 AI로 번역하고, 해외 독자가 바로
              읽을 수 있는 뷰어와 반응 확인 기능을 제공합니다.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <LinkButton href={user ? "/works/new" : "/signup"}>
                지금 작품 업로드하기
              </LinkButton>
              <LinkButton href="#preview" variant="secondary">
                샘플 작품 보기
              </LinkButton>
            </div>
          </div>

          {/* 종이비행기가 원고에서 해외 독자에게 날아가는 카드 UI */}
          <div className="relative fade-up">
            <Card className="relative z-10">
              <div className="flex items-center justify-between text-sm text-ink-muted">
                <span>원문 · 한국어</span>
                <span className="text-plane-primary">✈ 번역 중…</span>
                <span>번역 · English</span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-2xl bg-sky-pale p-4 leading-relaxed text-ink-sub">
                  그는 종이비행기를 하늘로 날렸다. 바람을 타고 멀리.
                </div>
                <div className="rounded-2xl bg-plane-light/40 p-4 leading-relaxed text-ink-main">
                  He launched the paper plane into the sky, carried far on the
                  wind.
                </div>
              </div>
            </Card>
            <div className="pointer-events-none absolute -right-6 -top-6 text-5xl opacity-20">
              ✈
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <Section title="좋은 이야기에도, 해외로 가는 길은 멀었습니다">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            "번역 비용 부담",
            "해외 독자 반응 확인 어려움",
            "작품 발견 경로 부족",
          ].map((t) => (
            <Card key={t} className="text-center">
              <p className="font-bold text-ink-main">{t}</p>
            </Card>
          ))}
        </div>
      </Section>

      {/* Solution Section */}
      <Section title="PaperPlane이 대신 날려 보냅니다">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {[
            "작품 업로드",
            "AI 자동 번역",
            "공개 뷰어 생성",
            "독자 유입 확인",
            "댓글 반응 수집",
          ].map((t) => (
            <Card key={t} className="text-center">
              <p className="font-semibold text-ink-main">{t}</p>
            </Card>
          ))}
        </div>
      </Section>

      {/* How It Works */}
      <Section title="3단계면 충분합니다">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { n: "1", t: "작품을 업로드합니다." },
            { n: "2", t: "AI가 번역본을 생성합니다." },
            { n: "3", t: "공개 링크로 해외 독자 반응을 확인합니다." },
          ].map((s) => (
            <Card key={s.n}>
              <div className="text-3xl font-extrabold text-plane-primary">
                {s.n}
              </div>
              <p className="mt-2 font-semibold text-ink-main">{s.t}</p>
            </Card>
          ))}
        </div>
      </Section>

      {/* Previews */}
      <Section title="창작자와 독자, 두 화면을 미리 만나보세요" id="preview">
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <p className="text-sm font-bold text-ink-muted">
              창작자 대시보드 미리보기
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Metric label="전체 조회수" value="1,200" />
              <Metric label="오늘 조회수" value="45" />
              <Metric label="댓글 수" value="32" />
              <Metric label="주요 유입" value="twitter.com" />
            </div>
            <p className="mt-4 text-sm text-ink-sub">
              최근 댓글: “재밌게 읽었어요! 다음 화 기대됩니다.”
            </p>
          </Card>
          <Card>
            <p className="text-sm font-bold text-ink-muted">독자 뷰어 미리보기</p>
            <h3 className="mt-4 text-lg font-bold text-ink-main">
              The Paper Plane Letter
            </h3>
            <p className="mt-3 text-[15px] leading-[1.9] text-ink-main">
              He launched the paper plane into the sky, carried far on the wind.
              Somewhere, someone would read his story in their own language.
            </p>
            <div className="mt-4 rounded-2xl bg-sky-pale p-3 text-sm text-ink-sub">
              💬 reader_jp: とても感動しました！
            </div>
          </Card>
        </div>
      </Section>

      {/* CTA Section */}
      <section className="px-5 py-20">
        <div className="mx-auto max-w-3xl rounded-4xl bg-gradient-to-r from-plane-primary to-sky px-8 py-14 text-center text-white shadow-plane">
          <h2 className="text-2xl font-extrabold md:text-3xl">
            당신의 이야기를 더 먼 곳의 독자에게 보내보세요.
          </h2>
          <div className="mt-8 flex justify-center">
            <LinkButton
              href={user ? "/works/new" : "/signup"}
              variant="secondary"
            >
              첫 작품 업로드하기
            </LinkButton>
          </div>
        </div>
      </section>

      <footer className="border-t border-paper-border py-8 text-center text-sm text-ink-muted">
        <span className="text-plane-primary">✈</span> PaperPlane
      </footer>
    </div>
  );
}

function Section({
  title,
  children,
  id,
}: {
  title: string;
  children: React.ReactNode;
  id?: string;
}) {
  return (
    <section id={id} className="px-5 py-14">
      <div className="mx-auto max-w-6xl">
        <h2 className="mb-8 text-center text-2xl font-extrabold text-ink-main md:text-3xl">
          {title}
        </h2>
        {children}
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-sky-pale p-3">
      <p className="text-xs text-ink-muted">{label}</p>
      <p className="mt-1 text-lg font-extrabold text-ink-main">{value}</p>
    </div>
  );
}
