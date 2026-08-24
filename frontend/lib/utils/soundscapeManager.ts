import { Platform } from "react-native";

export interface SoundscapeTrack {
  key: string;
  name: string;
  emoji: string;
  icon: string;
  url: string;
  description: string;
}

export const SOUNDSCAPE_TRACKS: SoundscapeTrack[] = [
  {
    key: "rain",
    name: "Rain on Windowpane",
    emoji: "🌧️",
    icon: "CloudRain",
    url: "https://multicamp-prod-storage.nbg1.your-objectstorage.com/Liiro-Ebook-Prod/ambient/rain_windowpane.mp3",
    description: "Gentle raindrops falling against a glass windowpane.",
  },
  {
    key: "fireplace",
    name: "Cozy Fireplace Crackle",
    emoji: "🔥",
    icon: "Flame",
    url: "https://multicamp-prod-storage.nbg1.your-objectstorage.com/Liiro-Ebook-Prod/ambient/fireplace_crackle.mp3",
    description: "Warm hearth crackling embers in a quiet reading room.",
  },
  {
    key: "forest",
    name: "Mystic Forest Wind",
    emoji: "🌲",
    icon: "Trees",
    url: "https://multicamp-prod-storage.nbg1.your-objectstorage.com/Liiro-Ebook-Prod/ambient/mystic_forest.mp3",
    description: "Rustling pine leaves and soft mountain breezes.",
  },
  {
    key: "coffeeshop",
    name: "Quiet Coffee Shop",
    emoji: "☕",
    icon: "Coffee",
    url: "https://multicamp-prod-storage.nbg1.your-objectstorage.com/Liiro-Ebook-Prod/ambient/coffee_shop.mp3",
    description: "Distanced cafe chatter and warm ceramic cup sounds.",
  },
  {
    key: "gothic",
    name: "Victorian Gothic Library",
    emoji: "🏰",
    icon: "Castle",
    url: "https://multicamp-prod-storage.nbg1.your-objectstorage.com/Liiro-Ebook-Prod/ambient/gothic_library.mp3",
    description: "Old clock pendulum ticking in a grand silent library.",
  },
];

class SoundscapeManager {
  private audioElement: HTMLAudioElement | null = null;
  private currentKey: string | null = null;
  private isPlaying: boolean = false;
  private volume: number = 0.4;
  private listeners: Set<(state: { isPlaying: boolean; activeKey: string | null; volume: number }) => void> = new Set();

  constructor() {
    if (typeof window !== "undefined") {
      this.audioElement = new Audio();
      this.audioElement.loop = true;
      this.audioElement.volume = this.volume;
    }
  }

  public playSoundscape(key: string): void {
    const track = SOUNDSCAPE_TRACKS.find((t) => t.key === key);
    if (!track) return;

    if (this.currentKey === key && this.isPlaying) {
      this.pauseSoundscape();
      return;
    }

    this.currentKey = key;
    this.isPlaying = true;

    if (this.audioElement) {
      this.audioElement.src = track.url;
      this.audioElement.volume = this.volume;
      this.audioElement.play().catch((err) => console.warn("Ambient playback error:", err));
    }
    this.notify();
  }

  public pauseSoundscape(): void {
    this.isPlaying = false;
    if (this.audioElement) {
      this.audioElement.pause();
    }
    this.notify();
  }

  public stopSoundscape(): void {
    this.isPlaying = false;
    this.currentKey = null;
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.currentTime = 0;
    }
    this.notify();
  }

  public setVolume(vol: number): void {
    const clamped = Math.max(0, Math.min(1, vol));
    this.volume = clamped;
    if (this.audioElement) {
      this.audioElement.volume = clamped;
    }
    this.notify();
  }

  public getState() {
    return {
      isPlaying: this.isPlaying,
      activeKey: this.currentKey,
      volume: this.volume,
    };
  }

  public subscribe(listener: (state: { isPlaying: boolean; activeKey: string | null; volume: number }) => void): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => this.listeners.delete(listener);
  }

  private notify() {
    const state = this.getState();
    this.listeners.forEach((l) => l(state));
  }
}

export const soundscapeManager = new SoundscapeManager();
