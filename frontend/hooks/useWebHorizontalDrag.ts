import React, { useCallback, useMemo, useRef } from "react";
import { Platform } from "react-native";

export function useWebHorizontalDrag(ref: React.RefObject<any>) {
  const isWeb = Platform.OS === "web";

  const state = useRef({
    dragging: false,
    startX: 0,
    startScrollLeft: 0,
  });

  const getNode = useCallback(() => {
    const r: any = ref.current;
    if (r?.getScrollableNode) return r.getScrollableNode();
    return r;
  }, [ref]);

  const onPointerDown = useCallback(
    (e: any) => {
      if (!isWeb) return;

      const node = getNode();
      if (!node) return;

      state.current.dragging = true;
      state.current.startX = e.clientX;
      state.current.startScrollLeft = node.scrollLeft ?? 0;

      try {
        node.style.cursor = "grabbing";
        node.style.userSelect = "none";
      } catch {}
    },
    [getNode, isWeb]
  );

  const onPointerMove = useCallback(
    (e: any) => {
      if (!isWeb) return;
      if (!state.current.dragging) return;

      const node = getNode();
      if (!node) return;

      const dx = e.clientX - state.current.startX;
      node.scrollLeft = state.current.startScrollLeft - dx;
    },
    [getNode, isWeb]
  );

  const endDrag = useCallback(() => {
    if (!isWeb) return;

    const node = getNode();
    state.current.dragging = false;

    try {
      if (node) {
        node.style.cursor = "grab";
        node.style.userSelect = "auto";
      }
    } catch {}
  }, [getNode, isWeb]);

  const onWheel = useCallback(
    (e: any) => {
      if (!isWeb) return;

      const node = getNode();
      if (!node) return;

      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        node.scrollLeft += e.deltaY;
      }
    },
    [getNode, isWeb]
  );

  return useMemo(() => {
    if (!isWeb) return {};

    return {
      onPointerDown,
      onPointerMove,
      onPointerUp: endDrag,
      onPointerCancel: endDrag,
      onPointerLeave: endDrag,
      onPointerLeaveCapture: endDrag,
      onWheel,
      style: { cursor: "grab" as const } as any,
    };
  }, [endDrag, isWeb, onPointerDown, onPointerMove, onWheel]);
}
