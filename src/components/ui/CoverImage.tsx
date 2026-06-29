// 작품/회차 메인 이미지. 이미지가 없으면 기본(브랜드 그라데이션 + ✈)으로 표시한다.
export function CoverImage({
  src,
  alt = "",
  className = "",
}: {
  src?: string | null;
  alt?: string;
  className?: string;
}) {
  if (src) {
    return (
      // 자체 업로드/외부 이미지라 next/image 대신 img 사용
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt}
        loading="lazy"
        className={`h-full w-full object-cover ${className}`}
      />
    );
  }
  return (
    <div
      className={`flex h-full w-full items-center justify-center bg-gradient-to-br from-sky-pale to-plane-light/40 ${className}`}
    >
      <span className="text-3xl text-plane-primary opacity-50">✈</span>
    </div>
  );
}
