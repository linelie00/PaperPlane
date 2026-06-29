import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/Card";
import { LinkButton } from "@/components/ui/Button";
import { getCurrentUser } from "@/lib/auth";

export default async function LandingPage() {
  const user = await getCurrentUser();
  const startHref = user ? "/works" : "/signup";

  return (
    <div className="min-h-screen">
      <Header nickname={user?.nickname} image={user?.image} />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-3xl px-5 py-24 text-center md:py-32">
          <span className="fade-up inline-block rounded-full bg-sky-pale px-4 py-1.5 text-sm font-bold text-plane-dark">
            웹툰·웹소설 작가와 팬을 잇는 공간
          </span>
          <h1 className="fade-up mt-6 text-4xl font-extrabold leading-tight tracking-tight text-ink-main md:text-5xl lg:text-[56px] lg:leading-[1.15]">
            작품은 끝나도,
            <br />
            <span className="text-plane-primary">팬심은 이어지니까</span>
          </h1>
          <p className="fade-up mx-auto mt-6 max-w-xl text-lg leading-relaxed text-ink-sub">
            PaperPlane은 작품만 보고 떠나던 독자를 작가님의{" "}
            <strong className="font-bold text-ink-main">‘코어 팬’</strong>으로
            이어드려요. ✈️
          </p>
          <div className="fade-up mt-9 flex flex-wrap justify-center gap-3">
            <LinkButton href={startHref}>작가로 시작하기</LinkButton>
            <LinkButton href="#papers" variant="secondary">
              어떤 공간인지 보기
            </LinkButton>
          </div>
        </div>
      </section>

      {/* 1. 문제의식 */}
      <Section
        eyebrow="1. 문제의식"
        title="작품을 다 보고 나면, 우리는 작가님 이름을 기억할까요?"
      >
        <div className="mx-auto max-w-2xl space-y-4">
          <Card className="flex items-start gap-4">
            <span className="text-2xl">🧩</span>
            <p className="text-ink-sub">
              ‘작품’을 보는 것만으로는{" "}
              <strong className="font-bold text-ink-main">
                ‘작가와 팬의 관계’
              </strong>
              가 만들어지기 어렵습니다.
            </p>
          </Card>
          <Card className="flex items-start gap-4">
            <span className="text-2xl">🙂</span>
            <p className="text-ink-sub">
              작품을 본 독자가 누구인지, 작가님은 알 수 없어요.
            </p>
          </Card>
          <p className="pt-2 text-center text-lg font-bold text-plane-dark">
            PaperPlane은 그 사이 ‘관계’를 이어갑니다.
          </p>
        </div>
      </Section>

      {/* 2. 작가가 얻는 것 */}
      <Section eyebrow="2. 작가님이 얻는 것" title="PaperPlane에서 작가님이 얻는 것 ✍️">
        <div className="mx-auto grid max-w-4xl gap-4 md:grid-cols-3">
          {[
            {
              icon: "💛",
              title: "코어 팬으로",
              body: "흩어지던 독자가 다시 찾아오는 코어 팬으로 이어집니다.",
            },
            {
              icon: "📊",
              title: "데이터로",
              body: "내 팬이 누구인지, 무엇에 반응하는지 조회·댓글 데이터로 확인해요.",
            },
            {
              icon: "🎁",
              title: "부담 없이",
              body: "무료 · 독점계약 없음 · 기존 SNS 그대로 함께 쓸 수 있어요.",
            },
          ].map((c) => (
            <Card key={c.title} className="text-center">
              <div className="text-3xl">{c.icon}</div>
              <h3 className="mt-3 font-extrabold text-ink-main">{c.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-sub">{c.body}</p>
            </Card>
          ))}
        </div>
      </Section>

      {/* 3. 어떤 콘텐츠 (Papers) */}
      <Section
        id="papers"
        eyebrow="3. 어떤 콘텐츠?"
        title="본편은 그대로 플랫폼에. PaperPlane엔 팬을 위한 ‘Papers’를 올려요"
      >
        <p className="mx-auto -mt-4 mb-8 max-w-xl text-center text-ink-sub">
          외전, 짧은 컷, 낙서, 작업 비하인드(러프·메이킹). 팬이 가장 좋아하는,
          본편 밖의 이야기.
        </p>
        <div className="mx-auto grid max-w-4xl gap-4 sm:grid-cols-2">
          {[
            { tag: "외전", body: "본편 밖의 특별한 이야기" },
            { tag: "짧은 컷", body: "소소하고 귀여운 짧은 순간들" },
            { tag: "낙서", body: "작가님의 자유로운 낙서" },
            { tag: "작업 비하인드", body: "러프·메이킹까지 보는 즐거움" },
          ].map((p) => (
            <Card key={p.tag} className="flex items-center gap-4">
              <span className="shrink-0 rounded-xl bg-plane-primary px-3 py-1.5 text-sm font-bold text-white">
                {p.tag}
              </span>
              <p className="font-semibold text-ink-main">{p.body}</p>
            </Card>
          ))}
        </div>
      </Section>

      {/* 번역 (보조 기능) */}
      <Section eyebrow="해외 팬도 함께" title="원문 그대로, 해외 팬도 함께 읽어요">
        <div className="mx-auto max-w-2xl">
          <Card className="text-center">
            <p className="text-ink-sub">
              Papers는 원문 그대로 올리면 됩니다. 독자는 원하면{" "}
              <strong className="font-bold text-ink-main">
                일본어·영어 등
              </strong>{" "}
              번역으로도 바꿔 읽을 수 있어요.
            </p>
            <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-sky-pale px-4 py-2 text-sm font-semibold text-plane-dark">
              <span>원문</span>
              <span className="text-plane-primary">✈</span>
              <span>日本語 · English</span>
            </div>
            <p className="mt-5 text-sm italic text-ink-muted">
              “언어가 달라져도, 이야기가 주는 설렘은 같아야 한다.”
            </p>
          </Card>
        </div>
      </Section>

      {/* CTA */}
      <section className="px-5 py-20">
        <div className="mx-auto max-w-3xl rounded-4xl bg-gradient-to-r from-plane-primary to-sky px-8 py-14 text-center text-white shadow-plane">
          <h2 className="text-2xl font-extrabold md:text-3xl">
            작품은 끝나도, 팬심은 이어지니까.
          </h2>
          <p className="mx-auto mt-4 max-w-lg leading-relaxed text-white/90">
            팬과 더 가까워지는 공간을 만들고 있습니다. 작가님은 평소처럼 작업만
            하시면 돼요. 궁금한 점은 편하게 DM 주세요 :)
          </p>
          <div className="mt-8 flex justify-center">
            <LinkButton href={startHref} variant="secondary">
              작가로 시작하기
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
  eyebrow,
  title,
  children,
  id,
}: {
  eyebrow?: string;
  title: string;
  children: React.ReactNode;
  id?: string;
}) {
  return (
    <section id={id} className="px-5 py-16">
      <div className="mx-auto max-w-6xl">
        {eyebrow && (
          <p className="mb-3 text-center text-sm font-bold text-plane-primary">
            {eyebrow}
          </p>
        )}
        <h2 className="mb-10 text-center text-2xl font-extrabold leading-snug text-ink-main md:text-3xl">
          {title}
        </h2>
        {children}
      </div>
    </section>
  );
}
