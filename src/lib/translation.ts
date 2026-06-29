import { db } from "@/lib/db";
import { translateText } from "@/lib/ai";
import { sanitizeHtml } from "@/lib/utils";
import type { TranslationStatus } from "@/types";

// 회차 번역을 실행하고 상태를 갱신한다.
// 성공 시 completed, 실패 시 failed로 저장하며 원문은 유지한다. (CLAUDE.md)
export async function runChapterTranslation(chapterId: string): Promise<{
  translationStatus: TranslationStatus;
  translatedText: string | null;
}> {
  const chapter = await db.chapter.findUnique({
    where: { id: chapterId },
    include: { work: true },
  });

  if (!chapter) {
    throw new Error("CHAPTER_NOT_FOUND");
  }

  await db.chapter.update({
    where: { id: chapterId },
    data: { translationStatus: "processing" },
  });

  try {
    const raw = await translateText({
      originalText: chapter.originalText,
      sourceLanguage: chapter.work.sourceLanguage,
      targetLanguage: chapter.work.targetLanguage,
      title: `${chapter.work.title} - ${chapter.title}`,
      description: chapter.work.description,
      genre: chapter.work.genre,
    });
    // LLM이 반환한 HTML도 저장 전에 정제한다. (서식 보존 + XSS 방어)
    const translatedText = sanitizeHtml(raw);

    await db.chapter.update({
      where: { id: chapterId },
      data: { translatedText, translationStatus: "completed" },
    });

    return { translationStatus: "completed", translatedText };
  } catch (err) {
    console.error("[translation] 회차 번역 실패:", err);
    await db.chapter.update({
      where: { id: chapterId },
      data: { translationStatus: "failed" },
    });
    return { translationStatus: "failed", translatedText: null };
  }
}
