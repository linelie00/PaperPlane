"use client";

import { useRef, useState } from "react";
import { Avatar } from "@/components/ui/Avatar";

// 프로필 사진 선택/변경/제거. /api/avatar로 업로드 후 URL을 onChange로 전달한다.
export function AvatarPicker({
  value,
  name,
  onChange,
}: {
  value: string | null;
  name: string;
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
      if (res.ok && data?.url) {
        onChange(data.url);
      } else {
        setError(data?.error?.message ?? "업로드에 실패했습니다.");
      }
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex items-center gap-4">
      <Avatar src={value} name={name || "?"} size={64} />
      <div className="flex flex-col gap-1.5">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="rounded-full border border-plane-light bg-white px-4 py-1.5 text-sm font-bold text-plane-dark hover:bg-sky-pale disabled:opacity-50"
          >
            {uploading ? "업로드 중…" : value ? "사진 변경" : "사진 선택"}
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
        <p className="text-xs text-ink-muted">PNG·JPG·WEBP·GIF, 2MB 이하 (선택)</p>
        {error && <p className="text-xs font-medium text-error">{error}</p>}
      </div>
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
