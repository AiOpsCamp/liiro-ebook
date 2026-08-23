import os
import sys
import json
import urllib.request
import pymongo
import whisper

def run_openai_whisper_alignment(story_slug="the-strange-case-of-dr-jekyll-and-mr-hyde", model_name="tiny.en"):
    mongo_url = "mongodb://admin:PROD_PASSWORD_2026@127.0.0.1:27017/langoread_prod?authSource=admin"
    client = pymongo.MongoClient(mongo_url)
    db = client["langoreads"]

    story = db["stories"].find_one({"slug": story_slug})
    if not story:
        print(f"❌ Story '{story_slug}' not found!")
        sys.exit(1)

    chapters = list(db["storychapters"].find({"storyId": story["_id"]}).sort("chapterNumber", 1))
    print(f"📖 Found {len(chapters)} chapters for '{story.get('title', story_slug)}'.")

    print(f"🤖 Loading OpenAI Whisper model ({model_name})...")
    model = whisper.load_model(model_name)

    scratch_dir = os.path.join(os.path.dirname(__file__), "..", "scratch", "jekyll_audio")
    os.makedirs(scratch_dir, exist_ok=True)

    for ch in chapters:
        ch_num = ch.get("chapterNumber")
        audio_map = ch.get("audioUrl", {})
        audio_url = audio_map.get("en") if isinstance(audio_map, dict) else audio_map

        if not audio_url:
            print(f"⚠️ Chapter {ch_num}: No audio URL found, skipping.")
            continue

        local_mp3 = os.path.join(scratch_dir, f"ch_{ch_num}.mp3")
        if not os.path.exists(local_mp3):
            print(f"\n📥 [Chapter {ch_num}] Downloading {audio_url}...")
            urllib.request.urlretrieve(audio_url, local_mp3)

        print(f"🎙️ [Chapter {ch_num}] Aligning with OpenAI Whisper (word_timestamps=True)...")
        result = model.transcribe(local_mp3, word_timestamps=True)

        exercise_sentences = []
        for seg in result.get("segments", []):
            seg_text = seg.get("text", "").strip()
            seg_start = round(float(seg.get("start", 0.0)), 3)
            seg_end = round(float(seg.get("end", 0.0)), 3)

            word_list = []
            for w in seg.get("words", []):
                w_text = w.get("word", "").strip()
                if "start" in w and "end" in w:
                    w_start = round(float(w["start"]), 3)
                    w_end = round(float(w["end"]), 3)
                    word_list.append({
                        "text": w_text,
                        "start": w_start,
                        "end": w_end
                    })

            if word_list:
                exercise_sentences.append({
                    "text": seg_text,
                    "start": seg_start,
                    "end": seg_end,
                    "words": word_list
                })

        if exercise_sentences:
            max_end = exercise_sentences[-1]["end"]
            db["storychapters"].update_one(
                {"_id": ch["_id"]},
                {
                    "$set": {
                        "wordTimestamps.en": exercise_sentences,
                        "durationSeconds.en": max_end
                    }
                }
            )
            print(f"✅ [Chapter {ch_num}] SAVED OPENAI WHISPER TIMESTAMPS TO MONGO ATLAS! ({len(exercise_sentences)} sentences, duration: {max_end}s)")

    print("\n=======================================================")
    print("🎉 ALL CHAPTERS ALIGNED WITH OPENAI WHISPER WORD TIMESTAMPS!")
    print("=======================================================")
    client.close()

if __name__ == "__main__":
    story_arg = sys.argv[1] if len(sys.argv) > 1 else "the-strange-case-of-dr-jekyll-and-mr-hyde"
    model_arg = sys.argv[2] if len(sys.argv) > 2 else "tiny.en"
    run_openai_whisper_alignment(story_arg, model_arg)
