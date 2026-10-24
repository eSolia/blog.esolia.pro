#!/usr/bin/env bash
# Safe fast-forward pull of /root/www (blog.esolia.pro CMS host).
# Installed at /usr/local/bin/blog-nightly-pull.sh; run nightly by
# blog-nightly-pull.timer. Logs to the journal (journalctl -u blog-nightly-pull).
#
# Editors sometimes leave CMS drafts uncommitted (no Save state / Publish), so
# this does NOT require a clean tree. `git merge --ff-only` already refuses,
# changing nothing, when an incoming commit would overwrite a locally modified
# or untracked file; otherwise it fast-forwards and leaves the drafts in place.
# We rely on that check rather than stashing: a stash/pop can leave conflict
# markers inside a draft and orphan stashes nobody remembers.
#
# InfoSec: never discards or rewrites uncommitted CMS edits; only fast-forwards
# to origin/main (no merges, no resets), so the VPS cannot diverge from GitHub.
set -uo pipefail
REPO=/root/www
cd "$REPO" || { echo "no $REPO"; exit 1; }
# Readable Japanese filenames in the journal instead of octal escapes.
git() { command git -c core.quotePath=false "$@"; }

branch=$(git rev-parse --abbrev-ref HEAD)
[ "$branch" != "main" ] && { echo "skip: on '$branch', not main"; exit 0; }

git fetch --quiet origin main || { echo "fetch failed"; exit 1; }
before=$(git rev-parse HEAD)
target=$(git rev-parse origin/main)

dirty=$(git status --porcelain)
if [ -n "$dirty" ]; then
  echo "uncommitted CMS changes present (kept as-is):"
  printf '%s\n' "$dirty" | sed 's/^/  /'
fi

[ "$before" = "$target" ] && { echo "up to date (${before:0:8})"; exit 0; }
git merge-base --is-ancestor HEAD origin/main ||
  { echo "skip: local main has commits not on origin/main (unpushed CMS commit?)"; exit 0; }

if ! out=$(git merge --ff-only origin/main 2>&1); then
  echo "skip: fast-forward refused; nothing changed. git says:"
  printf '%s\n' "$out" | sed 's/^/  /'
  echo "  -> an incoming commit touches a file with uncommitted CMS edits."
  echo "     Publish/Save state (or discard) that draft in the CMS, then re-run:"
  echo "     systemctl start blog-nightly-pull.service"
  exit 0
fi

after=$(git rev-parse HEAD)
echo "pulled ${before:0:8} -> ${after:0:8}"
git --no-pager diff --name-only "$before" "$after" | sed 's/^/  changed: /'
if git diff --name-only "$before" "$after" | grep -qE '^(deno\.json|deno\.lock|_config\.ts|_cms\.ts|_md5_shim\.ts|plugins\.ts)$'; then
  echo "config/deps changed -> restarting lumecms"
  systemctl restart lumecms
else
  echo "content-only change -> Lume watcher rebuilds; no restart needed"
fi
echo "done"
