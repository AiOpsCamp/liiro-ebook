import { AudioManager } from "@/lib/utils/audioManager";

export class AudioPlayer {
  private static audioMgr = AudioManager.getInstance();

  static async play(audioUrl: string, onFinish?: () => void, seekPosition = 0): Promise<boolean> {
    return await this.audioMgr.playAudio(audioUrl, onFinish, seekPosition);
  }

  static async pause(): Promise<void> {
    await this.audioMgr.pauseAudio();
  }

  static async stop(): Promise<void> {
    await this.audioMgr.stopAudio();
  }

  static async seekTo(seconds: number): Promise<void> {
    await this.audioMgr.seekTo(seconds);
  }

  static setRate(rate: number): void {
    this.audioMgr.setRate(rate);
  }

  static getPosition(): number {
    return this.audioMgr.getPosition();
  }

  static getDuration(): number {
    return this.audioMgr.getDuration();
  }

  static isPlaying(): boolean {
    return this.audioMgr.getIsPlaying();
  }

  static addStatusListener(cb: (status: { position: number; duration: number }) => void): void {
    this.audioMgr.addStatusListener(cb);
  }

  static removeStatusListener(cb: (status: { position: number; duration: number }) => void): void {
    this.audioMgr.removeStatusListener(cb);
  }
}
