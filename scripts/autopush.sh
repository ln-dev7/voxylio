#!/bin/zsh
# Voxylio auto-push — runs as a LaunchAgent every 3 minutes (see
# scripts/me.lndev.voxylio.autopush.plist; install instructions in the
# repo README). Pushes master to origin ONLY when it is strictly ahead
# and origin/master is an ancestor (pure fast-forward). Never forces,
# never touches a repo that is mid-merge/rebase.
# Log: ~/Library/Logs/voxylio-autopush.log
set -u
REPO="/Users/lndev/Desktop/LN/Perso/voxylio"
LOG="$HOME/Library/Logs/voxylio-autopush.log"
log() { echo "$(date '+%F %T') $1" >> "$LOG"; }

cd "$REPO" 2>/dev/null || exit 0
if [ -d .git/rebase-merge ] || [ -d .git/rebase-apply ] || [ -f .git/MERGE_HEAD ]; then
  exit 0 # a human is in the middle of something: stand down
fi

git fetch -q origin master 2>/dev/null || { log "fetch failed"; exit 0; }
LOCAL=$(git rev-parse master 2>/dev/null) || exit 0
REMOTE=$(git rev-parse origin/master 2>/dev/null) || exit 0
[ "$LOCAL" = "$REMOTE" ] && exit 0

if git merge-base --is-ancestor origin/master master 2>/dev/null; then
  N=$(git rev-list --count "$REMOTE".."$LOCAL")
  if git push -q origin master 2>>"$LOG"; then
    log "pushed $N commit(s) -> ${LOCAL:0:9}"
  else
    log "push failed ($N commit(s) waiting) — check SSH key/network"
  fi
else
  log "master and origin/master diverged — manual attention needed"
fi
