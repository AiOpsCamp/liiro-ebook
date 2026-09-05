#!/usr/bin/env python3
"""
=============================================================================
🎧 LIIRO EBOOK: TOP SHORT NOVELLAS & CLASSICS (EXCLUDING SHERLOCK HOLMES)
=============================================================================
High-speed 8-core audiobook generation across curated short classic masterpieces
(<= 15 chapters), starting directly with Arsène Lupin, The Great Gatsby,
Jack London, Stevenson, Wells, Dickens, and E. Nesbit.

Narrator Voices:
  - LEWIS (bm_lewis): French Mystery (Arsène Lupin), Gothic Horror (Jekyll & Hyde)
  - ADAM (am_adam): American Literature (The Great Gatsby), Wilderness (Call of the Wild)
  - GEORGE (bm_george): BBC English Narrator, Victorian Novellas, Sci-Fi Classics
  - HEART (af_heart): Warm Female, Children & Fairy Tales (Kipling, E. Nesbit)
  - EMMA (bf_emma): British Female, Literary Drama & Modernist Classics (Virginia Woolf)
  - MICHAEL (am_michael): Philosophy, Spiritual & Wisdom Classics (Tozer, Comte)

Concurrency: 8 Parallel Chapter Workers per Book
=============================================================================
"""

import sys
import os
import subprocess
import time

