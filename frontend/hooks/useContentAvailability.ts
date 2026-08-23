import { useMemo } from "react";
import { useGetContentAvailabilityQuery } from "@/redux/query/content-availability-query";

export function useContentAvailability(targetLanguage?: string) {
  const lang = targetLanguage ? String(targetLanguage).trim().toLowerCase() : "";
  const { data, isLoading } = useGetContentAvailabilityQuery(lang, {
    skip: !lang,
  });

  return useMemo(() => {
    if (data && data.success) {
      return {
        hasVocabularies: data.hasVocabularies ?? true,
        hasExercises: data.hasExercises ?? true,
        hasLessons: Boolean(data.hasLessons),
        isLoading: false,
      };
    }

    // Default fallback while loading: Lessons are strictly only available for Finnish ('fi')
    const isFinnish = lang === "fi" || lang === "finnish" || lang === "suomi";
    return {
      hasVocabularies: true,
      hasExercises: true,
      hasLessons: isFinnish,
      isLoading,
    };
  }, [data, lang, isLoading]);
}
