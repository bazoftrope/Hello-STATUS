#!/usr/bin/env bash
set -euo pipefail

REPO_DIR="/home/ubuntu/Hello-STATUS"
BRANCH="main"
LOG_FILE="/home/ubuntu/hello-status-auto-deploy.log"
LOCK_FILE="/tmp/hello-status-auto-deploy.lock"

log() {
  echo "$(date -Is) $*" >> "$LOG_FILE"
}

# Prevent overlapping deploys (cron runs every minute, build may take several minutes).
exec 9>"$LOCK_FILE"
if ! flock -n 9; then
  log "deploy already running, skip"
  exit 0
fi

cd "$REPO_DIR"

git fetch origin "$BRANCH" >> "$LOG_FILE" 2>&1

LOCAL_SHA=$(git rev-parse HEAD)
REMOTE_SHA=$(git rev-parse "origin/$BRANCH")

if [ "$LOCAL_SHA" = "$REMOTE_SHA" ]; then
  exit 0
fi

log "new commit detected: $LOCAL_SHA -> $REMOTE_SHA"

git checkout -f "$BRANCH" 2>/dev/null || git checkout -f -B "$BRANCH" "origin/$BRANCH"
git reset --hard "origin/$BRANCH"

# Build first: a failed build must leave the currently running container untouched.
log "docker compose build..."
if ! docker compose build >> "$LOG_FILE" 2>&1; then
  log "BUILD FAILED, keeping previous container running"
  exit 1
fi

log "docker compose up -d..."
docker compose up -d >> "$LOG_FILE" 2>&1

# Wait for the app to answer; roll back to the previous commit if it never comes up.
log "waiting for http://localhost:3000/login..."
HEALTHY=0
for _ in $(seq 1 30); do
  sleep 5
  CODE=$(curl -s -o /dev/null -w '%{http_code}' --max-time 10 http://localhost:3000/login || echo 000)
  if [ "$CODE" = "200" ]; then
    HEALTHY=1
    break
  fi
done

if [ "$HEALTHY" -ne 1 ]; then
  log "HEALTH CHECK FAILED after deploy, rolling back to $LOCAL_SHA"
  git reset --hard "$LOCAL_SHA"
  docker compose build >> "$LOG_FILE" 2>&1 || log "rollback build failed"
  docker compose up -d >> "$LOG_FILE" 2>&1 || log "rollback up failed"
  exit 1
fi

log "deploy finished: $REMOTE_SHA is live"
