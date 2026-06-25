"use client";

import { useRef, useState } from "react";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";

type Props = {
  value: string;
  onChange: (html: string) => void;
};

// 툴바 버튼
function ToolbarButton({
  active,
  disabled,
  onClick,
  title,
  children,
}: {
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={`flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-sm font-bold transition disabled:opacity-40 ${
        active
          ? "bg-plane-primary text-white"
          : "text-ink-sub hover:bg-sky-pale hover:text-plane-dark"
      }`}
    >
      {children}
    </button>
  );
}

function Toolbar({ editor }: { editor: Editor }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // 같은 파일 재선택 허용
    if (!file) return;

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.url) {
        editor.chain().focus().setImage({ src: data.url }).run();
      } else {
        alert(data?.error?.message ?? "이미지 업로드에 실패했습니다.");
      }
    } finally {
      setUploading(false);
    }
  }

  const Divider = () => <span className="mx-1 h-5 w-px bg-paper-border" />;

  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-paper-border bg-white px-2 py-1.5">
      <ToolbarButton
        title="굵게"
        active={editor.isActive("bold")}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <span className="font-extrabold">B</span>
      </ToolbarButton>
      <ToolbarButton
        title="기울임"
        active={editor.isActive("italic")}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <span className="italic">I</span>
      </ToolbarButton>
      <ToolbarButton
        title="밑줄"
        active={editor.isActive("underline")}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      >
        <span className="underline">U</span>
      </ToolbarButton>
      <ToolbarButton
        title="취소선"
        active={editor.isActive("strike")}
        onClick={() => editor.chain().focus().toggleStrike().run()}
      >
        <span className="line-through">S</span>
      </ToolbarButton>

      <Divider />

      {([1, 2, 3] as const).map((level) => (
        <ToolbarButton
          key={level}
          title={`제목 ${level}`}
          active={editor.isActive("heading", { level })}
          onClick={() => editor.chain().focus().toggleHeading({ level }).run()}
        >
          H{level}
        </ToolbarButton>
      ))}

      <Divider />

      <ToolbarButton
        title="글머리 목록"
        active={editor.isActive("bulletList")}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        •
      </ToolbarButton>
      <ToolbarButton
        title="번호 목록"
        active={editor.isActive("orderedList")}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        1.
      </ToolbarButton>
      <ToolbarButton
        title="인용구"
        active={editor.isActive("blockquote")}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M7 7h4v6c0 2.2-1.5 3.7-3.7 4.3l-.6-1.4C7.9 15.6 8.6 15 8.7 14H7c-1.1 0-2-.9-2-2V9c0-1.1.9-2 2-2zm9 0h4v6c0 2.2-1.5 3.7-3.7 4.3l-.6-1.4c1.2-.3 1.9-.9 2-1.9H16c-1.1 0-2-.9-2-2V9c0-1.1.9-2 2-2z" />
        </svg>
      </ToolbarButton>

      <Divider />

      <ToolbarButton
        title="이미지 삽입"
        disabled={uploading}
        onClick={() => fileRef.current?.click()}
      >
        {uploading ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="animate-spin">
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" opacity="0.25" />
            <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="2" />
            <circle cx="8.5" cy="9.5" r="1.5" fill="currentColor" />
            <path d="m4 18 5-5 4 4 3-3 4 4" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
          </svg>
        )}
      </ToolbarButton>
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

export function RichTextEditor({ value, onChange }: Props) {
  const editor = useEditor({
    immediatelyRender: false, // Next SSR 하이드레이션 불일치 방지
    extensions: [
      StarterKit,
      Image.configure({ inline: false, allowBase64: false }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class:
          "rich-content min-h-[260px] px-4 py-3 outline-none focus:outline-none",
      },
    },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  return (
    <div className="overflow-hidden rounded-2xl border border-paper-border bg-white focus-within:border-plane-primary focus-within:ring-4 focus-within:ring-plane-light/40">
      {editor && <Toolbar editor={editor} />}
      <EditorContent editor={editor} />
    </div>
  );
}
