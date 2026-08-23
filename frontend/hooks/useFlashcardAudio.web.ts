import { useCallback, useEffect, useRef, useState } from "react";

export type FlashcardAudioAPI = {
  play: (uri?: string) => Promise<void>;
  stop: () => void;
  isPlaying: boolean;
  error: string | null;
};

// Audio cache with 24h expiry (shared across instances)
const AUDIO_CACHE_MAP = new Map<string, { data: string; expiresAt: number }>();
const AUDIO_CACHE_MAX = 10;
const AUDIO_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in ms

function getCachedAudioUri(uri: string): string | null {
  const cached = AUDIO_CACHE_MAP.get(uri);
  if (!cached) return null;
  if (Date.now() > cached.expiresAt) {
    AUDIO_CACHE_MAP.delete(uri);
    return null;
  }
  return cached.data;
}

function setCachedAudioUri(uri: string, data: string): void {
  // Evict oldest if at capacity (simple FIFO)
  if (AUDIO_CACHE_MAP.size >= AUDIO_CACHE_MAX) {
    const firstKey = Array.from(AUDIO_CACHE_MAP.keys())[0];
    if (firstKey) AUDIO_CACHE_MAP.delete(firstKey);
  }
  AUDIO_CACHE_MAP.set(uri, { data, expiresAt: Date.now() + AUDIO_CACHE_TTL });
}

export function useFlashcardAudio(): FlashcardAudioAPI {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const cleanupTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const a = new Audio();
    a.preload = "auto";
    audioRef.current = a;

    const onEnded = () => setIsPlaying(false);
    const onPause = () => setIsPlaying(false);
    const onPlay = () => setIsPlaying(true);

    a.addEventListener("ended", onEnded);
    a.addEventListener("pause", onPause);
    a.addEventListener("play", onPlay);

    const currentCleanupTimer = cleanupTimerRef.current;

    return () => {
      // Cleanup on unmount
      if (currentCleanupTimer) {
        clearTimeout(currentCleanupTimer);
      }
      
      a.pause();
      a.currentTime = 0;
      a.removeEventListener("ended", onEnded);
      a.removeEventListener("pause", onPause);
      a.removeEventListener("play", onPlay);
      
      setIsPlaying(false);
      setError(null);
    };
  }, []);

  const play = useCallback(async (uri?: string) => {
    setError(null);

    if (!uri) {
      setError("No audio available");
      return;
    }

    try {
      if (!audioRef.current) audioRef.current = new Audio();
      const a = audioRef.current;

      // Check cache first
      const cachedUri = getCachedAudioUri(uri);
      const audioUri = cachedUri || uri;

      // Cache new URI if not already cached
      if (!cachedUri) {
        setCachedAudioUri(uri, audioUri);
      }

      a.pause();
      a.currentTime = 0;
      a.src = audioUri;

      await a.play();
      setIsPlaying(true);
    } catch {
      setIsPlaying(false);
      setError("Failed to play audio");
    }
  }, []);

  const stop = useCallback(() => {
    const a = audioRef.current;
    if (!a) return;

    try {
      a.pause();
      a.currentTime = 0;
    } catch {}
    setIsPlaying(false);
  }, []);

  return { play, stop, isPlaying, error };
}
