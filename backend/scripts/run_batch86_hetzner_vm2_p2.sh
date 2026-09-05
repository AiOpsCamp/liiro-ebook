#!/bin/bash
# Hetzner VM 2 (Process 2) - 14 Books
cd /Users/humayunrashid/multicamp/liiro-ebook/backend 2>/dev/null || cd /root
PYTHON_BIN=$(which python3)
[ -f /root/runner_venv/bin/python3 ] && PYTHON_BIN=/root/runner_venv/bin/python3

$PYTHON_BIN -u scripts/generate_audio_single_master.py the-maracot-deep the-three-impostors the-haunted-bookshop the-divine-comedy the-book-of-jade lord-peter-views-the-body master-flea spoon-river-anthology the-master-mind-of-mars the-mind-of-mr-j-g-reeder the-faerie-queene all-quiet-on-the-western-front a-man-could-stand-up some-do-not --voices michael --qualities standard --skip-whisper --parallel 1 --force 2>&1 | tee /tmp/batch86_hetzner_vm2_p2.log
