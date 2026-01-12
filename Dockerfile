FROM ubuntu:22.04

# Prevent interactive prompts during package installation
ENV DEBIAN_FRONTEND=noninteractive

# Install basic dependencies
RUN apt-get update && apt-get install -y \
    bash \
    curl \
    git \
    jq \
    ca-certificates \
    python3 \
    python3-pip \
    python-is-python3 \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies for newsletter pipeline
RUN pip3 install --no-cache-dir feedparser requests python-json-logger pytest pyyaml jsonschema

# Install OpenCode CLI
RUN curl -fsSL https://opencode.ai/install | bash

# Add OpenCode to PATH
ENV PATH="/root/.opencode/bin:${PATH}"

# Set up working directory
WORKDIR /workspace

# Default command: run the agent loop from mounted scripts
CMD ["/workspace/scripts/agent-loop.sh"]
