#!/bin/bash
# Story Verifier - Checks if story acceptance criteria are met
# Usage: verify-story.sh <story-id> <prd-file>

set -e

STORY_ID="$1"
PRD_FILE="$2"

if [ -z "$STORY_ID" ] || [ -z "$PRD_FILE" ]; then
    echo "Usage: verify-story.sh <story-id> <prd-file>"
    exit 1
fi

# Extract acceptance criteria for this story
CRITERIA=$(jq -r --arg id "$STORY_ID" '.userStories[] | select(.id == $id) | .acceptanceCriteria[]' "$PRD_FILE")

if [ -z "$CRITERIA" ]; then
    echo "Error: Story $STORY_ID not found in PRD"
    exit 1
fi

echo "Verifying $STORY_ID acceptance criteria..."

FAILED=0

# Check each criterion
while IFS= read -r criterion; do
    echo "  Checking: $criterion"
    
    # Check for command execution patterns: "Command <cmd> passes" or "Tests pass with <cmd>"
    if echo "$criterion" | grep -qiE "(Command|Tests? pass|Run) .* (passes|pass|succeeds?)"; then
        # Extract command based on pattern type
        CMD=""
        
        # Pattern: "Tests pass with <cmd>" or "Test passes with <cmd>"
        if echo "$criterion" | grep -qiE "Tests? pass.*with"; then
            CMD=$(echo "$criterion" | sed -E 's/.*with ([^"]+).*/\1/' | sed -E "s/'([^']+)'/\1/")
        # Pattern: "Command <cmd> passes" or "Run <cmd> succeeds"
        elif echo "$criterion" | grep -qiE "(Command|Run)"; then
            CMD=$(echo "$criterion" | sed -E 's/.*(Command|Run) ([^"]+) .*/\2/' | sed -E "s/'([^']+)'/\1/")
        fi
        
        if [ -n "$CMD" ] && [ "$CMD" != "$criterion" ]; then
            echo "    Executing: $CMD"
            if eval "$CMD" > /dev/null 2>&1; then
                echo "    ✓ Command passed"
            else
                echo "    ✗ FAIL: Command failed with exit code $?"
                FAILED=1
            fi
        fi
    # Extract file paths from criteria (patterns like: "File path/to/file exists" or "Script path/to/script")
    elif echo "$criterion" | grep -qiE "(File|Script|Test file|Directory).*exists"; then
        # Extract the path (everything between quotes or after "File/Script" and before "exists")
        FILEPATH=$(echo "$criterion" | sed -E 's/.*(File|Script|Test file|Directory) ([^ ]+) .*/\2/' | tr -d '"'"'"'')
        
        if [ -n "$FILEPATH" ] && [ "$FILEPATH" != "$criterion" ]; then
            # Check if it's a directory or file
            if echo "$criterion" | grep -qi "Directory"; then
                if [ ! -d "$FILEPATH" ]; then
                    echo "    ✗ FAIL: Directory $FILEPATH does not exist"
                    FAILED=1
                else
                    echo "    ✓ Directory exists"
                fi
            else
                if [ ! -f "$FILEPATH" ]; then
                    echo "    ✗ FAIL: File $FILEPATH does not exist"
                    FAILED=1
                else
                    echo "    ✓ File exists"
                fi
            fi
        fi
    fi
    
    # Check for "contains X+ items" patterns
    if echo "$criterion" | grep -qE "contains.* [0-9]\\+"; then
        FILEPATH=$(echo "$criterion" | sed -E 's/.* ([^ ]+) contains.*/\1/' | tr -d '"'"'"'')
        COUNT=$(echo "$criterion" | grep -oE "[0-9]+" | head -1)
        
        if [ -f "$FILEPATH" ]; then
            if echo "$criterion" | grep -qi "array"; then
                # JSON array length check
                ARRAY_NAME=$(echo "$criterion" | grep -oE "'[^']+'" | head -1 | tr -d "'")
                if [ -n "$ARRAY_NAME" ]; then
                    ACTUAL=$(jq -r ".$ARRAY_NAME | length" "$FILEPATH" 2>/dev/null || echo "0")
                    if [ "$ACTUAL" -ge "$COUNT" ]; then
                        echo "    ✓ Array '$ARRAY_NAME' has $ACTUAL items (>= $COUNT)"
                    else
                        echo "    ✗ FAIL: Array '$ARRAY_NAME' has $ACTUAL items (need >= $COUNT)"
                        FAILED=1
                    fi
                fi
            elif echo "$criterion" | grep -qi "fixture.*files"; then
                # Count files in directory
                DIRPATH=$(echo "$FILEPATH" | sed 's|/[^/]*$||')
                if [ -d "$DIRPATH" ]; then
                    ACTUAL=$(find "$DIRPATH" -name "*.xml" | wc -l | tr -d ' ')
                    if [ "$ACTUAL" -ge "$COUNT" ]; then
                        echo "    ✓ Found $ACTUAL fixture files (>= $COUNT)"
                    else
                        echo "    ✗ FAIL: Found $ACTUAL fixture files (need >= $COUNT)"
                        FAILED=1
                    fi
                fi
            fi
        fi
    fi
    
done <<< "$CRITERIA"

if [ $FAILED -eq 0 ]; then
    echo "✓ All verifiable criteria passed for $STORY_ID"
    exit 0
else
    echo "✗ Some criteria failed for $STORY_ID"
    exit 1
fi
