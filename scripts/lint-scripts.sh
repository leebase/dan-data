#!/bin/bash
# Lint all bash scripts using shellcheck
# Usage: ./scripts/lint-scripts.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Check if shellcheck is installed
if ! command -v shellcheck &> /dev/null; then
    echo "Error: shellcheck not found"
    echo "Install with: brew install shellcheck (macOS) or apt-get install shellcheck (Linux)"
    exit 1
fi

echo "Running shellcheck on all bash scripts in scripts/..."
echo ""

FAILED=0
CHECKED=0

# Find all .sh files in scripts directory
while IFS= read -r script; do
    CHECKED=$((CHECKED + 1))
    echo "Checking: $script"
    
    if shellcheck "$script"; then
        echo "  ✓ Passed"
    else
        echo "  ✗ Failed"
        FAILED=1
    fi
    echo ""
done < <(find "$SCRIPT_DIR" -name "*.sh" -type f)

echo "Checked $CHECKED scripts"

if [ $FAILED -eq 0 ]; then
    echo "✓ All scripts passed shellcheck"
    exit 0
else
    echo "✗ Some scripts have shellcheck issues"
    exit 1
fi
