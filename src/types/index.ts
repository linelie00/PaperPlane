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
  userId: string | null; // 로그인 작성자 (null = 레거시 익명)
  authorImage: string | null; // 작성자 프로필 이미지
  hasPassword: boolean; // (레거시) 익명 작성자가 비밀번호로 삭제 가능한지
  replies: CommentItem[];
};

// 작가 SNS 링크
export type AuthorLinkItem = {
  id: string;
  platform: string;
  url: string;
};

// 독자 피드 아이템 (구독 작가 최근 회차 / 트렌딩)
export type FeedItem = {
  workId: string;
  publicSlug: string;
  title: string;
  coverImage: string | null;
  authorId: string;
  authorNickname: string;
  authorImage: string | null;
  viewCount: number;
  heartCount: number;
  latestChapterOrder: number | null;
  updatedAt: string;
  subscribed: boolean; // 구독 작가의 작품인지 (추천 이유 표시)
};

// 관리자(개발자) 대시보드 통계
export type AdminStats = {
  totalUsers: number;
  totalWorks: number;
  totalViews: number;
  totalSubscriptions: number;
  totalHearts: number;
  totalLinkClicks: number;
  // 플랫폼별 클릭률(클릭 / 노출 조회수 근사)
  platforms: { platform: string; clicks: number }[];
  // 링크별 상위 클릭
  topLinks: {
    linkId: string;
    platform: string;
    url: string;
    authorNickname: string;
    clicks: number;
  }[];
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
  // 내 SNS 링크 클릭 요약 (서비스 어필 지표)
  snsClicks: { platform: string; url: string; clicks: number }[];
  totalSnsClicks: number;
};
