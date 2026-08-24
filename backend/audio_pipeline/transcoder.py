#!/usr/bin/env python3
"""
🎬 HLS VOD Audio Transcoder (FFmpeg)
====================================
Transcodes raw WAV/MP3 audio files into 6-second HLS MPEG-TS chunks (.ts)
and generates HTTP Live Streaming master playlists (.m3u8).
"""

import os
import subprocess
import glob

def transcode_to_hls(input_audio_path: str, output_hls_dir: str, segment_duration: int = 6) -> str:
    """
    Transcode WAV/MP3 file into HLS playlist and MPEG-TS segments using FFmpeg.
    Returns path to playlist.m3u8 file.
    """
    os.makedirs(output_hls_dir, exist_ok=True)
    playlist_path = os.path.join(output_hls_dir, "playlist.m3u8")
    segment_pattern = os.path.join(output_hls_dir, "segment_%03d.ts")

    cmd = [
        "ffmpeg", "-y",
        "-i", input_audio_path,
        "-c:a", "aac",
        "-b:a", "128k",
        "-ac", "2",
        "-ar", "44100",
        "-f", "hls",
        "-hls_time", str(segment_duration),
        "-hls_playlist_type", "vod",
        "-hls_segment_filename", segment_pattern,
        playlist_path
    ]

    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        raise RuntimeError(f"FFmpeg HLS transcoding failed: {result.stderr}")

    segments = glob.glob(os.path.join(output_hls_dir, "segment_*.ts"))
    print(f"🎬 Transcoded {os.path.basename(input_audio_path)} ➔ HLS VOD: {len(segments)} segments + playlist.m3u8")
    return playlist_path

if __name__ == "__main__":
    test_wav = "/tmp/test_kokoro_synth.wav"
    if os.path.exists(test_wav):
        out_dir = "/tmp/test_hls_output"
        transcode_to_hls(test_wav, out_dir)
        print("✅ HLS Transcode verification complete.")
