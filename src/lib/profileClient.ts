// 프로필 저장 클라이언트 헬퍼: PATCH /api/profile + (변경 시) PUT /api/profile/links.
// ProfileForm과 작가 홈 인라인 편집에서 공용으로 사용한다.

type LinkDraft = { platform: string; url: string };

export async function saveProfile({
  profile,
  links,
}: {
  profile: {
    nickname: string;
    image: string | null;
    coverImage: string | null;
    bio: string;
  };
  links?: LinkDraft[]; // undefined면 링크는 건드리지 않음
}): Promise<{ ok: true } | { ok: false; message: string }> {
  const res = await fetch("/api/profile", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(profile),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    return { ok: false, message: data?.error?.message ?? "저장에 실패했습니다." };
  }

  if (links !== undefined) {
    const cleaned = links.filter((l) => l.url.trim() !== "");
    const linkRes = await fetch("/api/profile/links", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ links: cleaned }),
    });
    if (!linkRes.ok) {
      const data = await linkRes.json().catch(() => null);
      return {
        ok: false,
        message: data?.error?.message ?? "SNS 링크 저장에 실패했습니다.",
      };
    }
  }

  return { ok: true };
}
