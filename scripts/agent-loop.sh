#!/bin/bash
# Agent Loop - Ralph Wiggum Pattern
# Autonomous coding agent loop with fresh context iterations

set -e

# Helper function for timeout (works on macOS and Linux)
run_with_timeout() {
    local timeout_secs=$1
    shift
    
    if command -v timeout &> /dev/null; then
        timeout "$timeout_secs" "$@"
    elif command -v gtimeout &> /dev/null; then
        gtimeout "$timeout_secs" "$@"
    else
        # Fallback: run without timeout (will still work)
        "$@"
    fi
}

# Determine script directory and workspace root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKSPACE_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Source configuration
CONF_FILE="${WORKSPACE_ROOT}/config/agent-loop.conf"
if [ -f "$CONF_FILE" ]; then
    source "$CONF_FILE"
else
    echo "Error: Configuration file not found at $CONF_FILE"
    exit 1
fi

# Set defaults if not in config
MAX_RETRIES_PER_STORY=${MAX_RETRIES_PER_STORY:-5}
SLEEP_BETWEEN_ITERATIONS=${SLEEP_BETWEEN_ITERATIONS:-2}
PRD_FILE="${WORKSPACE_ROOT}/${PRD_FILE:-data/prd.json}"
PROGRESS_FILE="${WORKSPACE_ROOT}/${PROGRESS_FILE:-data/progress.txt}"
SYSTEM_PROMPT="${WORKSPACE_ROOT}/${SYSTEM_PROMPT:-prompts/system-prompt.md}"
ARCHIVE_DIR="${WORKSPACE_ROOT}/${ARCHIVE_DIR:-data/archive}"
LAST_BRANCH_FILE="${WORKSPACE_ROOT}/data/.last-branch"

# Set defaults for provider configuration
AI_PROVIDER=${AI_PROVIDER:-"openrouter"}
OPENAI_MODEL=${OPENAI_MODEL:-"gpt-4o"}
OPENROUTER_MODEL=${OPENROUTER_MODEL:-"openrouter/x-ai/grok-code-fast-1"}

# Load API keys based on provider
if [ "$AI_PROVIDER" = "openai" ]; then
    # OpenAI can use OAuth (via opencode connect) or API key
    if [ -f "${WORKSPACE_ROOT}/config/.openai.key" ]; then
        export OPENAI_API_KEY=$(cat "${WORKSPACE_ROOT}/config/.openai.key")
    elif [ -n "$OPENAI_API_KEY" ]; then
        : # Already set in environment
    else
        echo "INFO: No OpenAI API key found - will use OAuth authentication"
        echo "INFO: OpenCode will use the connection established via 'opencode connect'"
    fi
    MODEL_NAME="$OPENAI_MODEL"
else
    if [ -f "${WORKSPACE_ROOT}/config/.openrouter.key" ]; then
        export OPENROUTER_API_KEY=$(cat "${WORKSPACE_ROOT}/config/.openrouter.key")
    elif [ -n "$OPENROUTER_API_KEY_FILE" ] && [ -f "$OPENROUTER_API_KEY_FILE" ]; then
        export OPENROUTER_API_KEY=$(cat "$OPENROUTER_API_KEY_FILE")
    else
        echo "Error: OpenRouter API key not found"
        echo "Create config/.openrouter.key with your API key"
        exit 1
    fi
    MODEL_NAME="$OPENROUTER_MODEL"
fi

# Allow max retries per story override from command line
if [ -n "$1" ]; then
    MAX_RETRIES_PER_STORY=$1
fi

