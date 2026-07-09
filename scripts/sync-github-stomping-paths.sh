#!/usr/bin/env bash
set -euo pipefail

REPO_URL="https://github.com/OurHeadwaters/Stomping-Paths.git"
REMOTE_NAME="github-stomping-paths"

if [ -z "${GITHUB_TOKEN:-}" ]; then
  echo "ERROR: GITHUB_TOKEN is not set."
  echo ""
  echo "To fix this:"
  echo "  1. Go to https://github.com/settings/tokens and create a Personal Access Token"
  echo "     with 'repo' scope (or 'Contents: Read and write' for fine-grained tokens)."
  echo "  2. In Replit, open the Secrets panel and add:"
  echo "     Key:   GITHUB_TOKEN"
  echo "     Value: <your token>"
  echo ""
  exit 1
fi

AUTH_URL="https://oauth2:${GITHUB_TOKEN}@github.com/OurHeadwaters/Stomping-Paths.git"

if git remote get-url "$REMOTE_NAME" &>/dev/null; then
  git remote set-url "$REMOTE_NAME" "$AUTH_URL"
else
  git remote add "$REMOTE_NAME" "$AUTH_URL"
fi

BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "main")

echo "Fetching '$BRANCH' from $REPO_URL ..."
if git fetch "$REMOTE_NAME" "$BRANCH" 2>/dev/null; then
  HAS_REMOTE_BRANCH=1
else
  echo "Remote branch '$BRANCH' does not exist yet on $REPO_URL (empty repo, or different default branch)."
  HAS_REMOTE_BRANCH=0
fi

if [ "$HAS_REMOTE_BRANCH" = "1" ]; then
  if git merge-base --is-ancestor "$REMOTE_NAME/$BRANCH" HEAD 2>/dev/null; then
    echo "Local branch already contains all remote commits."
  else
    echo "Remote has commits not in this workspace — checking whether they merge cleanly ..."

    MERGE_BASE=$(git merge-base HEAD "$REMOTE_NAME/$BRANCH")
    CONFLICT_CHECK=$(git merge-tree "$MERGE_BASE" HEAD "$REMOTE_NAME/$BRANCH" 2>/dev/null || true)

    if echo "$CONFLICT_CHECK" | grep -q "<<<<<<<"; then
      git remote set-url "$REMOTE_NAME" "$REPO_URL"
      echo ""
      echo "ERROR: Merging '$REMOTE_NAME/$BRANCH' into this workspace would conflict."
      echo "Nothing was changed — no merge was started, so there's no conflicted state to recover from."
      echo ""
      echo "To fix this, pick one:"
      echo "  1. Manually pull and merge '$REMOTE_NAME/$BRANCH', resolve the conflicts, then re-run this sync."
      echo "  2. If you're sure this workspace's version should win, re-run with FORCE_PUSH=1 to overwrite"
      echo "     the remote branch instead of merging (this discards the remote-only commits)."
      exit 1
    fi

    if [ "${FORCE_PUSH:-}" = "1" ]; then
      echo "FORCE_PUSH=1 set — skipping merge, will overwrite remote branch on push."
    else
      echo "No conflicts detected — merging ..."
      if ! git -c user.name="Replit Agent" -c user.email="agent@replit.com" merge "$REMOTE_NAME/$BRANCH" --no-edit -m "Merge remote-tracking branch '$REMOTE_NAME/$BRANCH' (auto-sync)"; then
        git merge --abort 2>/dev/null || true
        git remote set-url "$REMOTE_NAME" "$REPO_URL"
        echo ""
        echo "ERROR: Merge conflict between this workspace and GitHub. Aborted the merge."
        echo "This needs manual resolution — pull the remote changes, resolve conflicts, and re-run this sync."
        echo "Or re-run with FORCE_PUSH=1 to overwrite the remote branch instead."
        exit 1
      fi
    fi
  fi
fi

if [ "${FORCE_PUSH:-}" = "1" ]; then
  echo "Force-pushing branch '$BRANCH' to $REPO_URL ..."
  git push "$REMOTE_NAME" "$BRANCH" --tags --force
else
  echo "Pushing branch '$BRANCH' to $REPO_URL ..."
  git push "$REMOTE_NAME" "$BRANCH" --tags
fi

git remote set-url "$REMOTE_NAME" "$REPO_URL"

echo ""
echo "Done. Synced to https://github.com/OurHeadwaters/Stomping-Paths"
