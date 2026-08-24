import { Platform } from "react-native";
import { setAudioModeAsync, type AudioSource } from "expo-audio";
import { getToken } from "@/lib/utils";

type AudioStatus = {
  isLoaded?: boolean;
  playing?: boolean;
  buffering?: boolean;
  duration?: number;
  position?: number;
  didJustFinish?: boolean;
  [k: string]: any;
};

type StatusListener = (status: { position: number; duration: number }) => void;

export class AudioManager {
  private static instance: AudioManager;
  private player: any | null = null;
  private webAudioEl: any | null = null;
  private pollId: any | null = null;

  private isPlaying = false;
  private onAudioFinishCallback: (() => void) | null = null;
  private statusListeners = new Set<StatusListener>();
  private lastKnownPosition = 0;
  private lastKnownDuration = 0;

  static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  private async ensurePlayer() {
    if (this.player || this.webAudioEl) return;

    if (Platform.OS === "web" && typeof window !== "undefined") {
      this.webAudioEl = new (window as any).Audio();
      return;
    }

    try {
      const mod: any = require("expo-audio");
      this.player =
        mod.getOrCreateSharedPlayer?.() ||
        mod.SharedPlayer ||
        mod.createAudioPlayer?.();
    } catch (err) {
      console.warn("expo-audio native player initialization failed, falling back to Web Audio", err);
      if (typeof window !== "undefined") {
        this.webAudioEl = new (window as any).Audio();
      }
    }
  }

  async initializeAudio(): Promise<void> {
    try {
      if (Platform.OS !== "web") {
        await setAudioModeAsync({
          playsInSilentMode: true,
          interruptionMode: "duckOthers",
          interruptionModeAndroid: "duckOthers",
          shouldPlayInBackground: true,
        });
      }
    } catch (error) {
      console.error("Error setting audio mode:", error);
    }
  }

  /**
   * Resolve DRM signed stream token if given a story slug
   */
  async resolveDrmStreamUrl(storySlug: string, chapterNumber = 1, voice = "adam"): Promise<string> {
    const apiBase = process.env.EXPO_PUBLIC_API_URL || "http://localhost:5012/api/v1";
    const tokenUrl = `${apiBase.replace(/\/$/, "")}/stories/slug/${storySlug}/stream-token?chapterNumber=${chapterNumber}&voice=${voice}`;
    
    try {
      const token = await getToken("token");
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(tokenUrl, { headers });
      const json = await res.json();
      if (json.success && json.signedStreamUrl) {
        return json.signedStreamUrl;
      }
    } catch (e) {
      console.warn("Failed to fetch DRM stream token, falling back to direct stream URL", e);
    }

    return `${apiBase.replace(/\/$/, "")}/stories/slug/${storySlug}/stream`;
  }

