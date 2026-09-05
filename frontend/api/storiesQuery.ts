import { mainApi as apiSlice } from "./mainQuery";

export interface HighlightItem {
  _id?: string;
  chapterId: string;
  paragraphIdx: number;
  selectedText: string;
  note?: string;
  color?: string;
  createdAt?: string;
}

export interface Story {
  _id: string;
  slug: string;
  title: string;
  synopsis?: string;
  coverImageUrl?: string;
  difficultyLevel?: string;
  author?: string;
  totalDurationSeconds?: number;
  totalChapters?: number;
  isFeatured?: boolean;
  featuredRank?: number;
  isPremium?: boolean;
  contentType?: "ebook" | "audiobook" | "both";
  languages?: string[];
  tags?: string[];
  isAiEnhanced?: boolean;
  hasIllustrations?: boolean;
  aiEnhancements?: {
    illustrations?: boolean;
    sceneCount?: number;
    enhancedAt?: string;
  };
  seriesName?: string;
  seriesOrder?: number;
  userProgress?: {
    lastReadAt?: string;
    lastListenedAt?: string;
    lastVisitedAt?: string;
    lastActivityType?: "reading" | "listening" | "visited";
    completedChapterIds: string[];
    bookmarkedChapterIds?: string[];
    highlights?: HighlightItem[];
    currentChapterId?: string;
    audioTimestamp?: number;
    scrollOffset?: number;
    currentPageIdx?: number;
    isCompleted?: boolean;
    readerSettings?: {
      theme?: string;
      fontFamily?: "sans" | "serif" | "mono";
      fontSize?: number;
      textAlign?: "left" | "justify" | "center";
      containerWidth?: number;
    };
  } | null;
}

export interface AudioVoiceOption {
  id: string;
  key: string;
  name: string;
  gender: string;
  accent: string;
  description?: string;
  url: string;
}

export interface StoryChapter {
  _id: string;
  chapterNumber: number;
  title: string;
  textPayload?: string;
  audioUrl?: string;
  audioVoices?: {
    defaultVoiceId?: string;
    voices?: AudioVoiceOption[];
  };
  durationSeconds?: number;
  wordTimestamps?: Array<{ word: string; start: number; end: number }>;
}

export interface StoryDetailsResponse extends Story {
  chapters: StoryChapter[];
  similarStories?: Story[];
  moreByAuthor?: Story[];
  seriesBooks?: Story[];
}

export type StoryDetail = StoryDetailsResponse;

export interface DashboardResponse {
  topFeatured?: Story[];
  continueReading?: Story[];
  continueListening?: Story[];
  recentlyVisited?: Story[];
  recentlyRead: Story[];
  newest: Story[];
  audiobooks?: Story[];
  byLevel: {
    beginner: Story[];
    intermediate: Story[];
    advanced: Story[];
  };
  byGenre?: {
    horror: Story[];
    adventure: Story[];
    romance: Story[];
    scifi: Story[];
    mystery: Story[];
    classic: Story[];
    philosophy?: Story[];
    comedy?: Story[];
    fantasy?: Story[];
    thriller?: Story[];
    gothic?: Story[];
    drama?: Story[];
    biography?: Story[];
    nature?: Story[];
    victorian?: Story[];
    russian?: Story[];
    french?: Story[];
    children?: Story[];
    loveStories?: Story[];
    psychFiction?: Story[];
    shortStories?: Story[];
  };
}

export interface EbookAuthor {
  _id: string;
  name: string;
  slug: string;
  bio?: string;
  avatarUrl?: string;
  books: Story[];
  bookCount: number;
}

export interface EbookCategory {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  color?: string;
  icon?: string;
  books: Story[];
  bookCount: number;
}

export interface EbookTag {
  _id: string;
  name: string;
  slug: string;
  books: Story[];
  bookCount: number;
}

export interface BookSeries {
  _id: string;
  title: string;
  slug: string;
  description?: string;
  author?: string;
  coverImageUrl?: string;
  bookCount: number;
  books: Story[];
}

export interface EbookNarrator {
  name: string;
  slug: string;
  bio?: string;
  avatarUrl?: string;
  catalogCount?: number;
  voiceId?: string;
}

