#!/usr/bin/env python3
"""
🧹 Text Cleaner & Sanitizer for Audio Generation (TTS)
======================================================
Removes markdown syntax, special symbols, duplicate chapter titles, HTML tags,
and unicode artifacts before feeding text into Kokoro ONNX TTS.
"""

import re
import unicodedata

def remove_html_tags(text: str) -> str:
    """Strip HTML elements and unescape entities."""
    text = re.sub(r"<br\s*/?>", "\n", text, flags=re.IGNORECASE)
    text = re.sub(r"</p>", "\n\n", text, flags=re.IGNORECASE)
    text = re.sub(r"<[^>]+>", "", text)
    return text

def normalize_unicode(text: str) -> str:
    """Clean invisible unicode characters, zero-width spaces, and control symbols."""
    # Remove zero-width spaces, joiners, non-breaking spaces
    text = text.replace("\u2060", "").replace("\u200b", "").replace("\ufeff", "")
    text = text.replace("\u00a0", " ")
    # Normalize unicode to NFKC
    text = unicodedata.normalize("NFKC", text)
    return text

def clean_special_characters_for_tts(text: str) -> str:
    """
    Strips special characters that cause unwanted TTS noises (asterisks, hashes, etc.)
    and normalizes punctuation for natural speech pause rhythm.
    """
    # 1. Remove Markdown Headers (# Title -> Title)
    text = re.sub(r"^#{1,6}\s+", "", text, flags=re.MULTILINE)

    # 2. Remove Markdown Emphasis/Bold (*word*, **word**, _word_, __word__)
    text = re.sub(r"\*{1,3}([^\*]+)\*{1,3}", r"\1", text)
    text = re.sub(r"_{1,3}([^_]+)_{1,3}", r"\1", text)

    # 3. Remove standalone asterisks, tildes, backticks, carets, hashes
    text = re.sub(r"[*`~^#<>|\\{}]", "", text)

    # 4. Replace em-dashes and en-dashes with natural pause commas
    text = re.sub(r"[—–]", ", ", text)

    # 5. Normalize smart quotes to standard quotes for uniform TTS parsing
    text = text.replace("“", '"').replace("”", '"').replace("‘", "'").replace("’", "'")

    # 6. Replace symbols with spoken words
    text = re.sub(r"\b&\b", "and", text)
    text = re.sub(r"\b@\b", "at", text)

    # 7. Collapse multiple dashes/ellipsis to clean punctuation
    text = re.sub(r"-{2,}", ", ", text)
    text = re.sub(r"\.{4,}", "...", text)

    # 8. Collapse excessive whitespace and blank lines
    lines = [line.strip() for line in text.splitlines()]
    cleaned_text = "\n".join(line for line in lines if line)
    cleaned_text = re.sub(r"[ \t]+", " ", cleaned_text)

    return cleaned_text.strip()

def deduplicate_chapter_title(title: str, text_payload: str) -> str:
    """
    Detects if the text payload ALREADY begins with the chapter title or 'Chapter X',
    preventing duplicate narration (e.g. 'Story of the Door, Story of the Door...').
    """
    if not text_payload:
        return ""

    clean_title = re.sub(r"[^\w\s]", "", title.lower()).strip()
    lines = text_payload.splitlines()
    first_few_lines = lines[:3]

    for i, line in enumerate(first_few_lines):
        clean_line = re.sub(r"[^\w\s]", "", line.lower()).strip()

        # If line exactly matches or starts with the chapter title or 'chapter N'
        if clean_line and (clean_line == clean_title or clean_line.startswith(clean_title)):
            # Drop the duplicate heading line from text_payload
            lines = lines[i + 1:]
            break
        # Also check for 'Chapter 1' / 'Chapter One' pattern
        if re.match(r"^chapter\s+(\d+|one|two|three|four|five|six|seven|eight|nine|ten)", clean_line, re.IGNORECASE):
            lines = lines[i + 1:]
            break

    return "\n\n".join(line.strip() for line in lines if line.strip())

def prepare_tts_script(title: str, text_payload: str, chapter_number: int = 1) -> str:
    """
    Master text preparation function:
    1. Removes HTML tags and unescapes entities.
    2. Normalizes unicode artifacts.
    3. Deduplicates chapter title heading.
    4. Strips asterisks, hashes, and special sound characters.
    5. Returns clean, single-narration TTS script.
    """
    raw_text = remove_html_tags(text_payload or "")
    norm_text = normalize_unicode(raw_text)

    # Deduplicate chapter heading
    body_text = deduplicate_chapter_title(title or "", norm_text)

    # Clean special symbols
    clean_title = clean_special_characters_for_tts(title or f"Chapter {chapter_number}")
    clean_body = clean_special_characters_for_tts(body_text)

    # Prepend spoken chapter header EXACTLY ONCE
    spoken_header = f"Chapter {chapter_number}. {clean_title}."
    return f"{spoken_header}\n\n{clean_body}"

if __name__ == "__main__":
    # Test cleaning logic
    test_title = "Story of the Door"
    test_payload = """Story of the Door

Mr. Utterson the lawyer was a man of a *rugged* countenance that was **never** lighted by a smile—cold, scanty and embarrassed in discourse; backward in sentiment; lean, long, dusty, dreary and yet somehow lovable.

And you never asked about the⁠—place with the door?"""

    result = prepare_tts_script(test_title, test_payload, chapter_number=1)
    print("=== SANITIZED TTS OUTPUT ===")
    print(result)
