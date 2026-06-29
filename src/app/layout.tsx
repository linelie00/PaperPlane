import type { Metadata } from "next";
import "./globals.css";
import { appUrl } from "@/lib/meta";

const TITLE = "PaperPlane — 언어가 달라져도, 이야기가 주는 설렘은 같아야 한다";
const DESCRIPTION =
  "PaperPlane은 창작자의 이야기를 AI로 번역하고, 해외 독자가 바로 읽을 수 있는 뷰어와 반응 확인 기능을 제공합니다.";

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