export const storiesApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getStories: builder.query<{ success: boolean; count: number; total: number; data: Story[] }, { limit?: number; page?: number; category?: string; tag?: string; search?: string; difficulty?: string } | void>({
      query: (params) => ({
        url: "/stories",
        params: params || { limit: 1000 },
      }),
      transformResponse: (response: { success: boolean; count: number; total: number; data: Story[] }) => response,
      providesTags: ["Story"] as any,
    }),
    getStoriesDashboard: builder.query<DashboardResponse, void>({
      query: () => "/stories/dashboard",
      transformResponse: (response: { success: boolean; data: DashboardResponse }) => response.data,
      providesTags: ["StoryDashboard"] as any,
    }),
    getAuthors: builder.query<EbookAuthor[], void>({
      query: () => "/stories/authors",
      transformResponse: (response: { success: boolean; data: EbookAuthor[] }) => response.data,
    }),
    getAuthorBySlug: builder.query<EbookAuthor, string>({
      query: (slug) => `/stories/authors/${slug}`,
      transformResponse: (response: { success: boolean; data: EbookAuthor }) => response.data,
    }),
    getCategories: builder.query<EbookCategory[], void>({
      query: () => "/stories/categories",
      transformResponse: (response: { success: boolean; data: EbookCategory[] }) => response.data,
    }),
    getCategoryBySlug: builder.query<EbookCategory, string>({
      query: (slug) => `/stories/categories/${slug}`,
      transformResponse: (response: { success: boolean; data: EbookCategory }) => response.data,
    }),
    getTags: builder.query<EbookTag[], void>({
      query: () => "/stories/tags",
      transformResponse: (response: { success: boolean; data: EbookTag[] }) => response.data,
    }),
    getTagBySlug: builder.query<EbookTag, string>({
      query: (slug) => `/stories/tags/${slug}`,
      transformResponse: (response: { success: boolean; data: EbookTag }) => response.data,
    }),
    getBookSeries: builder.query<BookSeries[], void>({
      query: () => "/stories/series",
      transformResponse: (response: { success: boolean; data: BookSeries[] }) => response.data,
    }),
    getBookSeriesBySlug: builder.query<BookSeries, string>({
      query: (slug) => `/stories/series/${slug}`,
      transformResponse: (response: { success: boolean; data: BookSeries }) => response.data,
    }),
    getNarrators: builder.query<EbookNarrator[], void>({
      query: () => "/metadata/narrators",
      transformResponse: (response: { success: boolean; data: EbookNarrator[] }) => response.data,
    }),
    getStoryBySlug: builder.query<StoryDetailsResponse, string | { slug: string; lang?: string }>({
      query: (arg) => {
        const slug = typeof arg === "string" ? arg : arg.slug;
        const lang = typeof arg === "object" ? arg.lang : undefined;
        return `/stories/slug/${slug}${lang ? `?lang=${lang}` : ""}`;
      },
      transformResponse: (response: { success: boolean; data: StoryDetailsResponse }) => response.data,
      providesTags: ["Story"] as any,
    }),
    getChapterContent: builder.query<StoryChapter, { slug: string; chapterId: string; lang?: string }>({
      query: ({ slug, chapterId, lang }) => `/stories/slug/${slug}/chapters/${chapterId}${lang ? `?lang=${lang}` : ""}`,
      transformResponse: (response: { success: boolean; data: StoryChapter }) => response.data,
    }),
    syncStoryProgress: builder.mutation<
      any,
      {
        slug: string;
        chapterId?: string;
        audioTimestamp?: number;
        scrollOffset?: number;
        currentPageIdx?: number;
        activityType?: "reading" | "listening" | "visited";
        readerSettings?: {
          theme?: string;
          fontFamily?: "sans" | "serif" | "mono";
          fontSize?: number;
          textAlign?: "left" | "justify" | "center";
          containerWidth?: number;
        };
      }
    >({
      query: ({ slug, chapterId, audioTimestamp, scrollOffset, currentPageIdx, activityType, readerSettings }) => ({
        url: `/stories/slug/${slug}/progress`,
        method: "POST",
        body: {
          currentChapterId: chapterId,
          audioTimestamp: audioTimestamp ?? 0,
          scrollOffset,
          currentPageIdx,
          activityType: activityType || "reading",
          readerSettings,
        },
      }),
      transformResponse: (response: { success: boolean; data: any }) => response.data,
      invalidatesTags: ["StoryDashboard", "Story"] as any,
    }),
    resetStoryProgress: builder.mutation<any, { slug: string }>({
      query: ({ slug }) => ({
        url: `/stories/slug/${slug}/progress/reset`,
        method: "POST",
      }),
      transformResponse: (response: { success: boolean; data: any }) => response.data,
      invalidatesTags: ["StoryDashboard", "Story"] as any,
    }),
    markStoryCompleted: builder.mutation<any, { slug: string; isCompleted?: boolean }>({
      query: ({ slug, isCompleted = true }) => ({
        url: `/stories/slug/${slug}/progress/complete`,
        method: "POST",
        body: { isCompleted },
      }),
      transformResponse: (response: { success: boolean; data: any }) => response.data,
      invalidatesTags: ["StoryDashboard", "Story"] as any,
    }),
    toggleStoryBookmark: builder.mutation<any, { slug: string; chapterId: string }>({
      query: ({ slug, chapterId }) => ({
        url: `/stories/slug/${slug}/bookmark`,
        method: "POST",
        body: { chapterId },
      }),
      transformResponse: (response: { success: boolean; data: any }) => response.data,
    }),
    addStoryHighlight: builder.mutation<any, { slug: string; chapterId: string; paragraphIdx?: number; selectedText: string; note?: string; color?: string }>({
      query: ({ slug, chapterId, paragraphIdx, selectedText, note, color }) => ({
        url: `/stories/slug/${slug}/highlights`,
        method: "POST",
        body: { chapterId, paragraphIdx, selectedText, note, color },
      }),
      transformResponse: (response: { success: boolean; data: any }) => response.data,
    }),
    deleteStoryHighlight: builder.mutation<any, { slug: string; highlightId: string }>({
      query: ({ slug, highlightId }) => ({
        url: `/stories/slug/${slug}/highlights/${highlightId}`,
        method: "DELETE",
      }),
      transformResponse: (response: { success: boolean; data: any }) => response.data,
    }),
    getStreamToken: builder.query<
      {
        success: boolean;
        signedStreamUrl: string;
        expiresAt: string;
        expiresInSeconds: number;
        storySlug: string;
        chapterNumber: number;
        voice: string;
      },
      { slug: string; chapterNumber?: number; voice?: string }
    >({
      query: ({ slug, chapterNumber = 1, voice = "adam" }) => `/stories/slug/${slug}/stream-token?chapterNumber=${chapterNumber}&voice=${voice}`,
      transformResponse: (response: any) => response,
    }),
    syncWhispersyncPosition: builder.mutation<
      any,
      {
        storySlug: string;
        chapterIndex?: number;
        paragraphIndex?: number;
        audioTimestampSec?: number;
        syncMode?: "reading" | "listening";
        deviceType?: string;
      }
    >({
      query: ({ storySlug, chapterIndex = 1, paragraphIndex, audioTimestampSec, syncMode = "reading", deviceType = "web-desktop" }) => ({
        url: "/stories/whispersync",
        method: "POST",
        body: { storySlug, chapterIndex, paragraphIndex, audioTimestampSec, syncMode, deviceType },
      }),
      transformResponse: (response: { success: boolean; whispersync: any; resumeGuide: any }) => response,
      invalidatesTags: ["Whispersync", "StoryDashboard", "UserLibrary"] as any,
    }),
    getWhispersyncPosition: builder.query<
      { success: boolean; hasSyncedPosition: boolean; whispersync: any; storySlug: string; lastVisitedAt?: string },
      string
    >({
      query: (slug) => `/stories/slug/${slug}/whispersync`,
      transformResponse: (response: any) => response,
      providesTags: ["Whispersync"] as any,
    }),
    getStoryRecommendations: builder.query<
      { targetSlug: string; recommendationsCount: number; recommendations: Story[] },
      { slug: string; limit?: number }
    >({
      query: ({ slug, limit = 10 }) => `/stories/slug/${slug}/recommendations?limit=${limit}`,
      transformResponse: (response: { success: boolean; data: any }) => response.data,
    }),
    getUserLibrary: builder.query<
      { active: any[]; completed: any[]; bookmarked: any[]; totalActive: number; totalCompleted: number; totalBookmarked: number },
      void
    >({
      query: () => "/stories/user/library",
      transformResponse: (response: { success: boolean; data: any }) => response.data,
      providesTags: ["UserLibrary"] as any,
    }),
    getStorySummary: builder.query<any, string | { slug: string; lang?: string; voiceId?: string; quality?: string }>({
      query: (arg) => {
        const slug = typeof arg === "string" ? arg : arg.slug;
        const lang = typeof arg === "object" ? arg.lang : undefined;
        const voiceId = typeof arg === "object" ? arg.voiceId : undefined;
        const quality = typeof arg === "object" ? arg.quality : undefined;
        const queryParts = [];
        if (lang) queryParts.push(`lang=${lang}`);
        if (voiceId) queryParts.push(`voiceId=${voiceId}`);
        if (quality) queryParts.push(`quality=${quality}`);
        const queryStr = queryParts.length > 0 ? `?${queryParts.join("&")}` : "";
        return `/stories/slug/${slug}/summary${queryStr}`;
      },
      transformResponse: (res: any) => (res.success ? res.data : null),
    }),
    getReels: builder.query<any[], number | void>({
      query: (limit = 20) => `/reels?limit=${limit}`,
      transformResponse: (res: any) => (res.success ? res.data : []),
    }),
    likeReel: builder.mutation<any, string>({
      query: (reelId) => ({
        url: `/reels/${reelId}/like`,
        method: "POST",
      }),
    }),
    getAudiobooks: builder.query<any, { page?: number; limit?: number } | void>({
      query: (params) => {
        const page = typeof params === "object" ? params.page || 1 : 1;
        const limit = typeof params === "object" ? params.limit || 50 : 50;
        return `/stories/audiobooks?page=${page}&limit=${limit}`;
      },
      transformResponse: (res: any) => (res.success ? res : { success: false, data: [] }),
    }),
    getUserActivities: builder.query<any[], number | void>({
      query: (limit = 30) => `/user/activities?limit=${limit}`,
      transformResponse: (res: any) => (res.success ? res.data : []),
    }),
    getUserStreaks: builder.query<any, void>({
      query: () => "/user/streaks",
      transformResponse: (res: any) => (res.success ? res.data : null),
    }),
    pingDailyStreak: builder.mutation<any, number | void>({
      query: (minutesRead = 5) => ({
        url: "/user/streaks/ping",
        method: "POST",
        body: { minutesRead },
      }),
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetStoriesQuery,
  useGetStoriesDashboardQuery,
  useGetAuthorsQuery,
  useGetAuthorBySlugQuery,
  useGetCategoriesQuery,
  useGetCategoryBySlugQuery,
  useGetTagsQuery,
  useGetTagBySlugQuery,
  useGetBookSeriesQuery,
  useGetBookSeriesBySlugQuery,
  useGetNarratorsQuery,
  useGetStoryBySlugQuery,
  useGetChapterContentQuery,
  useSyncStoryProgressMutation,
  useResetStoryProgressMutation,
  useMarkStoryCompletedMutation,
  useToggleStoryBookmarkMutation,
  useAddStoryHighlightMutation,
  useDeleteStoryHighlightMutation,
  useGetStreamTokenQuery,
  useSyncWhispersyncPositionMutation,
  useGetWhispersyncPositionQuery,
  useGetStoryRecommendationsQuery,
  useGetUserLibraryQuery,
  useGetStorySummaryQuery,
  useGetReelsQuery,
  useLikeReelMutation,
  useGetAudiobooksQuery,
  useGetUserActivitiesQuery,
  useGetUserStreaksQuery,
  usePingDailyStreakMutation,
} = storiesApi;
