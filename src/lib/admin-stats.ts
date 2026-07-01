import { db } from "@/lib/db";
import type { AdminStats } from "@/types";

// 개발자(관리자) 대시보드 통계를 집계한다. (SNS 클릭률 등 서비스 어필 지표)
export async function getAdminStats(): Promise<AdminStats> {
  const [
    totalUsers,
    totalWorks,
    totalViews,
    totalSubscriptions,
    authorHearts,
    workHearts,
    totalLinkClicks,
    links,
  ] = await Promise.all([
    db.user.count(),
    db.work.count(),
    db.viewLog.count(),
    db.subscription.count(),
    db.authorHeart.count(),
    db.workHeart.count(),
    db.linkClick.count(),
    db.authorLink.findMany({
      select: {
        id: true,
        platform: true,
        url: true,
        user: { select: { nickname: true } },
        _count: { select: { clicks: true } },
      },
    }),
  ]);

  // 플랫폼별 클릭 집계
  const platformCounts = new Map<string, number>();
  for (const l of links) {
    const key = l.platform.toLowerCase();
    platformCounts.set(key, (platformCounts.get(key) ?? 0) + l._count.clicks);
  }
  const platforms = Array.from(platformCounts.entries())
    .map(([platform, clicks]) => ({ platform, clicks }))
    .sort((a, b) => b.clicks - a.clicks);

  const topLinks = links
    .map((l) => ({
      linkId: l.id,
      platform: l.platform,
      url: l.url,
      authorNickname: l.user.nickname,
      clicks: l._count.clicks,
    }))
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 10);

  return {
    totalUsers,
    totalWorks,
    totalViews,
    totalSubscriptions,
    totalHearts: authorHearts + workHearts,
    totalLinkClicks,
    platforms,
    topLinks,
  };
}
