#!/bin/bash
# Local Mac (Process 2) - 15 Books
cd /Users/humayunrashid/multicamp/liiro-ebook/backend 2>/dev/null || cd /root
PYTHON_BIN=$(which python3)
[ -f /root/runner_venv/bin/python3 ] && PYTHON_BIN=/root/runner_venv/bin/python3

$PYTHON_BIN -u scripts/generate_audio_single_master.py wet-magic nonsense-books his-masterpiece this-side-of-paradise little-lord-fauntleroy principia-ethica fannys-first-play major-barbara you-never-can-tell a-bid-for-fortune at-the-mountains-of-madness the-food-of-the-gods hedda-gabler darby-ogill-and-the-good-people a-woman-of-thirty --voices michael --qualities standard --skip-whisper --parallel 1 --force 2>&1 | tee /tmp/batch86_mac_p2.log
