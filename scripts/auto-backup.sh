#!/bin/bash
# Auto-backup script — commits and pushes all changes every 30 min
# Usage: run manually, or add to cron: */30 * * * * /path/to/auto-backup.sh >> /tmp/findcard-backup.log 2>&1

REPO="/Users/idanyehiel/Documents/project1"
BRANCH="master"
MAX_RETRIES=3

cd "$REPO" || { echo "[ERROR] Cannot cd to $REPO"; exit 1; }

# Stage all changes
git add -A

# Only commit if there's something to commit
if git diff --cached --quiet; then
  echo "[$(date '+%H:%M:%S')] Nothing to commit — repo is clean"
else
  TIMESTAMP=$(date '+%Y-%m-%d %H:%M')
  git commit -m "auto-backup: $TIMESTAMP" --no-gpg-sign
  echo "[$(date '+%H:%M:%S')] Committed changes"
fi

# Push with retry
for i in $(seq 1 $MAX_RETRIES); do
  if git push origin "$BRANCH" 2>&1; then
    echo "[$(date '+%H:%M:%S')] Pushed to GitHub successfully"
    exit 0
  else
    echo "[$(date '+%H:%M:%S')] Push attempt $i failed, retrying..."
    sleep 5
  fi
done

echo "[$(date '+%H:%M:%S')] Push failed after $MAX_RETRIES retries"
exit 1
