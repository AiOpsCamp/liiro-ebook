#!/bin/bash
# Hetzner VM 2 (Process 1) - 14 Books
cd /Users/humayunrashid/multicamp/liiro-ebook/backend 2>/dev/null || cd /root
PYTHON_BIN=$(which python3)
[ -f /root/runner_venv/bin/python3 ] && PYTHON_BIN=/root/runner_venv/bin/python3

$PYTHON_BIN -u scripts/generate_audio_single_master.py the-faraway-bride green-forest-stories green-meadow-stories smoky-the-cowhorse the-sound-and-the-fury romeo-and-juliet the-new-freedom old-indian-legends the-luzumiyat eugene-onegin idylls-of-the-king john-silence-stories sir-gawain-and-the-green-knight the-argonautica --voices michael --qualities standard --skip-whisper --parallel 1 --force 2>&1 | tee /tmp/batch86_hetzner_vm2_p1.log
