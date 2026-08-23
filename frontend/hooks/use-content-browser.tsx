import { useCallback, useMemo, useRef, useState, useEffect } from "react";
import { useFocusEffect } from "expo-router/react-navigation";
import { router } from "expo-router";
import type { ContentItem, ContentType } from "@/types/content-types";
import { useContentData } from "./useContentData";
import { useDebounce } from "./use-debounce";
import { useHandleFavoritePackMutation } from "@/redux/query/lexicon-query";

const AUTO_REVALIDATE_ON_FOCUS = false;

// Module-level collator — avoid re-creating on every filter change
const collator = new Intl.Collator();

export type SortOrder = "az" | "za" | "enrolledFirst" | "favoritesFirst";

type GroupedCategory = {
  totalPacks: number;
  allPacks: ContentItem[];
};

export const useContentBrowser = (contentType: ContentType = "vocabulary") => {
  const { data, isLoading: isCacheLoading, revalidate } = useContentData();
  const [handleFavoritePack] = useHandleFavoritePackMutation();

  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);

  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [onlyEnrolled, setOnlyEnrolled] = useState(false);
  const [accessFilter, setAccessFilter] = useState<"any" | "free" | "premium">("any");
  const [onlyWithImage, setOnlyWithImage] = useState(false);
  const [sortOrder, setSortOrder] = useState<SortOrder>("az");

  // Use ref for favorites to avoid re-flattening allContentData on every toggle
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const favoritesRef = useRef(favorites);
  
  useEffect(() => {
    favoritesRef.current = favorites;
  }, [favorites]);

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isUpdatingFavorite, setIsUpdatingFavorite] = useState(false);
  const [updatingFavoriteId, setUpdatingFavoriteId] = useState("");
  const [error, setError] = useState<string | null>(null);

  // flatten — only recomputes when API data or favorites change
  const allContentData = useMemo<ContentItem[]>(() => {
    if (!data) return [];
    const flat: ContentItem[] = [];
    const cats = data.categories;
    const catKeys = Object.keys(cats);
    for (let ci = 0; ci < catKeys.length; ci++) {
      const cat = catKeys[ci];
      const subs = cats[cat].subcategories;
      const subKeys = Object.keys(subs);
      for (let si = 0; si < subKeys.length; si++) {
        const sub = subKeys[si];
        const packs = subs[sub].packs;
        for (let pi = 0; pi < packs.length; pi++) {
          const p = packs[pi];
          flat.push({
            ...p,
            category: cat,
            subcategory: sub,
            isFavorite: favorites.has(p._id) || !!p.isFavorite || !!p.isFavourite,
          });
        }
      }
    }
    return flat;
  }, [data, favorites]);

  // taxonomy
  const categories = useMemo(() => (data ? Object.keys(data.categories) : []), [data]);

  const subcategoriesByCategory = useMemo<Record<string, string[]>>(() => {
    if (!data) return {};
    const out: Record<string, string[]> = {};
    Object.entries(data.categories).forEach(([catName, cat]) => {
      out[catName] = Object.keys(cat.subcategories || {}).sort();
    });
    return out;
  }, [data]);

  const subcategoriesForSelected = useMemo(() => {
    if (!selectedCategory) return [];
    return subcategoriesByCategory[selectedCategory] || [];
  }, [selectedCategory, subcategoriesByCategory]);

  // filters — uses debouncedSearch instead of raw searchQuery
  const filteredData = useMemo(() => {
    let list = allContentData;

    if (selectedCategory) list = list.filter((i) => i.category === selectedCategory);
    if (selectedSubcategory) list = list.filter((i) => i.subcategory === selectedSubcategory);
    if (onlyEnrolled) list = list.filter((i) => i.isEnrolled);
    if (onlyFavorites)
      list = list.filter((i) => i.isFavorite || (i as any).isFavourite || favorites.has(i._id));

    if (accessFilter !== "any") {
      list = list.filter((i) => {
        const acc = (i as any).access;
        if (!acc) return false;
        return accessFilter === "free" ? acc.free === true : acc.premium === true;
      });
    }

    if (onlyWithImage) list = list.filter((i) => !!(i as any).image_url);

    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase().trim();
      list = list.filter((i) => {
        const t = (i.name || i.title || "").toLowerCase();
        return (
          t.includes(q) ||
          (i.category || "").toLowerCase().includes(q) ||
          (i.subcategory || "").toLowerCase().includes(q) ||
          (i.slug || "").toLowerCase().includes(q)
        );
      });
    }

    // Use module-level collator instead of creating a new one
    if (sortOrder === "az")
      list = [...list].sort((a, b) => collator.compare(a.name || "", b.name || ""));
    else if (sortOrder === "za")
      list = [...list].sort((a, b) => collator.compare(b.name || "", a.name || ""));
    else if (sortOrder === "enrolledFirst")
      list = [...list].sort((a, b) => Number(b.isEnrolled) - Number(a.isEnrolled));
    else if (sortOrder === "favoritesFirst") {
      const fav = (x: ContentItem) =>
        Number(x.isFavorite || (x as any).isFavourite || favorites.has(x._id));
      list = [...list].sort((a, b) => fav(b) - fav(a));
    }

    return list;
  }, [
    allContentData,
    debouncedSearch,
    selectedCategory,
    selectedSubcategory,
    onlyEnrolled,
    onlyFavorites,
    accessFilter,
    onlyWithImage,
    sortOrder,
    favorites,
  ]);

  // grouped for homepage sections
  const groupedData: Record<string, GroupedCategory> = useMemo(() => {
    if (!data) return {};

    const groups: Record<string, GroupedCategory> = {};

    // iterate in API's original order
    for (const cat of Object.keys(data.categories)) {
      groups[cat] = { totalPacks: 0, allPacks: [] };
    }

    // then push filtered packs into those groups
    for (let i = 0; i < filteredData.length; i++) {
      const item = filteredData[i];
      const cat = item.category || "Uncategorized";
      if (!groups[cat]) groups[cat] = { totalPacks: 0, allPacks: [] };
      groups[cat].allPacks.push(item);
      groups[cat].totalPacks += 1;
    }

    return groups;
  }, [data, filteredData]);

  // refresh
  useFocusEffect(
    useCallback(() => {
      if (AUTO_REVALIDATE_ON_FOCUS) void revalidate();
    }, [revalidate])
  );

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    setError(null);
    try {
      await revalidate({ force: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to refresh");
    } finally {
      setIsRefreshing(false);
    }
  }, [revalidate]);

  // category navigation as originally intended
  const handleViewCategory = useCallback((c: string) => {
    setSelectedCategory(c);
    setSelectedSubcategory(null);
    setSearchQuery("");
  }, []);

  const handleBackToBrowse = useCallback(() => {
    setSelectedCategory(null);
    setSelectedSubcategory(null);
    setSearchQuery("");
  }, []);

  const handleClearFilters = useCallback(() => {
    setSearchQuery("");
    setSelectedCategory(null);
    setSelectedSubcategory(null);
    setOnlyFavorites(false);
    setOnlyEnrolled(false);
    setOnlyWithImage(false);
    setAccessFilter("any");
    setSortOrder("az");
  }, []);

  // favorites (optimistic)
  const toggleFavorite = useCallback(
    async (id: string, slug: string, nextFavorite: boolean) => {
      if (isUpdatingFavorite) return;
      setIsUpdatingFavorite(true);
      setUpdatingFavoriteId(id);
      try {
        setFavorites((prev) => {
          const next = new Set(prev);
          if (nextFavorite) next.add(id);
          else next.delete(id);
          return next;
        });
        await handleFavoritePack({ slug, newFav: nextFavorite }).unwrap();
      } catch (e) {
        setFavorites((prev) => {
          const next = new Set(prev);
          if (!nextFavorite) next.add(id);
          else next.delete(id);
          return next;
        });
        throw e;
      } finally {
        setIsUpdatingFavorite(false);
        setUpdatingFavoriteId("");
      }
    },
    [handleFavoritePack, isUpdatingFavorite]
  );

  const navigateToItem = useCallback(
    (item: ContentItem) => {
      router.push(`/${contentType}/start/${item.slug}` as any);
    },
    [contentType]
  );

  const isLoading = isCacheLoading || (!data && !error);

  return {
    // data
    groupedApiData: data,
    groupedData,
    filteredData,

    // taxonomy
    categories,
    subcategoriesByCategory,
    subcategoriesForSelected,

    // filters
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    selectedSubcategory,
    setSelectedSubcategory,
    onlyFavorites,
    setOnlyFavorites,
    onlyEnrolled,
    setOnlyEnrolled,
    accessFilter,
    setAccessFilter,
    onlyWithImage,
    setOnlyWithImage,
    sortOrder,
    setSortOrder,

    // ui/status
    isLoading,
    isRefreshing,
    error,
    isUpdatingFavorite,
    updatingFavoriteId,

    // actions
    handleRefresh,
    handleClearFilters,
    handleViewCategory,
    handleBackToBrowse,
    toggleFavorite,
    navigateToItem,
    revalidate,
  };
};