# Archive previous run if branch changed
if [ -f "$PRD_FILE" ] && [ -f "$LAST_BRANCH_FILE" ]; then
    CURRENT_BRANCH=$(jq -r '.branchName // empty' "$PRD_FILE" 2>/dev/null || echo "")
    LAST_BRANCH=$(cat "$LAST_BRANCH_FILE" 2>/dev/null || echo "")
    
    if [ -n "$CURRENT_BRANCH" ] && [ -n "$LAST_BRANCH" ] && [ "$CURRENT_BRANCH" != "$LAST_BRANCH" ]; then
        DATE=$(date +%Y-%m-%d-%H%M%S)
        FOLDER_NAME=$(echo "$LAST_BRANCH" | sed 's|/|-|g')
        ARCHIVE_FOLDER="$ARCHIVE_DIR/$DATE-$FOLDER_NAME"
        
        echo "Archiving previous run: $LAST_BRANCH"
        mkdir -p "$ARCHIVE_FOLDER"
        [ -f "$PRD_FILE" ] && cp "$PRD_FILE" "$ARCHIVE_FOLDER/"
        [ -f "$PROGRESS_FILE" ] && cp "$PROGRESS_FILE" "$ARCHIVE_FOLDER/"
        echo "   Archived to: $ARCHIVE_FOLDER"
        
        # Reset progress file for new run
        echo "# Agent Progress Log" > "$PROGRESS_FILE"
        echo "Started: $(date)" >> "$PROGRESS_FILE"
        echo "---" >> "$PROGRESS_FILE"
    fi
fi

# Track current branch
if [ -f "$PRD_FILE" ]; then
    CURRENT_BRANCH=$(jq -r '.branchName // empty' "$PRD_FILE" 2>/dev/null || echo "")
    if [ -n "$CURRENT_BRANCH" ]; then
        mkdir -p "$(dirname "$LAST_BRANCH_FILE")"
        echo "$CURRENT_BRANCH" > "$LAST_BRANCH_FILE"
    fi
fi

# Initialize progress file if it doesn't exist
if [ ! -f "$PROGRESS_FILE" ]; then
    mkdir -p "$(dirname "$PROGRESS_FILE")"
    echo "# Agent Progress Log" > "$PROGRESS_FILE"
    echo "Started: $(date)" >> "$PROGRESS_FILE"
    echo "---" >> "$PROGRESS_FILE"
fi

# Generate run ID for this execution
RUN_ID=$(date +%Y%m%d-%H%M%S)-$$

echo "========================================"
echo "  Agent Loop - Ralph Wiggum Pattern"
echo "========================================"
echo "AI Provider: $AI_PROVIDER"
echo "Model: $MODEL_NAME"
echo "Max retries per story: $MAX_RETRIES_PER_STORY"
echo "PRD file: $PRD_FILE"
echo "Progress file: $PROGRESS_FILE"
echo "Verifier: Enabled (stories must pass verification)"
echo ""

# Validate PRD structure before starting loop
echo "Validating PRD structure..."
if "${SCRIPT_DIR}/validate-prd.sh" "$PRD_FILE"; then
    echo ""
else
    echo "Error: PRD validation failed. Fix issues above before running agent loop."
    exit 1
fi

# Main loop - continue until all stories complete or a story fails max retries
VERDICT_FILE="${WORKSPACE_ROOT}/data/.verdicts"

CURRENT_STORY_ID=""
STORY_RETRY_COUNT=0

