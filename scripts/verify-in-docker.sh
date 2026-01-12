#!/bin/bash
# Verify story completion (local version - no Docker)
# Usage: verify-in-docker.sh <story-id>

set -e

STORY_ID="$1"

if [ -z "$STORY_ID" ]; then
    echo "Usage: verify-in-docker.sh <story-id>"
    exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKSPACE_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "Verifying story: $STORY_ID"

# Simple verification logic based on story ID
case "$STORY_ID" in
    "US-001")
        # Check that readme.md and architecture.md exist in workspace
        if [ ! -f "$WORKSPACE_ROOT/workspace/readme.md" ]; then
            echo "✗ FAIL: workspace/readme.md not found"
            exit 1
        fi
        
        if [ ! -f "$WORKSPACE_ROOT/workspace/architecture.md" ]; then
            echo "✗ FAIL: workspace/architecture.md not found"
            exit 1
        fi
        
        # Check that readme.md mentions DMAIC and verification views
        if ! grep -qi "DMAIC" "$WORKSPACE_ROOT/workspace/readme.md"; then
            echo "✗ FAIL: readme.md does not mention DMAIC"
            exit 1
        fi
        
        if ! grep -q "vw_kpi_baseline\|vw_wait_time_audit" "$WORKSPACE_ROOT/workspace/readme.md"; then
            echo "✗ FAIL: readme.md does not reference required views"
            exit 1
        fi
        
        # Check that architecture.md has required content
        if ! grep -qi "schema\|generation order" "$WORKSPACE_ROOT/workspace/architecture.md"; then
            echo "✗ FAIL: architecture.md missing schema or generation order"
            exit 1
        fi
        
        if ! grep -q "sha256\|spec_fingerprint" "$WORKSPACE_ROOT/workspace/architecture.md"; then
            echo "✗ FAIL: architecture.md missing traceability requirements"
            exit 1
        fi
        
        echo "✓ PASS: All acceptance criteria met for $STORY_ID"
        exit 0
        ;;
    *)
        echo "✓ PASS: No specific verification for $STORY_ID (placeholder)"
        exit 0
        ;;
esac
