import type { ReactNode } from "react";

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-4xl border border-paper-border bg-white p-6 shadow-card ${className}`}
    >
      {children}
    </div>
  );
}
