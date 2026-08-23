import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Platform } from "react-native";

export function useAudio(url?: string) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const isSupported = Platform.OS === "web" && typeof Audio !== "undefined";

  useEffect(() => {
    if (!isSupported) return;

    // cleanup previous
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current.load();
      audioRef.current = null;
    }

    if (!url) return;

    const el = new Audio(url);
    el.preload = "auto";

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => setIsPlaying(false);

    el.addEventListener("play", onPlay);
    el.addEventListener("pause", onPause);
    el.addEventListener("ended", onEnded);

    audioRef.current = el;

    return () => {
      el.removeEventListener("play", onPlay);
      el.removeEventListener("pause", onPause);
      el.removeEventListener("ended", onEnded);
      el.pause();
      el.src = "";
      el.load();
      if (audioRef.current === el) audioRef.current = null;
    };
  }, [url, isSupported]);

  const play = useCallback(() => {
    audioRef.current?.play?.().catch(() => {});
  }, []);

  const pause = useCallback(() => {
    audioRef.current?.pause?.();
  }, []);

  return useMemo(
    () => ({
      play,
      pause,
      isPlaying,
      isSupported,
    }),
    [play, pause, isPlaying, isSupported]
  );
}
