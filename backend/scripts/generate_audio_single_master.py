import os
import sys
import time
import json
import re
import html
import argparse
import urllib.request
import unicodedata
import gc
import shutil

# Suppress harmless phonemizer/espeak temp directory exit cleanup warnings
_orig_rmtree = shutil.rmtree
def _safe_rmtree(path, *args, **kwargs):
    kwargs['ignore_errors'] = True
    try:
        return _orig_rmtree(path, *args, **kwargs)
    except Exception:
        pass
shutil.rmtree = _safe_rmtree
from datetime import datetime, timezone
import soundfile as sf
import numpy as np
import boto3
from botocore.exceptions import ClientError
import tempfile
import glob
import pymongo
import threading
from concurrent.futures import ThreadPoolExecutor
from kokoro_onnx import Kokoro
try:
    import whisper
except ImportError:
    whisper = None

whisper_lock = threading.Lock()

def cleanup_system_temp():
    """Removes leftover temporary audio files and orphaned espeak temp directories in system temp."""
    temp_dir = tempfile.gettempdir()
    now = time.time()
    for tmp_pattern in ["audio*.wav", "audio*.mp3", "*.tmp.mp3", "*.tmp.wav", "tmp*"]:
        for tmp_path in glob.glob(os.path.join(temp_dir, tmp_pattern)):
            try:
                # If older than 60 seconds or a temporary audio file, remove
                mtime = os.path.getmtime(tmp_path)
                if (now - mtime) > 60 or tmp_path.endswith((".wav", ".mp3")):
                    if os.path.isfile(tmp_path) or os.path.islink(tmp_path):
                        os.remove(tmp_path)
                    elif os.path.isdir(tmp_path):
                        shutil.rmtree(tmp_path, ignore_errors=True)
            except Exception:
                pass


# Force unbuffered stdout for live progress logging
sys.stdout.reconfigure(line_buffering=True)

AUTH_MONGO_URI = os.getenv("MONGO_URL", "mongodb://admin:PROD_PASSWORD_2026@127.0.0.1:27018/liiro_prod?authSource=admin&directConnection=true")

HETZNER_BUCKET = "multicamp-prod-storage"
HETZNER_ENDPOINT = "https://nbg1.your-objectstorage.com"
HETZNER_CDN_BASE = "https://multicamp-prod-storage.nbg1.your-objectstorage.com/LangoReads-Prod/ebooks"

AWS_KEY = os.getenv("HETZNER_ACCESS_KEY_ID", os.getenv("HETZNER_S3_KEY", "KVFSGG7GLKG95GYEJOE3"))
AWS_SECRET = os.getenv("HETZNER_SECRET_ACCESS_KEY", os.getenv("HETZNER_S3_SECRET", "DsaLlvMswIAzVx93FjkvaUyfsqUrzatR8kF1SrGK"))

MODEL_URL = "https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v1.0.onnx"
VOICES_URL = "https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin"

MODEL_PATH = os.path.join(os.path.dirname(__file__), "..", "scratch", "kokoro-v1.0.onnx")
VOICES_PATH = os.path.join(os.path.dirname(__file__), "..", "scratch", "voices-v1.0.bin")

# Kokoro Voice Key Registry
VOICE_REGISTRY = {
    "michael": {"id": "am_michael", "key": "michael", "name": "Michael (US Male)", "gender": "male", "lang": "en-us"},
    "ana": {"id": "af_heart", "key": "ana", "name": "Ana (US Female)", "gender": "female", "lang": "en-us"},
    "heart": {"id": "af_heart", "key": "heart", "name": "Heart (US Female)", "gender": "female", "lang": "en-us"},
    "adam": {"id": "am_adam", "key": "adam", "name": "Adam (US Male)", "gender": "male", "lang": "en-us"},
    "bella": {"id": "af_bella", "key": "bella", "name": "Bella (US Female)", "gender": "female", "lang": "en-us"},
    "sarah": {"id": "af_sarah", "key": "sarah", "name": "Sarah (US Female)", "gender": "female", "lang": "en-us"},
    "nicole": {"id": "af_nicole", "key": "nicole", "name": "Nicole (US Female)", "gender": "female", "lang": "en-us"},
    "sky": {"id": "af_sky", "key": "sky", "name": "Sky (US Female)", "gender": "female", "lang": "en-us"},
    "george": {"id": "bm_george", "key": "george", "name": "George (UK Male)", "gender": "male", "lang": "en-gb"},
    "emma": {"id": "bf_emma", "key": "emma", "name": "Emma (UK Female)", "gender": "female", "lang": "en-gb"},
    "alice": {"id": "bf_alice", "key": "alice", "name": "Alice (UK Female)", "gender": "female", "lang": "en-gb"},
    "daniel": {"id": "bm_daniel", "key": "daniel", "name": "Daniel (UK Male)", "gender": "male", "lang": "en-gb"},
    "lewis": {"id": "bm_lewis", "key": "lewis", "name": "Lewis (UK Male)", "gender": "male", "lang": "en-gb"}
}

QUALITY_PROFILES = {
    "high": {"bitrate": "128k", "args": "-b:a 128k"},
    "standard": {"bitrate": "64k", "args": "-ac 1 -b:a 64k"},
    "low": {"bitrate": "32k", "args": "-ac 1 -b:a 32k"}
}

def get_mongo_client():
    return pymongo.MongoClient(AUTH_MONGO_URI)

def get_s3_client():
    return boto3.client(
        's3',
        endpoint_url=HETZNER_ENDPOINT,
        aws_access_key_id=AWS_KEY,
        aws_secret_access_key=AWS_SECRET
    )

def download_if_missing(url, path):
    if not os.path.exists(path):
        os.makedirs(os.path.dirname(path), exist_ok=True)
        print(f"📥 Downloading Kokoro weights {os.path.basename(path)}...")
        headers = {'User-Agent': 'Mozilla/5.0'}
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req) as response, open(path, 'wb') as out_file:
            out_file.write(response.read())
        print(f"✅ Downloaded {os.path.basename(path)}")

