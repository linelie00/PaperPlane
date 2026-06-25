import type { TranslationStatus } from "@/types";

// 번역 상태 뱃지 (docs/08_UI_DESIGN_GUIDE.md)
const STATUS_MAP: Record<
  TranslationStatus,
  { label: string; className: string }
> = {
  pending: { label: "대기 중", className: "bg-slate-100 text-slate-500" },
  processing: { label: "번역 중", className: "bg-sky-soft text-plane-dark" },
  completed: { label: "번역 완료", className: "bg-plane-light text-plane-dark" },
  failed: { label: "번역 실패", className: "bg-red-100 text-error" },
};

export function StatusBadge({ status }: { status: TranslationStatus }) {
  const { label, className } = STATUS_MAP[status];
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${className}`}
    >
      {label}
    </span>
  );
}
