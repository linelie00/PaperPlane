import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { NewWorkChooser } from "./NewWorkChooser";

export default async function NewWorkPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const works = await db.work.findMany({
    where: { authorId: user.userId },
    orderBy: { createdAt: "desc" },
    select: { id: true, title: true, _count: { select: { chapters: true } } },
  });

  return (
    <NewWorkChooser
      works={works.map((w) => ({
        id: w.id,
        title: w.title,
        chapterCount: w._count.chapters,
      }))}
    />
  );
}
