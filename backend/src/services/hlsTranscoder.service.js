"use strict";

const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");
const { promisify } = require("util");
const { PutObjectCommand, GetObjectCommand } = require("@aws-sdk/client-s3");
const { s3Client, BUCKET, ENDPOINT } = require("./s3Signer.service");

const execAsync = promisify(exec);

/**
 * HLS Audio Transcoder & Streaming Engine for Enterprise Audiobooks
 * Transcodes MP3/WAV audio into 6-second MPEG-TS chunks (.ts) + master playlist (.m3u8)
 */
class HLSTranscoderService {
  /**
   * Transcode local or remote audio file into HLS format and upload to Hetzner S3
   *
   * @param {string} sourceAudioPathOrUrl - Local filepath or HTTP URL of input audio
   * @param {string} storySlug - Story slug identifier
   * @param {number} chapterNumber - Chapter number
   * @param {string} voice - Voice key (default "adam")
   * @returns {Promise<Object>} Object containing HLS master playlist S3 key and URL
   */
  static async transcodeAndUploadHLS(sourceAudioPathOrUrl, storySlug, chapterNumber, voice = "adam") {
    const scratchDir = path.join(__dirname, "..", "..", "scratch", "hls_temp", `${storySlug}_ch${chapterNumber}_${voice}`);
    if (fs.existsSync(scratchDir)) {
      fs.rmSync(scratchDir, { recursive: true, force: true });
    }
    fs.mkdirSync(scratchDir, { recursive: true });

    let inputPath = sourceAudioPathOrUrl;
    let tempDownloadPath = null;

    // Handle remote S3 or HTTP URL
    if (sourceAudioPathOrUrl.startsWith("http://") || sourceAudioPathOrUrl.startsWith("https://")) {
      tempDownloadPath = path.join(scratchDir, "source_input.mp3");
      const axios = require("axios");
      const response = await axios({
        method: "get",
        url: sourceAudioPathOrUrl,
        responseType: "stream",
      });

      const writer = fs.createWriteStream(tempDownloadPath);
      response.data.pipe(writer);

      await new Promise((resolve, reject) => {
        writer.on("finish", resolve);
        writer.on("error", reject);
      });

      inputPath = tempDownloadPath;
    }

    const playlistPath = path.join(scratchDir, "playlist.m3u8");
    const segmentPattern = path.join(scratchDir, "segment_%03d.ts");

    // FFmpeg HLS Transcoding Command (6-second audio segments, AAC 128k audio codec)
    const ffmpegCmd = `ffmpeg -y -i "${inputPath}" -c:a aac -b:a 128k -ac 2 -ar 44100 -f hls -hls_time 6 -hls_playlist_type vod -hls_segment_filename "${segmentPattern}" "${playlistPath}"`;

    console.log(`🎬 [HLS Transcoder] Running FFmpeg HLS segmenter for ${storySlug} Ch ${chapterNumber}...`);
    await execAsync(ffmpegCmd);

    // Read generated files and upload to Hetzner S3 under Liiro-Ebook-Prod/hls/
    const generatedFiles = fs.readdirSync(scratchDir).filter((f) => f.endsWith(".m3u8") || f.endsWith(".ts"));
    console.log(`📤 [HLS Transcoder] Uploading ${generatedFiles.length} HLS files to Hetzner S3...`);

    const s3Prefix = `Liiro-Ebook-Prod/hls/${storySlug}/voices/${voice}/chapter_${chapterNumber}`;
    const uploadedFiles = [];

    for (const filename of generatedFiles) {
      const filePath = path.join(scratchDir, filename);
      const fileBuffer = fs.readFileSync(filePath);
      const isPlaylist = filename.endsWith(".m3u8");
      const contentType = isPlaylist ? "application/vnd.apple.mpegurl" : "video/mp2t";

      const s3Key = `${s3Prefix}/${filename}`;

      await s3Client.send(
        new PutObjectCommand({
          Bucket: BUCKET,
          Key: s3Key,
          Body: fileBuffer,
          ContentType: contentType,
          CacheControl: isPlaylist ? "no-cache, must-revalidate" : "public, max-age=31536000, immutable",
        })
      );

      uploadedFiles.push({ filename, s3Key, url: `${ENDPOINT}/${BUCKET}/${s3Key}` });
    }

    // Cleanup scratch temp directory
    fs.rmSync(scratchDir, { recursive: true, force: true });

    const masterKey = `${s3Prefix}/playlist.m3u8`;
    const masterUrl = `${ENDPOINT}/${BUCKET}/${masterKey}`;

    return {
      success: true,
      storySlug,
      chapterNumber,
      voice,
      segmentCount: generatedFiles.length - 1,
      masterKey,
      masterUrl,
      uploadedFiles,
    };
  }

  /**
   * Fetch HLS Playlist or TS Segment from Hetzner S3
   */
  static async getHLSFileStream(s3Key) {
    const command = new GetObjectCommand({
      Bucket: BUCKET,
      Key: s3Key,
    });
    return s3Client.send(command);
  }
}

module.exports = HLSTranscoderService;
