import { setAudioModeAsync, type AudioSource } from "expo-audio";

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
    if (this.player) return;
    const mod: any = require("expo-audio");

    this.player =
      mod.getOrCreateSharedPlayer?.() ||
      mod.SharedPlayer ||
      mod.createAudioPlayer?.();

    if (!this.player) {
      throw new Error("expo-audio player unavailable");
    }
  }

  async initializeAudio(): Promise<void> {
    try {
      await setAudioModeAsync({
        playsInSilentMode: true,
        interruptionMode: "duckOthers",
        interruptionModeAndroid: "duckOthers",
        shouldPlayInBackground: false,
      });
    } catch (error) {
      console.error("Error setting audio mode:", error);
    }
  }

  async playAudio(uri: string, onFinish?: () => void, seekPosition = 0): Promise<boolean> {
    try {
      await this.initializeAudio();
      await this.ensurePlayer();
      await this.stopAndCleanup();

      this.onAudioFinishCallback = onFinish || null;

      const source: AudioSource = { uri };
      try { await this.player.seekTo?.(0); } catch {}
      this.player.replace?.(source);

      if (seekPosition > 0) {
        try { await this.player.seekTo?.(seekPosition); } catch {}
      }

      this.player.play?.();
      this.isPlaying = true;
      this.startPolling();
      return true;
    } catch (error) {
      console.error("Error playing audio:", error);
      this.isPlaying = false;
      return false;
    }
  }

  async stopAudio(): Promise<void> {
    await this.stopAndCleanup();
  }

  async seekTo(seconds: number): Promise<void> {
    try {
      await this.player?.seekTo?.(seconds);
      this.lastKnownPosition = seconds;
    } catch {}
  }

  setRate(rate: number): void {
    try {
      if (this.player) this.player.rate = rate;
    } catch {}
  }

  getPosition(): number { return this.lastKnownPosition; }
  getDuration(): number { return this.lastKnownDuration; }
  getIsPlaying(): boolean { return this.isPlaying; }

  addStatusListener(cb: StatusListener): void {
    this.statusListeners.add(cb);
  }

  removeStatusListener(cb: StatusListener): void {
    this.statusListeners.delete(cb);
  }

  private async stopAndCleanup(): Promise<void> {
    this.stopPolling();
    if (this.player) {
      try {
        this.player.pause?.();
        await this.player.seekTo?.(0);
      } catch (error) {
        console.error("Error stopping audio:", error);
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
          this.statusListeners.forEach((cb) => cb({ position, duration }));
        }
      } catch {
        // ignore polling errors
      }
    }, 400);
  }

  private stopPolling() {
    if (this.pollId) {
      clearInterval(this.pollId);
      this.pollId = null;
    }
  }
}
