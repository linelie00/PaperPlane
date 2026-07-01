import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { Header } from "@/components/layout/Header";
import { ProfileForm } from "./ProfileForm";

export default async function ProfilePage() {
  const session = await getCurrentUser();
  if (!session) redirect("/login");

  const user = await db.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      email: true,
      nickname: true,
      image: true,
      coverImage: true,
      bio: true,
      links: {
        orderBy: { order: "asc" },
        select: { id: true, platform: true, url: true },
      },
    },
  });
  if (!user) redirect("/login");

  return (
    <>
      <Header nickname={session.nickname} image={session.image} />
      <main className="mx-auto max-w-2xl px-5 py-10">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-extrabold text-ink-main">프로필 설정</h1>
          <a
            href={`/author/${user.id}`}
            className="text-sm font-semibold text-plane-dark hover:underline"
          >
            내 작가 홈 보기 →
          </a>
        </div>
        <p className="mt-1 text-sm text-ink-sub">
          닉네임, 프로필 사진, 배경 사진과 소개를 변경할 수 있어요.
        </p>
        <ProfileForm
          email={user.email}
          initialNickname={user.nickname}
          initialImage={user.image}
          initialCoverImage={user.coverImage}
          initialBio={user.bio}
          initialLinks={user.links}
        />
      </main>
    </>
  );
}
