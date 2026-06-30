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
  targetLanguages: string[];
  isPublic: boolean;
  chapterCount: number;
  publicChapterCount: number;
  viewCount: number;
  commentCount: number;
  createdAt: string;
};

// 회차 언어별 번역
export type ChapterTranslationItem = {
  language: string;
  status: TranslationStatus;
  text: string | null;
};

// 회차 (창작자 화면용 — 원문/번역문 포함)
export type ChapterItem = {
  id: string;
  order: number;
  title: string;
  category: string | null;
  isPublic: boolean;
  coverImage: string | null;
  originalText: string;
  translations: ChapterTranslationItem[];
};

export type CommentItem = {
  id: string;
  nickname: string;
  content: string;
  createdAt: string;
  parentId: string | null;
  hasPassword: boolean; // 익명 작성자가 비밀번호로 삭제 가능한지
  replies: CommentItem[];
};

// 창작자 화면용 댓글 (회차 정보 + 답글 중첩)
export type CreatorComment = {
  id: string;
  nickname: string;
  content: string;
  createdAt: string;
  chapterOrder: number | null;
  replies: {
    id: string;
    nickname: string;
    content: string;
    createdAt: string;
  }[];
};

export type WorkDetail = {
  id: string;
  title: string;
  description: string;
  genre: string;
  tags: string[];
  sourceLanguage: string;
  targetLanguages: string[];
  coverImage: string | null;
  isPublic: boolean;
  publicSlug: string | null;
  viewCount: number;
  commentCount: number;
  chapters: ChapterItem[];
  comments: CreatorComment[];
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
