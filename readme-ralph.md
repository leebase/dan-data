# Ralph Wiggum Autonomous Agent Pattern (Technical Specs)

This document contains the technical details for the Autonomous Coding Agent ("Ralph").

## 🧭 IMPORTANT: How the Ralph Loop Works
**Core tenant:** Ralph receives **no conversation context**. Ralph must learn everything from **files and git**.

That means these files are the *contract*:

1. `readme.md` — what Dan must do (learning stories, DMAIC deliverables)
2. `architecture.md` — how the dataset must be generated (schema + rules)
3. `prd.json` — what Ralph must build and what the verifier will check (non-negotiable)

### Assurance Mechanism (how we ensure Ralph uses these docs)
The generator must write a `meta` table row containing:
- `spec_version`
- `architecture_sha256`
- `readme_sha256`

And it must also write a file:
- `workspace/spec_fingerprint.json`

The verifier checks these hashes against the **actual contents** of `readme.md` and `architecture.md`.
If hashes don’t match: **fail**.

This makes the docs *binding*, not optional.

---

## 🛠️ Technical Quick Start

### Initial Setup
```bash
# Initialize configuration (prompts for OpenRouter API key)
./scripts/init-config.sh

# Or manually add API key
echo "your-key-here" > config/.openrouter.key
```

### Docker Operations
```bash
# Build the Docker container
docker-compose build

# Start the agent loop
./scripts/start-agent.sh
```

### Development
```bash
# Run agent loop locally (bypasses Docker)
./scripts/agent-loop.sh

# Run with custom max iterations
./scripts/agent-loop.sh 15
```

## Project Structure

```
dandata/
├── config/              # Configuration files
│   ├── .openrouter.key  # API key (gitignored)
│   ├── agent-loop.conf  # Loop settings
│   └── opencode.json    # OpenCode configuration
├── prompts/             # Agent prompts
│   └── system-prompt.md # Instructions for agent
├── data/                # Runtime data (gitignored)
│   ├── prd.json         # User stories
│   ├── progress.txt     # Agent progress log
│   └── archive/         # Previous runs
├── scripts/             # Automation scripts
├── workspace/           # Agent working directory
├── verifier/            # Verification scripts
├── AGENTS.md            # Persistent agent memory
└── webapp/              # Next.js Verification App (Dan's "Answer Key")
```

## Story Format

Stories in `data/prd.json` follow this structure:

```json
{
  "id": "US-001",
  "title": "Brief description",
  "description": "Detailed description as user story",
  "acceptanceCriteria": [
    "Criterion 1 with explicit verification method",
    "Criterion 2 (e.g., 'tests pass', 'file exists at path')"
  ],
  "priority": 1,
  "passes": false
}
```

Stories MUST be small (1-3 criteria) and include explicit verification methods.

## Ralph Wiggum Pattern

This project uses the Ralph Wiggum autonomous agent pattern:
- **Fresh context** - Each iteration starts clean, no accumulated state
- **Small stories** - Maximum 1-3 acceptance criteria per story
- **Forced verification** - Tests/typecheck/proof files required before marking complete
- **Git as memory** - Commits after each successful story
- **Self-documentation** - Updates AGENTS.md with learnings
