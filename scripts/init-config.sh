#!/bin/bash
# Initialize configuration for Autocoder

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "========================================"
echo "  Autocoder Configuration Setup"
echo "========================================"
echo ""
echo "Select AI Provider:"
echo "  1) OpenAI (ChatGPT Plus - gpt-4o)"
echo "  2) OpenRouter (Multiple models)"
echo ""
read -p "Enter choice [1-2]: " PROVIDER_CHOICE

case $PROVIDER_CHOICE in
    1)
        AI_PROVIDER="openai"
        if [ -f "$PROJECT_ROOT/config/.openai.key" ]; then
            echo "✓ OpenAI API key already configured"
        else
            echo ""
            echo "Setting up OpenAI API key..."
            echo "Get your API key from: https://platform.openai.com/api-keys"
            echo ""
            read -p "Enter your OpenAI API key: " API_KEY
            
            if [ -z "$API_KEY" ]; then
                echo "Error: API key cannot be empty"
                exit 1
            fi
            
            echo "$API_KEY" > "$PROJECT_ROOT/config/.openai.key"
            echo "✓ API key saved to config/.openai.key"
        fi
        
        # Update config to use OpenAI
        if grep -q "AI_PROVIDER=" "$PROJECT_ROOT/config/agent-loop.conf"; then
            sed -i '' 's/AI_PROVIDER=.*/AI_PROVIDER="openai"/' "$PROJECT_ROOT/config/agent-loop.conf" 2>/dev/null || \
            sed -i 's/AI_PROVIDER=.*/AI_PROVIDER="openai"/' "$PROJECT_ROOT/config/agent-loop.conf"
        fi
        ;;
    2)
        AI_PROVIDER="openrouter"
        if [ -f "$PROJECT_ROOT/config/.openrouter.key" ]; then
            echo "✓ OpenRouter API key already configured"
        else
            echo ""
            echo "Setting up OpenRouter API key..."
            echo "Get your API key from: https://openrouter.ai/"
            echo ""
            read -p "Enter your OpenRouter API key: " API_KEY
            
            if [ -z "$API_KEY" ]; then
                echo "Error: API key cannot be empty"
                exit 1
            fi
            
            echo "$API_KEY" > "$PROJECT_ROOT/config/.openrouter.key"
            echo "✓ API key saved to config/.openrouter.key"
        fi
        
        # Update config to use OpenRouter
        if grep -q "AI_PROVIDER=" "$PROJECT_ROOT/config/agent-loop.conf"; then
            sed -i '' 's/AI_PROVIDER=.*/AI_PROVIDER="openrouter"/' "$PROJECT_ROOT/config/agent-loop.conf" 2>/dev/null || \
            sed -i 's/AI_PROVIDER=.*/AI_PROVIDER="openrouter"/' "$PROJECT_ROOT/config/agent-loop.conf"
        fi
        ;;
    *)
        echo "Invalid choice. Exiting."
        exit 1
        ;;
esac

echo ""
echo "✓ Configuration complete!"
echo "✓ Using provider: $AI_PROVIDER"
echo ""
echo "Next steps:"
echo "  1. Build Docker container: docker-compose build"
echo "  2. Start agent loop: ./scripts/start-agent.sh"
echo ""
