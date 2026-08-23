import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getToken } from "@/lib/utils";

let FileSystem: any = null;
if (Platform.OS !== "web") {
  try {
    FileSystem = require("expo-file-system");
  } catch (e) {
    console.warn("expo-file-system unavailable on this platform");
  }
}

const OFFLINE_INDEX_KEY = "liiro_offline_index";

export interface DownloadedBookMeta {
  slug: string;
  title: string;
  coverImageUrl?: string;
  downloadedAt: string;
  totalChapters: number;
  totalSizeBytes: number;
}

/**
 * Enterprise Offline Chapter & Audio Downloader Service
 * Manages downloading ebook text payloads and audio files locally for offline reading/listening.
 */
class OfflineManager {
  private static instance: OfflineManager;

  static getInstance(): OfflineManager {
    if (!OfflineManager.instance) {
      OfflineManager.instance = new OfflineManager();
    }
    return OfflineManager.instance;
  }

  private getBookDir(slug: string): string {
    if (!FileSystem || !FileSystem.documentDirectory) return "";
    return `${FileSystem.documentDirectory}offline_books/${slug}/`;
  }

  /**
   * Get list of all locally downloaded books
   */
  async getDownloadedBooks(): Promise<DownloadedBookMeta[]> {
    try {
      const json = await AsyncStorage.getItem(OFFLINE_INDEX_KEY);
      return json ? JSON.parse(json) : [];
    } catch {
      return [];
    }
  }

  /**
   * Check if a specific story is downloaded
   */
  async isBookDownloaded(slug: string): Promise<boolean> {
    const list = await this.getDownloadedBooks();
    return list.some((b) => b.slug === slug);
  }

  /**
   * Download complete story text and chapter audio files
   */
  async downloadBook(slug: string, onProgress?: (pct: number) => void): Promise<boolean> {
    try {
      const apiBase = process.env.EXPO_PUBLIC_API_URL || "http://localhost:5012/api/v1";
      const token = await getToken("token");
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      onProgress?.(0.05);

      // 1. Fetch complete Story details + chapter list
      const storyRes = await fetch(`${apiBase.replace(/\/$/, "")}/stories/slug/${slug}`, { headers });
      const storyJson = await storyRes.json();
      if (!storyJson.success || !storyJson.data) {
        throw new Error("Failed to fetch story details for offline download");
      }

      const storyData = storyJson.data;
      const chapters = storyData.chapters || [];
      onProgress?.(0.2);

      let totalSize = JSON.stringify(storyData).length;

      // 2. Download audio files if native FileSystem is available
      if (FileSystem && FileSystem.documentDirectory) {
        const bookDir = this.getBookDir(slug);
        const dirInfo = await FileSystem.getInfoAsync(bookDir);
        if (!dirInfo.exists) {
          await FileSystem.makeDirectoryAsync(bookDir, { intermediates: true });
        }

        // Save story JSON metadata
        const metaPath = `${bookDir}story.json`;
        await FileSystem.writeAsStringAsync(metaPath, JSON.stringify(storyData));

        // Download chapter audio files
        for (let i = 0; i < chapters.length; i++) {
          const ch = chapters[i];
          const audioUrl = ch.audioUrl;
          if (audioUrl) {
            const localAudioPath = `${bookDir}chapter_${ch.chapterNumber || i + 1}.mp3`;
            const downloadRes = await FileSystem.downloadAsync(audioUrl, localAudioPath);
            if (downloadRes.status === 200) {
              const fileInfo = await FileSystem.getInfoAsync(localAudioPath);
              if (fileInfo.exists) totalSize += fileInfo.size || 0;
            }
          }

          const progressPct = 0.2 + ((i + 1) / Math.max(1, chapters.length)) * 0.75;
          onProgress?.(Math.min(0.95, progressPct));
        }
      } else {
        // Fallback for Web: Store story JSON in AsyncStorage
        await AsyncStorage.setItem(`offline_story_${slug}`, JSON.stringify(storyData));
      }

      // 3. Update Offline Index
      const existing = await this.getDownloadedBooks();
      const filtered = existing.filter((b) => b.slug !== slug);
      const newMeta: DownloadedBookMeta = {
        slug,
        title: typeof storyData.title === "object" ? storyData.title.en : storyData.title || slug,
        coverImageUrl: storyData.coverImageUrl,
        downloadedAt: new Date().toISOString(),
        totalChapters: chapters.length,
        totalSizeBytes: totalSize,
      };

      filtered.unshift(newMeta);
      await AsyncStorage.setItem(OFFLINE_INDEX_KEY, JSON.stringify(filtered));

      onProgress?.(1.0);
      return true;
    } catch (error) {
      console.error(`Error downloading book '${slug}' for offline use:`, error);
      return false;
    }
  }

  /**
   * Retrieve locally cached story data for offline reading
   */
  async getOfflineStory(slug: string): Promise<any | null> {
    try {
      if (FileSystem && FileSystem.documentDirectory) {
        const metaPath = `${this.getBookDir(slug)}story.json`;
        const fileInfo = await FileSystem.getInfoAsync(metaPath);
        if (fileInfo.exists) {
          const content = await FileSystem.readAsStringAsync(metaPath);
          return JSON.parse(content);
        }
      }

      const webContent = await AsyncStorage.getItem(`offline_story_${slug}`);
      return webContent ? JSON.parse(webContent) : null;
    } catch {
      return null;
    }
  }

  /**
   * Delete offline downloaded book and free up storage
   */
  async removeDownloadedBook(slug: string): Promise<boolean> {
    try {
      if (FileSystem && FileSystem.documentDirectory) {
        const bookDir = this.getBookDir(slug);
        const dirInfo = await FileSystem.getInfoAsync(bookDir);
        if (dirInfo.exists) {
          await FileSystem.deleteAsync(bookDir, { idempotent: true });
        }
      }

      await AsyncStorage.removeItem(`offline_story_${slug}`);

      const list = await this.getDownloadedBooks();
      const updated = list.filter((b) => b.slug !== slug);
      await AsyncStorage.setItem(OFFLINE_INDEX_KEY, JSON.stringify(updated));
      return true;
    } catch (error) {
      console.error(`Error deleting downloaded book '${slug}':`, error);
      return false;
    }
  }
}

export const offlineManager = OfflineManager.getInstance();
