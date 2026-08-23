import { useCallback, useEffect, useRef, useState } from "react";
import {
  useAudioPlayer,
  useAudioPlayerStatus,
  setAudioModeAsync,
  type AudioSource,
} from "expo-audio";

export type FlashcardAudioAPI = {
  play: (uri?: string) => Promise<void>;
  stop: () => void;
  isPlaying: boolean;
  error: string | null;
};

// Audio cache with 24h expiry
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
  const player = useAudioPlayer();
  const status = useAudioPlayerStatus(player);

  const isMounted = useRef(true);
  const cleanupTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    isMounted.current = true;
    (async () => {
      try {
        await setAudioModeAsync({
          playsInSilentMode: true,
          interruptionMode: "duckOthers",
          interruptionModeAndroid: "duckOthers",
          shouldPlayInBackground: false,
        });
      } catch {}
    })();

    const currentCleanupTimer = cleanupTimerRef.current;

    return () => {
      isMounted.current = false;
      
      // Explicit cleanup
      if (currentCleanupTimer) {
        clearTimeout(currentCleanupTimer);
      }
      
      try {
        player.pause();
        player.release();
      } catch {}
      
      setIsPlaying(false);
      setError(null);
    };
     
  }, []);

  useEffect(() => {
    if ((status as any)?.didJustFinish) {
      if (isMounted.current) setIsPlaying(false);
    }
  }, [status]);

  useEffect(() => {
    if (status && "playing" in status) {
      if (!status.playing && isPlaying && !(status as any).buffering) setIsPlaying(false);
    }
  }, [status, isPlaying]);

  const play = useCallback(
    async (uri?: string) => {
      if (!uri) {
        setError("No audio available");
        return;
      }
      if (isPlaying) return;

      setIsPlaying(true);
      setError(null);

      try {
        // Check cache first
        const cachedUri = getCachedAudioUri(uri);
        const audioUri = cachedUri || uri;

        // Cache new URI if not already cached
        if (!cachedUri) {
          setCachedAudioUri(uri, audioUri);
        }

        const src: AudioSource = { uri: audioUri };
        try {
          await player.seekTo(0);
        } catch {}
        
        if (isMounted.current) {
          player.replace(src);
          player.play();
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        setError("Failed to play audio: " + msg);
        setIsPlaying(false);
      }
    },
    [isPlaying, player]
  );

  const stop = useCallback(() => {
    try {
      player.pause();
    } catch {}
    setIsPlaying(false);
  }, [player]);

  return { play, stop, isPlaying, error };
}
