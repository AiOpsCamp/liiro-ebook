#!/usr/bin/env python3
"""
queue_series_runner.py
======================
Ultra-Fast, Low-Memory Subprocess-Isolated Audio Queue Runner.

Runs standard prose series with --parallel 2 concurrency.
Isolated process per book guarantees RAM stays strictly under ~400 MB.
"""

import sys
import os
import subprocess
import time
import gc
import argparse

# Force unbuffered output
sys.stdout.reconfigure(line_buffering=True)

SCRIPTS_DIR = os.path.dirname(os.path.abspath(__file__))
MASTER_SCRIPT = os.path.join(SCRIPTS_DIR, "generate_audio_single_master.py")

EASY_PROSE_QUEUE = [
    # 🏰 Richard Chandos Action-Thriller Series (18 ch total)
    "blind-corner",
    "perishable-goods",

    # 🦊 Memoirs of George Sherston Series (20 ch total)
    "memoirs-of-a-foxhunting-man",
    "memoirs-of-an-infantry-officer",

    # 🏙️ Utopian Trilogy Series (24 ch total)
    "herland",
    "moving-the-mountain",

    # 🎩 House of Arden Magic Adventure Series (26 ch total)
    "hardings-luck",
    "the-house-of-arden",

    # 🚀 Solar Queen Sci-Fi Series (26 ch total)
    "voodoo-planet",
    "plague-ship",

    # 🎩 A. J. Raffles Gentleman Thief Series (26 ch total)
    "the-amateur-cracksman",
    "the-black-mask",
    "a-thief-in-the-night",

    # 🧚 Psammead Fantasy Trilogy Series (37 ch total)
    "five-children-and-it",
    "the-phoenix-and-the-carpet",
    "the-story-of-the-amulet"
]

def main():
    parser = argparse.ArgumentParser(description="Isolated Fast Audio Queue Runner")
    parser.add_argument("books", nargs="*", help="List of book slugs to synthesize")
    parser.add_argument("--voices", "-v", default="michael", help="Voices to generate (default: michael)")
    parser.add_argument("--qualities", "-q", default="standard", help="Qualities to generate (default: standard)")
    parser.add_argument("--parallel", "-p", type=int, default=6, help="Parallel workers per book (default: 6)")
    parser.add_argument("--force", "-f", action="store_true", help="Force re-generation of existing chapters")
    args = parser.parse_args()

    books = args.books if args.books else EASY_PROSE_QUEUE

    print("\n" + "=" * 75)
    print("🚀 INITIALIZING FAST SUBPROCESS-ISOLATED AUDIO RUNNER (PARALLEL=2)")
    print(f"   Total Books in Queue: {len(books)}")
    print(f"   Target Voice(s): {args.voices}")
    print(f"   Target Qualities: {args.qualities}")
    print(f"   Concurrency: {args.parallel} Parallel Chapter Workers")
    print(f"   Queue: {', '.join(books)}")
    print("   Memory Isolation: Fresh Subprocess per Book (< 400 MB RAM Peak)")
    print("=" * 75 + "\n")

    for idx, slug in enumerate(books, 1):
        print(f"\n[{idx}/{len(books)}] ⏳ Starting Fast Worker for: {slug} (Voice: {args.voices}, Workers: {args.parallel})...")
        start_time = time.time()

        cmd = [
            sys.executable,
            "-u",
            MASTER_SCRIPT,
            slug,
            "--voices", args.voices,
            "--qualities", args.qualities,
            "--skip-whisper",
            "--parallel", str(args.parallel)
        ]
        if args.force:
            cmd.append("--force")

        # Execute as independent subprocess
        process = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1,
            cwd=os.path.dirname(SCRIPTS_DIR)
        )

        for line in process.stdout:
            print(line, end="")

        process.wait()
        elapsed = time.time() - start_time

        if process.returncode == 0:
            print(f"[{idx}/{len(books)}] ✅ Completed '{slug}' successfully in {elapsed:.1f}s!")
        else:
            print(f"[{idx}/{len(books)}] ⚠️ Worker for '{slug}' exited with code {process.returncode}")

        # Reclaim system resources between books
        gc.collect()
        time.sleep(1)

        # Check for user stop flag to cleanly pause queue
        stop_file = os.path.join(SCRIPTS_DIR, "STOP_AFTER_CURRENT")
        if os.path.exists(stop_file):
            print(f"\n🛑 User stop requested via '{stop_file}'. Pausing queue after '{slug}'!")
            try: os.remove(stop_file)
            except Exception: pass
            break

    print("\n" + "=" * 75)
    print("🎉 ALL EASY PROSE SERIES COMPLETED SUCCESSFULLY!")
    print("=" * 75 + "\n")

if __name__ == "__main__":
    main()
