#!/bin/bash
# Connect to OpenAI using OAuth authentication
# This script runs inside the Docker container to authenticate with OpenAI

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "========================================"
echo "  OpenAI OAuth Authentication"
echo "========================================"
echo ""
echo "This will authenticate OpenCode with your OpenAI account."
echo "You can use your ChatGPT Plus subscription this way."
echo ""

# Check if running inside Docker
if [ -f "/.dockerenv" ]; then
    # Inside Docker - run opencode auth login directly
    opencode auth login
else
    # Outside Docker - run in container with interactive terminal
    echo "Starting Docker container for authentication..."
    echo ""
    docker compose run --rm opencode-agent opencode auth login
fi

echo ""
echo "✓ Authentication complete!"
echo ""
echo "Your OpenAI connection is now configured."
echo "Run ./scripts/start-agent.sh to start the agent loop."
echo ""
