import { db } from "@/lib/db";
import type { FeedItem } from "@/types";
import type { Prisma } from "@prisma/client";

const FEED_SIZE = 18;

// 피드에 노출 가능한 공개 작품 조건: 공개 + 공개 회차 1개 이상
const publicWorkWhere: Prisma.WorkWhereInput = {
  isPublic: true,
  publicSlug: { not: null },
  chapters: { some: { isPublic: true } },
};

const feedSelect = {
  id: true,
  title: true,
  coverImage: true,
  publicSlug: true,
  updatedAt: true,
  author: { select: { id: true, nickname: true, image: true } },
  chapters: {
    where: { isPublic: true },
    orderBy: { order: "desc" as const },
    take: 1,
    select: { order: true },
  },
  _count: { select: { viewLogs: true, hearts: true } },
} satisfies Prisma.WorkSelect;

type FeedRow = Prisma.WorkGetPayload<{ select: typeof feedSelect }>;

function toItem(w: FeedRow, subscribed: boolean): FeedItem {
  return {
    workId: w.id,
    publicSlug: w.publicSlug!,
    title: w.title,
    coverImage: w.coverImage,
    authorId: w.author.id,
    authorNickname: w.author.nickname,
    authorImage: w.author.image,
    viewCount: w._count.viewLogs,
    heartCount: w._count.hearts,
    latestChapterOrder: w.chapters[0]?.order ?? null,
    updatedAt: w.updatedAt.toISOString(),
    subscribed,
  };
}

// 독자 피드: 구독 작가의 최근 공개 작품 우선, 부족하면 트렌딩(조회+하트)으로 보강한다.
export async function getReaderFeed(userId: string): Promise<{
  subscribedCount: number;
  items: FeedItem[];
}> {
  const subs = await db.subscription.findMany({
    where: { subscriberId: userId },
    select: { authorId: true },
  });
  const subscribedIds = subs.map((s) => s.authorId);
  const subscribedSet = new Set(subscribedIds);

  // 1) 구독 작가의 최근 공개 작품
  const subscribedWorks =
    subscribedIds.length > 0
      ? await db.work.findMany({
          where: { ...publicWorkWhere, authorId: { in: subscribedIds } },
          orderBy: { updatedAt: "desc" },
          take: FEED_SIZE,
          select: feedSelect,
        })
      : [];

  const items: FeedItem[] = subscribedWorks.map((w) => toItem(w, true));
  const seen = new Set(items.map((i) => i.workId));

  // 2) 부족하면 트렌딩으로 보강 (조회수 → 하트 순)
  if (items.length < FEED_SIZE) {
    const trending = await db.work.findMany({
      where: {
        ...publicWorkWhere,
        id: { notIn: Array.from(seen) },
      },
      orderBy: [
        { viewLogs: { _count: "desc" } },
        { hearts: { _count: "desc" } },
        { updatedAt: "desc" },
      ],
      take: FEED_SIZE - items.length,
      select: feedSelect,
    });
    for (const w of trending) {
      if (seen.has(w.id)) continue;
      items.push(toItem(w, subscribedSet.has(w.author.id)));
    }
  }

  return { subscribedCount: subscribedIds.length, items };
}
