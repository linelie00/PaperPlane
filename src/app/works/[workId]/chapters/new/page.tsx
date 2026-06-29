import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { ChapterForm } from "../ChapterForm";

export default async function NewChapterPage({
  params,
}: {
  params: Promise<{ workId: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { workId } = await params;
  const work = await db.work.findUnique({
    where: { id: workId },
    include: { _count: { select: { chapters: true } } },
  });

  if (!work) notFound();
  if (work.authorId !== user.userId) redirect("/works");

  const nextOrder = work._count.chapters + 1;

  return (
    <ChapterForm
      workId={workId}
      mode="create"
      initialTitle={`${nextOrder}화`}
      initialText=""
      initialPublic={false}
      initialCover={null}
    />
  );
}