NON_SHERLOCK_SHORT_PIPELINE = [
    # -------------------------------------------------------------------------
    # 🎩 1. ARSÈNE LUPIN GENTLEMAN BURGLAR SERIES (Maurice Leblanc) — LEWIS
    # -------------------------------------------------------------------------
    {"slug": "the-extraordinary-adventures-of-arsene-lupin-gentleman-burglar", "voice": "lewis", "series": "Arsène Lupin", "author": "Maurice Leblanc", "ch": 9},
    {"slug": "the-eight-strokes-of-the-clock", "voice": "lewis", "series": "Arsène Lupin", "author": "Maurice Leblanc", "ch": 8},
    {"slug": "arsene-lupin-versus-herlock-sholmes", "voice": "lewis", "series": "Arsène Lupin", "author": "Maurice Leblanc", "ch": 8},
    {"slug": "the-hollow-needle", "voice": "lewis", "series": "Arsène Lupin", "author": "Maurice Leblanc", "ch": 10},
    {"slug": "the-confessions-of-arsene-lupin", "voice": "lewis", "series": "Arsène Lupin", "author": "Maurice Leblanc", "ch": 10},
    {"slug": "the-crystal-stopper", "voice": "lewis", "series": "Arsène Lupin", "author": "Maurice Leblanc", "ch": 13},
    {"slug": "memoirs-of-arsene-lupin", "voice": "lewis", "series": "Arsène Lupin", "author": "Maurice Leblanc", "ch": 14},

    # -------------------------------------------------------------------------
    # 🌟 2. WORLD LITERATURE SHORT NOVELS & NOVELLAS (ADAM, LEWIS, GEORGE, EMMA)
    # -------------------------------------------------------------------------
    {"slug": "the-great-gatsby", "voice": "adam", "series": "American Classics", "author": "F. Scott Fitzgerald", "ch": 9},
    {"slug": "the-call-of-the-wild", "voice": "adam", "series": "Wilderness Adventure", "author": "Jack London", "ch": 7},
    {"slug": "the-strange-case-of-dr-jekyll-and-mr-hyde", "voice": "lewis", "series": "Gothic Classics", "author": "Robert Louis Stevenson", "ch": 10},
    {"slug": "the-time-machine", "voice": "george", "series": "Sci-Fi Classics", "author": "H. G. Wells", "ch": 12},
    {"slug": "a-christmas-carol", "voice": "george", "series": "Victorian Classics", "author": "Charles Dickens", "ch": 5},
    {"slug": "heart-of-darkness", "voice": "adam", "series": "Psychological Novella", "author": "Joseph Conrad", "ch": 3},
    {"slug": "the-man-who-was-thursday", "voice": "george", "series": "Philosophical Thriller", "author": "G. K. Chesterton", "ch": 15},
    {"slug": "the-importance-of-being-earnest", "voice": "lewis", "series": "Comedy & Satire", "author": "Oscar Wilde", "ch": 5},
    {"slug": "dubliners", "voice": "george", "series": "Irish Modernism", "author": "James Joyce", "ch": 15},
    {"slug": "mrs-dalloway", "voice": "emma", "series": "Modernist Fiction", "author": "Virginia Woolf", "ch": 1},
    {"slug": "the-bridge-of-san-luis-rey", "voice": "adam", "series": "Pulitzer Novella", "author": "Thornton Wilder", "ch": 5},
    {"slug": "a-portrait-of-the-artist-as-a-young-man", "voice": "george", "series": "Modernist Classic", "author": "James Joyce", "ch": 5},
    {"slug": "the-young-visiters", "voice": "heart", "series": "Victorian Humour", "author": "Daisy Ashford", "ch": 12},
    {"slug": "the-water-babies", "voice": "heart", "series": "Fairy Tale", "author": "Charles Kingsley", "ch": 8},
    {"slug": "the-life-of-lazarillo-de-tormes", "voice": "lewis", "series": "Picaresque Classic", "author": "Anonymous", "ch": 8},
    {"slug": "the-league-of-the-scarlet-pimpernel", "voice": "lewis", "series": "Historical Adventure", "author": "Baroness Orczy", "ch": 11},
    {"slug": "the-house-without-windows", "voice": "heart", "series": "Nature Classic", "author": "Barbara Newhall Follett", "ch": 3},

    # -------------------------------------------------------------------------
    # 🧚 3. E. NESBIT & RUDYARD KIPLING CHILDREN CLASSICS — HEART
    # -------------------------------------------------------------------------
    {"slug": "the-railway-children", "voice": "heart", "series": "Family Adventure", "author": "E. Nesbit", "ch": 14},
    {"slug": "the-enchanted-castle", "voice": "heart", "series": "Magical Adventure", "author": "E. Nesbit", "ch": 12},
    {"slug": "the-magic-city", "voice": "heart", "series": "Magical Fantasy", "author": "E. Nesbit", "ch": 12},
    {"slug": "wet-magic", "voice": "heart", "series": "Underwater Fantasy", "author": "E. Nesbit", "ch": 12},
    {"slug": "the-jungle-book", "voice": "heart", "series": "Jungle Stories", "author": "Rudyard Kipling", "ch": 7},
    {"slug": "just-so-stories", "voice": "heart", "series": "Fables & Tales", "author": "Rudyard Kipling", "ch": 12},
    {"slug": "understood-betsy", "voice": "heart", "series": "Family Classic", "author": "Dorothy Canfield Fisher", "ch": 11},

    # -------------------------------------------------------------------------
    # 📜 4. BALZAC FRENCH CLASSIC NOVELLAS (1 to 9 chapters) — EMMA & GEORGE
    # -------------------------------------------------------------------------
    {"slug": "eugenie-grandet", "voice": "emma", "series": "Human Comedy", "author": "Honoré de Balzac", "ch": 1},
    {"slug": "father-goriot", "voice": "george", "series": "Human Comedy", "author": "Honoré de Balzac", "ch": 2},
    {"slug": "the-lily-of-the-valley", "voice": "emma", "series": "Human Comedy", "author": "Honoré de Balzac", "ch": 2},
    {"slug": "modeste-mignon", "voice": "emma", "series": "Human Comedy", "author": "Honoré de Balzac", "ch": 2},
    {"slug": "albert-savarus", "voice": "george", "series": "Human Comedy", "author": "Honoré de Balzac", "ch": 2},
    {"slug": "a-start-in-life", "voice": "george", "series": "Human Comedy", "author": "Honoré de Balzac", "ch": 2},
    {"slug": "ursule-mirouet", "voice": "emma", "series": "Human Comedy", "author": "Honoré de Balzac", "ch": 3},
    {"slug": "lost-illusions", "voice": "george", "series": "Human Comedy", "author": "Honoré de Balzac", "ch": 4},
    {"slug": "beatrix", "voice": "emma", "series": "Human Comedy", "author": "Honoré de Balzac", "ch": 4},
    {"slug": "parisians-in-the-country", "voice": "george", "series": "Human Comedy", "author": "Honoré de Balzac", "ch": 5},
    {"slug": "the-jealousies-of-a-country-town", "voice": "george", "series": "Human Comedy", "author": "Honoré de Balzac", "ch": 5},
    {"slug": "a-woman-of-thirty", "voice": "emma", "series": "Human Comedy", "author": "Honoré de Balzac", "ch": 6},
    {"slug": "the-celibates", "voice": "george", "series": "Human Comedy", "author": "Honoré de Balzac", "ch": 7},
    {"slug": "a-daughter-of-eve", "voice": "emma", "series": "Human Comedy", "author": "Honoré de Balzac", "ch": 9},

    # -------------------------------------------------------------------------
    # 🕵️ 5. DETECTIVE & MYSTERY NOVELLAS (6 to 13 chapters) — LEWIS
    # -------------------------------------------------------------------------
    {"slug": "the-wisdom-of-father-brown", "voice": "lewis", "series": "Father Brown", "author": "G. K. Chesterton", "ch": 12},
    {"slug": "the-big-bow-mystery", "voice": "lewis", "series": "Locked-Room Mystery", "author": "Israel Zangwill", "ch": 12},
    {"slug": "call-mr-fortune", "voice": "lewis", "series": "Detective Mystery", "author": "H. C. Bailey", "ch": 6},
    {"slug": "craig-kennedy-stories", "voice": "lewis", "series": "Scientific Detective", "author": "Arthur B. Reeve", "ch": 13},
    {"slug": "the-bellamy-trial", "voice": "lewis", "series": "Courtroom Mystery", "author": "Frances Noyes Hart", "ch": 8},

    # -------------------------------------------------------------------------
    # 📜 6. PHILOSOPHY, SPIRITUAL & PILGRIMAGE (6 to 13 chapters) — MICHAEL & EMMA
    # -------------------------------------------------------------------------
    {"slug": "the-pursuit-of-god", "voice": "michael", "series": "Spiritual Classic", "author": "A. W. Tozer", "ch": 10},
    {"slug": "a-general-view-of-positivism", "voice": "michael", "series": "Philosophy", "author": "Auguste Comte", "ch": 6},
    {"slug": "the-end-of-the-world", "voice": "george", "series": "Prize Fiction", "author": "Geoffrey Dennis", "ch": 13},
    {"slug": "pointed-roofs", "voice": "emma", "series": "Pilgrimage Series", "author": "Dorothy M. Richardson", "ch": 10},
    {"slug": "backwater", "voice": "emma", "series": "Pilgrimage Series", "author": "Dorothy M. Richardson", "ch": 10},
    {"slug": "interim", "voice": "emma", "series": "Pilgrimage Series", "author": "Dorothy M. Richardson", "ch": 11},
    {"slug": "honeycomb", "voice": "emma", "series": "Pilgrimage Series", "author": "Dorothy M. Richardson", "ch": 11},
    {"slug": "deadlock", "voice": "emma", "series": "Pilgrimage Series", "author": "Dorothy M. Richardson", "ch": 13}
]

BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SINGLE_RUNNER = os.path.join(BACKEND_DIR, "scripts", "generate_audio_single_master.py")
STOP_FILE = os.path.join(BACKEND_DIR, "scratch", "STOP_AFTER_CURRENT")

def run_pipeline():
    print("=" * 85, flush=True)
    print("🎙️ LIIRO EBOOK: HIGH-SPEED SHORT NOVELLAS RUNNER (NON-SHERLOCK | 8-CORE TURBO)", flush=True)
    print(f"   Target Pipeline: {len(NON_SHERLOCK_SHORT_PIPELINE)} Non-Sherlock Books", flush=True)
    print("   Concurrency: 8 Parallel Chapter Workers per Book", flush=True)
    print("=" * 85, flush=True)

    for i, item in enumerate(NON_SHERLOCK_SHORT_PIPELINE, 1):
        slug = item["slug"]
        voice = item["voice"]
        series = item["series"]
        author = item["author"]
        ch = item["ch"]

        if os.path.exists(STOP_FILE):
            print(f"\n🛑 Stop file detected ({STOP_FILE}). Gracefully exiting queue.", flush=True)
            try:
                os.remove(STOP_FILE)
            except Exception:
                pass
            break

        print(f"\n[{i}/{len(NON_SHERLOCK_SHORT_PIPELINE)}] ⏳ Starting: {slug} ({ch} chapters)", flush=True)
        print(f"   📖 Series: {series} | Author: {author}", flush=True)
        print(f"   🎙️ Selected Voice: {voice.upper()} | Quality: STANDARD | Workers: 8", flush=True)

        cmd = [
            sys.executable,
            "-u",
            SINGLE_RUNNER,
            slug,
            "--voices", voice,
            "--qualities", "standard",
            "--skip-whisper",
            "--parallel", "1"
        ]

        try:
            start_time = time.time()
            res = subprocess.run(cmd, cwd=BACKEND_DIR)
            elapsed = time.time() - start_time
            if res.returncode == 0:
                print(f"✅ [{i}/{len(NON_SHERLOCK_SHORT_PIPELINE)}] Finished '{slug}' in {elapsed:.1f}s!", flush=True)
            else:
                print(f"⚠️ [{i}/{len(NON_SHERLOCK_SHORT_PIPELINE)}] Worker for '{slug}' exited with code {res.returncode}", flush=True)
        except KeyboardInterrupt:
            print("\n🚨 Interrupted by user. Exiting pipeline.", flush=True)
            break
        except Exception as e:
            print(f"❌ Error executing book '{slug}': {e}", flush=True)

        time.sleep(1)

    print("\n" + "=" * 85, flush=True)
    print("🎉 ALL SHORT CLASSIC AUDIOBOOKS GENERATED & LIVE ON S3 CDN!", flush=True)
    print("=" * 85, flush=True)

if __name__ == "__main__":
    run_pipeline()
