import React, { useEffect, useRef, useCallback } from "react";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";

export interface PlayAudioProps {
  audioURL: string;
  play?: boolean;
  loop?: boolean;
  volume?: number;
  rate?: number;
  onPlaybackStatusUpdate?: (status: {
    isPlaying: boolean;
    isLoaded: boolean;
    isBuffering: boolean;
    currentTime: number;
    duration: number;
    didJustFinish: boolean;
  }) => void;
  onLoad?: () => void;
  onError?: (error: string) => void;
  onFinish?: () => void;
  shouldCorrectPitch?: boolean;
  autoPlay?: boolean;
  resetOnSourceChange?: boolean;
}

export interface PlayAudioRef {
  play: () => Promise<void>;
  pause: () => void;
  stop: () => void;
  seekTo: (seconds: number) => void;
  setVolume: (volume: number) => void;
  setRate: (rate: number, shouldCorrectPitch?: boolean) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  isPlaying: () => boolean;
  isLoaded: () => boolean;
  replay: () => Promise<void>;
}

const PlayAudio = React.forwardRef<PlayAudioRef, PlayAudioProps>(
  (
    {
      audioURL,
      play = false,
      loop = false,
      volume = 1.0,
      rate = 1.0,
      onPlaybackStatusUpdate,
      onLoad,
      onError,
      onFinish,
      shouldCorrectPitch = true,
      autoPlay = false,
      resetOnSourceChange = true,
    },
    ref
  ) => {
    const player = useAudioPlayer(audioURL, { updateInterval: 100 });
    const status = useAudioPlayerStatus(player);

    // refs (no setState-in-effect)
    const prevURLRef = useRef<string>(audioURL);
    const internallyControlledRef = useRef<boolean>(false);
    const isPlayingRef = useRef<boolean>(false);
    const hasFinishedRef = useRef<boolean>(false);
    const volumeRef = useRef<number>(volume);
    const rateRef = useRef<number>(rate);
    const didCallOnLoadRef = useRef<boolean>(false);

    // Source changes
    useEffect(() => {
      if (prevURLRef.current === audioURL) return;

      const wasPlaying = isPlayingRef.current;

      // pause current
      if (wasPlaying) {
        try {
          player.pause();
        } catch {}
      }

      hasFinishedRef.current = false;
      didCallOnLoadRef.current = false;

      // reset position if configured and loaded
      if (resetOnSourceChange && status.isLoaded) {
        try {
          player.seekTo(0);
        } catch {}
      }

      prevURLRef.current = audioURL;

      // auto-play if needed
      if ((wasPlaying || autoPlay) && status.isLoaded) {
        const t = setTimeout(() => {
          try {
            internallyControlledRef.current = true;
            player.play();
          } catch {
            onError?.("Failed to auto-play after source change");
          } finally {
            internallyControlledRef.current = false;
          }
        }, 80);

        return () => clearTimeout(t);
      }
    }, [audioURL, autoPlay, onError, player, resetOnSourceChange, status.isLoaded]);

    // Rate changes
    useEffect(() => {
      if (!status.isLoaded) return;
      if (rateRef.current === rate) return;

      rateRef.current = rate;
      try {
        player.setPlaybackRate(rate, shouldCorrectPitch ? "high" : "low");
      } catch (error) {
        console.warn("Failed to set playback rate:", error);
      }
    }, [player, rate, shouldCorrectPitch, status.isLoaded]);

    // Volume changes (expo-audio API pending; keep as ref)
    useEffect(() => {
      volumeRef.current = Math.max(0, Math.min(1, volume));
    }, [volume]);

    // External play prop (NO setState here)
    useEffect(() => {
      if (!status.isLoaded) return;

      // If parent says play, start (unless already playing or finished)
      if (play && !isPlayingRef.current && !hasFinishedRef.current) {
        try {
          internallyControlledRef.current = false;
          player.play();
        } catch {
          onError?.("Failed to play audio");
        }
      }

      // If parent says stop/pause, pause ONLY if playback was not triggered internally
      if (!play && isPlayingRef.current && !internallyControlledRef.current) {
        try {
          player.pause();
        } catch {
          onError?.("Failed to pause audio");
        }
      }
    }, [play, onError, player, status.isLoaded]);

    // Status updates
    useEffect(() => {
      if (!status) return;

      const wasPlaying = isPlayingRef.current;
      isPlayingRef.current = !!status.playing;

      // fire onLoad once per URL when loaded
      if (status.isLoaded && !didCallOnLoadRef.current) {
        didCallOnLoadRef.current = true;
        onLoad?.();
      }

      // finish handling
      if (status.didJustFinish && !hasFinishedRef.current) {
        hasFinishedRef.current = true;
        onFinish?.();

        if (loop && status.isLoaded) {
          try {
            player.seekTo(0);
            player.play();
            hasFinishedRef.current = false;
          } catch {
            onError?.("Failed to loop audio");
          }
        }
      }

      // reset finish when playback restarts near beginning
      if (status.playing && status.currentTime < 1) {
        hasFinishedRef.current = false;
      }

      // status callback
      onPlaybackStatusUpdate?.({
        isPlaying: !!status.playing,
        isLoaded: !!status.isLoaded,
        isBuffering: !!status.isBuffering,
        currentTime: status.currentTime ?? 0,
        duration: status.duration ?? 0,
        didJustFinish: !!status.didJustFinish,
      });

      // if load callback should only happen when transitioning loaded and not playing, you can refine here.
      void wasPlaying;
    }, [status, loop, player, onFinish, onLoad, onPlaybackStatusUpdate, onError]);

    // Imperative methods
    const playAudio = useCallback(async () => {
      if (!status.isLoaded) {
        const msg = "Audio not loaded or player not available";
        onError?.(msg);
        throw new Error(msg);
      }
      try {
        internallyControlledRef.current = true;
        hasFinishedRef.current = false;
        await player.play();
      } catch {
        onError?.("Failed to play audio");
        throw new Error("Failed to play audio");
      } finally {
        internallyControlledRef.current = false;
      }
    }, [onError, player, status.isLoaded]);

    const pauseAudio = useCallback(() => {
      if (!status.isLoaded) return;
      try {
        internallyControlledRef.current = true;
        player.pause();
      } catch {
        onError?.("Failed to pause audio");
      } finally {
        internallyControlledRef.current = false;
      }
    }, [onError, player, status.isLoaded]);

    const stopAudio = useCallback(() => {
      if (!status.isLoaded) return;
      try {
        internallyControlledRef.current = true;
        player.pause();
        player.seekTo(0);
        hasFinishedRef.current = false;
      } catch {
        onError?.("Failed to stop audio");
      } finally {
        internallyControlledRef.current = false;
      }
    }, [onError, player, status.isLoaded]);

    const seekToPosition = useCallback(
      (seconds: number) => {
        if (!status.isLoaded || !(status.duration > 0)) return;
        try {
          const clamped = Math.max(0, Math.min(seconds, status.duration));
          player.seekTo(clamped);
          hasFinishedRef.current = false;
        } catch {
          onError?.("Failed to seek audio");
        }
      },
      [onError, player, status.duration, status.isLoaded]
    );

    const setVolumeLevel = useCallback((newVolume: number) => {
      volumeRef.current = Math.max(0, Math.min(1, newVolume));

      console.warn("Volume control not yet implemented in expo-audio");
    }, []);

    const setPlaybackRate = useCallback(
      (newRate: number, correctPitch: boolean = shouldCorrectPitch) => {
        if (!status.isLoaded) return;
        try {
          const clamped = Math.max(0.25, Math.min(4.0, newRate));
          rateRef.current = clamped;
          player.setPlaybackRate(clamped, correctPitch ? "high" : "low");
        } catch {
          onError?.("Failed to set playback rate");
        }
      },
      [onError, player, shouldCorrectPitch, status.isLoaded]
    );

    const getCurrentTime = useCallback(() => status?.currentTime || 0, [status?.currentTime]);
    const getDuration = useCallback(() => status?.duration || 0, [status?.duration]);
    const getIsPlaying = useCallback(() => !!status?.playing, [status?.playing]);
    const getIsLoaded = useCallback(() => !!status?.isLoaded, [status?.isLoaded]);

    const replayAudio = useCallback(async () => {
      if (!status.isLoaded) {
        const msg = "Audio not loaded or player not available";
        onError?.(msg);
        throw new Error(msg);
      }
      try {
        internallyControlledRef.current = true;
        hasFinishedRef.current = false;
        player.seekTo(0);
        await player.play();
      } catch {
        onError?.("Failed to replay audio");
        throw new Error("Failed to replay audio");
      } finally {
        internallyControlledRef.current = false;
      }
    }, [onError, player, status.isLoaded]);

    React.useImperativeHandle(
      ref,
      () => ({
        play: playAudio,
        pause: pauseAudio,
        stop: stopAudio,
        seekTo: seekToPosition,
        setVolume: setVolumeLevel,
        setRate: setPlaybackRate,
        getCurrentTime,
        getDuration,
        isPlaying: getIsPlaying,
        isLoaded: getIsLoaded,
        replay: replayAudio,
      }),
      [
        playAudio,
        pauseAudio,
        stopAudio,
        seekToPosition,
        setVolumeLevel,
        setPlaybackRate,
        getCurrentTime,
        getDuration,
        getIsPlaying,
        getIsLoaded,
        replayAudio,
      ]
    );

    // Auto-play on mount if specified
    useEffect(() => {
      if (!autoPlay) return;
      if (!status.isLoaded) return;
      if (isPlayingRef.current) return;

      const timer = setTimeout(() => {
        try {
          internallyControlledRef.current = true;
          player.play();
        } catch {
          onError?.("Failed to auto-play on mount");
        } finally {
          internallyControlledRef.current = false;
        }
      }, 80);

      return () => clearTimeout(timer);
    }, [autoPlay, onError, player, status.isLoaded]);

    return null;
  }
);

PlayAudio.displayName = "PlayAudio";
export default PlayAudio;
