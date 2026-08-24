import { Platform } from "react-native";

export type ActivityType =
  | "started_reading"
  | "paused_reading"
  | "completed_chapter"
  | "started_listening"
  | "paused_listening"
  | "completed_audiobook"
  | "changed_language"
  | "added_bookmark"
  | "achieved_streak";

export interface LogActivityPayload {
  activityType: ActivityType;
  storyId?: string;
  storySlug: string;
  storyTitle: string;
  chapterNumber?: number;
  chapterTitle?: string;
  activeLang?: string;
  readingMode?: "text" | "audiobook" | "slideshow";
  positionSec?: number;
  progressPercent?: number;
}

export class ActivityTracker {
  static async log(payload: LogActivityPayload): Promise<boolean> {
    try {
      const apiBase = process.env.EXPO_PUBLIC_API_URL || "http://localhost:5012/api/v1";
      const res = await fetch(`${apiBase}/user/activities`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...payload,
          deviceType: Platform.OS === "web" ? "web" : Platform.OS,
        }),
      });
      const json = await res.json();
      return json.success || false;
    } catch (err) {
      console.warn("Failed to log user activity:", err);
      return false;
    }
  }
}
