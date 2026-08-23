import * as React from "react";
import {
  subscribe,
  getSnapshot,
  revalidate,
  ensureLoadedFromDisk,
  getLoadingState,
} from "@/lib/utils/cache/contentCache";
import type { GroupedVocabularyData } from "@/types/content-types";

export function useContentData(): {
  data: GroupedVocabularyData | null;
  isLoading: boolean;
  revalidate: (opts?: { force?: boolean }) => Promise<GroupedVocabularyData | null>;
} {
  const data = React.useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  // Re-subscribe to get loading state updates (same listener set)
  const isLoading = React.useSyncExternalStore(subscribe, getLoadingState, getLoadingState);

  React.useEffect(() => {
    let mounted = true;
    ensureLoadedFromDisk().then(() => {
      if (mounted && getSnapshot() == null) {
        void revalidate();
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  return { data, isLoading, revalidate };
}