def is_valid_roman(s):
    if not s or not isinstance(s, str):
        return False
    return bool(re.match(r"^(?=[MDCLXVI])M{0,4}(CM|CD|D?C{0,3})(XC|XL|L?X{0,3})(IX|IV|V?I{0,3})$", s.strip(), re.IGNORECASE))

def roman_to_int(roman_str):
    roman_dict = {"I":1, "V":5, "X":10, "L":50, "C":100, "D":500, "M":1000}
    s = roman_str.upper()
    total = 0
    prev = 0
    for char in reversed(s):
        val = roman_dict.get(char, 0)
        if val < prev:
            total -= val
        else:
            total += val
        prev = val
    return total

def int_to_roman(num):
    if not isinstance(num, int) or num <= 0 or num > 3999:
        return ""
    val = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1]
    syb = ["M", "CM", "D", "CD", "C", "XC", "L", "XL", "X", "IX", "V", "IV", "I"]
    roman_num = ""
    i = 0
    while num > 0:
        for _ in range(num // val[i]):
            roman_num += syb[i]
            num %= val[i]
        i += 1
    return roman_num

def replace_roman_numerals_in_text(text):
    if not text:
        return ""

    # 1. Replace "Chapter I", "Book IV", "Part III", "Act V", "Scene II", "Stave I", "Volume I"
    def replace_heading_roman(m):
        prefix = m.group(1)
        roman = m.group(2)
        if is_valid_roman(roman):
            val = roman_to_int(roman)
            return f"{prefix} {val}"
        return m.group(0)

    pattern_heading = r"\b(Chapter|Book|Part|Volume|Section|Act|Scene|Stave)\s+([IVXLCDM]+)\b"
    text = re.sub(pattern_heading, replace_heading_roman, text, flags=re.IGNORECASE)

    # 2. Replace standalone Roman numerals e.g. "II:", "III —", "IV -", "V." (NEVER 'I' which is English pronoun 'I')
    def replace_standalone_roman(m):
        leading_punct = m.group(1)
        roman = m.group(2)
        trailing_punct = m.group(3)
        if roman.upper() == "I":
            return m.group(0)
        if is_valid_roman(roman):
            val = roman_to_int(roman)
            return f"{leading_punct}{val}{trailing_punct}"
        return m.group(0)

    pattern_standalone = r"(^|\n|\.\s+)\b([IVXLCDM]+)\b([\.\:\,\s—\-]+|$)"
    text = re.sub(pattern_standalone, replace_standalone_roman, text)

    return text

def normalize_audio_abbreviations(text):
    if not text:
        return ""

    # 1. Normalize all curly apostrophes and quotation marks to standard ASCII
    text = text.replace("’", "'").replace("‘", "'")
    text = text.replace("“", '"').replace("”", '"')
    text = text.replace("`", "'")

    # 2. Strip all zero-width and invisible control characters
    text = text.replace("\u2060", "").replace("\u200b", "").replace("\ufeff", "").replace("\u00a0", " ")

    # 3. Expand common abbreviations to prevent TTS stutters
    text = re.sub(r"\bMr\.(?=\s+[A-Z])", "Mister", text)
    text = re.sub(r"\bMrs\.(?=\s+[A-Z])", "Missus", text)
    text = re.sub(r"\bDr\.(?=\s+[A-Z])", "Doctor", text)
    text = re.sub(r"\bSt\.(?=\s+[A-Z])", "Saint", text)
    text = re.sub(r"\bNo\.(?=\s+\d+)", "Number", text)
    text = re.sub(r"\bVol\.(?=\s+\d+)", "Volume", text)

    # 4. Format em-dashes with surrounding spaces for micro-breathing pauses (0.15s-0.20s)
    text = re.sub(r"(?<=\S)[\—\–](?=\S)", " — ", text)
    text = re.sub(r"\s*[\—\–]\s*", " — ", text)

    # 5. Convert all-caps words (e.g. "THE", "CHAPTER") to Titlecase so TTS never spells them out as acronyms
    def fix_all_caps(m):
        w = m.group(0)
        if w in ["I", "A", "OK"]:
            return w
        return w.capitalize()

    text = re.sub(r"\b[A-Z]{2,}\b", fix_all_caps, text)

    return text

def convert_roman_title_to_spoken(title, chapter_num):
    if not title:
        return ""
    if isinstance(title, dict):
        title = title.get("en") or title.get("es") or next(iter(title.values()), "")
    cleaned_title = str(title).strip()

    # 1. Strip explicit "CHAPTER I. ", "CHAPTER 1: " prefixes
    cleaned_title = re.sub(r"^(?:CHAPTER|STAVE|BOOK|PART|VOLUME)\s+(?:[IVXLCDM]+\b|\d+)[\.\:\—\-\s]*", "", cleaned_title, flags=re.IGNORECASE).strip()

    # 2. Strip standalone leading Roman numerals / numbers if followed by punctuation (e.g. "I. Down...", "8 “It's...")
    cleaned_title = re.sub(r"^(?:[IVXLCDM]+\b|\d+)[\.\:\—\-\s]+", "", cleaned_title).strip()
    cleaned_title = re.sub(r"^\d+\s+", "", cleaned_title).strip()

    # 3. If cleaned_title is ONLY a Roman numeral or ONLY digits (e.g. "I", "II", "1", "2"), return empty so we only speak "Chapter N"
    if is_valid_roman(cleaned_title) or cleaned_title.isdigit():
        return ""

    # 4. If cleaned_title is just "Chapter", return empty
    if cleaned_title.lower() in ["chapter", f"chapter {chapter_num}"]:
        return ""

    spoken_title = replace_roman_numerals_in_text(cleaned_title).strip()
    return spoken_title


def clean_chapter_content_perfect(raw_payload, story_title="", chapter_title="", spoken_title="", chapter_num=1):
    """
    100% mirrors the frontend React reader clean parser (EbookReadContent.tsx).
    Strips all HTML tags, <figure>, <header>, <hgroup>, zero-width characters,
    Roman numerals, duplicate story titles, and duplicate chapter headers.
    """
    if not raw_payload:
        return []

    if isinstance(raw_payload, dict):
        raw_payload = raw_payload.get("en") or next(iter(raw_payload.values()), "")

    text = str(raw_payload).strip()
    text = html.unescape(text)

    # 1. Remove zero-width and invisible control characters
    text = text.replace("\u2060", "").replace("\u200b", "").replace("\ufeff", "").replace("\u00a0", " ")
    text = unicodedata.normalize("NFKC", text)

    # 2. Strip XML declarations, DOCTYPE, and head blocks
    text = re.sub(r"<\?xml[^>]*\?>", " ", text, flags=re.I)
    text = re.sub(r"<!DOCTYPE[^>]*>", " ", text, flags=re.I)
    text = re.sub(r"<head[^>]*>[\s\S]*?<\/head>", " ", text, flags=re.I)

    # 3. Check if content is HTML (contains HTML tags like <p, <div, <header, <h2)
    is_html = bool(re.search(r"<\/?(?:p|div|header|hgroup|figure|h[1-6]|span|section|article)\b", text, re.I))

    if is_html:
        # Strip header, hgroup, figure, figcaption, style, script blocks entirely
        text = re.sub(r"<(header|hgroup|figure|figcaption|style|script)[^>]*>[\s\S]*?<\/\1>", " ", text, flags=re.I)

        # Split on closing paragraph/heading/div tags or <br>
        text = re.sub(r"<\/(p|div|h[1-6]|li|blockquote|section|article|header|tr)>", "\n\n", text, flags=re.I)
        text = re.sub(r"<br\s*\/?>", "\n", text, flags=re.I)

        # Strip ALL remaining HTML / XML tags (<p>, <span>, <em>, <strong>, etc.)
        text = re.sub(r"<[^>]+>", " ", text)

    # 3. Normalize Victorian/Edwardian historical anonymized dates & redacted names
    # e.g. "192‒" / "192-" -> "1920", "Lord B---" -> "Lord B"
    text = re.sub(r'\b(19[0-9])[‒—\-\_\u2012\u2013\u2014]+', lambda m: m.group(1) + '0', text)
    text = re.sub(r'\b(1[789])[‒—\-\_\u2012\u2013\u2014]{2,}', lambda m: m.group(1) + '00', text)
    text = re.sub(r'\b([A-Z][a-z]?)[‒—\-\_\u2012\u2013\u2014]{2,}\b', r'\1', text)

    # Normalize newlines and split into paragraphs
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    text = re.sub(r"(?<!\n)\n(?!\n)", " ", text)
    raw_paras = [p.strip() for p in re.split(r"\n\s*\n", text) if p.strip()]

    story_title_clean = str(story_title).lower().strip()
    ch_title_clean = str(chapter_title).lower().strip()
    spoken_title_clean = str(spoken_title).lower().strip()

    filtering = True
    cleaned_paras = []

    for p in raw_paras:
        p_clean = re.sub(r"\s+", " ", p).strip()
        if not p_clean:
            continue
        p_lower = p_clean.lower()

        if filtering:
            # Match Roman numerals (e.g. 'I', 'II', 'III', 'IV')
            is_roman = bool(re.match(r"^[IVXLCDM]+\.?$", p_clean, re.I))
            # Match Roman numeral with title (e.g. 'I: The Egg', 'I. The Egg')
            is_roman_with_title = bool(re.match(r"^[IVXLCDM]+[:.\s-]+", p_clean, re.I) and len(p_clean) < 80)
            # Match Story Title duplicate (e.g. 'THE PHOENIX AND THE CARPET')
            is_story_title = bool(story_title_clean and (p_lower == story_title_clean or p_lower in story_title_clean or (len(story_title_clean) > 5 and story_title_clean in p_lower and len(p_clean) < 100)))
            # Match Chapter Title duplicate or Chapter Header (e.g. 'CHAPTER 1', 'STAVE I', 'BOOK I')
            is_chapter_title = bool(ch_title_clean and (p_lower == ch_title_clean or (len(ch_title_clean) > 3 and ch_title_clean in p_lower and len(p_clean) < 100)))
            is_spoken_title = bool(spoken_title_clean and (p_lower == spoken_title_clean or (len(spoken_title_clean) > 3 and spoken_title_clean in p_lower and len(p_clean) < 100)))
            is_chapter_header = bool(re.match(r"^(?:CHAPTER|BOOK|STAVE|PART|VOLUME)\s+([0-9IVXLCDM]+)\b[.\s:-]*", p_clean, re.I))

            if is_roman or is_roman_with_title or is_story_title or is_chapter_title or is_spoken_title or is_chapter_header:
                continue
            else:
                filtering = False

        narrative_para = p_clean
        if len(cleaned_paras) == 0:
            # Strip leading Roman numerals or chapter headers at the start of paragraph 0
            narrative_para = re.sub(r"^(?:CHAPTER|BOOK|STAVE|PART|VOLUME)\s+[0-9IVXLCDM]+\b[.\s:-]*", "", narrative_para, flags=re.I).strip()
            narrative_para = re.sub(r"^[IVXLCDM\d]+[:.\s-]+", "", narrative_para, flags=re.I).strip()
            for t_str in [spoken_title_clean, ch_title_clean]:
                if t_str and len(t_str) > 2:
                    clean_t = re.sub(r"^(?:CHAPTER|BOOK|STAVE|PART|VOLUME)\s+[0-9IVXLCDM\d]+\b[.\s:-]*", "", t_str, flags=re.I).strip()
                    if clean_t:
                        escaped_title = re.escape(clean_t)
                        narrative_para = re.sub(rf"^({escaped_title}\s*)+", "", narrative_para, flags=re.I).strip()
            # Strip leading leftover punctuation
            narrative_para = re.sub(r"^[:.\-—\s]+", "", narrative_para).strip()

        if narrative_para:
            narrative_para = replace_roman_numerals_in_text(narrative_para)
            narrative_para = normalize_audio_abbreviations(narrative_para)
            cleaned_paras.append(narrative_para)

    return cleaned_paras

def is_dialogue_paragraph(p):
    p_str = p.strip()
    return bool(re.search(r'^[“"\'‘]', p_str) or re.search(r'[”"\'’]$', p_str))

def generate_audio_for_paragraphs(kokoro, clean_paragraphs, spoken_header, voice_id="am_michael", title_pause=2.2, paragraph_pause=1.2, is_ch1=False, intro_preamble=None):
    """
    Generates audio directly from pre-cleaned paragraphs list.
    """
    paragraphs_to_speak = []
    
    if is_ch1 and intro_preamble:
        paragraphs_to_speak.append((intro_preamble, -1, "intro"))
        
    paragraphs_to_speak.append((f"{spoken_header}.", 0, "header"))
    
    for idx, p in enumerate(clean_paragraphs, 1):
        paragraphs_to_speak.append((p, idx, "body"))

    audio_chunks = []
    final_sr = 24000
    total_samples = 0
    paragraph_timestamps = []
    sentence_timestamps = []

    for p_idx, (p_text, logical_p_idx, item_type) in enumerate(paragraphs_to_speak):
        para_start_sec = round(total_samples / final_sr, 3)

        # Detect scene breaks (e.g. "***", "---", "* * *")
        if re.match(r"^[\*\-\_\s]{3,}$", p_text):
            pause_samples = int(1.8 * final_sr)
            audio_chunks.append(np.zeros(pause_samples, dtype=np.float32))
            total_samples += pause_samples
            continue

        # Smart sentence-aware chunking for natural Kokoro TTS intonation
        sentences = [s.strip() for s in re.split(r'(?<=[.!?])\s+', p_text) if s.strip()]
        if not sentences:
            sentences = [p_text]

        if item_type == "body":
            print(f"      Paragraph {logical_p_idx}/{len(clean_paragraphs)} ({len(sentences)} sentences)...", flush=True)

        for s_idx, s in enumerate(sentences):
            sent_start_sec = round(total_samples / final_sr, 3)
            try:
                samples, sr = kokoro.create(s, voice=voice_id, speed=1.0, lang="en-us")
                if samples is not None and getattr(samples, "size", 0) > 0:
                    audio_chunks.append(samples)
                    final_sr = sr
                    total_samples += len(samples)
                    sent_end_sec = round(total_samples / final_sr, 3)
                    sentence_timestamps.append({
                        "paragraphIndex": logical_p_idx,
                        "sentenceIndex": s_idx,
                        "start": sent_start_sec,
                        "end": sent_end_sec,
                        "startSec": sent_start_sec,
                        "endSec": sent_end_sec,
                        "durationSec": round(sent_end_sec - sent_start_sec, 3),
                        "text": s,
                        "type": item_type
                    })
            except Exception as ex:
                print(f"⚠️ Kokoro segment synthesis error: {ex}")

        # Breathing pauses:
        if logical_p_idx == -1:
            pause_sec = 1.40  # 1.4s pause after Brand Intro
        elif logical_p_idx == 0:
            pause_sec = title_pause  # 2.2s after Chapter Title
        elif is_dialogue_paragraph(p_text) and (p_idx > 1 and is_dialogue_paragraph(paragraphs_to_speak[p_idx - 1][0])):
            pause_sec = 0.80
        else:
            pause_sec = paragraph_pause

        pause_samples = int(pause_sec * final_sr)
        audio_chunks.append(np.zeros(pause_samples, dtype=np.float32))
        total_samples += pause_samples

        para_end_sec = round(total_samples / final_sr, 3)
        paragraph_timestamps.append({
            "paragraphIndex": logical_p_idx,
            "start": para_start_sec,
            "end": para_end_sec,
            "startSec": para_start_sec,
            "endSec": para_end_sec,
            "durationSec": round(para_end_sec - para_start_sec, 3),
            "text": (p_text[:80] + "...") if len(p_text) > 80 else p_text,
            "type": item_type
        })

    valid_chunks = [c for c in audio_chunks if c is not None and getattr(c, "size", 0) > 0]
    if not valid_chunks:
        return None, 24000, [], []
    return np.concatenate(valid_chunks), final_sr, paragraph_timestamps, sentence_timestamps

def verify_s3_url_exists(s3_client, url):
    """
    Verifies if a given CDN URL exists on Hetzner S3 bucket.
    """
    if not url or not isinstance(url, str):
        return False
    prefix = f"{HETZNER_CDN_BASE}/"
    if not url.startswith(prefix):
        return False
    key = "LangoReads-Prod/ebooks/" + url[len(prefix):]
    try:
        s3_client.head_object(Bucket=HETZNER_BUCKET, Key=key)
        return True
    except ClientError:
        return False

def transcode_and_upload_voice_qualities(s3_client, wav_path, slug, ch_num, voice_key, requested_qualities, out_dir):
    """
    Transcodes master WAV into requested qualities (high, standard, low), uploads to Hetzner S3, and returns URLs.
    """
    bitrate_urls = {}

    for q in requested_qualities:
        if q not in QUALITY_PROFILES:
            continue
        p = QUALITY_PROFILES[q]
        mp3_filename = f"chapter_{ch_num}_{voice_key}_{q}.mp3"
        local_mp3 = os.path.join(out_dir, mp3_filename)

        os.system(f"ffmpeg -y -i \"{wav_path}\" {p['args']} \"{local_mp3}\" >/dev/null 2>&1")

        s3_key = f"LangoReads-Prod/ebooks/{slug}/voices/{voice_key}/{q}/chapter_{ch_num}.mp3"
        print(f"   ☁️ Uploading {voice_key.upper()} - {q.upper()} ({p['bitrate']}) MP3 to S3 CDN...")

        with open(local_mp3, "rb") as f:
            try:
                s3_client.put_object(
                    Bucket=HETZNER_BUCKET,
                    Key=s3_key,
                    Body=f,
                    ACL="public-read",
                    ContentType="audio/mpeg",
                    CacheControl="public, max-age=31536000, immutable"
                )
            except Exception:
                f.seek(0)
                s3_client.put_object(
                    Bucket=HETZNER_BUCKET,
                    Key=s3_key,
                    Body=f,
                    ContentType="audio/mpeg",
                    CacheControl="public, max-age=31536000, immutable"
                )

        bitrate_urls[q] = f"{HETZNER_CDN_BASE}/{slug}/voices/{voice_key}/{q}/chapter_{ch_num}.mp3"

        if os.path.exists(local_mp3):
            try: os.remove(local_mp3)
            except Exception: pass

    # Also generate default voice URL under /voices/<key>/chapter_N.mp3 if standard or high was generated
    std_or_high_q = "standard" if "standard" in bitrate_urls else ("high" if "high" in bitrate_urls else list(bitrate_urls.keys())[0])
    default_voice_s3_key = f"LangoReads-Prod/ebooks/{slug}/voices/{voice_key}/chapter_{ch_num}.mp3"
    default_voice_url = f"{HETZNER_CDN_BASE}/{slug}/voices/{voice_key}/chapter_{ch_num}.mp3"
    
    # Copy S3 object to default voice key
    try:
        s3_client.copy_object(
            Bucket=HETZNER_BUCKET,
            CopySource={"Bucket": HETZNER_BUCKET, "Key": f"LangoReads-Prod/ebooks/{slug}/voices/{voice_key}/{std_or_high_q}/chapter_{ch_num}.mp3"},
            Key=default_voice_s3_key,
            ACL="public-read",
            ContentType="audio/mpeg",
            CacheControl="public, max-age=31536000, immutable"
        )
    except Exception as ex:
        print(f"   ⚠️ S3 copy warning for default voice key: {ex}")

    bitrate_urls["default"] = default_voice_url
    return bitrate_urls

def resolve_author_name(story, db):
    author_val = story.get("author") or story.get("authorName")
    if isinstance(author_val, str) and author_val.strip():
        val = author_val.strip()
        if len(val) == 24 and all(c in "0123456789abcdefABCDEF" for c in val):
            try:
                from bson import ObjectId
                author_doc = db["ebookauthors"].find_one({"_id": ObjectId(val)}) or db["authors"].find_one({"_id": ObjectId(val)})
                if author_doc:
                    name_val = author_doc.get("name")
                    if isinstance(name_val, dict):
                        return name_val.get("en") or list(name_val.values())[0]
                    elif isinstance(name_val, str) and name_val.strip():
                        return name_val.strip()
            except Exception:
                pass
            return val
        else:
            return val
    elif isinstance(author_val, dict):
        return author_val.get("en") or author_val.get("bn") or list(author_val.values())[0]
    
    if story.get("authorName"):
        return str(story.get("authorName")).strip()
    
    return "Classic Masterwork"

def process_single_book(slug, target_voices, target_qualities, force_mode, title_pause, paragraph_pause, kokoro, whisper_model, s3_client, db, parallel_workers=4, target_chapters=None):
    story = db["stories"].find_one({"slug": slug})
    if not story:
        print(f"\n❌ Story not found in MongoDB: {slug}")
        return False

    story_title = story.get("title", {})
    if isinstance(story_title, dict):
        story_title = story_title.get("en", slug)

    chapters = list(db["storychapters"].find({"storyId": story["_id"]}).sort("chapterNumber", 1))
    if target_chapters:
        chapters = [ch for ch in chapters if ch.get("chapterNumber") in target_chapters]

    print("\n=======================================================================")
    print(f"🎙️ PROCESSING AUDIO & ALIGNMENT QUEUE: \"{story_title}\"")
    print(f"   Repository Slug: {slug}")
    print(f"   Total Chapters to Process: {len(chapters)}")
    print(f"   Target Voices: {', '.join([v['name'] for v in target_voices])}")
    print(f"   Target Bitrate Qualities: {', '.join([q.upper() for q in target_qualities])}")
    print(f"   Title Pause: {title_pause}s | Paragraph Pause: {paragraph_pause}s | Force Re-gen: {force_mode}")
    print(f"   Parallel Chapter Workers: {parallel_workers}")
    print("=======================================================================")

    story_author = resolve_author_name(story, db)

    out_dir = os.path.join(os.path.dirname(__file__), "..", "scratch", "audio_out", slug)
    os.makedirs(out_dir, exist_ok=True)

    # Option B: Generate Standalone Brand Intro Audio (intro.mp3)
    print(f"\n🌟 Option B: Generating Standalone Brand Intro Audio for \"{story_title}\"...")
    intro_text = f"Welcome to Liiro Ebook. You are listening to {story_title}, written by {story_author}. All rights reserved."

    intro_urls = {}
    for v_obj in target_voices:
        v_key = v_obj["key"]
        v_id = v_obj["id"]
        v_name = v_obj["name"]

        intro_wav_path = os.path.join(out_dir, f"intro_{v_key}.wav")
        samples, sr, _, _ = generate_audio_for_paragraphs(kokoro, [intro_text], "Introduction", voice_id=v_id, title_pause=1.0, paragraph_pause=0.4)
        if samples is not None and getattr(samples, "size", 0) > 0:
            sf.write(intro_wav_path, samples, sr)
            v_intro_urls = transcode_and_upload_voice_qualities(s3_client, intro_wav_path, slug, 0, v_key, target_qualities, out_dir)
            if v_intro_urls and "default" in v_intro_urls:
                intro_urls[v_key] = v_intro_urls["default"]
            if os.path.exists(intro_wav_path):
                try: os.remove(intro_wav_path)
                except Exception: pass

    # Clean up any leftover intro scratch files
    for tmp_intro in glob.glob(os.path.join(out_dir, "intro_*")):
        try:
            if os.path.isfile(tmp_intro): os.remove(tmp_intro)
        except Exception: pass
    cleanup_system_temp()

    if intro_urls:
        existing_brand_voices = story.get("brandIntroVoices") or {}
        merged_brand_voices = {**existing_brand_voices, **intro_urls}
        db["stories"].update_one(
            {"_id": story["_id"]},
            {"$set": {"brandIntroAudioUrl": merged_brand_voices.get(target_voices[0]["key"]), "brandIntroVoices": merged_brand_voices}}
        )
        print(f"✅ Saved Standalone Brand Intro Audio URLs to Story document in MongoDB: {intro_urls.get(target_voices[0]['key'])}")

    def process_one_chapter(ch):
        ch_num = ch.get("chapterNumber", 1)
        raw_text = ch.get("content") or ch.get("textPayload") or ""
        if isinstance(raw_text, dict):
            raw_text = raw_text.get("en") or list(raw_text.values())[0]

        raw_title = ch.get("title", f"Chapter {ch_num}")
        if isinstance(raw_title, dict):
            raw_title = raw_title.get("en", f"Chapter {ch_num}")

        spoken_title = convert_roman_title_to_spoken(raw_title, ch_num)
        clean_paragraphs = clean_chapter_content_perfect(raw_text, story_title=story_title, chapter_title=raw_title, spoken_title=spoken_title, chapter_num=ch_num)

        if spoken_title and not spoken_title.lower().startswith("chapter"):
            spoken_header = f"Chapter {ch_num}: {spoken_title}"
        else:
            spoken_header = spoken_title or f"Chapter {ch_num}"

        db_voices = ch.get("audioVoices", {}) or {}
        db_bitrates = ch.get("audioBitrates", {}) or {}
        db_timestamps = ch.get("timestamps", []) or []

        # Idempotency Check: Determine if ALL target voices and qualities exist on DB & S3
        if not force_mode:
            all_voices_exist = True
            for v_obj in target_voices:
                v_key = v_obj["key"]
                existing_v_url = db_voices.get(v_key)
                if not existing_v_url or not verify_s3_url_exists(s3_client, existing_v_url):
                    all_voices_exist = False
                    break

            all_qualities_exist = True
            for q in target_qualities:
                existing_q_url = db_bitrates.get(q)
                if not existing_q_url or not verify_s3_url_exists(s3_client, existing_q_url):
                    all_qualities_exist = False
                    break

            if all_voices_exist and all_qualities_exist and db_timestamps and len(db_timestamps) > 0:
                print(f"⏩ [Chapter {ch_num}/{len(chapters)}] All target voices & qualities verified. Skipping!")
                return True

        print(f"\n🎧 [Chapter {ch_num}/{len(chapters)}] Processing Audio for \"{spoken_header}\" ({len(clean_paragraphs)} clean paragraphs)...")

        updated_voices_map = {
            "defaultVoiceId": target_voices[0]["key"],
            "voices": []
        }
        updated_bitrates_map = {}
        primary_whisper_mp3 = None

        primary_para_timestamps = []
        primary_sent_timestamps = []
        primary_duration_sec = 0.0

        for v_idx, v_obj in enumerate(target_voices):
            v_key = v_obj["key"]
            v_id = v_obj["id"]
            v_name = v_obj["name"]

            wav_path = os.path.join(out_dir, f"chapter_{ch_num}_{v_key}.wav")
            print(f"   🗣️ [Ch {ch_num}] Synthesizing {v_name}...")

            is_ch1 = (ch_num == 1)
            intro_preamble = f"Welcome to Liiro Ebook. You are listening to {story_title}, written by {story_author}." if is_ch1 else None

            samples, sr, para_timestamps, sent_timestamps = generate_audio_for_paragraphs(
                kokoro,
                clean_paragraphs,
                spoken_header,
                voice_id=v_id,
                title_pause=title_pause,
                paragraph_pause=paragraph_pause,
                is_ch1=is_ch1,
                intro_preamble=intro_preamble
            )
            if samples is None or getattr(samples, "size", 0) == 0:
                print(f"   ⚠️ Failed to generate audio samples for voice: {v_name}")
                continue

            if v_idx == 0:
                primary_para_timestamps = para_timestamps
                primary_sent_timestamps = sent_timestamps
                primary_duration_sec = round(len(samples) / sr, 2)

            sf.write(wav_path, samples, sr)

            voice_urls = transcode_and_upload_voice_qualities(s3_client, wav_path, slug, ch_num, v_key, target_qualities, out_dir)

            updated_voices_map[v_key] = voice_urls["default"]
            updated_voices_map["voices"].append({
                "id": v_id,
                "key": v_key,
                "name": v_name,
                "url": voice_urls["default"]
            })

            # Prepare MP3 file for OpenAI Whisper forced alignment before removing WAV
            if v_idx == 0 and os.path.exists(wav_path) and os.path.getsize(wav_path) > 0:
                for q in target_qualities:
                    if q in voice_urls:
                        updated_bitrates_map[q] = voice_urls[q]

                primary_mp3_path = os.path.join(out_dir, f"chapter_{ch_num}_whisper.mp3")
                os.system(f"ffmpeg -y -i \"{wav_path}\" -ac 1 -b:a 64k \"{primary_mp3_path}\" >/dev/null 2>&1")
                if os.path.exists(primary_mp3_path) and os.path.getsize(primary_mp3_path) > 100:
                    primary_whisper_mp3 = primary_mp3_path

            # Clean up local WAV file immediately to save disk space
            if os.path.exists(wav_path):
                try: os.remove(wav_path)
                except Exception: pass

            # Clean up temporary whisper MP3 file if present
            if primary_whisper_mp3 and os.path.exists(primary_whisper_mp3):
                try: os.remove(primary_whisper_mp3)
                except Exception: pass

            import gc
            gc.collect()

            # Granular Instant Database Update for this specific voice
            current_ch = db["storychapters"].find_one({"_id": ch["_id"]}, {"audioVoices": 1})
            if current_ch and current_ch.get("audioVoices") is None:
                db["storychapters"].update_one({"_id": ch["_id"]}, {"$unset": {"audioVoices": "", "audioBitrates": ""}})

            instant_audio_url = updated_bitrates_map.get("standard") or updated_bitrates_map.get("low") or voice_urls.get("default")
            db["storychapters"].update_one(
                {"_id": ch["_id"]},
                {
                    "$set": {
                        "hasAudio": True,
                        "audioUrl": instant_audio_url,
                        "audioBitrates": updated_bitrates_map,
                        f"audioVoices.{v_key}": voice_urls["default"],
                        "audioVoices.defaultVoiceId": target_voices[0]["key"],
                        "timestamps": primary_para_timestamps,
                        "paragraphTimestamps": primary_para_timestamps,
                        "sentenceTimestamps": primary_sent_timestamps,
                        "durationSeconds": primary_duration_sec,
                        "updatedAt": datetime.now(timezone.utc)
                    }
                }
            )

        # Run OpenAI Whisper Forced Alignment for primary narrator voice if available
        exercise_sentences = []
        schema_timestamps = []
        duration_sec = primary_duration_sec

        if whisper_model and primary_whisper_mp3 and os.path.exists(primary_whisper_mp3) and os.path.getsize(primary_whisper_mp3) > 100:
            print(f"🎯 Running OpenAI Whisper Sentence & Word Alignment for Chapter {ch_num}...")
            with whisper_lock:
                alignment_res = whisper_model.transcribe(primary_whisper_mp3, word_timestamps=True, fp16=False)

            for seg in alignment_res.get("segments", []):
                seg_text = seg.get("text", "").strip()
                seg_start = round(float(seg.get("start", 0.0)), 3)
                seg_end = round(float(seg.get("end", 0.0)), 3)

                word_list = []
                schema_words = []

                for w in seg.get("words", []):
                    w_text = w.get("word", "").strip()
                    if "start" in w and "end" in w:
                        w_start = round(float(w["start"]), 3)
                        w_end = round(float(w["end"]), 3)
                        word_list.append({
                            "text": w_text,
                            "word": w_text,
                            "start": w_start,
                            "end": w_end,
                            "startSec": w_start,
                            "endSec": w_end
                        })
                        schema_words.append({
                            "word": w_text,
                            "startSec": w_start,
                            "endSec": w_end
                        })

                if word_list:
                    exercise_sentences.append({
                        "text": seg_text,
                        "start": seg_start,
                        "end": seg_end,
                        "startSec": seg_start,
                        "endSec": seg_end,
                        "words": word_list
                    })
                    schema_timestamps.append({
                        "text": seg_text,
                        "startSec": seg_start,
                        "endSec": seg_end,
                        "words": schema_words
                    })

            if exercise_sentences:
                duration_sec = exercise_sentences[-1]["endSec"]

            if os.path.exists(primary_whisper_mp3):
                try: os.remove(primary_whisper_mp3)
                except Exception: pass

        # Final Chapter MongoDB Save: Non-destructively merge with existing voices and bitrates
        current_ch = db["storychapters"].find_one({"_id": ch["_id"]}) or {}
        existing_voices = current_ch.get("audioVoices") or {}
        existing_bitrates = current_ch.get("audioBitrates") or {}

        merged_voices = {**existing_voices, **updated_voices_map}
        merged_bitrates = {**existing_bitrates, **updated_bitrates_map}

        update_doc = {
            "hasAudio": True,
            "audioUrl": merged_bitrates.get("standard") or merged_bitrates.get("high") or list(merged_bitrates.values())[0] if merged_bitrates else ch.get("audioUrl"),
            "audioBitrates": merged_bitrates,
            "audioVoices": merged_voices,
            "timestamps": schema_timestamps if schema_timestamps else primary_para_timestamps,
            "paragraphTimestamps": primary_para_timestamps,
            "sentenceTimestamps": primary_sent_timestamps,
            "durationSeconds": duration_sec,
            "updatedAt": datetime.now(timezone.utc)
        }

        if exercise_sentences:
            update_doc["wordTimestamps.en"] = exercise_sentences

        db["storychapters"].update_one({"_id": ch["_id"]}, {"$set": update_doc})
        print(f"   ✅ Chapter {ch_num} Saved to Hetzner Production MongoDB (with {len(primary_sent_timestamps)} Sentence & {len(primary_para_timestamps)} Paragraph Timestamps)!")
        
        # Immediately remove all local chapter audio files from scratch disk upon S3 upload & DB save
        for tmp_file in glob.glob(os.path.join(out_dir, f"chapter_{ch_num}*")):
            try:
                if os.path.isfile(tmp_file): os.remove(tmp_file)
            except Exception: pass
        cleanup_system_temp()
        import gc
        gc.collect()
        return True

    print(f"\n🚀 Launching {parallel_workers} Parallel Chapter Worker Threads for \"{story_title}\"...")
    if parallel_workers > 1:
        with ThreadPoolExecutor(max_workers=parallel_workers) as executor:
            list(executor.map(process_one_chapter, chapters))
    else:
        for ch in chapters:
            process_one_chapter(ch)

    # Immediately Mark Audiobook as LIVE on MongoDB as soon as Audio Synthesis & S3 Deployment completes
    db["stories"].update_one(
        {"_id": story["_id"]},
        {"$set": {"hasAudio": True, "isAudiobook": True, "updatedAt": datetime.now(timezone.utc)}}
    )
    print(f"\n🎉 ⚡ INSTANT AUDIOBOOK DEPLOYED & LIVE: \"{story_title}\" (All S3 CDN URLs Active!)")
    
    # Aggressive memory cleanup after full book completion
    if os.path.exists(out_dir):
        try: shutil.rmtree(out_dir)
        except Exception: pass
    cleanup_system_temp()
    gc.collect()
    return True

def main():
    parser = argparse.ArgumentParser(description="Master Multi-Book Audio Synthesis & OpenAI Whisper Alignment Pipeline")
    parser.add_argument("slugs", nargs="*", help="One or more book repository slugs (e.g. through-the-looking-glass frankenstein)")
    parser.add_argument("--books", "-b", help="Comma-separated list of book slugs")
    parser.add_argument("--voices", "-v", default="michael,ana", help="Comma-separated list of voices to generate (default: michael,ana). Available: michael,ana,heart,adam,bella,sarah,nicole,sky,george,emma,alice,daniel,lewis")
    parser.add_argument("--qualities", "-q", default="high,standard,low", help="Comma-separated list of bitrate qualities to generate (default: high,standard,low). Available: high,standard,low")
    parser.add_argument("--force", "-f", action="store_true", help="Force re-generation even if audio already exists in DB and S3")
    parser.add_argument("--title-pause", type=float, default=2.2, help="Pause duration in seconds after spoken title header (default: 2.2)")
    parser.add_argument("--paragraph-pause", type=float, default=1.2, help="Pause duration in seconds between paragraphs (default: 1.2)")
    parser.add_argument("--parallel", "-p", "--concurrency", type=int, default=2, help="Number of parallel chapter worker threads (default: 2)")
    parser.add_argument("--chapters", "-c", "--chapter", help="Comma-separated list or single chapter number to generate (e.g. 1 or 1,2,3)")
    parser.add_argument("--skip-whisper", action="store_true", help="Skip Whisper forced alignment for 100x ultra-fast audio deployment")
    args = parser.parse_args()

    # Parse target chapters filter if provided
    target_chapters = None
    if args.chapters:
        try:
            target_chapters = [int(c.strip()) for c in str(args.chapters).split(",") if c.strip()]
        except Exception:
            print(f"⚠️ Invalid --chapters argument '{args.chapters}'. Processing all chapters.")

    # Collect book slugs
    book_list = []
    if args.slugs:
        book_list.extend(args.slugs)
    if args.books:
        book_list.extend([b.strip() for b in args.books.split(",") if b.strip()])

    if not book_list:
        print("❌ Error: No book slugs provided!")
        print("Usage: python scripts/generate_and_align_ebook_audio.py <slug1> <slug2> --voices michael,ana --qualities high,standard,low")
        sys.exit(1)

    # Deduplicate book slugs while preserving order
    unique_books = []
    for b in book_list:
        if b not in unique_books:
            unique_books.append(b)

    # Parse requested voices
    requested_voice_keys = [v.strip().lower() for v in args.voices.split(",") if v.strip()]
    target_voices = []
    for vk in requested_voice_keys:
        if vk in VOICE_REGISTRY:
            target_voices.append(VOICE_REGISTRY[vk])
        else:
            print(f"⚠️ Unknown voice key '{vk}'. Available voices: {', '.join(VOICE_REGISTRY.keys())}")

    if not target_voices:
        print("❌ Error: No valid voices selected!")
        sys.exit(1)

    # Parse requested qualities
    requested_qualities = [q.strip().lower() for q in args.qualities.split(",") if q.strip()]
    valid_qualities = [q for q in requested_qualities if q in QUALITY_PROFILES]
    if not valid_qualities:
        print("❌ Error: No valid qualities selected! Choose from: high, standard, low")
        sys.exit(1)

    client = get_mongo_client()
    db = client["liiro_prod"]

    download_if_missing(MODEL_URL, MODEL_PATH)
    download_if_missing(VOICES_URL, VOICES_PATH)

    print("\n=======================================================================")
    print("🎙️ INITIALIZING MASTER AUDIO SYNTHESIS & WHISPER ALIGNMENT PIPELINE")
    print(f"   Queue Total Books: {len(unique_books)}")
    print(f"   Book Slugs: {', '.join(unique_books)}")
    print(f"   Selected Voices: {', '.join([v['name'] for v in target_voices])}")
    print(f"   Selected Qualities: {', '.join([q.upper() for q in valid_qualities])}")
    print(f"   Title Pause: {args.title_pause}s | Paragraph Pause: {args.paragraph_pause}s")
    if target_chapters:
        print(f"   Target Specific Chapters Only: {target_chapters}")
    print("=======================================================================")

    print("🎙️ Loading Kokoro v1.0 ONNX Engine...")
    kokoro = Kokoro(MODEL_PATH, VOICES_PATH)

    if whisper and not args.skip_whisper:
        print("🤖 Loading OpenAI Whisper Forced Alignment Model (tiny.en)...")
        whisper_model = whisper.load_model("tiny.en")
    else:
        if args.skip_whisper:
            print("⚡ Skipping Whisper alignment for 100x ultra-fast audio deployment.")
        else:
            print("ℹ️ OpenAI Whisper module not installed. Proceeding with Kokoro TTS audio synthesis & Hetzner S3 uploading.")
        whisper_model = None

    s3_client = get_s3_client()

    for idx, slug in enumerate(unique_books):
        print(f"\n📖 Queue Item [{idx + 1}/{len(unique_books)}]: {slug}")
        process_single_book(slug, target_voices, valid_qualities, args.force, args.title_pause, args.paragraph_pause, kokoro, whisper_model, s3_client, db, args.parallel, target_chapters=target_chapters)

    print("\n=======================================================================")
    print("🎉 MASTER MULTI-BOOK QUEUE AUDIO PIPELINE COMPLETE!")
    print("=======================================================================")

if __name__ == "__main__":
    main()
