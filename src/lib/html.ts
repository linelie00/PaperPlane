// 저장된 본문 HTML의 <img>에 네이티브 지연 로딩을 추가한다.
// 웹툰처럼 이미지가 많고 큰 회차에서 초기 로딩을 가볍게 한다.
// (에디터로 새로 삽입한 이미지는 이미 loading=lazy가 붙지만, 기존/번역 결과 보강용)
export function withLazyImages(html: string): string {
  return html.replace(
    /<img\b(?![^>]*\bloading=)/gi,
    '<img loading="lazy" decoding="async" ',
  );
}
