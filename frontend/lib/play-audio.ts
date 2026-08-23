import { setAudioModeAsync } from "expo-audio";
import { getNormalizedAudioUrl } from "@/components/words/AudioUtils";

type AudioStatus = {
  isLoaded?: boolean;
  playing?: boolean;
  buffering?: boolean;
  duration?: number;
  position?: number;
  didJustFinish?: boolean;
  [k: string]: any;
};

export class AudioPlayer {
  private static player: any | null = null;
  private static statusCallback: ((status: AudioStatus) => void) | null = null;
  private static pollId: any | null = null;

  private static async ensurePlayer() {
    if (!this.player) {
      this.player =
        (require("expo-audio") as any).getOrCreateSharedPlayer?.() ??
        (require("expo-audio") as any).SharedPlayer;

      if (!this.player?.replace) {
        this.player = (require("expo-audio") as any).createAudioPlayer?.();
      }

      try {
        await setAudioModeAsync({
          playsInSilentMode: true,
          interruptionMode: "duckOthers",
          interruptionModeAndroid: "duckOthers",
          shouldPlayInBackground: false,
        });
      } catch {
        // ignore
      }
    }
  }

  private static startPolling() {
    this.stopPolling();
    this.pollId = setInterval(async () => {
      try {
        const status: AudioStatus = await this.player?.getStatus?.();
        if (status) {
          this.statusCallback?.(status);
          if (status.didJustFinish) {
            this.stopPolling();
          }
        }
      } catch {}
    }, 400);
  }

  private static stopPolling() {
    if (this.pollId) {
      clearInterval(this.pollId);
      this.pollId = null;
    }
  }

  static async playAudio(url: string): Promise<void> {
    try {
      await this.ensurePlayer();

      const normalizedUrl = getNormalizedAudioUrl(url);
      if (!normalizedUrl) return;

      try {
        await this.player.seekTo?.(0);
      } catch {}
      this.player.replace?.({ uri: normalizedUrl });
      this.player.play?.();

      this.startPolling();

      this.statusCallback?.({
        isLoaded: true,
        playing: true,
        buffering: false,
        didJustFinish: false,
      });
    } catch (error) {
      console.error("Error playing audio:", error);
    }
  }

  static async stopAudio(): Promise<void> {
    if (!this.player) return;
    try {
      this.player.pause?.();
      await this.player.seekTo?.(0);
    } catch {
      // ignore
    } finally {
      this.stopPolling();
      this.statusCallback?.({
        isLoaded: true,
        playing: false,
        buffering: false,
        didJustFinish: true,
      });
    }
  }

  static async pauseAudio(): Promise<void> {
    if (!this.player) return;
    try {
      this.player.pause?.();
      const status: AudioStatus = (await this.player.getStatus?.()) ?? { isLoaded: true };
      this.statusCallback?.({
        ...status,
        playing: false,
      });
    } catch {
      // ignore
    }
  }

  static async resumeAudio(): Promise<void> {
    if (!this.player) return;
    try {
      this.player.play?.();
      this.startPolling();
      const status: AudioStatus = (await this.player.getStatus?.()) ?? { isLoaded: true };
      this.statusCallback?.({
        ...status,
        playing: true,
      });
    } catch {
      // ignore
    }
  }

  static async isPlaying(): Promise<boolean> {
    if (!this.player) return false;
    try {
      const status: AudioStatus = await this.player.getStatus?.();
      return !!(status?.isLoaded && status.playing);
    } catch {
      return false;
    }
  }

  static setStatusCallback(callback: (status: AudioStatus) => void) {
    this.statusCallback = callback;
  }
}
