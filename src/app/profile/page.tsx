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
    select: { email: true, nickname: true, image: true },
  });
  if (!user) redirect("/login");

  return (
    <>
      <Header nickname={session.nickname} image={session.image} />
      <main className="mx-auto max-w-2xl px-5 py-10">
        <h1 className="text-2xl font-extrabold text-ink-main">프로필 설정</h1>
        <p className="mt-1 text-sm text-ink-sub">
          닉네임과 프로필 사진을 변경할 수 있어요.
        </p>
        <ProfileForm
          email={user.email}
          initialNickname={user.nickname}
          initialImage={user.image}
        />
      </main>
    </>
  );
}
