import type { Metadata } from "next";
import "./globals.css";
import { appUrl } from "@/lib/meta";

const TITLE = "PaperPlane — 작품은 끝나도, 팬심은 이어지니까";
const DESCRIPTION =
  "PaperPlane은 작품만 보고 떠나던 독자를 작가의 ‘코어 팬’으로 잇는 팬덤 플랫폼입니다. 외전·짧은 컷·작업 비하인드 ‘Papers’로 팬과 더 가까워지세요.";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl()),
  title: {
    default: TITLE,
    template: "%s · PaperPlane",
  },
  description: DESCRIPTION,
  openGraph: {
    type: "website",
    siteName: "PaperPlane",
    title: TITLE,
    description: DESCRIPTION,
    locale: "ko_KR",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
