import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { WorkDetailView } from "./WorkDetailView";
import type { WorkDetail } from "@/types";

export default async function WorkDetailPage({
  params,
}: {
  params: Promise<{ workId: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { workId } = await params;
  const work = await db.work.findUnique({
    where: { id: workId },
    include: {
      content: true,
      comments: { orderBy: { createdAt: "desc" } },
      _count: { select: { viewLogs: true } },
    },
  });

  if (!work) notFound();
  // 창작자는 자신의 작품만 볼 수 있다. (CLAUDE.md)
  if (work.authorId !== user.userId) redirect("/works");

  const detail: WorkDetail = {
    id: work.id,
    title: work.title,
    description: work.description,
    genre: work.genre,
    tags: work.tags,
    sourceLanguage: work.sourceLanguage,
    targetLanguage: work.targetLanguage,
    originalText: work.content?.originalText ?? "",
    translatedText: work.content?.translatedText ?? null,
    translationStatus: work.content?.translationStatus ?? "pending",
    isPublic: work.isPublic,
    publicSlug: work.publicSlug,
    viewCount: work._count.viewLogs,
    comments: work.comments.map((c) => ({
      id: c.id,
      nickname: c.nickname,
      content: c.content,
      createdAt: c.createdAt.toISOString(),
    })),
  };

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";

  return <WorkDetailView work={detail} appUrl={appUrl} />;
}
