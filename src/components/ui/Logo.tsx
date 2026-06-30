// PaperPlane 로고 — 종이비행기 마크 + 워드마크.
// withWordmark=false면 마크만(파비콘/모바일용).

let gradSeq = 0;

export function Logo({
  size = 26,
  withWordmark = true,
  className = "",
}: {
  size?: number;
  withWordmark?: boolean;
  className?: string;
}) {
  // 같은 페이지에 여러 개 그려도 그라데이션 id가 겹치지 않게 한다.
  const gid = `pp-wing-${gradSeq++}`;

  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 80 80"
        fill="none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#22C7C7" />
            <stop offset="1" stopColor="#38BDF8" />
          </linearGradient>
        </defs>
        <polygon points="73,7 7,30 37,43" fill={`url(#${gid})`} />
        <polygon points="73,7 37,43 50,73" fill="#0E9BA3" />
      </svg>
      {withWordmark && (
        <span
          className="font-extrabold tracking-tight text-ink-main"
          style={{ fontSize: size * 0.74 }}
        >
          Paper<span className="text-plane-primary">Plane</span>
        </span>
      )}
    </span>
  );
}
