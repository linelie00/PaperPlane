import type { AuthorLinkItem } from "@/types";

// 플랫폼 라벨 → 표시 이모지/이름 (알 수 없으면 링크 아이콘)
const PLATFORM_META: Record<string, { icon: string; label: string }> = {
  twitter: { icon: "𝕏", label: "X (Twitter)" },
  x: { icon: "𝕏", label: "X (Twitter)" },
  instagram: { icon: "📷", label: "Instagram" },
  youtube: { icon: "▶", label: "YouTube" },
  tiktok: { icon: "🎵", label: "TikTok" },
  facebook: { icon: "f", label: "Facebook" },
  blog: { icon: "✍", label: "Blog" },
};

function meta(platform: string) {
  return (
    PLATFORM_META[platform.toLowerCase()] ?? { icon: "🔗", label: platform }
  );
}

// 작가 SNS 링크 버튼들. 클릭은 /api/links/[id]/go 를 거쳐 추적 후 리다이렉트된다.
export function AuthorSnsLinks({ links }: { links: AuthorLinkItem[] }) {
  if (links.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      {links.map((l) => {
        const m = meta(l.platform);
        return (
          <a
            key={l.id}
            href={`/api/links/${l.id}/go`}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="inline-flex items-center gap-1.5 rounded-full border border-paper-border bg-white px-4 py-2 text-sm font-semibold text-ink-sub transition hover:border-plane-light hover:text-plane-dark"
          >
            <span aria-hidden>{m.icon}</span>
            {m.label}
          </a>
        );
      })}
    </div>
  );
}
