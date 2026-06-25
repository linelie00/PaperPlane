import { db } from "@/lib/db";
import { translateText } from "@/lib/ai";
import { sanitizeHtml } from "@/lib/utils";
import type { TranslationStatus } from "@/types";

// 작품 번역을 실행하고 상태를 갱신한다.
// 성공 시 completed, 실패 시 failed로 저장하며 원문은 유지한다. (CLAUDE.md)
export async function runTranslation(workId: string): Promise<{
  translationStatus: TranslationStatus;
  translatedText: string | null;
}> {
  const work = await db.work.findUnique({
    where: { id: workId },
    include: { content: true },
  });

  if (!work || !work.content) {
    throw new Error("WORK_NOT_FOUND");
  }

  await db.workContent.update({
    where: { workId },
    data: { translationStatus: "processing" },
  });

  try {
    const raw = await translateText({
      originalText: work.content.originalText,
      sourceLanguage: work.sourceLanguage,
      targetLanguage: work.targetLanguage,
      title: work.title,
      description: work.description,
      genre: work.genre,
    });
    // LLM이 반환한 HTML도 저장 전에 정제한다. (서식 보존 + XSS 방어)
    const translatedText = sanitizeHtml(raw);

    await db.workContent.update({
      where: { workId },
      data: { translatedText, translationStatus: "completed" },
    });

    return { translationStatus: "completed", translatedText };
  } catch (err) {
    console.error("[translation] 번역 실패:", err);
    await db.workContent.update({
      where: { workId },
      data: { translationStatus: "failed" },
    });
    return { translationStatus: "failed", translatedText: null };
  }
}
