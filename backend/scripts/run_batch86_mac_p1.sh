#!/bin/bash
# Local Mac (Process 1) - 15 Books
cd /Users/humayunrashid/multicamp/liiro-ebook/backend 2>/dev/null || cd /root
PYTHON_BIN=$(which python3)
[ -f /root/runner_venv/bin/python3 ] && PYTHON_BIN=/root/runner_venv/bin/python3

$PYTHON_BIN -u scripts/generate_audio_single_master.py star-hunter on-the-art-of-reading a-general-view-of-positivism poetry the-water-babies the-old-english-baron sons-and-lovers the-young-visiters moll-flanders the-lives-and-opinions-of-eminent-philosophers understood-betsy interim the-enchanted-castle the-magic-city the-railway-children --voices michael --qualities standard --skip-whisper --parallel 1 --force 2>&1 | tee /tmp/batch86_mac_p1.log
