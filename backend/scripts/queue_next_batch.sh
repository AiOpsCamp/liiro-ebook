#!/usr/bin/env bash
set -e

cd /Users/humayunrashid/multicamp/liiro-ebook

echo "⏳ Waiting for Batch 2 (task-526) to finish before launching Batch 3..."
while pgrep -f "run_gutenberg_batch_importer.py --catalog=backend/docs/NEXT_200_GUTENBERG_BOOKS.json" > /dev/null; do
    sleep 5
done

echo "🎉 Batch 2 finished! Starting Batch 3 (Books 201-400) immediately..."
python3 -u backend/scripts/run_gutenberg_batch_importer.py --catalog=backend/docs/NEXT_200_GUTENBERG_BOOKS_PART2.json