  private formatAudioUrl(url: string | null | undefined): string {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:") || url.startsWith("file:")) {
      return url;
    }
    const apiBase = process.env.EXPO_PUBLIC_API_URL || "http://localhost:5012/api/v1";
    const backendHost = apiBase.replace(/\/api\/v1\/?$/, "");
    return `${backendHost.replace(/\/$/, "")}/${url.replace(/^\//, "")}`;
  }

  async playAudio(uri: string, onFinish?: () => void, seekPosition = 0): Promise<boolean> {
    try {
      if (!uri) {
        console.warn("Cannot play audio: Empty or undefined URI provided");
        return false;
      }

      const formattedUri = this.formatAudioUrl(uri);
      await this.initializeAudio();
      await this.ensurePlayer();
      await this.stopAndCleanup();

      this.onAudioFinishCallback = onFinish || null;

      if (this.webAudioEl) {
        if (this.webAudioEl.src !== formattedUri) {
          this.webAudioEl.src = formattedUri;
          try { this.webAudioEl.load(); } catch {}
        }

        this.webAudioEl.onended = () => {
          const cb = this.onAudioFinishCallback;
          this.cleanup();
          cb?.();
        };

        try {
          await this.webAudioEl.play();
          if (seekPosition > 0) {
            try { this.webAudioEl.currentTime = seekPosition; } catch {}
          }
          this.isPlaying = true;
          this.startPolling();
          return true;
        } catch (playErr) {
          console.warn("Immediate Web Audio play error, trying canplay listener...", playErr);

          return new Promise<boolean>((resolve) => {
            let resolved = false;
            const cleanupListeners = () => {
              if (this.webAudioEl) {
                this.webAudioEl.removeEventListener("canplay", onCanPlay);
                this.webAudioEl.removeEventListener("error", onError);
              }
            };

            const onCanPlay = async () => {
              if (resolved) return;
              resolved = true;
              cleanupListeners();
              try {
                await this.webAudioEl.play();
                if (seekPosition > 0) {
                  try { this.webAudioEl.currentTime = seekPosition; } catch {}
                }
                this.isPlaying = true;
                this.startPolling();
                resolve(true);
              } catch (retryErr) {
                console.warn("Retry Web Audio play error:", retryErr);
                this.isPlaying = false;
                resolve(false);
              }
            };

            const onError = (err: any) => {
              if (resolved) return;
              resolved = true;
              cleanupListeners();
              console.warn("Web Audio media load error:", err);
              this.isPlaying = false;
              resolve(false);
            };

            if (this.webAudioEl.readyState >= 3) {
              onCanPlay();
            } else {
              this.webAudioEl.addEventListener("canplay", onCanPlay);
              this.webAudioEl.addEventListener("error", onError);
            }

            setTimeout(() => {
              if (!resolved) {
                resolved = true;
                cleanupListeners();
                console.warn("Web Audio play timeout");
                this.isPlaying = false;
                resolve(false);
              }
            }, 4000);
          });
        }
      }

      if (this.player) {
        const source: AudioSource = { uri: formattedUri };
        try { await this.player.seekTo?.(0); } catch {}
        this.player.replace?.(source);

        if (seekPosition > 0) {
          try { await this.player.seekTo?.(seekPosition); } catch {}
        }

        this.player.play?.();
        this.isPlaying = true;
        this.startPolling();
        return true;
      }

      return false;
    } catch (error) {
      console.error("Error playing audio:", error);
      this.isPlaying = false;
      return false;
    }
  }

  async pauseAudio(): Promise<void> {
    if (this.webAudioEl) {
      this.webAudioEl.pause();
    }
    if (this.player) {
      this.player.pause?.();
    }
    this.isPlaying = false;
  }

  async resumeAudio(): Promise<void> {
    try {
      if (this.webAudioEl) {
        await this.webAudioEl.play();
      }
      if (this.player) {
        this.player.play?.();
      }
      this.isPlaying = true;
      this.startPolling();
    } catch (err) {
      console.warn("Failed to resume audio playback:", err);
    }
  }

  async stopAudio(): Promise<void> {
    await this.stopAndCleanup();
  }

  async seekTo(seconds: number): Promise<void> {
    try {
      if (this.webAudioEl) {
        this.webAudioEl.currentTime = seconds;
      }
      if (this.player) {
        await this.player.seekTo?.(seconds);
      }
      this.lastKnownPosition = seconds;
    } catch {}
  }

  setRate(rate: number): void {
    try {
      if (this.webAudioEl) {
        this.webAudioEl.playbackRate = rate;
      }
      if (this.player) {
        this.player.rate = rate;
      }
    } catch {}
  }

  setVolume(volume: number): void {
    const safeVol = Math.max(0, Math.min(1, volume));
    try {
      if (this.webAudioEl) {
        this.webAudioEl.volume = safeVol;
      }
      if (this.player) {
        this.player.volume = safeVol;
      }
    } catch {}
  }

  getPosition(): number { return this.lastKnownPosition; }
  getDuration(): number { return this.lastKnownDuration; }
  getIsPlaying(): boolean { return this.isPlaying; }
  getWebAudioElement(): any {
    if (!this.webAudioEl && Platform.OS === "web" && typeof window !== "undefined") {
      this.webAudioEl = new (window as any).Audio();
    }
    return this.webAudioEl;
  }

  addStatusListener(cb: StatusListener): void {
    this.statusListeners.add(cb);
  }

  removeStatusListener(cb: StatusListener): void {
    this.statusListeners.delete(cb);
  }

  subscribeStatus(cb: StatusListener): void {
    this.addStatusListener(cb);
  }

  unsubscribeStatus(cb: StatusListener): void {
    this.removeStatusListener(cb);
  }

  // ── BookBeat Sleep Timer & Dynamic Fade Engine ──────────────────────────────
  private sleepTimerId: any | null = null;
  private sleepTimerEndMs: number | null = null;
  private isEndOfChapterMode = false;
  private fadeIntervalId: any | null = null;

  setSleepTimer(minutes: number | "end_of_chapter"): void {
    this.cancelSleepTimer();

    if (minutes === "end_of_chapter") {
      this.isEndOfChapterMode = true;
      this.sleepTimerEndMs = null;
      console.log("🌙 Sleep timer set to End of Chapter");
      return;
    }

    const durationMs = minutes * 60 * 1000;
    this.sleepTimerEndMs = Date.now() + durationMs;
    this.isEndOfChapterMode = false;

    console.log(`🌙 Sleep timer set for ${minutes} minutes (Expires at ${new Date(this.sleepTimerEndMs).toLocaleTimeString()})`);

    this.sleepTimerId = setTimeout(() => {
      this.triggerSleepTimerExpiration();
    }, durationMs);
  }

  extendSleepTimer(extraMinutes = 15): void {
    const currentRemainingSec = this.getRemainingSleepTimerSeconds();
    const newMinutes = Math.ceil(currentRemainingSec / 60) + extraMinutes;
    this.setSleepTimer(newMinutes);
  }

  cancelSleepTimer(): void {
    if (this.sleepTimerId) {
      clearTimeout(this.sleepTimerId);
      this.sleepTimerId = null;
    }
    if (this.fadeIntervalId) {
      clearInterval(this.fadeIntervalId);
      this.fadeIntervalId = null;
    }
    this.sleepTimerEndMs = null;
    this.isEndOfChapterMode = false;
    this.setVolume(1.0);
  }

  getRemainingSleepTimerSeconds(): number {
    if (this.isEndOfChapterMode) return -1; // -1 represents End of Chapter
    if (!this.sleepTimerEndMs) return 0;
    const diff = Math.max(0, Math.floor((this.sleepTimerEndMs - Date.now()) / 1000));
    return diff;
  }

  private async triggerSleepTimerExpiration(): Promise<void> {
    console.log("🌙 Sleep timer expiring, initiating dynamic volume fade-out...");
    await this.fadeVolume(0, 5000); // Smooth 5-second fade-out
    await this.pauseAudio();
    this.cancelSleepTimer();
  }

  async fadeVolume(targetVolume = 0, durationMs = 3000): Promise<void> {
    const steps = 20;
    const intervalMs = durationMs / steps;
    let currentStep = 0;
    const initialVolume = 1.0;

    return new Promise((resolve) => {
      this.fadeIntervalId = setInterval(() => {
        currentStep++;
        const factor = 1 - currentStep / steps;
        const vol = Math.max(targetVolume, initialVolume * factor);
        this.setVolume(vol);

        if (currentStep >= steps) {
          clearInterval(this.fadeIntervalId);
          this.fadeIntervalId = null;
          resolve();
        }
      }, intervalMs);
    });
  }

  private async stopAndCleanup(): Promise<void> {
    this.stopPolling();
    if (this.webAudioEl) {
      try {
        this.webAudioEl.pause();
        this.webAudioEl.currentTime = 0;
      } catch {}
    }
    if (this.player) {
      try {
        this.player.pause?.();
        await this.player.seekTo?.(0);
      } catch (error) {
        console.error("Error stopping native audio player:", error);
      }
    }
    this.isPlaying = false;
    this.onAudioFinishCallback = null;
  }

  private cleanup(): void {
    this.stopPolling();
    this.isPlaying = false;
    this.onAudioFinishCallback = null;
  }

  async dispose(): Promise<void> {
    await this.stopAndCleanup();
  }

  private startPolling() {
    this.stopPolling();
    this.pollId = setInterval(async () => {
      try {
        if (this.webAudioEl) {
          const position = this.webAudioEl.currentTime || 0;
          const duration = this.webAudioEl.duration || 0;
          this.lastKnownPosition = position;
          this.lastKnownDuration = duration;
          this.updateMediaSessionPositionState(position, duration);
          this.statusListeners.forEach((cb) => cb({ position, duration }));
          return;
        }

        if (this.player) {
          const status: AudioStatus = await this.player?.getStatus?.();
          if (status?.didJustFinish) {
            const cb = this.onAudioFinishCallback;
            this.cleanup();
            cb?.();
          } else if (this.isPlaying && status) {
            const position = status.position ?? this.lastKnownPosition;
            const duration = status.duration ?? this.lastKnownDuration;
            this.lastKnownPosition = position;
            this.lastKnownDuration = duration;
            this.updateMediaSessionPositionState(position, duration);
            this.statusListeners.forEach((cb) => cb({ position, duration }));
          }
        }
      } catch {
        // ignore polling errors
      }
    }, 300);
  }

  private updateMediaSessionPositionState(position: number, duration: number) {
    if (Platform.OS === "web" && typeof window !== "undefined" && "mediaSession" in navigator && (navigator.mediaSession as any).setPositionState) {
      if (duration > 0 && position >= 0 && position <= duration) {
        try {
          (navigator.mediaSession as any).setPositionState({
            duration: Math.max(0, duration),
            playbackRate: 1.0,
            position: Math.max(0, Math.min(position, duration)),
          });
        } catch {}
      }
    }
  }

  private stopPolling() {
    if (this.pollId) {
      clearInterval(this.pollId);
      this.pollId = null;
    }
  }

  /**
   * Update CarPlay & Android Auto Automotive Dashboard MediaSession Controls
   */
  updateCarPlayMediaSessionMetadata(metadata: {
    title: string;
    artist: string;
    album: string;
    artworkUrl?: string;
  }): void {
    if (Platform.OS === "web" && typeof window !== "undefined" && "mediaSession" in navigator) {
      try {
        navigator.mediaSession.metadata = new (window as any).MediaMetadata({
          title: metadata.title,
          artist: metadata.artist,
          album: metadata.album,
          artwork: metadata.artworkUrl
            ? [
                { src: metadata.artworkUrl, sizes: "96x96", type: "image/png" },
                { src: metadata.artworkUrl, sizes: "128x128", type: "image/png" },
                { src: metadata.artworkUrl, sizes: "192x192", type: "image/png" },
                { src: metadata.artworkUrl, sizes: "512x512", type: "image/png" },
              ]
            : [],
        });

        // Register Automotive Action Controls (CarPlay / Android Auto)
        navigator.mediaSession.setActionHandler("play", () => {
          this.resumeAudio();
          navigator.mediaSession.playbackState = "playing";
        });
        navigator.mediaSession.setActionHandler("pause", () => {
          this.pauseAudio();
          navigator.mediaSession.playbackState = "paused";
        });
        navigator.mediaSession.setActionHandler("seekbackward", () => {
          const newPos = Math.max(0, this.lastKnownPosition - 15);
          this.seekTo(newPos);
        });
        navigator.mediaSession.setActionHandler("seekforward", () => {
          const newPos = this.lastKnownPosition + 15;
          this.seekTo(newPos);
        });
      } catch (err) {
        console.warn("MediaSession CarPlay metadata initialization warning:", err);
      }
    }
  }
}
