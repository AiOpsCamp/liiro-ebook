#!/usr/bin/env python3
"""
🎙️ Audio Synthesizer Engine (Kokoro ONNX TTS)
==============================================
Synthesizes high-fidelity audio speech from text using Kokoro ONNX model.
Auto-downloads model files if missing.
"""

import os
import sys
import urllib.request
import soundfile as sf
import numpy as np

try:
    from kokoro_onnx import Kokoro
except ImportError:
    print("❌ kokoro-onnx module not found. Installing kokoro-onnx...")
    os.system("pip install --break-system-packages kokoro-onnx soundfile numpy")
    from kokoro_onnx import Kokoro

KOKORO_DIR = os.path.expanduser("~/.cache/kokoro")
KOKORO_MODEL_PATH = os.path.join(KOKORO_DIR, "kokoro-v1.0.onnx")
KOKORO_VOICES_PATH = os.path.join(KOKORO_DIR, "voices-v1.0.bin")

KOKORO_MODEL_URL = "https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v1.0.onnx"
KOKORO_VOICES_URL = "https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin"

def download_file(url: str, dest_path: str):
    """Download a file with progress indicator."""
    os.makedirs(os.path.dirname(dest_path), exist_ok=True)
    print(f"📥 Downloading {os.path.basename(dest_path)} from {url}...")
    urllib.request.urlretrieve(url, dest_path)
    print(f"✅ Successfully downloaded {os.path.basename(dest_path)}")

def ensure_kokoro_files():
    """Ensure Kokoro ONNX model and voices BIN exist locally."""
    if not os.path.exists(KOKORO_MODEL_PATH):
        download_file(KOKORO_MODEL_URL, KOKORO_MODEL_PATH)
    if not os.path.exists(KOKORO_VOICES_PATH):
        download_file(KOKORO_VOICES_URL, KOKORO_VOICES_PATH)

class AudioSynthesizer:
    def __init__(self, model_path=KOKORO_MODEL_PATH, voices_path=KOKORO_VOICES_PATH):
        ensure_kokoro_files()
        self.kokoro = Kokoro(model_path, voices_path)

    def synthesize_text(self, text: str, voice: str = "am_adam", speed: float = 1.0, sample_rate: int = 24000) -> np.ndarray:
        """Synthesize clean text paragraphs into float32 audio samples."""
        paragraphs = [p.strip() for p in text.split("\n\n") if p.strip()]
        audio_chunks = []
        pause_samples = np.zeros(int(sample_rate * 0.4), dtype=np.float32) # 0.4s pause between paragraphs

        for i, para in enumerate(paragraphs):
            try:
                samples, _ = self.kokoro.create(para, voice=voice, speed=speed, lang="en-us")
                if len(samples) > 0:
                    audio_chunks.append(samples)
                    if i < len(paragraphs) - 1:
                        audio_chunks.append(pause_samples)
            except Exception as e:
                print(f"⚠️ Warning: Speech synthesis error on paragraph: '{para[:50]}...': {e}")
                continue

        if not audio_chunks:
            raise ValueError("No audio samples were generated during synthesis.")

        return np.concatenate(audio_chunks)

    def synthesize_to_file(self, text: str, output_wav_path: str, voice: str = "am_adam", speed: float = 1.0) -> float:
        """Synthesize text and save directly to WAV audio file. Returns duration in seconds."""
        audio_data = self.synthesize_text(text, voice=voice, speed=speed)
        sample_rate = 24000
        os.makedirs(os.path.dirname(output_wav_path), exist_ok=True)
        sf.write(output_wav_path, audio_data, sample_rate)
        duration_sec = len(audio_data) / sample_rate
        return duration_sec

if __name__ == "__main__":
    synthesizer = AudioSynthesizer()
    test_out = "/tmp/test_kokoro_synth.wav"
    duration = synthesizer.synthesize_to_file(
        "Chapter 1. Story of the Door.\n\nMr. Utterson the lawyer was a man of a rugged countenance.",
        test_out,
        voice="am_adam"
    )
    print(f"✅ Synthesized test audio saved to {test_out} (Duration: {duration:.2f}s)")
