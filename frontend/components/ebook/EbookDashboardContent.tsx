import React, { useState, useMemo, useCallback, useEffect, useRef } from "react";
import {
  View,
  ScrollView,
  Pressable,
  useWindowDimensions,
  TextInput,
  Image,
  Platform,
} from "react-native";
import { useSelector } from "react-redux";
import { selectIsDark, selectThemeTokens } from "@/redux/features/themeSlice";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { EbookStreakBanner } from "./dashboard/EbookStreakBanner";
import { EbookMiniAudioPlayer } from "./dashboard/EbookMiniAudioPlayer";
import { EbookNotificationsModal } from "./EbookNotificationsModal";
import { EbookSubscriptionModal } from "./EbookSubscriptionModal";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  Easing,
  FadeInUp,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { getLocalizedText } from "@/utils/getLocalizedText";
import { useWebHorizontalDrag } from "@/hooks/useWebHorizontalDrag";
import {
  ArrowLeft,
  Search,
  X,
  BookOpen,
  Sparkles,
  Layers,
  Award,
  Headphones,
  Compass,
  Flame,
  ChevronRight,
  Clock,
  Globe,
  Users,
  FolderGit2,
  Home,
  Tag,
  Heart,
  Brain,
  Baby,
  GraduationCap,
  TrendingUp,
} from "lucide-react-native";
import ProfileNavbarMenu from "./ProfileNavbarMenu";

import { AppText as Text } from "@/components/ui/AppText";
import StoryCard from "./StoryCard";
import ContinueCard from "./ContinueCard";
import {
  useGetStoriesDashboardQuery,
  useGetAuthorsQuery,
  useGetCategoriesQuery,
  useGetTagsQuery,
  useGetBookSeriesQuery,
  DashboardResponse,
  Story,
  EbookAuthor,
  EbookCategory,
  EbookTag,
  BookSeries,
} from "@/api/storiesQuery";

/* ── Types ───────────────────────────────────────────── */

interface Props {
  data?: DashboardResponse | undefined;
  dashboardData?: DashboardResponse | undefined;
  colors?: any;
  onStoryPress?: (slug: string, preferAudio?: boolean) => void;
  insets?: any;
  onBackPress?: () => void;
  onRefresh?: () => void;
}

type CategoryKey =
  | "all"
  | "spanish"
  | "french"
  | "multilingual"
  | "audiobooks"
  | "children"
  | "philosophy"
  | "comedy"
  | "fantasy"
  | "horror"
  | "adventure"
  | "romance"
  | "scifi"
  | "mystery"
  | "thriller"
  | "gothic"
  | "drama"
  | "biography"
  | "nature"
  | "victorian"
  | "russian"
  | "classic"
  | "lovestories"
  | "psychfiction"
  | "beginner"
  | "intermediate"
  | "advanced";

const CATEGORIES: { key: CategoryKey; label: string; icon: any; color: string }[] = [
  { key: "all",          label: "All Books",            icon: Compass,      color: "#0EA5E9" },
  { key: "children",     label: "For Young Readers",    icon: Baby,         color: "#F97316" },
  { key: "audiobooks",   label: "Audiobooks",           icon: Headphones,   color: "#9333EA" },
  { key: "philosophy",   label: "Philosophy & Thought", icon: Sparkles,     color: "#F59E0B" },
  { key: "comedy",       label: "Comedy & Satire",      icon: Flame,        color: "#EF4444" },
  { key: "fantasy",      label: "Fantasy & Magic",      icon: Layers,       color: "#8B5CF6" },
  { key: "horror",       label: "Horror & Weird",       icon: Flame,        color: "#A855F7" },
  { key: "thriller",     label: "Spy & Mystery",        icon: Search,       color: "#3B82F6" },
  { key: "gothic",       label: "Gothic Classics",      icon: Sparkles,     color: "#6366F1" },
  { key: "drama",        label: "Drama & Plays",        icon: BookOpen,     color: "#10B981" },
  { key: "biography",    label: "Biographies & History",icon: Award,        color: "#EC4899" },
  { key: "nature",       label: "Science & Nature",     icon: Compass,      color: "#84CC16" },
  { key: "victorian",    label: "Victorian Classics",   icon: Award,        color: "#EAB308" },
  { key: "russian",      label: "Russian Classics 🇷🇺", icon: Globe,        color: "#DC2626" },
  { key: "french",       label: "French Classics 🇫🇷",  icon: Globe,        color: "#2563EB" },
  { key: "adventure",    label: "High Adventure",       icon: Compass,      color: "#059669" },
  { key: "romance",      label: "Romance",              icon: Heart,        color: "#F43F5E" },
  { key: "lovestories",  label: "Love Stories",         icon: Heart,        color: "#EC4899" },
  { key: "psychfiction", label: "Psychological Fiction",icon: Brain,        color: "#7C3AED" },
  { key: "scifi",        label: "Sci-Fi & Dystopian",   icon: Layers,       color: "#0891B2" },
  { key: "beginner",     label: "Beginner (A1-A2)",     icon: GraduationCap,color: "#10B981" },
  { key: "intermediate", label: "Intermediate (B1-B2)", icon: GraduationCap,color: "#3B82F6" },
  { key: "advanced",     label: "Advanced (C1-C2)",     icon: GraduationCap,color: "#F43F5E" },
];

/* ── Skeleton ────────────────────────────────────────── */

const SkeletonPulse: React.FC<{
  w: number | string;
  h: number;
  r?: number;
  isDark: boolean;
  style?: any;
  delay?: number;
}> = ({ w, h, r = 12, isDark, style, delay = 0 }) => {
  const opacity = useSharedValue(0.3);
  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withRepeat(withTiming(0.75, { duration: 850, easing: Easing.inOut(Easing.ease) }), -1, true)
    );
  }, [delay, opacity]);
  const anim = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return (
    <Animated.View
      style={[
        {
          width: w, height: h, borderRadius: r,
          backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
        },
        anim, style,
      ]}
    />
  );
};

const DashboardSkeleton: React.FC<{ isDark: boolean; insets?: any }> = ({ isDark, insets }) => {
  const topInset = insets?.top ?? 0;
  return (
    <View style={{ paddingTop: Math.max(topInset + 8, 20), paddingBottom: 60 }}>
    <View style={{ paddingHorizontal: 20, gap: 10, marginBottom: 24 }}>
      <SkeletonPulse w="100%" h={180} r={24} isDark={isDark} />
    </View>
    <View style={{ paddingHorizontal: 20, gap: 10, marginBottom: 20 }}>
      <SkeletonPulse w="100%" h={46} r={14} isDark={isDark} delay={80} />
      <View style={{ flexDirection: "row", gap: 8 }}>
        {[80, 95, 110, 90].map((w, i) => (
          <SkeletonPulse key={i} w={w} h={34} r={100} isDark={isDark} delay={i * 50 + 120} />
        ))}
      </View>
    </View>
    <View style={{ flexDirection: "row", gap: 14, paddingHorizontal: 20, flexWrap: "wrap" }}>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <SkeletonPulse key={i} w="47%" h={220} r={14} isDark={isDark} delay={i * 60 + 180} />
      ))}
    </View>
  </View>
);
};

/* ── Stat Badge (used in hero) ───────────────────────── */

const StatBadge: React.FC<{ icon: any; label: string }> = ({ icon: Icon, label }) => (
  <View
    style={{
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "rgba(255,255,255,0.1)",
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 100,
      gap: 5,
    }}
  >
    <Icon size={11} color="rgba(255,255,255,0.65)" />
    <Text weight="Medium" style={{ color: "rgba(255,255,255,0.82)", fontSize: 11 }}>
      {label}
    </Text>
  </View>
);

/* ── Activity Card Rail ────────────────────────────────────────── */

const ActivityCardRail: React.FC<{
  title: string;
  icon: any;
  color: string;
  stories: Story[];
  variant: "reading" | "listening" | "visit";
  onStoryPress: (slug: string, preferAudio?: boolean) => void;
  textColor: string;
}> = ({ title, icon: Icon, color, stories, variant, onStoryPress, textColor }) => {
  const scrollRef = useRef<any>(null);
  const dragProps = useWebHorizontalDrag(scrollRef);
  if (!stories || stories.length === 0) return null;

  return (
    <View style={{ marginBottom: 28 }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, marginBottom: 12 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: color + "20", alignItems: "center", justifyContent: "center" }}>
            <Icon size={15} color={color} />
          </View>
          <Text weight="Bold" style={{ fontSize: 18, color: textColor, letterSpacing: -0.3 }}>
            {title}
          </Text>
        </View>
      </View>

      <ScrollView ref={scrollRef} {...dragProps} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
        {stories.map((story) => (
          <ContinueCard key={story._id} story={story} onPress={onStoryPress} variant={variant} />
        ))}
      </ScrollView>
    </View>
  );
};

/* ── Section Rail ────────────────────────────────────── */

interface SectionRailProps {
  title: string;
  color?: string;
  stories: Story[];
  onStoryPress: (slug: string) => void;
  onSeeAllPress?: () => void;
  isDark: boolean;
  textColor: string;
}

