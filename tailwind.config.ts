import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: {
          white: "#FFFFFF",
          background: "#F8FDFF",
          surface: "#FFFFFF",
          border: "#D8EEF5",
        },
        plane: {
          primary: "#22C7C7",
          dark: "#0891B2",
          light: "#A7F3F0",
        },
        sky: {
          DEFAULT: "#38BDF8",
          soft: "#E0F7FF",
          pale: "#F0FAFF",
        },
        ink: {
          main: "#102A43",
          sub: "#627D98",
          muted: "#9FB3C8",
        },
        success: "#10B981",
        warning: "#F59E0B",
        error: "#EF4444",
      },
      borderRadius: {
        "4xl": "2rem",
      },
      boxShadow: {
        card: "0 12px 30px rgba(8, 145, 178, 0.08)",
        plane: "0 10px 24px rgba(34, 199, 199, 0.24)",
      },
      fontFamily: {
        sans: ["Pretendard", "Inter", "Noto Sans KR", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
