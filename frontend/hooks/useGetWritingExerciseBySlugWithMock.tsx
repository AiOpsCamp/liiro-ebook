import { useGetWritingExerciseBySlugQuery } from "@/redux/query/writing-query";
import { mockWritingExercises } from "@/redux/query/writing-query.mock";
import type { WritingExercise } from "@/redux/query/writing-query";

/**
 * Hook that fetches a writing exercise by slug with mock data fallback
 * Used for testing until backend is ready
 */
export function useGetWritingExerciseBySlugWithMock(slug: string) {
  const { data, isLoading, error, refetch } = useGetWritingExerciseBySlugQuery(
    { slug },
    { skip: !slug || slug.length < 3 }
  );

  // Fallback to mock data if error or no data
  const mockData = mockWritingExercises[slug as keyof typeof mockWritingExercises] as WritingExercise | undefined;
  
  return {
    data: data || mockData,
    isLoading: isLoading && !mockData,
    error: error && !mockData ? error : null,
    refetch,
    isMocked: !data && !!mockData,
  };
}
