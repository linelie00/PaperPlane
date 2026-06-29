import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";

// 뷰어에서 작가(아바타 + 닉네임)를 보여주고 작가 홈으로 연결한다.
export function AuthorBadge({
  authorId,
  nickname,
  image,
  size = 36,
}: {
  authorId: string;
  nickname: string;
  image: string | null;
  size?: number;
}) {
  return (
    <Link
      href={`/author/${authorId}`}
      className="inline-flex items-center gap-2 rounded-full py-1 pr-3 transition hover:bg-sky-pale"
      title={`${nickname} 작가 홈`}
    >
      <Avatar src={image} name={nickname} size={size} />
      <span className="text-sm font-semibold text-ink-sub">
        by {nickname}
      </span>
    </Link>
  );
}
