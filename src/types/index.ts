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
  translationStatus: TranslationStatus;
  isPublic: boolean;
  viewCount: number;
  commentCount: number;
  createdAt: string;
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
  originalText: string;
  translatedText: string | null;
  translationStatus: TranslationStatus;
  isPublic: boolean;
  publicSlug: string | null;
  viewCount: number;
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
