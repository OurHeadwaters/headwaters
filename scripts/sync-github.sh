#!/usr/bin/env bash
set -euo pipefail

REPO_URL="https://github.com/OurHeadwaters/headwaters.git"
REMOTE_NAME="github"

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

AUTH_URL="https://oauth2:${GITHUB_TOKEN}@github.com/OurHeadwaters/headwaters.git"

if git remote get-url "$REMOTE_NAME" &>/dev/null; then
  git remote set-url "$REMOTE_NAME" "$AUTH_URL"
else
  git remote add "$REMOTE_NAME" "$AUTH_URL"
fi

BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "main")

echo "Fetching '$BRANCH' from $REPO_URL ..."
git fetch "$REMOTE_NAME" "$BRANCH"

if git merge-base --is-ancestor "$REMOTE_NAME/$BRANCH" HEAD 2>/dev/null; then
  echo "Local branch already contains all remote commits."
else
  echo "Remote has commits not in this workspace — merging them in first ..."
  if ! git -c user.name="Replit Agent" -c user.email="agent@replit.com" merge "$REMOTE_NAME/$BRANCH" --no-edit -m "Merge remote-tracking branch '$REMOTE_NAME/$BRANCH' (auto-sync)"; then
    git merge --abort 2>/dev/null || true
    git remote set-url "$REMOTE_NAME" "$REPO_URL"
    echo ""
    echo "ERROR: Merge conflict between this workspace and GitHub. Aborted the merge."
    echo "This needs manual resolution — pull the remote changes, resolve conflicts, and re-run this sync."
    exit 1
  fi
fi

echo "Pushing branch '$BRANCH' to $REPO_URL ..."
git push "$REMOTE_NAME" "$BRANCH" --tags

git remote set-url "$REMOTE_NAME" "$REPO_URL"

echo ""
echo "Done. Synced to https://github.com/OurHeadwaters/headwaters"
