"use strict";

/**
 * Whispersync Bi-Directional Position Mapping Service
 * Calculates exact bi-directional sync coordinates between Reading (Paragraph Index) and Listening (Audio Seconds).
 */
class WhispersyncService {
  /**
   * Map Reading Position (Paragraph Index) -> Audio Seconds
   */
  static calculateAudioTimeFromParagraph(chapter, paragraphIndex) {
    if (!chapter) return 0;
    const targetIdx = Math.max(0, parseInt(paragraphIndex) || 0);

    // 1. Try forced alignment word/sentence timestamps
    const timestamps = chapter.timestamps || (chapter.wordTimestamps && chapter.wordTimestamps.en) || [];
    if (Array.isArray(timestamps) && timestamps.length > 0) {
      if (timestamps[targetIdx] && typeof timestamps[targetIdx].startSec === "number") {
        return timestamps[targetIdx].startSec;
      }
      if (timestamps[targetIdx] && typeof timestamps[targetIdx].start === "number") {
        return timestamps[targetIdx].start;
      }
    }

    // 2. Fallback: Proportional character calculation
    const rawText = typeof chapter.textPayload === "object" ? chapter.textPayload.en || "" : chapter.textPayload || "";
    const paragraphs = rawText.split("\n").filter((p) => p.trim().length > 0);
    if (paragraphs.length === 0) return 0;

    const totalDuration = chapter.durationSeconds?.en || chapter.durationSeconds || chapter.totalDurationSeconds || 300;
    const totalChars = rawText.length || 1;

    let charsUpToTarget = 0;
    for (let i = 0; i < Math.min(targetIdx, paragraphs.length); i++) {
      charsUpToTarget += paragraphs[i].length;
    }

    const ratio = Math.min(1.0, charsUpToTarget / totalChars);
    return Math.round(ratio * totalDuration * 100) / 100;
  }

  /**
   * Map Audiobook Position (Audio Seconds) -> Paragraph Index
   */
  static calculateParagraphFromAudioTime(chapter, audioTimestampSec) {
    if (!chapter) return 0;
    const targetSec = Math.max(0, parseFloat(audioTimestampSec) || 0);

    // 1. Try forced alignment word/sentence timestamps
    const timestamps = chapter.timestamps || (chapter.wordTimestamps && chapter.wordTimestamps.en) || [];
    if (Array.isArray(timestamps) && timestamps.length > 0) {
      for (let i = 0; i < timestamps.length; i++) {
        const start = timestamps[i].startSec ?? timestamps[i].start ?? 0;
        const end = timestamps[i].endSec ?? timestamps[i].end ?? start + 5;
        if (targetSec >= start && targetSec <= end) {
          return i;
        }
      }
    }

    // 2. Fallback: Proportional character calculation
    const rawText = typeof chapter.textPayload === "object" ? chapter.textPayload.en || "" : chapter.textPayload || "";
    const paragraphs = rawText.split("\n").filter((p) => p.trim().length > 0);
    if (paragraphs.length === 0) return 0;

    const totalDuration = chapter.durationSeconds?.en || chapter.durationSeconds || chapter.totalDurationSeconds || 300;
    const ratio = Math.min(1.0, targetSec / Math.max(1, totalDuration));

    const targetCharPos = Math.round(ratio * rawText.length);
    let cumulativeChars = 0;

    for (let i = 0; i < paragraphs.length; i++) {
      cumulativeChars += paragraphs[i].length;
      if (cumulativeChars >= targetCharPos) {
        return i;
      }
    }

    return Math.max(0, paragraphs.length - 1);
  }
}

module.exports = WhispersyncService;
