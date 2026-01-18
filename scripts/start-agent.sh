#!/bin/bash
# Start the Autocoder agent loop

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Check if API key exists
if [ ! -f "$PROJECT_ROOT/config/.openrouter.key" ]; then
    echo "Error: OpenRouter API key not found"
    echo "Run ./scripts/init-config.sh first"
    exit 1
fi

# Check if PRD file exists
if [ ! -f "$PROJECT_ROOT/data/prd.json" ]; then
    echo "Error: No PRD file found at data/prd.json"
    echo "Create a PRD file with user stories to begin"
    exit 1
fi

echo "Starting Autocoder agent loop..."
echo ""

# Check if running in Docker or locally
if [ -f "/.dockerenv" ]; then
    # Inside Docker container
    exec "$PROJECT_ROOT/scripts/agent-loop.sh" "$@"
else
    # Outside Docker - run agent-loop in container, then verify
    docker compose run --rm opencode-agent bash /workspace/scripts/agent-loop.sh 1
    AGENT_EXIT=$?
    
    if [ $AGENT_EXIT -ne 0 ]; then
        echo ""
        echo "Agent loop completed. Running external verification..."
    fi
    
    # Run external verification
    "$PROJECT_ROOT/verifier/external-verify.sh" "$PROJECT_ROOT/data/prd.json"
    exit $?
fi
