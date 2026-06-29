// 프로필 아바타. 이미지가 없으면 닉네임 첫 글자로 대체한다.
export function Avatar({
  src,
  name,
  size = 40,
  className = "",
}: {
  src?: string | null;
  name: string;
  size?: number;
  className?: string;
}) {
  const initial = (name?.trim()?.[0] ?? "✈").toUpperCase();
  const style = { width: size, height: size };

  if (src) {
    return (
      // 자체 업로드/외부 이미지라 next/image 대신 img 사용
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name}
        style={style}
        className={`shrink-0 rounded-full object-cover ${className}`}
      />
    );
  }

  return (
    <span
      style={{ ...style, fontSize: size * 0.42 }}
      className={`flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-plane-primary to-sky font-bold text-white ${className}`}
    >
      {initial}
    </span>
  );
}
