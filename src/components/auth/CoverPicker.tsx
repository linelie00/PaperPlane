"use client";

import { useRef, useState } from "react";

// 배경(배너) 이미지 업로더 — /api/avatar 재사용. 업로드 후 URL을 onChange로 전달한다.
export function CoverPicker({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (url: string | null) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError("");
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/avatar", { method: "POST", body: fd });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.url) onChange(data.url);
      else setError(data?.error?.message ?? "업로드에 실패했습니다.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="relative h-32 w-full overflow-hidden rounded-2xl border border-paper-border bg-gradient-to-br from-sky-pale to-plane-light/30">
        {value && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="배경" className="h-full w-full object-cover" />
        )}
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="rounded-full border border-plane-light bg-white px-4 py-1.5 text-sm font-bold text-plane-dark hover:bg-sky-pale disabled:opacity-50"
        >
          {uploading ? "업로드 중…" : value ? "배경 변경" : "배경 선택"}
        </button>
        {value && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="rounded-full px-3 py-1.5 text-sm font-semibold text-ink-sub hover:text-error"
          >
            제거
          </button>
        )}
      </div>
      {error && <p className="text-xs font-medium text-error">{error}</p>}
      <input
        ref={fileRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
        onChange={handleFile}
      />
    </div>
  );
}
