"use client";

import { useRef, useState } from "react";
import { CoverImage } from "./CoverImage";

// 메인 이미지 선택/변경/제거. /api/upload(로그인 필요)로 업로드한다.
export function ImagePicker({
  value,
  onChange,
  boxClass = "h-40 w-full",
}: {
  value: string | null;
  onChange: (url: string | null) => void;
  boxClass?: string;
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
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.url) onChange(data.url);
      else setError(data?.error?.message ?? "업로드에 실패했습니다.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className={`overflow-hidden rounded-2xl border border-paper-border ${boxClass}`}>
        <CoverImage src={value} alt="메인 이미지 미리보기" />
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="rounded-full border border-plane-light bg-white px-4 py-1.5 text-sm font-bold text-plane-dark hover:bg-sky-pale disabled:opacity-50"
        >
          {uploading ? "업로드 중…" : value ? "이미지 변경" : "이미지 선택"}
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
      <p className="text-xs text-ink-muted">
        PNG·JPG·WEBP·GIF, 5MB 이하 (선택) · 없으면 기본 이미지가 표시됩니다.
      </p>
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
