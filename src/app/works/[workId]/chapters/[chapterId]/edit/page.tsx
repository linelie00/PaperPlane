import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { ChapterForm } from "../../ChapterForm";

export default async function EditChapterPage({
  params,
}: {
  params: Promise<{ workId: string; chapterId: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { workId, chapterId } = await params;
  const chapter = await db.chapter.findUnique({
    where: { id: chapterId },
    include: { work: { select: { authorId: true } } },
  });

  if (!chapter || chapter.workId !== workId) notFound();
  if (chapter.work.authorId !== user.userId) redirect("/works");

  return (
    <ChapterForm
      workId={workId}
      mode="edit"
      chapterId={chapter.id}
      initialTitle={chapter.title}
      initialText={chapter.originalText}
    />
  );
}