const SectionRail: React.FC<SectionRailProps> = ({
  title,
  color = "#0EA5E9",
  stories,
  onStoryPress,
  onSeeAllPress,
  isDark,
  textColor,
}) => {
  const scrollRef = useRef<any>(null);
  const dragProps = useWebHorizontalDrag(scrollRef);
  if (!stories || stories.length === 0) return null;

  return (
    <View style={{ marginBottom: 36 }}>
      {/* Header */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, marginBottom: 14 }}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <View style={{ width: 3, height: 20, borderRadius: 1.5, backgroundColor: color, marginRight: 10 }} />
          <Text weight="Bold" style={{ fontSize: 17, letterSpacing: -0.3, color: textColor }}>
            {title}
          </Text>
        </View>
        {onSeeAllPress ? (
          <Pressable
            onPress={onSeeAllPress}
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1, flexDirection: "row", alignItems: "center", gap: 2 })}
          >
            <Text weight="SemiBold" style={{ fontSize: 13, color }}>See all</Text>
            <ChevronRight size={14} color={color} />
          </Pressable>
        ) : (
          <Text weight="Regular" style={{ fontSize: 12, color: isDark ? "#475569" : "#94A3B8" }}>
            {stories.length} books
          </Text>
        )}
      </View>

      <ScrollView
        ref={scrollRef}
        {...dragProps}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
      >
        {stories.map((story) => (
          <View key={story._id} style={{ width: 148 }}>
            <StoryCard story={story} onPress={onStoryPress} variant="standard" />
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

/* ── Main Component ──────────────────────────────────── */

const EbookDashboardContent: React.FC<Props> = ({
  data: propData,
  dashboardData,
  onStoryPress,
  insets,
  onBackPress,
}) => {
  const router = useRouter();
  const hookInsets = useSafeAreaInsets();
  const safeInsets = insets || hookInsets || { top: 0, bottom: 0, left: 0, right: 0 };
  const isDark = useSelector(selectIsDark);
  const tokens = useSelector(selectThemeTokens);
  const { width } = useWindowDimensions();
  const maxW = Math.min(width, 1200);

  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<CategoryKey>("all");
  const [searchFocused, setSearchFocused] = useState(false);
  const [activeNavTab, setActiveNavTab] = useState<"home" | "authors" | "categories" | "tags" | "top100" | "series">("home");
  const [authorSearch, setAuthorSearch] = useState("");
  const [tagSearch, setTagSearch] = useState("");
  const [top100Search, setTop100Search] = useState("");
  const [seriesSearch, setSeriesSearch] = useState("");
  const [selectedAuthor, setSelectedAuthor] = useState<EbookAuthor | null>(null);
  const [isNotifModalOpen, setIsNotifModalOpen] = useState(false);
  const [isSubModalOpen, setIsSubModalOpen] = useState(false);

  const { data: authorsData = [] } = useGetAuthorsQuery();
  const { data: categoriesData = [] } = useGetCategoriesQuery();
  const { data: tagsData = [] } = useGetTagsQuery();
  const { data: seriesData = [] } = useGetBookSeriesQuery();

  const handleBack = useCallback(() => {
    if (onBackPress) {
      onBackPress();
    } else if (router.canGoBack()) {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace("/");
      }
    } else {
      router.push("/home");
    }
  }, [onBackPress, router]);

  const data = useMemo(() => {
    const raw = propData || dashboardData;
    if (!raw) return null;
    return (raw as any).data ? (raw as any).data : raw;
  }, [propData, dashboardData]);

  const continueStory = useMemo(() => data?.recentlyRead?.[0] ?? null, [data]);

  const featuredCovers = useMemo(() => {
    return (data?.newest || [])
      .filter((s) => !!s.coverImageUrl)
      .slice(0, 3)
      .map((s) => ({ ...s, coverImageUrl: s.coverImageUrl?.replace(/^http:\/\//, "https://") }));
  }, [data]);

  const allStories = useMemo(() => {
    if (!data) return [];
    if (data.allPublished && Array.isArray(data.allPublished) && data.allPublished.length > 0) {
      return data.allPublished;
    }
    const map = new Map<string, Story>();
    const add = (list?: Story[]) => list?.forEach((s) => (s._id || s.slug) && map.set(s._id || s.slug, s));
    add(data.topFeatured);
    add(data.recentlyRead);
    add(data.newest);
    add(data.audiobooks);
    add(data.byLevel?.beginner);
    add(data.byLevel?.intermediate);
    add(data.byLevel?.advanced);
    if (data.byGenre) {
      Object.values(data.byGenre).forEach((list: any) => add(list));
    }
    return Array.from(map.values());
  }, [data]);

  const categoryStories = useMemo(() => {
    if (!data) return allStories;
    const matchTag = (s: any, tagStr: string) =>
      s.tags?.some((t: any) => getLocalizedText(t).toLowerCase().includes(tagStr));

    if (activeCategory === "all") return allStories;
    if (activeCategory === "spanish") return allStories.filter((s) => s.languages?.includes("es"));
    if (activeCategory === "french") return allStories.filter((s) => s.languages?.includes("fr"));
    if (activeCategory === "multilingual") return allStories.filter((s) => s.languages && s.languages.length > 1);
    if (activeCategory === "audiobooks") return data.audiobooks || allStories.filter((s) => s.contentType === "audiobook" || s.contentType === "both");
    if (activeCategory === "children") return data.byGenre?.children || allStories.filter((s) => matchTag(s, "children") || matchTag(s, "fairy tale") || matchTag(s, "young"));
    if (activeCategory === "lovestories") return data.byGenre?.loveStories || allStories.filter((s) => matchTag(s, "love stories") || matchTag(s, "romance"));
    if (activeCategory === "psychfiction") return data.byGenre?.psychFiction || allStories.filter((s) => matchTag(s, "psychological"));
    if (activeCategory === "beginner") return data.byLevel?.beginner || [];
    if (activeCategory === "intermediate") return data.byLevel?.intermediate || [];
    if (activeCategory === "advanced") return data.byLevel?.advanced || [];

    if (activeCategory === "philosophy") return data.byGenre?.philosophy || allStories.filter((s) => matchTag(s, "philosophy") || matchTag(s, "stoicism") || matchTag(s, "ethics"));
    if (activeCategory === "comedy") return data.byGenre?.comedy || allStories.filter((s) => matchTag(s, "comedy") || matchTag(s, "humor") || matchTag(s, "satire"));
    if (activeCategory === "fantasy") return data.byGenre?.fantasy || allStories.filter((s) => matchTag(s, "fantasy"));
    if (activeCategory === "horror") return data.byGenre?.horror || allStories.filter((s) => matchTag(s, "horror") || matchTag(s, "weird"));
    if (activeCategory === "thriller") return data.byGenre?.thriller || allStories.filter((s) => matchTag(s, "thriller") || matchTag(s, "spy") || matchTag(s, "detective") || matchTag(s, "mystery"));
    if (activeCategory === "gothic") return data.byGenre?.gothic || allStories.filter((s) => matchTag(s, "gothic"));
    if (activeCategory === "drama") return data.byGenre?.drama || allStories.filter((s) => matchTag(s, "drama") || matchTag(s, "play"));
    if (activeCategory === "biography") return data.byGenre?.biography || allStories.filter((s) => matchTag(s, "biography") || matchTag(s, "memoir") || matchTag(s, "history"));
    if (activeCategory === "nature") return data.byGenre?.nature || allStories.filter((s) => matchTag(s, "nature") || matchTag(s, "science"));
    if (activeCategory === "victorian") return data.byGenre?.victorian || allStories.filter((s) => matchTag(s, "victorian"));
    if (activeCategory === "russian") return data.byGenre?.russian || allStories.filter((s) => matchTag(s, "russian"));
    if (activeCategory === "adventure") return data.byGenre?.adventure || allStories.filter((s) => matchTag(s, "adventure") || matchTag(s, "sea"));
    if (activeCategory === "romance") return data.byGenre?.romance || allStories.filter((s) => matchTag(s, "romance"));
    if (activeCategory === "scifi") return data.byGenre?.scifi || allStories.filter((s) => matchTag(s, "sci-fi") || matchTag(s, "scifi") || matchTag(s, "dystopian"));
    if (activeCategory === "mystery") return data.byGenre?.mystery || allStories.filter((s) => matchTag(s, "mystery"));
    if (activeCategory === "classic") return data.byGenre?.classic || allStories.filter((s) => matchTag(s, "classic"));
    return allStories;
  }, [data, activeCategory, allStories]);

  const displayStories = useMemo(() => {
    if (!searchQuery.trim()) return categoryStories;
    const q = searchQuery.toLowerCase().trim();
    return allStories.filter(
      (s) =>
        getLocalizedText(s.title).toLowerCase().includes(q) ||
        (s.author && s.author.toLowerCase().includes(q)) ||
        (s.tags && s.tags.some((t) => getLocalizedText(t).toLowerCase().includes(q)))
    );
  }, [categoryStories, allStories, searchQuery]);

  const spanishStories = useMemo(() => allStories.filter((s) => s.languages?.includes("es")), [allStories]);
  const frenchStories = useMemo(() => allStories.filter((s) => s.languages?.includes("fr")), [allStories]);
  const multilingualStories = useMemo(() => allStories.filter((s) => s.languages && s.languages.length > 1), [allStories]);
  const childrenStories = useMemo(() => data?.byGenre?.children || allStories.filter((s) => s.tags?.some((t) => /children|fairy tale|young readers/i.test(t))), [data, allStories]);
  const loveStoriesStories = useMemo(() => data?.byGenre?.loveStories || allStories.filter((s) => s.tags?.some((t) => /love stories|love story/i.test(t))), [data, allStories]);
  const psychFictionStories = useMemo(() => data?.byGenre?.psychFiction || allStories.filter((s) => s.tags?.some((t) => /psychological/i.test(t))), [data, allStories]);
  const beginnerStories = useMemo(() => data?.byLevel?.beginner || [], [data]);
  const intermediateStories = useMemo(() => data?.byLevel?.intermediate || [], [data]);
  const advancedStories = useMemo(() => data?.byLevel?.advanced || [], [data]);

  if (!data) return <DashboardSkeleton isDark={isDark} insets={safeInsets} />;

  const surfaceBg = isDark ? "#080E1A" : "#F5F6FA";
  const textColor = isDark ? "#F1F5F9" : "#0F172A";
  const textSubColor = isDark ? "#64748B" : "#94A3B8";
  const accentColor = tokens.accentPrimary || "#0EA5E9";
  const isSectionRailMode = activeCategory === "all" && !searchQuery.trim();

  /* Cover fan positions */
  const FAN_OFFSETS = [
    { left: 0, top: 14, rotate: "-10deg", opacity: 0.55, zIndex: 1 },
    { left: 22, top: 4, rotate: "3deg",  opacity: 0.78, zIndex: 2 },
    { left: 10, top: 22, rotate: "-2deg", opacity: 1,   zIndex: 3 },
  ];

  return (
    <View style={{ flex: 1, width: "100%", height: "100%", backgroundColor: surfaceBg }}>
      <ScrollView
        showsVerticalScrollIndicator={true}
        style={{ flex: 1, width: "100%", height: "100%" }}
        contentContainerStyle={{
          paddingTop: Math.max((safeInsets?.top ?? 0) + 4, 12),
          paddingBottom: Math.max((safeInsets?.bottom ?? 0) + 48, 56),
        }}
      >
        <View style={{ width: "100%", maxWidth: maxW, alignSelf: "center" }}>
        {/* ── 1. Professional Nav Bar ─────────────────────────────────── */}
        <Animated.View
          entering={FadeInUp.duration(350)}
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 20,
            marginBottom: 20,
            gap: 16,
            width: "100%",
          }}
        >
          {/* ── Liiro Branding Logo ────────────────────────── */}
          <Pressable
            onPress={() => router.push("/")}
            style={({ pressed }) => ({
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
              flexShrink: 0,
              opacity: pressed ? 0.8 : 1,
            })}
            accessibilityLabel="Liiro Ebook Home"
          >
            <LinearGradient
              colors={["#0EA5E9", "#6366F1"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <BookOpen size={19} color="#FFFFFF" strokeWidth={2.5} />
            </LinearGradient>

            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Text weight="Bold" style={{ fontSize: 22, color: textColor, letterSpacing: -0.6 }}>
                Liiro
              </Text>
              <View
                style={{
                  paddingHorizontal: 7,
                  paddingVertical: 2,
                  borderRadius: 6,
                  backgroundColor: isDark ? "rgba(14, 165, 233, 0.15)" : "rgba(14, 165, 233, 0.10)",
                  borderWidth: 1,
                  borderColor: "rgba(14, 165, 233, 0.3)",
                }}
              >
                <Text weight="Bold" style={{ fontSize: 10, color: "#0EA5E9", letterSpacing: 0.5 }}>
                  EBOOK
                </Text>
              </View>
            </View>
          </Pressable>

          {/* Navigation Tabs Container */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flex: 1, justifyContent: "flex-end" }}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ flexShrink: 1 }}
              contentContainerStyle={{
                flexDirection: "row",
                alignItems: "center",
                padding: 4,
                borderRadius: 100,
                backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(15,23,42,0.05)",
                borderWidth: 1,
                borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
                gap: 4,
              }}
            >
              <Pressable
                onPress={() => setActiveNavTab("home")}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingHorizontal: 14,
                  paddingVertical: 7,
                  borderRadius: 100,
                  backgroundColor: activeNavTab === "home" ? accentColor : "transparent",
                  gap: 6,
                }}
              >
                <Home size={13} color={activeNavTab === "home" ? "#FFFFFF" : textSubColor} />
                <Text weight="SemiBold" style={{ fontSize: 12.5, color: activeNavTab === "home" ? "#FFFFFF" : textColor }}>
                  Home
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setActiveNavTab("authors")}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingHorizontal: 14,
                  paddingVertical: 7,
                  borderRadius: 100,
                  backgroundColor: activeNavTab === "authors" ? accentColor : "transparent",
                  gap: 6,
                }}
              >
                <Users size={13} color={activeNavTab === "authors" ? "#FFFFFF" : textSubColor} />
                <Text weight="SemiBold" style={{ fontSize: 12.5, color: activeNavTab === "authors" ? "#FFFFFF" : textColor }}>
                  Authors ({authorsData.length})
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setActiveNavTab("categories")}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingHorizontal: 14,
                  paddingVertical: 7,
                  borderRadius: 100,
                  backgroundColor: activeNavTab === "categories" ? accentColor : "transparent",
                  gap: 6,
                }}
              >
                <FolderGit2 size={13} color={activeNavTab === "categories" ? "#FFFFFF" : textSubColor} />
                <Text weight="SemiBold" style={{ fontSize: 12.5, color: activeNavTab === "categories" ? "#FFFFFF" : textColor }}>
                  Categories ({categoriesData.length})
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setActiveNavTab("tags")}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingHorizontal: 14,
                  paddingVertical: 7,
                  borderRadius: 100,
                  backgroundColor: activeNavTab === "tags" ? accentColor : "transparent",
                  gap: 6,
                }}
              >
                <Tag size={13} color={activeNavTab === "tags" ? "#FFFFFF" : textSubColor} />
                <Text weight="SemiBold" style={{ fontSize: 12.5, color: activeNavTab === "tags" ? "#FFFFFF" : textColor }}>
                  Tags ({tagsData.length})
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setActiveNavTab("top100")}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingHorizontal: 14,
                  paddingVertical: 7,
                  borderRadius: 100,
                  backgroundColor: activeNavTab === "top100" ? "#F59E0B" : "transparent",
                  gap: 6,
                }}
              >
                <Sparkles size={13} color={activeNavTab === "top100" ? "#FFFFFF" : "#F59E0B"} />
                <Text weight="Bold" style={{ fontSize: 12.5, color: activeNavTab === "top100" ? "#FFFFFF" : textColor }}>
                  Top 100 Picks ⭐
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setActiveNavTab("series")}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingHorizontal: 14,
                  paddingVertical: 7,
                  borderRadius: 100,
                  backgroundColor: activeNavTab === "series" ? "#8B5CF6" : "transparent",
                  gap: 6,
                }}
              >
                <Layers size={13} color={activeNavTab === "series" ? "#FFFFFF" : "#8B5CF6"} />
                <Text weight="Bold" style={{ fontSize: 12.5, color: activeNavTab === "series" ? "#FFFFFF" : textColor }}>
                  Book Series ({seriesData.length}) 📚
                </Text>
              </Pressable>

              <Pressable
                onPress={() => router.push("/ebook/explore")}
                style={({ pressed }) => ({
                  flexDirection: "row",
                  alignItems: "center",
                  paddingHorizontal: 14,
                  paddingVertical: 7,
                  borderRadius: 100,
                  backgroundColor: "transparent",
                  gap: 6,
                  opacity: pressed ? 0.6 : 1,
                })}
              >
                <Compass size={13} color={accentColor} />
                <Text weight="Bold" style={{ fontSize: 12.5, color: accentColor }}>
                  Explore All
                </Text>
                <ChevronRight size={13} color={accentColor} />
              </Pressable>
            </ScrollView>

            {/* Pinned Profile Avatar Menu (Never Clipped) */}
            <ProfileNavbarMenu />
          </View>
        </Animated.View>

        {activeNavTab === "authors" ? (
          /* ── AUTHORS VIEW ────────────────────────────────────────── */
          <Animated.View entering={FadeInUp.duration(350)} style={{ paddingHorizontal: 16 }}>
            <View style={{ marginBottom: 16 }}>
              <Text weight="Bold" style={{ fontSize: 22, color: textColor, marginBottom: 4 }}>
                Classic Authors Directory
              </Text>
              <Text style={{ fontSize: 13, color: textSubColor }}>
                Browse {authorsData.length} master authors and their complete literary collections
              </Text>
            </View>

            {/* Author Search Bar */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: 16,
                paddingVertical: 12,
                borderRadius: 16,
                backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "#FFFFFF",
                borderWidth: 1,
                borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
                marginBottom: 20,
              }}
            >
              <Search size={16} color={textSubColor} />
              <TextInput
                placeholder="Search authors (e.g. Maurice Leblanc, H. Rider Haggard, Jane Austen)…"
                placeholderTextColor={textSubColor}
                value={authorSearch}
                onChangeText={setAuthorSearch}
                style={{ flex: 1, fontSize: 14, color: textColor, marginLeft: 10, padding: 0 }}
              />
              {authorSearch.length > 0 && (
                <Pressable onPress={() => setAuthorSearch("")}>
                  <X size={14} color={textSubColor} />
                </Pressable>
              )}
            </View>

            {/* Authors Grid */}
            <View style={{ flexDirection: "row", flexWrap: "wrap", marginHorizontal: -6 }}>
              {authorsData
                .filter((a) => a.name.toLowerCase().includes(authorSearch.toLowerCase().trim()))
                .map((author) => {
                  const isSelected = selectedAuthor?.slug === author.slug;
                  const cols = width >= 1024 ? 3 : width >= 640 ? 2 : 1;
                  return (
                    <View key={author._id} style={{ width: `${100 / cols}%`, paddingHorizontal: 6, paddingBottom: 14 }}>
                      <Pressable
                        onPress={() => router.push(`/ebook/author/${author.slug}`)}
                        style={({ pressed }) => ({
                          padding: 16,
                          borderRadius: 20,
                          backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "#FFFFFF",
                          borderWidth: 1,
                          borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
                          opacity: pressed ? 0.8 : 1,
                        })}
                      >
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                          <View
                            style={{
                              width: 44,
                              height: 44,
                              borderRadius: 22,
                              backgroundColor: accentColor + "25",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <Text weight="Bold" style={{ color: accentColor, fontSize: 16 }}>
                              {author.name.charAt(0)}
                            </Text>
                          </View>

                          <View style={{ flex: 1 }}>
                            <Text weight="Bold" style={{ fontSize: 15, color: textColor }} numberOfLines={1}>
                              {author.name}
                            </Text>
                            <Text style={{ fontSize: 12, color: textSubColor, marginTop: 2 }}>
                              {author.bookCount} {author.bookCount === 1 ? "Masterwork" : "Masterworks"}
                            </Text>
                          </View>

                          <ChevronRight size={16} color={textSubColor} />
                        </View>
                      </Pressable>
                    </View>
                  );
                })}
            </View>
          </Animated.View>
        ) : activeNavTab === "categories" ? (
          /* ── CATEGORIES VIEW ─────────────────────────────────────── */
          <Animated.View entering={FadeInUp.duration(350)} style={{ paddingHorizontal: 16 }}>
            <View style={{ marginBottom: 16 }}>
              <Text weight="Bold" style={{ fontSize: 22, color: textColor, marginBottom: 4 }}>
                Browse by Category & Genre
              </Text>
              <Text style={{ fontSize: 13, color: textSubColor }}>
                Explore {categoriesData.length} curated literary genres
              </Text>
            </View>

            <View style={{ flexDirection: "row", flexWrap: "wrap", marginHorizontal: -6 }}>
              {categoriesData.map((cat) => {
                const cols = width >= 1024 ? 3 : width >= 640 ? 2 : 1;
                return (
                  <View key={cat._id} style={{ width: `${100 / cols}%`, paddingHorizontal: 6, paddingBottom: 14 }}>
                    <Pressable
                      onPress={() => router.push(`/ebook/category/${cat.slug}`)}
                      style={({ pressed }) => ({
                        padding: 20,
                        borderRadius: 22,
                        backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "#FFFFFF",
                        borderWidth: 1,
                        borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
                        gap: 12,
                        opacity: pressed ? 0.8 : 1,
                      })}
                    >
                      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                        <View
                          style={{
                            width: 44,
                            height: 44,
                            borderRadius: 22,
                            backgroundColor: (cat.color || "#0EA5E9") + "20",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <BookOpen size={20} color={cat.color || "#0EA5E9"} />
                        </View>

                        <View
                          style={{
                            paddingHorizontal: 10,
                            paddingVertical: 4,
                            borderRadius: 100,
                            backgroundColor: (cat.color || "#0EA5E9") + "15",
                          }}
                        >
                          <Text weight="Bold" style={{ fontSize: 11, color: cat.color || "#0EA5E9" }}>
                            {cat.bookCount} Books
                          </Text>
                        </View>
                      </View>

                      <View>
                        <Text weight="Bold" style={{ fontSize: 17, color: textColor, marginBottom: 2 }}>
                          {cat.name}
                        </Text>
                        <Text style={{ fontSize: 12.5, color: textSubColor }}>
                          Explore {cat.bookCount} masterworks in {cat.name}
                        </Text>
                      </View>

                      <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                        <Text weight="Bold" style={{ fontSize: 12, color: cat.color || "#0EA5E9" }}>
                          View Collection
                        </Text>
                        <ChevronRight size={13} color={cat.color || "#0EA5E9"} />
                      </View>
                    </Pressable>
                  </View>
                );
              })}
            </View>
          </Animated.View>
        ) : activeNavTab === "tags" ? (
          /* ── TAGS DIRECTORY VIEW ─────────────────────────────────── */
          <Animated.View entering={FadeInUp.duration(350)} style={{ paddingHorizontal: 16 }}>
            <View style={{ marginBottom: 16 }}>
              <Text weight="Bold" style={{ fontSize: 22, color: textColor, marginBottom: 4 }}>
                Literary Tags & Topics Directory
              </Text>
              <Text style={{ fontSize: 13, color: textSubColor }}>
                Browse {tagsData.length} searchable literary tags and subjects across the library
              </Text>
            </View>

            {/* Tag Search Bar */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: 16,
                paddingVertical: 12,
                borderRadius: 16,
                backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "#FFFFFF",
                borderWidth: 1,
                borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
                marginBottom: 20,
              }}
            >
              <Search size={16} color={textSubColor} />
              <TextInput
                placeholder="Search tags (e.g. gothic, detective, sci-fi, time-travel, satire)…"
                placeholderTextColor={textSubColor}
                value={tagSearch}
                onChangeText={setTagSearch}
                style={{ flex: 1, fontSize: 14, color: textColor, marginLeft: 10, padding: 0 }}
              />
              {tagSearch.length > 0 && (
                <Pressable onPress={() => setTagSearch("")}>
                  <X size={14} color={textSubColor} />
                </Pressable>
              )}
            </View>

            {/* Tag Pills Cloud */}
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
              {tagsData
                .filter((t) => t.name.toLowerCase().includes(tagSearch.toLowerCase().trim()))
                .map((tag) => (
                  <Pressable
                    key={tag._id}
                    onPress={() => router.push(`/ebook/explore?search=${encodeURIComponent(tag.name)}`)}
                    style={({ pressed }) => ({
                      flexDirection: "row",
                      alignItems: "center",
                      paddingHorizontal: 14,
                      paddingVertical: 8,
                      borderRadius: 100,
                      backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "#FFFFFF",
                      borderWidth: 1,
                      borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)",
                      gap: 6,
                      opacity: pressed ? 0.7 : 1,
                    })}
                  >
                    <Tag size={12} color={accentColor} />
                    <Text weight="Bold" style={{ fontSize: 13, color: textColor }}>
                      #{tag.name}
                    </Text>
                    <View
                      style={{
                        paddingHorizontal: 8,
                        paddingVertical: 2,
                        borderRadius: 100,
                        backgroundColor: accentColor + "20",
                      }}
                    >
                      <Text weight="Bold" style={{ fontSize: 11, color: accentColor }}>
                        {tag.bookCount}
                      </Text>
                    </View>
                  </Pressable>
                ))}
            </View>
          </Animated.View>
        ) : activeNavTab === "top100" ? (
          /* ── TOP 100 PICKS VIEW ──────────────────────────────────── */
          <Animated.View entering={FadeInUp.duration(350)} style={{ paddingHorizontal: 16 }}>
            <View style={{ marginBottom: 20 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <Sparkles size={20} color="#F59E0B" />
                <Text weight="Bold" style={{ fontSize: 24, color: textColor, letterSpacing: -0.4 }}>
                  Top 100 Masterwork Picks
                </Text>
              </View>
              <Text style={{ fontSize: 13, color: textSubColor, lineHeight: 18 }}>
                Curated collection of the 100 most iconic classics, masterworks, and world literature
              </Text>
            </View>

            {/* Top 100 Search Bar */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: 16,
                paddingVertical: 12,
                borderRadius: 16,
                backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "#FFFFFF",
                borderWidth: 1,
                borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
                marginBottom: 20,
              }}
            >
              <Search size={16} color="#F59E0B" />
              <TextInput
                placeholder="Search Top 100 Masterworks (e.g. Alice, Dracula, Gatsby, Sherlock)…"
                placeholderTextColor={textSubColor}
                value={top100Search}
                onChangeText={setTop100Search}
                style={{
                  flex: 1,
                  marginLeft: 10,
                  fontSize: 14,
                  color: textColor,
                  padding: 0,
                }}
              />
              {top100Search.length > 0 && (
                <Pressable onPress={() => setTop100Search("")}>
                  <X size={15} color={textSubColor} />
                </Pressable>
              )}
            </View>

            {/* Top 100 Grid */}
            <View style={{ flexDirection: "row", flexWrap: "wrap", marginHorizontal: -6 }}>
              {(data?.topFeatured || [])
                .filter((s) => {
                  if (!top100Search.trim()) return true;
                  const query = top100Search.toLowerCase();
                  const title = getLocalizedText(s.title).toLowerCase();
                  const author = (s.author || "").toLowerCase();
                  return title.includes(query) || author.includes(query);
                })
                .map((story, idx) => {
                  const cols = width >= 1024 ? 5 : width >= 768 ? 4 : width >= 480 ? 3 : 2;
                  return (
                    <View key={story._id} style={{ width: `${100 / cols}%`, paddingHorizontal: 6, paddingBottom: 16 }}>
                      <StoryCard story={story} onPress={onStoryPress} variant="standard" />
                    </View>
                  );
                })}
            </View>
          </Animated.View>
        ) : activeNavTab === "series" ? (
          /* ── BOOK SERIES VIEW ─────────────────────────────────────── */
          <Animated.View entering={FadeInUp.duration(350)} style={{ paddingHorizontal: 16 }}>
            <View style={{ marginBottom: 20 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <Layers size={20} color="#8B5CF6" />
                <Text weight="Bold" style={{ fontSize: 24, color: textColor, letterSpacing: -0.4 }}>
                  Curated Book Series & Sagas
                </Text>
              </View>
              <Text style={{ fontSize: 13, color: textSubColor, lineHeight: 18 }}>
                Explore {seriesData.length} iconic literary sagas and grouped masterwork collections
              </Text>
            </View>

            {/* Series Search Bar */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: 16,
                paddingVertical: 12,
                borderRadius: 16,
                backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "#FFFFFF",
                borderWidth: 1,
                borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
                marginBottom: 20,
              }}
            >
              <Search size={16} color="#8B5CF6" />
              <TextInput
                placeholder="Search Book Series (e.g. Sherlock, Oz, Barsoom, Tarzan, Jeeves)…"
                placeholderTextColor={textSubColor}
                value={seriesSearch}
                onChangeText={setSeriesSearch}
                style={{
                  flex: 1,
                  marginLeft: 10,
                  fontSize: 14,
                  color: textColor,
                  padding: 0,
                }}
              />
              {seriesSearch.length > 0 && (
                <Pressable onPress={() => setSeriesSearch("")}>
                  <X size={15} color={textSubColor} />
                </Pressable>
              )}
            </View>

            {/* Series Cards */}
            <View style={{ flexDirection: "row", flexWrap: "wrap", marginHorizontal: -6 }}>
              {seriesData
                .filter((s) => {
                  if (!seriesSearch.trim()) return true;
                  const query = seriesSearch.toLowerCase();
                  const title = getLocalizedText(s.title).toLowerCase();
                  const author = (s.author || "").toLowerCase();
                  return title.includes(query) || author.includes(query);
                })
                .map((series) => {
                  const cols = width >= 1024 ? 3 : width >= 640 ? 2 : 1;
                  return (
                    <View key={series._id} style={{ width: `${100 / cols}%`, paddingHorizontal: 6, paddingBottom: 16 }}>
                      <View
                        style={{
                          padding: 20,
                          borderRadius: 22,
                          backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "#FFFFFF",
                          borderWidth: 1,
                          borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
                          gap: 14,
                        }}
                      >
                        <View style={{ flexDirection: "row", gap: 14, alignItems: "center" }}>
                          {series.coverImageUrl ? (
                            <Image
                              source={{ uri: series.coverImageUrl }}
                              style={{ width: 60, height: 86, borderRadius: 10 }}
                              resizeMode="cover"
                            />
                          ) : (
                            <View
                              style={{
                                width: 60,
                                height: 86,
                                borderRadius: 10,
                                backgroundColor: "#8B5CF620",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <Layers size={24} color="#8B5CF6" />
                            </View>
                          )}

                          <View style={{ flex: 1 }}>
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 }}>
                              <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 100, backgroundColor: "rgba(139, 92, 246, 0.15)" }}>
                                <Text weight="Bold" style={{ fontSize: 10, color: "#8B5CF6" }}>
                                  {series.bookCount} {series.bookCount === 1 ? "Book" : "Books"}
                                </Text>
                              </View>
                            </View>
                            <Text weight="Bold" style={{ fontSize: 16, color: textColor, marginBottom: 2 }} numberOfLines={1}>
                              {getLocalizedText(series.title)}
                            </Text>
                            <Text style={{ fontSize: 12, color: textSubColor }} numberOfLines={1}>
                              by {series.author}
                            </Text>
                          </View>
                        </View>

                        {series.description ? (
                          <Text style={{ fontSize: 12.5, color: textSubColor, lineHeight: 17 }} numberOfLines={2}>
                            {getLocalizedText(series.description)}
                          </Text>
                        ) : null}

                        {/* Series Books horizontal preview */}
                        {series.books && series.books.length > 0 && (
                          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                            {series.books.map((b) => (
                              <Pressable
                                key={b._id}
                                onPress={() => onStoryPress(b.slug)}
                                style={({ pressed }) => ({
                                  flexDirection: "row",
                                  alignItems: "center",
                                  gap: 6,
                                  paddingHorizontal: 10,
                                  paddingVertical: 5,
                                  borderRadius: 8,
                                  backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
                                  opacity: pressed ? 0.7 : 1,
                                })}
                              >
                                <BookOpen size={11} color="#8B5CF6" />
                                <Text weight="Medium" style={{ fontSize: 11, color: textColor }} numberOfLines={1}>
                                  {getLocalizedText(b.title)}
                                </Text>
                              </Pressable>
                            ))}
                          </ScrollView>
                        )}
                      </View>
                    </View>
                  );
                })}
            </View>
          </Animated.View>
        ) : (
          /* ── HOME DASHBOARD VIEW ──────────────────────────────────── */
          <View style={{ width: "100%" }}>
        {/* Daily Reading Streak & Goal Banner */}
        <Animated.View entering={FadeInUp.delay(30).duration(400)} style={{ paddingHorizontal: 16 }}>
          <EbookStreakBanner
            currentStreak={7}
            xpScore={450}
            dailyGoalMinutes={15}
            completedMinutesToday={12}
            isDark={isDark}
            onPressDetails={() => {}}
          />
        </Animated.View>

        {/* ── 2. Editorial Hero ──────────────────────────── */}
        <Animated.View entering={FadeInUp.delay(60).duration(480)} style={{ paddingHorizontal: 16, marginBottom: 24 }}>
          <LinearGradient
            colors={["#0A1628", "#12233E", "#162B4E"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ borderRadius: 28, padding: 28, overflow: "hidden", minHeight: 190 }}
          >
            {/* Ambient glow */}
            <View
              style={{
                position: "absolute",
                top: -60,
                right: 30,
                width: 220,
                height: 220,
                borderRadius: 110,
                backgroundColor: "rgba(56,189,248,0.07)",
              }}
            />
            <View
              style={{
                position: "absolute",
                bottom: -40,
                left: -30,
                width: 160,
                height: 160,
                borderRadius: 80,
                backgroundColor: "rgba(99,102,241,0.06)",
              }}
            />

            <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" }}>
              {/* Left: text */}
              <View style={{ flex: 1, paddingRight: 8 }}>
                {/* Eyebrow Greeting */}
                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
                  <View style={{ width: 18, height: 2, borderRadius: 1, backgroundColor: "#38BDF8", marginRight: 8 }} />
                  <Text weight="Bold" style={{ color: "#38BDF8", fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase" }}>
                    Good afternoon, Reader! 👋
                  </Text>
                </View>

                {/* Headline */}
                <Text weight="Bold" style={{ color: "#FFFFFF", fontSize: 26, lineHeight: 33, letterSpacing: -0.6, marginBottom: 14 }}>
                  Discover &{"\n"}Read World{"\n"}Classics
                </Text>

                {/* Explore All CTA Button */}
                <Pressable
                  onPress={() => router.push("/ebook/explore")}
                  style={({ pressed }) => ({
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: "#38BDF8",
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                    borderRadius: 100,
                    alignSelf: "flex-start",
                    marginBottom: 16,
                    gap: 6,
                    opacity: pressed ? 0.85 : 1,
                  })}
                >
                  <Compass size={14} color="#0F172A" />
                  <Text weight="Bold" style={{ color: "#0F172A", fontSize: 13 }}>
                    Explore All {allStories.length}+ Books
                  </Text>
                  <ChevronRight size={14} color="#0F172A" />
                </Pressable>

                {/* Stat badges */}
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 7 }}>
                  <StatBadge icon={BookOpen}   label={`${allStories.length}+ Books`} />
                  <StatBadge icon={Headphones} label="Audio Included" />
                  <StatBadge icon={Award}      label="A1 – C2" />
                </View>
              </View>

              {/* Right: fanned book covers */}
              {featuredCovers.length >= 2 && (
                <View style={{ width: 110, height: 160, position: "relative", marginLeft: 4 }}>
                  {featuredCovers.slice(0, 3).map((book, i) => {
                    const fan = FAN_OFFSETS[i];
                    return (
                      <Image
                        key={book._id}
                        source={{ uri: book.coverImageUrl }}
                        style={{
                          position: "absolute",
                          width: 68,
                          height: 92,
                          borderRadius: 9,
                          left: fan.left,
                          top: fan.top,
                          opacity: fan.opacity,
                          zIndex: fan.zIndex,
                          transform: [{ rotate: fan.rotate }],
                          shadowColor: "#000",
                          shadowOffset: { width: 0, height: 4 },
                          shadowOpacity: 0.5,
                          shadowRadius: 10,
                        }}
                        resizeMode="cover"
                      />
                    );
                  })}
                </View>
              )}
            </View>
          </LinearGradient>
        </Animated.View>

        {/* ── 2. Daily Streak Banner ───────────────────── */}
        <Animated.View entering={FadeInUp.delay(100).duration(450)} style={{ paddingHorizontal: 16, marginBottom: 20 }}>
          <EbookStreakBanner
            currentStreak={7}
            xpScore={450}
            isDark={isDark}
            onPressBell={() => setIsNotifModalOpen(true)}
            onPressUpgrade={() => setIsSubModalOpen(true)}
          />
        </Animated.View>

        {/* ── 3. Continue Reading ───────────────────────── */}
        {continueStory && !searchQuery.trim() && (
          <Animated.View entering={FadeInUp.delay(120).duration(450)} style={{ paddingHorizontal: 16, marginBottom: 24 }}>
            <StoryCard story={continueStory} onPress={onStoryPress} variant="continue" />
          </Animated.View>
        )}

        {/* ── 4. Search ─────────────────────────────────── */}
        <Animated.View entering={FadeInUp.delay(160).duration(450)} style={{ paddingHorizontal: 16, marginBottom: 16 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 18,
              paddingVertical: 13,
              borderRadius: 16,
              backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "#FFFFFF",
              borderWidth: 1.5,
              borderColor: searchFocused
                ? accentColor + "60"
                : isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)",
              shadowColor: searchFocused ? accentColor : "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: searchFocused ? 0.15 : 0.04,
              shadowRadius: 8,
            }}
          >
            <Search size={16} color={searchFocused ? accentColor : textSubColor} />
            <TextInput
              placeholder="Search by title, author, or genre…"
              placeholderTextColor={textSubColor}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              style={{ flex: 1, fontSize: 14, color: textColor, marginLeft: 10, padding: 0 }}
              accessibilityLabel="Search ebook catalog"
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery("")} hitSlop={12} accessibilityLabel="Clear search">
                <View
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 11,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)",
                    marginLeft: 8,
                  }}
                >
                  <X size={12} color={textSubColor} />
                </View>
              </Pressable>
            )}
          </View>
        </Animated.View>

        {/* ── 5. Category Pills ─────────────────────────── */}
        {!searchQuery.trim() && (
          <Animated.View entering={FadeInUp.delay(190).duration(450)} style={{ marginBottom: 28 }}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
            >
              {CATEGORIES.map((cat) => {
                const isActive = activeCategory === cat.key;
                const CatIcon = cat.icon;
                return (
                  <Pressable
                    key={cat.key}
                    onPress={() => setActiveCategory(cat.key)}
                    style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
                    accessibilityLabel={`Filter by ${cat.label}`}
                    accessibilityState={{ selected: isActive }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        paddingHorizontal: 14,
                        paddingVertical: 8,
                        borderRadius: 100,
                        backgroundColor: isActive ? cat.color : isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
                        borderWidth: isActive ? 0 : 1,
                        borderColor: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)",
                        gap: 6,
                      }}
                    >
                      <CatIcon size={12} color={isActive ? "#FFFFFF" : isDark ? "#64748B" : "#94A3B8"} />
                      <Text
                        weight="SemiBold"
                        style={{
                          fontSize: 12.5,
                          color: isActive ? "#FFFFFF" : isDark ? "#94A3B8" : "#64748B",
                          letterSpacing: 0.1,
                        }}
                      >
                        {cat.label}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          </Animated.View>
        )}

        {/* ── 6. Main Content: Rails or Grid ────────────── */}
        {isSectionRailMode ? (
          <Animated.View entering={FadeInUp.delay(220).duration(450)}>
            {/* Top 100 Featured Masterworks Showcase Rail */}
            {data?.topFeatured && data.topFeatured.length > 0 && (
              <SectionRail
                title="⭐ Editor's Top 100 Picks"
                color="#F59E0B"
                stories={data.topFeatured}
                onStoryPress={onStoryPress}
                onSeeAllPress={() => setActiveNavTab("top100")}
                textColor={textColor}
                isDark={isDark}
              />
            )}

            {/* ✨ AI Personalized Recommendations Rail */}
            {data?.allPublished && data.allPublished.length > 0 && (
              <SectionRail
                title="✨ Recommended For You"
                color="#8B5CF6"
                stories={data.allPublished.slice(0, 10)}
                onStoryPress={onStoryPress}
                onSeeAllPress={() => router.push("/ebook/explore")}
                textColor={textColor}
                isDark={isDark}
              />
            )}

            {/* 🎥 Book Reels (Short Video Teasers Feed) Banner */}
            <Pressable
              onPress={() => router.push("/reels")}
              style={({ pressed }) => ({
                marginHorizontal: 20,
                marginBottom: 32,
                borderRadius: 24,
                padding: 20,
                backgroundColor: isDark ? "rgba(245,158,11,0.12)" : "#FEF3C7",
                borderWidth: 1.5,
                borderColor: isDark ? "#F59E0B" : "#FCD34D",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                opacity: pressed ? 0.85 : 1,
              })}
            >
              <View style={{ flex: 1, paddingRight: 16 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 }}>
                  <Text weight="Bold" style={{ color: "#F59E0B", fontSize: 11, letterSpacing: 1 }}>NEW FEATURE 🎥</Text>
                </View>
                <Text weight="Bold" style={{ color: isDark ? "#FFFFFF" : "#0F172A", fontSize: 18, marginBottom: 4 }}>
                  Explore Book Reels Feed
                </Text>
                <Text style={{ color: isDark ? "#CBD5E1" : "#475569", fontSize: 12.5, lineHeight: 18 }}>
                  Watch short video teasers, ambient quote visuals, and 1-tap jump straight into reading!
                </Text>
              </View>
              <View style={{ backgroundColor: "#F59E0B", paddingHorizontal: 16, paddingVertical: 12, borderRadius: 100 }}>
                <Text weight="Bold" style={{ color: "#0F172A", fontSize: 13 }}>Watch Reels ❯</Text>
              </View>
            </Pressable>

            {/* ⚡ Quick Listens (< 3 Hours) Rail */}
            {data?.shortAudiobooks && data.shortAudiobooks.length > 0 && (
              <SectionRail
                title="⚡ Quick Listens (< 3 Hours)"
                color="#06B6D4"
                stories={data.shortAudiobooks}
                onStoryPress={onStoryPress}
                onSeeAllPress={() => router.push("/ebook/explore")}
                textColor={textColor}
                isDark={isDark}
              />
            )}

            {/* Children's Books Rail */}
            {childrenStories.length > 0 && (
              <View style={{ marginBottom: 36 }}>
                <View style={{ paddingHorizontal: 20, marginBottom: 14 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                      <View style={{ width: 3, height: 20, borderRadius: 1.5, backgroundColor: "#F97316", marginRight: 10 }} />
                      <Text weight="Bold" style={{ fontSize: 17, letterSpacing: -0.3, color: textColor }}>
                        🧒 For Young Readers
                      </Text>
                    </View>
                    <Pressable
                      onPress={() => setActiveCategory("children")}
                      style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1, flexDirection: "row", alignItems: "center", gap: 2 })}
                    >
                      <Text weight="SemiBold" style={{ fontSize: 13, color: "#F97316" }}>See all</Text>
                      <ChevronRight size={14} color="#F97316" />
                    </Pressable>
                  </View>
                  <Text style={{ fontSize: 12, color: textSubColor, marginTop: 4, marginLeft: 13 }}>
                    Classic tales & fairy stories for young readers of all ages
                  </Text>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}>
                  {childrenStories.map((story) => (
                    <View key={story._id} style={{ width: 148 }}>
                      <StoryCard story={story} onPress={onStoryPress} variant="standard" />
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Continue Reading Rail */}
            <ActivityCardRail
              title="Continue Reading"
              icon={BookOpen}
              color="#3B82F6"
              stories={data?.continueReading || []}
              variant="reading"
              onStoryPress={onStoryPress}
              textColor={textColor}
            />

            {/* Continue Listening Rail */}
            <ActivityCardRail
              title="Continue Listening"
              icon={Headphones}
              color="#8B5CF6"
              stories={data?.continueListening || []}
              variant="listening"
              onStoryPress={onStoryPress}
              textColor={textColor}
            />

            {/* Your Last Visit Rail */}
            <ActivityCardRail
              title="Your Last Visit"
              icon={Clock}
              color="#10B981"
              stories={data?.recentlyVisited || []}
              variant="visit"
              onStoryPress={onStoryPress}
              textColor={textColor}
            />

            {/* ── Popular Categories Showcase Block ── */}
            <View style={{ paddingHorizontal: 16, marginBottom: 32 }}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: accentColor + "20", alignItems: "center", justifyContent: "center" }}>
                    <FolderGit2 size={15} color={accentColor} />
                  </View>
                  <Text weight="Bold" style={{ fontSize: 18, color: textColor, letterSpacing: -0.3 }}>
                    Popular Categories
                  </Text>
                </View>

                <Pressable
                  onPress={() => setActiveNavTab("categories")}
                  style={({ pressed }) => ({
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 4,
                    opacity: pressed ? 0.6 : 1,
                  })}
                >
                  <Text weight="Bold" style={{ fontSize: 13, color: accentColor }}>
                    View All ({categoriesData.length})
                  </Text>
                  <ChevronRight size={14} color={accentColor} />
                </Pressable>
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
                {categoriesData.slice(0, 8).map((cat) => (
                  <Pressable
                    key={cat._id}
                    onPress={() => router.push(`/ebook/category/${cat.slug}`)}
                    style={({ pressed }) => ({
                      width: 170,
                      padding: 16,
                      borderRadius: 20,
                      backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "#FFFFFF",
                      borderWidth: 1,
                      borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
                      gap: 10,
                      opacity: pressed ? 0.8 : 1,
                    })}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                      <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: (cat.color || accentColor) + "20", alignItems: "center", justifyContent: "center" }}>
                        <BookOpen size={16} color={cat.color || accentColor} />
                      </View>
                      <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 100, backgroundColor: (cat.color || accentColor) + "18" }}>
                        <Text weight="Bold" style={{ fontSize: 10.5, color: cat.color || accentColor }}>
                          {cat.bookCount} Books
                        </Text>
                      </View>
                    </View>

                    <Text weight="Bold" style={{ fontSize: 15, color: textColor }} numberOfLines={1}>
                      {cat.name}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>

            {/* ── Popular Master Authors Showcase Block ── */}
            <View style={{ paddingHorizontal: 16, marginBottom: 32 }}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: "#8B5CF620", alignItems: "center", justifyContent: "center" }}>
                    <Users size={15} color="#8B5CF6" />
                  </View>
                  <Text weight="Bold" style={{ fontSize: 18, color: textColor, letterSpacing: -0.3 }}>
                    Popular Master Authors
                  </Text>
                </View>

                <Pressable
                  onPress={() => setActiveNavTab("authors")}
                  style={({ pressed }) => ({
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 4,
                    opacity: pressed ? 0.6 : 1,
                  })}
                >
                  <Text weight="Bold" style={{ fontSize: 13, color: "#8B5CF6" }}>
                    View All ({authorsData.length})
                  </Text>
                  <ChevronRight size={14} color="#8B5CF6" />
                </Pressable>
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
                {authorsData.slice(0, 10).map((author) => (
                  <Pressable
                    key={author._id}
                    onPress={() => router.push(`/ebook/author/${author.slug}`)}
                    style={({ pressed }) => ({
                      flexDirection: "row",
                      alignItems: "center",
                      padding: 14,
                      borderRadius: 20,
                      backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "#FFFFFF",
                      borderWidth: 1,
                      borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
                      gap: 12,
                      minWidth: 190,
                      opacity: pressed ? 0.8 : 1,
                    })}
                  >
                    <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: "#8B5CF625", alignItems: "center", justifyContent: "center" }}>
                      <Text weight="Bold" style={{ color: "#8B5CF6", fontSize: 15 }}>
                        {author.name.charAt(0)}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text weight="Bold" style={{ fontSize: 14, color: textColor }} numberOfLines={1}>
                        {author.name}
                      </Text>
                      <Text style={{ fontSize: 12, color: textSubColor, marginTop: 1 }}>
                        {author.bookCount} {author.bookCount === 1 ? "Book" : "Books"}
                      </Text>
                    </View>
                  </Pressable>
                ))}
              </ScrollView>
            </View>

            {/* ── Popular Ebook Tags Showcase Block ── */}
            <View style={{ paddingHorizontal: 16, marginBottom: 32 }}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: "#10B98120", alignItems: "center", justifyContent: "center" }}>
                    <Tag size={15} color="#10B981" />
                  </View>
                  <Text weight="Bold" style={{ fontSize: 18, color: textColor, letterSpacing: -0.3 }}>
                    Popular Ebook Tags
                  </Text>
                </View>

                <Pressable
                  onPress={() => setActiveNavTab("tags")}
                  style={({ pressed }) => ({
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 4,
                    opacity: pressed ? 0.6 : 1,
                  })}
                >
                  <Text weight="Bold" style={{ fontSize: 13, color: "#10B981" }}>
                    View All ({tagsData.length})
                  </Text>
                  <ChevronRight size={14} color="#10B981" />
                </Pressable>
              </View>

              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {tagsData.slice(0, 16).map((tag) => (
                  <Pressable
                    key={tag._id}
                    onPress={() => router.push(`/ebook/explore?search=${encodeURIComponent(tag.name)}`)}
                    style={({ pressed }) => ({
                      flexDirection: "row",
                      alignItems: "center",
                      paddingHorizontal: 12,
                      paddingVertical: 7,
                      borderRadius: 100,
                      backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "#FFFFFF",
                      borderWidth: 1,
                      borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
                      gap: 6,
                      opacity: pressed ? 0.7 : 1,
                    })}
                  >
                    <Tag size={11} color="#10B981" />
                    <Text weight="Bold" style={{ fontSize: 12.5, color: textColor }}>
                      #{tag.name}
                    </Text>
                    <View style={{ paddingHorizontal: 6, paddingVertical: 1.5, borderRadius: 100, backgroundColor: "#10B98118" }}>
                      <Text weight="Bold" style={{ fontSize: 10, color: "#10B981" }}>
                        {tag.bookCount}
                      </Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            </View>

            <SectionRail
              title="New Arrivals"
              color="#F59E0B"
              stories={data?.newest || []}
              onStoryPress={onStoryPress}
              isDark={isDark}
              textColor={textColor}
            />

            {/* Reading Levels Block */}
            {(beginnerStories.length > 0 || intermediateStories.length > 0 || advancedStories.length > 0) && (
              <View style={{ paddingHorizontal: 16, marginBottom: 36 }}>
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: "#10B98120", alignItems: "center", justifyContent: "center" }}>
                      <GraduationCap size={15} color="#10B981" />
                    </View>
                    <Text weight="Bold" style={{ fontSize: 18, color: textColor, letterSpacing: -0.3 }}>
                      Browse by Reading Level
                    </Text>
                  </View>
                </View>
                <View style={{ flexDirection: "row", gap: 12 }}>
                  {[
                    { label: "Beginner", sub: "A1 – A2", stories: beginnerStories, color: "#10B981", cat: "beginner" as CategoryKey },
                    { label: "Intermediate", sub: "B1 – B2", stories: intermediateStories, color: "#3B82F6", cat: "intermediate" as CategoryKey },
                    { label: "Advanced", sub: "C1 – C2", stories: advancedStories, color: "#F43F5E", cat: "advanced" as CategoryKey },
                  ].map((level) => (
                    <Pressable
                      key={level.cat}
                      onPress={() => setActiveCategory(level.cat)}
                      style={({ pressed }) => ({
                        flex: 1,
                        padding: 16,
                        borderRadius: 20,
                        backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "#FFFFFF",
                        borderWidth: 1.5,
                        borderColor: level.color + "40",
                        alignItems: "center",
                        gap: 8,
                        opacity: pressed ? 0.8 : 1,
                      })}
                    >
                      <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: level.color + "20", alignItems: "center", justifyContent: "center" }}>
                        <GraduationCap size={18} color={level.color} />
                      </View>
                      <Text weight="Bold" style={{ fontSize: 13, color: textColor, textAlign: "center" }}>
                        {level.label}
                      </Text>
                      <Text style={{ fontSize: 11, color: textSubColor, textAlign: "center" }}>
                        {level.sub}
                      </Text>
                      <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 100, backgroundColor: level.color + "18" }}>
                        <Text weight="Bold" style={{ fontSize: 10.5, color: level.color }}>
                          {level.stories.length} Books
                        </Text>
                      </View>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            {/* Books in Spanish Rail */}
            {spanishStories.length > 0 && (
              <SectionRail
                title="Libros en Español 🇪🇸"
                color="#EF4444"
                stories={spanishStories}
                onStoryPress={onStoryPress}
                onSeeAllPress={() => setActiveCategory("spanish")}
                isDark={isDark}
                textColor={textColor}
              />
            )}

            {/* Books in French Rail */}
            {frenchStories.length > 0 && (
              <SectionRail
                title="Livres en Français 🇫🇷"
                color="#3B82F6"
                stories={frenchStories}
                onStoryPress={onStoryPress}
                onSeeAllPress={() => setActiveCategory("french")}
                isDark={isDark}
                textColor={textColor}
              />
            )}

            {/* Multilingual Books Rail */}
            {multilingualStories.length > 0 && (
              <SectionRail
                title="Multilingual Editions 🌐"
                color="#8B5CF6"
                stories={multilingualStories}
                onStoryPress={onStoryPress}
                onSeeAllPress={() => setActiveCategory("multilingual")}
                isDark={isDark}
                textColor={textColor}
              />
            )}
            <SectionRail
              title="Audiobooks"
              color="#8B5CF6"
              stories={data?.audiobooks || []}
              onStoryPress={(slug) => onStoryPress(slug, true)}
              onSeeAllPress={() => setActiveCategory("audiobooks")}
              isDark={isDark}
              textColor={textColor}
            />
            <SectionRail
              title="Philosophy & Thought"
              color="#F59E0B"
              stories={data?.byGenre?.philosophy || allStories.filter((s) => s.tags?.some((t) => /philosophy|stoicism|ethics/i.test(t)))}
              onStoryPress={onStoryPress}
              onSeeAllPress={() => router.push("/ebook/explore?genre=philosophy")}
              isDark={isDark}
              textColor={textColor}
            />
            <SectionRail
              title="Comedy & Satire"
              color="#EF4444"
              stories={data?.byGenre?.comedy || allStories.filter((s) => s.tags?.some((t) => /comedy|humor|satire/i.test(t)))}
              onStoryPress={onStoryPress}
              onSeeAllPress={() => router.push("/ebook/explore?genre=comedy")}
              isDark={isDark}
              textColor={textColor}
            />
            <SectionRail
              title="Fantasy & Magic"
              color="#8B5CF6"
              stories={data?.byGenre?.fantasy || allStories.filter((s) => s.tags?.some((t) => /fantasy/i.test(t)))}
              onStoryPress={onStoryPress}
              onSeeAllPress={() => router.push("/ebook/explore?genre=fantasy")}
              isDark={isDark}
              textColor={textColor}
            />
            <SectionRail
              title="Horror & Weird Fiction"
              color="#A855F7"
              stories={data?.byGenre?.horror || allStories.filter((s) => s.tags?.some((t) => /horror|weird/i.test(t)))}
              onStoryPress={onStoryPress}
              onSeeAllPress={() => router.push("/ebook/explore?genre=horror")}
              isDark={isDark}
              textColor={textColor}
            />
            <SectionRail
              title="Spy Thrillers & Mystery"
              color="#3B82F6"
              stories={data?.byGenre?.thriller || allStories.filter((s) => s.tags?.some((t) => /thriller|spy|mystery|detective/i.test(t)))}
              onStoryPress={onStoryPress}
              onSeeAllPress={() => router.push("/ebook/explore?genre=thriller")}
              isDark={isDark}
              textColor={textColor}
            />
            <SectionRail
              title="Gothic Classics"
              color="#6366F1"
              stories={data?.byGenre?.gothic || allStories.filter((s) => s.tags?.some((t) => /gothic/i.test(t)))}
              onStoryPress={onStoryPress}
              onSeeAllPress={() => router.push("/ebook/explore?genre=gothic")}
              isDark={isDark}
              textColor={textColor}
            />
            <SectionRail
              title="Drama & Plays"
              color="#10B981"
              stories={data?.byGenre?.drama || allStories.filter((s) => s.tags?.some((t) => /drama|play/i.test(t)))}
              onStoryPress={onStoryPress}
              onSeeAllPress={() => router.push("/ebook/explore?genre=drama")}
              isDark={isDark}
              textColor={textColor}
            />
            <SectionRail
              title="Biographies & History"
              color="#EC4899"
              stories={data?.byGenre?.biography || allStories.filter((s) => s.tags?.some((t) => /biography|memoir|history/i.test(t)))}
              onStoryPress={onStoryPress}
              onSeeAllPress={() => router.push("/ebook/explore?genre=biography")}
              isDark={isDark}
              textColor={textColor}
            />
            <SectionRail
              title="Science & Nature"
              color="#84CC16"
              stories={data?.byGenre?.nature || allStories.filter((s) => s.tags?.some((t) => /nature|science/i.test(t)))}
              onStoryPress={onStoryPress}
              onSeeAllPress={() => router.push("/ebook/explore?genre=nature")}
              isDark={isDark}
              textColor={textColor}
            />
            <SectionRail
              title="Victorian Masterpieces"
              color="#EAB308"
              stories={data?.byGenre?.victorian || allStories.filter((s) => s.tags?.some((t) => /victorian/i.test(t)))}
              onStoryPress={onStoryPress}
              onSeeAllPress={() => router.push("/ebook/explore?genre=victorian")}
              isDark={isDark}
              textColor={textColor}
            />
            <SectionRail
              title="Russian Literature 🇷🇺"
              color="#DC2626"
              stories={data?.byGenre?.russian || allStories.filter((s) => s.tags?.some((t) => /russian/i.test(t)))}
              onStoryPress={onStoryPress}
              onSeeAllPress={() => router.push("/ebook/explore?genre=russian")}
              isDark={isDark}
              textColor={textColor}
            />
            <SectionRail
              title="High Adventure & Sea"
              color="#059669"
              stories={data?.byGenre?.adventure || allStories.filter((s) => s.tags?.some((t) => /adventure|sea|pirates/i.test(t)))}
              onStoryPress={onStoryPress}
              onSeeAllPress={() => router.push("/ebook/explore?genre=adventure")}
              isDark={isDark}
              textColor={textColor}
            />
            <SectionRail
              title="Romance"
              color="#F43F5E"
              stories={data?.byGenre?.romance || allStories.filter((s) => s.tags?.some((t) => /romance/i.test(t)))}
              onStoryPress={onStoryPress}
              onSeeAllPress={() => router.push("/ebook/explore?genre=romance")}
              isDark={isDark}
              textColor={textColor}
            />
            {loveStoriesStories.length > 0 && (
              <SectionRail
                title="💕 Love Stories"
                color="#EC4899"
                stories={loveStoriesStories}
                onStoryPress={onStoryPress}
                onSeeAllPress={() => setActiveCategory("lovestories")}
                isDark={isDark}
                textColor={textColor}
              />
            )}
            {psychFictionStories.length > 0 && (
              <SectionRail
                title="🧠 Psychological Fiction"
                color="#7C3AED"
                stories={psychFictionStories}
                onStoryPress={onStoryPress}
                onSeeAllPress={() => setActiveCategory("psychfiction")}
                isDark={isDark}
                textColor={textColor}
              />
            )}
            <SectionRail
              title="Sci-Fi & Dystopian"
              color="#0891B2"
              stories={data?.byGenre?.scifi || allStories.filter((s) => s.tags?.some((t) => /sci-fi|scifi|dystopian/i.test(t)))}
              onStoryPress={onStoryPress}
              onSeeAllPress={() => router.push("/ebook/explore?genre=scifi")}
              isDark={isDark}
              textColor={textColor}
            />
            <SectionRail
              title="World Classics"
              color="#EAB308"
              stories={data?.byGenre?.classic || allStories.filter((s) => s.tags?.some((t) => /classic/i.test(t)))}
              onStoryPress={onStoryPress}
              onSeeAllPress={() => router.push("/ebook/explore?genre=all")}
              isDark={isDark}
              textColor={textColor}
            />
          </Animated.View>
        ) : (
          /* Grid View */
          <Animated.View entering={FadeInUp.delay(220).duration(450)} style={{ paddingHorizontal: 16 }}>
            {/* Grid header */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 18,
                paddingBottom: 14,
                borderBottomWidth: 1,
                borderBottomColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <View
                  style={{
                    width: 3,
                    height: 20,
                    borderRadius: 1.5,
                    backgroundColor: CATEGORIES.find((c) => c.key === activeCategory)?.color || accentColor,
                  }}
                />
                <Text weight="Bold" style={{ fontSize: 18, letterSpacing: -0.3, color: textColor }}>
                  {searchQuery.trim()
                    ? `Results for "${searchQuery}"`
                    : CATEGORIES.find((c) => c.key === activeCategory)?.label || "Catalog"}
                </Text>
              </View>
              <Text weight="Medium" style={{ fontSize: 12, color: textSubColor }}>
                {displayStories.length} {displayStories.length === 1 ? "book" : "books"}
              </Text>
            </View>

            {displayStories.length > 0 ? (
              <View style={{ flexDirection: "row", flexWrap: "wrap", marginHorizontal: -6 }}>
                {displayStories.map((story) => {
                  const cols = width >= 1024 ? 4 : width >= 768 ? 3 : 2;
                  return (
                    <View key={story._id} style={{ width: `${100 / cols}%`, paddingHorizontal: 6, paddingBottom: 14 }}>
                      <StoryCard story={story} onPress={onStoryPress} variant="standard" />
                    </View>
                  );
                })}
              </View>
            ) : (
              <View style={{ paddingVertical: 64, alignItems: "center", gap: 10 }}>
                <View
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 32,
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 4,
                    backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "#F1F5F9",
                  }}
                >
                  <BookOpen size={28} color={textSubColor} />
                </View>
                <Text weight="SemiBold" style={{ fontSize: 16, color: textColor }}>
                  No books found
                </Text>
                <Text style={{ fontSize: 13, color: textSubColor, textAlign: "center", maxWidth: 240 }}>
                  Try a different keyword or select another genre.
                </Text>
                <Pressable
                  onPress={() => { setSearchQuery(""); setActiveCategory("all"); }}
                  style={({ pressed }) => ({
                    marginTop: 8,
                    paddingVertical: 10,
                    paddingHorizontal: 22,
                    borderRadius: 100,
                    backgroundColor: accentColor,
                    opacity: pressed ? 0.85 : 1,
                  })}
                >
                  <Text weight="SemiBold" style={{ color: "#FFFFFF", fontSize: 13 }}>Reset Filters</Text>
                </Pressable>
              </View>
            )}
          </Animated.View>
        )}
        </View>
        )}
        </View>
      </ScrollView>

      {/* Floating Sticky Bottom Mini Audio Player */}
      <EbookMiniAudioPlayer
        onPressExpand={() => router.push("/ebook/explore")}
      />

      {/* Notifications Drawer Modal */}
      <EbookNotificationsModal
        visible={isNotifModalOpen}
        onClose={() => setIsNotifModalOpen(false)}
      />

      {/* Upgrade Subscription Modal */}
      <EbookSubscriptionModal
        visible={isSubModalOpen}
        onClose={() => setIsSubModalOpen(false)}
      />
    </View>
  );
};

export default EbookDashboardContent;
