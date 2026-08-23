import * as React from "react";
import { ScrollView } from "react-native";

interface AutoScrollOptions {
  scrollThreshold?: number; // (Not very needed but keeping it)
  smoothScroll?: boolean;
}

export function useAutoScroll(
  enabled: boolean,
  deps: React.DependencyList,
  options?: AutoScrollOptions
): React.RefObject<ScrollView | null> {
  const scrollViewRef = React.useRef<ScrollView>(null);
  const optionsRef = React.useRef(options);

  React.useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  const onContentSizeChange = React.useCallback(() => {
    if (enabled && scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({
        animated: optionsRef.current?.smoothScroll ?? true,
      });
    }
  }, [enabled]);

  // Optionally, if you want to expose the `onContentSizeChange`
  React.useEffect(() => {
    (scrollViewRef as any).onContentSizeChange = onContentSizeChange;
  }, [onContentSizeChange]);

  return scrollViewRef;
}
