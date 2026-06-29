import { ImageResponse } from "next/og";

// 모든 페이지의 기본 OG 이미지 (브랜드 카드). 개별 페이지에서 덮어쓸 수 있다.
export const alt = "PaperPlane — 언어가 달라져도, 이야기가 주는 설렘은 같아야 한다";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #f0faff 0%, #ffffff 55%, #e7f8ff 100%)",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ fontSize: 120, marginBottom: 8 }}>✈</div>
        <div style={{ fontSize: 84, fontWeight: 800, color: "#0e7490" }}>
          PaperPlane
        </div>
        <div
          style={{
            marginTop: 24,
            fontSize: 36,
            color: "#334155",
            maxWidth: 900,
            textAlign: "center",
          }}
        >
          언어가 달라져도, 이야기가 주는 설렘은 같아야 한다
        </div>
      </div>
    ),
    { ...size },
  );
}
