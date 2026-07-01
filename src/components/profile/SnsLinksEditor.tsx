"use client";

import { Input } from "@/components/ui/Input";

export type LinkDraft = { platform: string; url: string };

export const MAX_LINKS = 8;

// SNS 링크 목록 편집기 (제어 컴포넌트). 상위에서 value/onChange로 상태를 관리한다.
export function SnsLinksEditor({
  links,
  onChange,
}: {
  links: LinkDraft[];
  onChange: (links: LinkDraft[]) => void;
}) {
  function updateLink(i: number, patch: Partial<LinkDraft>) {
    onChange(links.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  }
  function addLink() {
    if (links.length >= MAX_LINKS) return;
    onChange([...links, { platform: "", url: "" }]);
  }
  function removeLink(i: number) {
    onChange(links.filter((_, idx) => idx !== i));
  }

  return (
    <div className="flex flex-col gap-3">
      {links.length > 0 && (
        <ul className="flex flex-col gap-2">
          {links.map((l, i) => (
            <li key={i} className="flex items-center gap-2">
              <div className="w-36 shrink-0">
                <Input
                  value={l.platform}
                  onChange={(e) => updateLink(i, { platform: e.target.value })}
                  placeholder="플랫폼"
                  maxLength={30}
                />
              </div>
              <Input
                value={l.url}
                onChange={(e) => updateLink(i, { url: e.target.value })}
                placeholder="https://..."
                inputMode="url"
              />
              <button
                type="button"
                onClick={() => removeLink(i)}
                className="shrink-0 rounded-full px-3 py-2 text-sm font-semibold text-ink-sub hover:text-error"
              >
                삭제
              </button>
            </li>
          ))}
        </ul>
      )}

      {links.length < MAX_LINKS && (
        <button
          type="button"
          onClick={addLink}
          className="self-start rounded-full border border-plane-light bg-white px-4 py-1.5 text-sm font-bold text-plane-dark hover:bg-sky-pale"
        >
          + 링크 추가
        </button>
      )}
    </div>
  );
}
