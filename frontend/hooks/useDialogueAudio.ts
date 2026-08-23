import { useCallback, useRef, useState, useEffect } from "react";
import { AudioManager } from "@/lib/utils/audioManager";

interface DialogueLine {
  audio_url?: string;
}

export const useDialogueAudio = (lines: DialogueLine[] = []) => {
  const [currentPlayingIdx, setCurrentPlayingIdx] = useState<number | null>(null);
  const [isPlayingAll, setIsPlayingAll] = useState(false);
  const audioManagerRef = useRef(AudioManager.getInstance());
  const playAllIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const playAllIndexRef = useRef(0);

  // Stop all audio and cleanup
  const stopAllAudio = useCallback(async () => {
    if (playAllIntervalRef.current) {
      clearTimeout(playAllIntervalRef.current);
      playAllIntervalRef.current = null;
    }
    await audioManagerRef.current.stopAudio();
    setCurrentPlayingIdx(null);
    setIsPlayingAll(false);
    playAllIndexRef.current = 0;
  }, []);

  // Play individual line
  const playLineAudio = useCallback(
    async (lineIdx: number) => {
      try {
        // If clicking the same line that's playing, stop it
        if (currentPlayingIdx === lineIdx) {
          await audioManagerRef.current.stopAudio();
          setCurrentPlayingIdx(null);
          return;
        }

        // Stop current playback if any
        await audioManagerRef.current.stopAudio();

        const line = lines[lineIdx];
        if (!line?.audio_url) {
          console.warn(`No audio URL for line ${lineIdx}`);
          return false;
        }

        setCurrentPlayingIdx(lineIdx);

        // Play audio with callback for when it finishes
        const success = await audioManagerRef.current.playAudio(
          line.audio_url,
          () => {
            setCurrentPlayingIdx(null);
          }
        );

        return success;
      } catch (error) {
        console.error("Error playing dialogue audio:", error);
        setCurrentPlayingIdx(null);
        return false;
      }
    },
    [lines, currentPlayingIdx]
  );

  // Play all lines sequentially
  const playAllSequentially = useCallback(async () => {
    setIsPlayingAll(true);
    playAllIndexRef.current = 0;

    const playNext = async (index: number) => {
      if (index >= lines.length) {
        setIsPlayingAll(false);
        setCurrentPlayingIdx(null);
        return;
      }

      const line = lines[index];
      if (!line?.audio_url) {
        // Skip lines without audio and move to next
        playNext(index + 1);
        return;
      }

      setCurrentPlayingIdx(index);

      // Estimate audio duration (8 seconds as default max)
      const estimatedDuration = 8000;

      await new Promise<void>((resolve) => {
        audioManagerRef.current
          .playAudio(line.audio_url!, () => {
            resolve();
          })
          .catch(() => {
            resolve();
          });

        // Timeout as fallback
        const timeoutId = setTimeout(() => {
          resolve();
        }, estimatedDuration);

        playAllIntervalRef.current = timeoutId;
      });

      // Play next line
      playNext(index + 1);
    };

    playNext(0);
  }, [lines]);

  // Toggle play all
  const togglePlayAll = useCallback(async () => {
    if (isPlayingAll) {
      await stopAllAudio();
    } else {
      await playAllSequentially();
    }
  }, [isPlayingAll, stopAllAudio, playAllSequentially]);

  // Cleanup on unmount
  useEffect(() => {
    const audioManager = audioManagerRef.current;
    return () => {
      if (playAllIntervalRef.current) {
        clearTimeout(playAllIntervalRef.current);
      }
      audioManager.stopAudio();
    };
  }, []);

  return {
    currentPlayingIdx,
    isPlayingAll,
    playLineAudio,
    togglePlayAll,
    stopAllAudio,
  };
};
