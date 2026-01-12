#!/bin/bash
# Set up git worktrees for dev-crawl and prod-crawl

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
PROD_DIR="${PROJECT_ROOT}-prod"

echo "========================================"
echo "  Setting up Git Worktrees"
echo "========================================"
echo ""

# Check if we're in a git repo
if [ ! -d "$PROJECT_ROOT/.git" ]; then
    echo "Error: Not a git repository"
    exit 1
fi

cd "$PROJECT_ROOT"

# Check current branch
CURRENT_BRANCH=$(git branch --show-current)

# Create dev-crawl if not exists
if ! git show-ref --verify --quiet refs/heads/dev-crawl; then
    echo "Creating dev-crawl branch..."
    git branch dev-crawl
fi

# Switch to dev-crawl if not already there
if [ "$CURRENT_BRANCH" != "dev-crawl" ]; then
    echo "Switching to dev-crawl..."
    git checkout dev-crawl
fi

# Create prod-crawl worktree if not exists
if [ -d "$PROD_DIR" ]; then
    echo "✓ prod-crawl worktree already exists at $PROD_DIR"
else
    echo "Creating prod-crawl worktree at $PROD_DIR..."
    git worktree add -b prod-crawl "$PROD_DIR"
fi

echo ""
echo "✓ Worktrees configured:"
echo ""
git worktree list
echo ""
echo "Usage:"
echo "  - Work in dev-crawl: cd $PROJECT_ROOT"
echo "  - View prod-crawl: cd $PROD_DIR"
echo ""
