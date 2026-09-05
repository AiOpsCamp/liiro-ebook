#!/bin/bash
# Hetzner VM 1 (Process 1) - 14 Books
cd /Users/humayunrashid/multicamp/liiro-ebook/backend 2>/dev/null || cd /root
PYTHON_BIN=$(which python3)
[ -f /root/runner_venv/bin/python3 ] && PYTHON_BIN=/root/runner_venv/bin/python3

$PYTHON_BIN -u scripts/generate_audio_single_master.py lost-face a-portrait-of-the-artist-as-a-young-man exiles irish-fairy-tales cornelli the-pilgrims-progress some-thoughts-concerning-education ten-days-that-shook-the-world chance the-nigger-of-the-narcissus the-wind-in-the-willows tao-te-ching a-tangled-tale eminent-victorians --voices michael --qualities standard --skip-whisper --parallel 1 --force 2>&1 | tee /tmp/batch86_hetzner_vm1_p1.log
