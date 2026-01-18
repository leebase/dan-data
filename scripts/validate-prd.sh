#!/bin/bash
# Validate PRD JSON structure
# Usage: validate-prd.sh <prd-file>

set -e

PRD_FILE="$1"

if [ -z "$PRD_FILE" ]; then
    echo "Usage: validate-prd.sh <prd-file>"
    exit 1
fi

if [ ! -f "$PRD_FILE" ]; then
    echo "Error: PRD file not found: $PRD_FILE"
    exit 1
fi

echo "Validating PRD structure: $PRD_FILE"

FAILED=0

# Check if file is valid JSON
if ! jq empty "$PRD_FILE" 2>/dev/null; then
    echo "✗ FAIL: Invalid JSON syntax"
    exit 1
fi

echo "  ✓ Valid JSON syntax"

# Check required top-level fields
if ! jq -e '.project' "$PRD_FILE" > /dev/null; then
    echo "  ✗ FAIL: Missing 'project' field"
    FAILED=1
else
    echo "  ✓ Has 'project' field"
fi

if ! jq -e '.userStories' "$PRD_FILE" > /dev/null; then
    echo "  ✗ FAIL: Missing 'userStories' array"
    FAILED=1
else
    echo "  ✓ Has 'userStories' array"
fi

# Check each user story has required fields
STORY_COUNT=$(jq '.userStories | length' "$PRD_FILE")
echo "  Checking $STORY_COUNT stories..."

for i in $(seq 0 $((STORY_COUNT - 1))); do
    STORY_ID=$(jq -r ".userStories[$i].id // \"MISSING\"" "$PRD_FILE")
    
    # Check required fields
    if [ "$STORY_ID" = "MISSING" ]; then
        echo "    ✗ Story $i: Missing 'id' field"
        FAILED=1
        continue
    fi
    
    if ! jq -e ".userStories[$i].title" "$PRD_FILE" > /dev/null; then
        echo "    ✗ $STORY_ID: Missing 'title' field"
        FAILED=1
    fi
    
    if ! jq -e ".userStories[$i].description" "$PRD_FILE" > /dev/null; then
        echo "    ✗ $STORY_ID: Missing 'description' field"
        FAILED=1
    fi
    
    if ! jq -e ".userStories[$i].acceptanceCriteria | type == \"array\"" "$PRD_FILE" > /dev/null 2>&1; then
        echo "    ✗ $STORY_ID: Missing or invalid 'acceptanceCriteria' array"
        FAILED=1
    fi
    
    if ! jq -e ".userStories[$i].priority | type == \"number\"" "$PRD_FILE" > /dev/null 2>&1; then
        echo "    ✗ $STORY_ID: Missing or invalid 'priority' number"
        FAILED=1
    fi
    
    if ! jq -e ".userStories[$i].passes | type == \"boolean\"" "$PRD_FILE" > /dev/null 2>&1; then
        echo "    ✗ $STORY_ID: Missing or invalid 'passes' boolean"
        FAILED=1
    fi
done

if [ $FAILED -eq 0 ]; then
    echo "✓ PRD validation passed"
    exit 0
else
    echo "✗ PRD validation failed"
    exit 1
fi
