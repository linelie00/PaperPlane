import { db } from "@/lib/db";
import { translateText } from "@/lib/ai";
import { sanitizeHtml } from "@/lib/utils";

type ChapterWithWork = NonNullable<
  Awaited<ReturnType<typeof loadChapter>>
>;

function loadChapter(chapterId: string) {
  return db.chapter.findUnique({
    where: { id: chapterId },
    include: { work: true },
  });
}

// 작품의 번역 대상 언어 목록 (구 targetLanguage 호환)
function workLanguages(work: { targetLanguages: string[]; targetLanguage: string }) {
  if (work.targetLanguages.length > 0) return work.targetLanguages;
  return work.targetLanguage ? [work.targetLanguage] : [];
}

// 한 회차를 한 언어로 번역해 ChapterTranslation에 저장한다.
async function translateOne(chapter: ChapterWithWork, language: string) {
  await db.chapterTranslation.upsert({
    where: { chapterId_language: { chapterId: chapter.id, language } },
    create: { chapterId: chapter.id, language, status: "processing" },
    update: { status: "processing" },
  });

  try {
    const raw = await translateText({
      originalText: chapter.originalText,
      sourceLanguage: chapter.work.sourceLanguage,
      targetLanguage: language,
      title: `${chapter.work.title} - ${chapter.title}`,
      description: chapter.work.description,
      genre: chapter.work.genre,
    });
    const text = sanitizeHtml(raw);
    await db.chapterTranslation.update({
      where: { chapterId_language: { chapterId: chapter.id, language } },
      data: { text, status: "completed" },
    });
  } catch (err) {
    console.error(`[translation] 회차 번역 실패 (${language}):`, err);
    await db.chapterTranslation.update({
      where: { chapterId_language: { chapterId: chapter.id, language } },
      data: { status: "failed" },
    });
  }
}

// 회차를 작품의 모든 대상 언어로 번역한다. (대상에서 빠진 언어 번역은 정리)
export async function runChapterTranslations(chapterId: string): Promise<void> {
  const chapter = await loadChapter(chapterId);
  if (!chapter) throw new Error("CHAPTER_NOT_FOUND");

  const langs = workLanguages(chapter.work);
  for (const lang of langs) {
    await translateOne(chapter, lang);
  }

  // 더 이상 대상이 아닌 언어의 번역은 제거
  await db.chapterTranslation.deleteMany({
    where: {
      chapterId,
      language: { notIn: langs.length > 0 ? langs : ["__none__"] },
    },
  });
}

// 회차의 특정 언어 하나만 다시 번역한다.
export async function runChapterTranslationFor(
  chapterId: string,
  language: string,
): Promise<void> {
  const chapter = await loadChapter(chapterId);
  if (!chapter) throw new Error("CHAPTER_NOT_FOUND");
  await translateOne(chapter, language);
}