while true; do
    # Check if PRD file exists
    if [ ! -f "$PRD_FILE" ]; then
        echo "Error: PRD file not found at $PRD_FILE"
        echo "Create a PRD file with user stories to begin."
        exit 1
    fi
    
    # Check VERIFIED stories from external verdict file (agent read-only)
    # This file is managed by external-verify.sh, not by this agent
    # Format: US-### PASS or US-### FAIL - only count PASS lines
    VERIFIED_STORIES=""
    if [ -f "$VERDICT_FILE" ]; then
        VERIFIED_STORIES=$(awk '$2=="PASS"{print $1}' "$VERDICT_FILE" | sort -u)
    fi
    VERIFIED_COUNT=$(echo "$VERIFIED_STORIES" | grep -c . 2>/dev/null || echo 0)
    
    # Get highest priority story not in verdict file (sort by priority asc, then id)
    STORY=""
    while IFS= read -r story_line; do
        STORY_ID=$(echo "$story_line" | jq -r '.id')
        if ! echo "$VERIFIED_STORIES" | grep -q "^$STORY_ID$"; then
            STORY="$story_line"
            break
        fi
    done < <(jq -r '.userStories | sort_by(.priority, .id) | .[] | @json' "$PRD_FILE")
    
    TOTAL_STORIES=$(jq '.userStories | length' "$PRD_FILE")
    echo "INFO: Externally verified stories: $VERIFIED_COUNT / $TOTAL_STORIES"
    echo "INFO: Verdict file: $VERDICT_FILE"
    
    if [ -z "$STORY" ]; then
        echo ""
        echo "✓ All stories complete!"
        echo "<promise>COMPLETE</promise>"
        exit 0
    fi
    
    STORY_ID=$(echo "$STORY" | jq -r '.id')
    STORY_TITLE=$(echo "$STORY" | jq -r '.title')
    
    # Check if this is a new story (reset retry count)
    if [ "$STORY_ID" != "$CURRENT_STORY_ID" ]; then
        CURRENT_STORY_ID="$STORY_ID"
        STORY_RETRY_COUNT=1
    else
        STORY_RETRY_COUNT=$((STORY_RETRY_COUNT + 1))
    fi
    
    # Check if we've exceeded max retries for this story
    if [ $STORY_RETRY_COUNT -gt $MAX_RETRIES_PER_STORY ]; then
        echo ""
        echo "✗ Story $STORY_ID failed after $MAX_RETRIES_PER_STORY attempts"
        echo "Stopping agent loop."
        exit 1
    fi
    
    echo ""
    echo "═══════════════════════════════════════"
    echo "  Story: $STORY_ID (Attempt $STORY_RETRY_COUNT of $MAX_RETRIES_PER_STORY)"
    echo "═══════════════════════════════════════"
    
    echo "Working on: $STORY_ID - $STORY_TITLE"
    
    # Record start time for telemetry
    START_TIME=$(date +%s)
    
    # Build prompt for agent
    PROMPT_FILE=$(mktemp)
    cat "$SYSTEM_PROMPT" > "$PROMPT_FILE"
    echo "" >> "$PROMPT_FILE"
    echo "## Current Story" >> "$PROMPT_FILE"
    echo "$STORY" | jq -r '.id as $id | .title as $title | .description as $desc | .acceptanceCriteria as $criteria | "### " + $id + ": " + $title + "\n\n" + $desc + "\n\n**Acceptance Criteria:**\n" + ($criteria | map("- " + .) | join("\n"))' >> "$PROMPT_FILE"
    
    # Run OpenCode with the build agent
    echo "Running OpenCode agent..."
    echo "(This may take 1-5 minutes depending on story complexity)"
    echo "[Output will stream below - if stuck >10min, process will timeout]"
    echo ""
    OUTPUT_FILE=$(mktemp)
    
    # Call opencode run with timeout (10 minutes max)
    # Use 'tee' to stream output to terminal AND capture to file
    if run_with_timeout 600 opencode run --agent build --model "$MODEL_NAME" "$(cat "$PROMPT_FILE")" 2>&1 | tee "$OUTPUT_FILE"; then
        echo ""
        echo "OpenCode completed successfully"
    else
        EXIT_CODE=$?
        echo ""
        if [ $EXIT_CODE -eq 124 ]; then
            echo "OpenCode TIMED OUT after 10 minutes"
        elif [ $EXIT_CODE -eq 141 ]; then
            echo "OpenCode pipe broken (possibly killed externally)"
        else
            echo "OpenCode encountered an error (exit code: $EXIT_CODE)"
        fi
    fi
    
    # Check if agent signaled completion
    if grep -q '<promise>COMPLETE</promise>' "$OUTPUT_FILE"; then
        echo ""
        echo "Agent signaled completion for $STORY_ID"
        
        # VERIFIER GATE 1: Run tight verification in Docker (actually execute tests)
        # This is the true arbiter - the agent can work around intermediate errors as long as
        # all acceptance criteria are met and verified
        echo "Running tight verification in Docker..."
        if "${SCRIPT_DIR}/verify-in-docker.sh" "$STORY_ID" >> "$OUTPUT_FILE" 2>&1; then
        echo "✓ Story $STORY_ID verification PASSED"
            
            # Calculate duration
            END_TIME=$(date +%s)
            DURATION=$((END_TIME - START_TIME))
            
            # Auto-mark story as PASS in verdict file
            echo "$STORY_ID PASS" >> "$VERDICT_FILE"
            echo "✓ Marked $STORY_ID as PASS in verdict file"
            
            # Update progress (log only - cannot affect verdict)
            echo "" >> "$PROGRESS_FILE"
            echo "## $(date +'%Y-%m-%d %H:%M:%S') - $STORY_ID" >> "$PROGRESS_FILE"
            echo "run_id: $RUN_ID" >> "$PROGRESS_FILE"
            echo "story_id: $STORY_ID" >> "$PROGRESS_FILE"
            echo "attempt: $STORY_RETRY_COUNT" >> "$PROGRESS_FILE"
            echo "model: $MODEL_NAME" >> "$PROGRESS_FILE"
            echo "duration_seconds: $DURATION" >> "$PROGRESS_FILE"
            echo "Status: VERIFICATION PASSED" >> "$PROGRESS_FILE"
            echo "Verified by: verify-in-docker.sh" >> "$PROGRESS_FILE"
            echo "Auto-marked as PASS" >> "$PROGRESS_FILE"
            
            # Break out of retry loop to move to next story
            CURRENT_STORY_ID=""
            continue
        else
            echo "✗ Tight verification FAILED"
            echo "Story $STORY_ID NOT marked complete"
            
            # Calculate duration
            END_TIME=$(date +%s)
            DURATION=$((END_TIME - START_TIME))
            
            # Update progress with telemetry
            echo "" >> "$PROGRESS_FILE"
            echo "## $(date +'%Y-%m-%d %H:%M:%S') - $STORY_ID" >> "$PROGRESS_FILE"
            echo "run_id: $RUN_ID" >> "$PROGRESS_FILE"
            echo "story_id: $STORY_ID" >> "$PROGRESS_FILE"
            echo "attempt: $STORY_RETRY_COUNT" >> "$PROGRESS_FILE"
            echo "model: $MODEL_NAME" >> "$PROGRESS_FILE"
            echo "duration_seconds: $DURATION" >> "$PROGRESS_FILE"
            echo "Status: VERIFICATION FAILED" >> "$PROGRESS_FILE"
            echo "Failed in: verify-in-docker.sh" >> "$PROGRESS_FILE"
        fi
    else
        echo ""
        echo "Story $STORY_ID not yet complete"
        
        # Calculate duration
        END_TIME=$(date +%s)
        DURATION=$((END_TIME - START_TIME))
        
        # Update progress with telemetry
        echo "" >> "$PROGRESS_FILE"
        echo "## $(date +'%Y-%m-%d %H:%M:%S') - $STORY_ID" >> "$PROGRESS_FILE"
        echo "run_id: $RUN_ID" >> "$PROGRESS_FILE"
        echo "story_id: $STORY_ID" >> "$PROGRESS_FILE"
        echo "attempt: $STORY_RETRY_COUNT" >> "$PROGRESS_FILE"
        echo "model: $MODEL_NAME" >> "$PROGRESS_FILE"
        echo "duration_seconds: $DURATION" >> "$PROGRESS_FILE"
        echo "Status: In progress" >> "$PROGRESS_FILE"
    fi
    
    # Save agent output to progress
    echo "Agent output:" >> "$PROGRESS_FILE"
    cat "$OUTPUT_FILE" >> "$PROGRESS_FILE"
    
    # Clean up
    rm -f "$PROMPT_FILE" "$OUTPUT_FILE"
    
    echo "Attempt $STORY_RETRY_COUNT complete."
    sleep $SLEEP_BETWEEN_ITERATIONS
done
