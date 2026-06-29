import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { EditWorkForm } from "./EditWorkForm";

export default async function EditWorkPage({
  params,
}: {
  params: Promise<{ workId: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { workId } = await params;
  const work = await db.work.findUnique({
    where: { id: workId },
    include: { content: true },
  });

  if (!work) notFound();
  // 창작자는 자신의 작품만 수정할 수 있다. (CLAUDE.md)
  if (work.authorId !== user.userId) redirect("/works");

  return (
    <EditWorkForm
      workId={work.id}
      initial={{
        title: work.title,
        description: work.description,
        genre: work.genre,
        tags: work.tags.join(", "),
        sourceLanguage: work.sourceLanguage,
        targetLanguage: work.targetLanguage,
        originalText: work.content?.originalText ?? "",
      }}
    />
  );
}
