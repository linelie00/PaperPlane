import { redirect } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { getCurrentUser } from "@/lib/auth";

// /works 하위 모든 페이지에 인증 헤더를 제공한다.
export default async function WorksLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="min-h-screen">
      <Header userId={user.userId} nickname={user.nickname} image={user.image} />
      {children}
    </div>
  );
}
