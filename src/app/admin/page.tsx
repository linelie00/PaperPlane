import { notFound } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/Card";
import { getCurrentUser } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import { getAdminStats } from "@/lib/admin-stats";

export const metadata = { title: "관리자" };

// 개발자용 대시보드 — ADMIN_EMAILS 허용목록만 접근 가능
export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user || !isAdminEmail(user.email)) notFound();

  const stats = await getAdminStats();
  const clickRate =
    stats.totalViews > 0
      ? ((stats.totalLinkClicks / stats.totalViews) * 100).toFixed(2)
      : "0.00";

  return (
    <div className="min-h-screen">
      <Header nickname={user.nickname} image={user.image} />

      <main className="mx-auto max-w-6xl px-5 py-10">
        <h1 className="text-2xl font-extrabold text-ink-main">개발자 대시보드</h1>
        <p className="mt-1 text-sm text-ink-sub">
          서비스 전체 지표와 SNS 클릭률을 확인합니다.
        </p>

        <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <SummaryCard label="전체 사용자" value={stats.totalUsers} />
          <SummaryCard label="전체 작품" value={stats.totalWorks} />
          <SummaryCard label="전체 조회수" value={stats.totalViews} />
          <SummaryCard label="구독 수" value={stats.totalSubscriptions} />
          <SummaryCard label="하트 수" value={stats.totalHearts} />
          <SummaryCard label="SNS 클릭 수" value={stats.totalLinkClicks} />
          <SummaryCard label="SNS 클릭률" value={`${clickRate}%`} />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          {/* 상위 SNS 링크 */}
          <Card className="lg:col-span-2">
            <h2 className="text-lg font-bold text-ink-main">상위 SNS 링크</h2>
            {stats.topLinks.length === 0 ? (
              <p className="mt-4 text-sm text-ink-muted">아직 클릭 기록이 없습니다.</p>
            ) : (
              <div className="mt-4 overflow-hidden rounded-2xl border border-paper-border">
                <table className="w-full text-left text-sm">
                  <thead className="bg-sky-pale text-ink-sub">
                    <tr>
                      <th className="px-4 py-3 font-semibold">작가</th>
                      <th className="px-4 py-3 font-semibold">플랫폼</th>
                      <th className="px-4 py-3 font-semibold">URL</th>
                      <th className="px-4 py-3 font-semibold">클릭</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.topLinks.map((l) => (
                      <tr key={l.linkId} className="border-t border-paper-border">
                        <td className="px-4 py-3 text-ink-main">{l.authorNickname}</td>
                        <td className="px-4 py-3 text-ink-sub">{l.platform}</td>
                        <td className="max-w-[240px] truncate px-4 py-3 text-ink-muted">
                          {l.url}
                        </td>
                        <td className="px-4 py-3 font-bold text-ink-main">{l.clicks}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {/* 플랫폼별 클릭 */}
          <Card>
            <h2 className="text-lg font-bold text-ink-main">플랫폼별 클릭</h2>
            {stats.platforms.length === 0 ? (
              <p className="mt-4 text-sm text-ink-muted">기록이 없습니다.</p>
            ) : (
              <ul className="mt-4 space-y-2">
                {stats.platforms.map((p) => (
                  <li
                    key={p.platform}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-ink-sub">{p.platform}</span>
                    <span className="font-bold text-ink-main">{p.clicks}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </main>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: number | string }) {
  return (
    <Card>
      <p className="text-sm text-ink-muted">{label}</p>
      <p className="mt-2 text-3xl font-extrabold text-ink-main">
        {typeof value === "number" ? value.toLocaleString() : value}
      </p>
    </Card>
  );
}
