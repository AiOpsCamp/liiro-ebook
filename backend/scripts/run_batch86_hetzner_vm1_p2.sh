#!/bin/bash
# Hetzner VM 1 (Process 2) - 14 Books
cd /Users/humayunrashid/multicamp/liiro-ebook/backend 2>/dev/null || cd /root
PYTHON_BIN=$(which python3)
[ -f /root/runner_venv/bin/python3 ] && PYTHON_BIN=/root/runner_venv/bin/python3

$PYTHON_BIN -u scripts/generate_audio_single_master.py on-a-pincushion the-necklace-of-princess-fiorimonde the-windfairies georgette-leblanc the-green-hat the-inspector-general childrens-stories a-high-wind-in-jamaica just-william fred-gross-stories captains-courageous just-so-stories the-jungle-book hindu-tales-from-the-sanskrit --voices michael --qualities standard --skip-whisper --parallel 1 --force 2>&1 | tee /tmp/batch86_hetzner_vm1_p2.log
