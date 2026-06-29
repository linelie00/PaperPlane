// PaperPlane 공용 타입 (docs/05_DB_SCHEMA.md 기준)

export type TranslationStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed";

export type WorkListItem = {
  id: string;
  title: string;
  sourceLanguage: string;
  targetLanguage: string;
  isPublic: boolean;
  chapterCount: number;
  publicChapterCount: number;
  viewCount: number;
  commentCount: number;
  createdAt: string;
};

// 회차 (창작자 화면용 — 원문/번역문 포함)
export type ChapterItem = {
  id: string;
  order: number;
  title: string;
  isPublic: boolean;
  translationStatus: TranslationStatus;
  originalText: string;
  translatedText: string | null;
};

export type CommentItem = {
  id: string;
  nickname: string;
  content: string;
  createdAt: string;
};

export type WorkDetail = {
  id: string;
  title: string;
  description: string;
  genre: string;
  tags: string[];
  sourceLanguage: string;
  targetLanguage: string;
  isPublic: boolean;
  publicSlug: string | null;
  viewCount: number;
  chapters: ChapterItem[];
  comments: CommentItem[];
};

export type DashboardStats = {
  totalWorks: number;
  totalViews: number;
  todayViews: number;
  totalComments: number;
  publicWorks: number;
  works: {
    workId: string;
    title: string;
    viewCount: number;
    commentCount: number;
  }[];
  referrers: { source: string; count: number }[];
  recentComments: {
    id: string;
    workId: string;
    nickname: string;
    content: string;
    createdAt: string;
  }[];
};
