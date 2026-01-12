# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Structure

This is a dual-purpose repository:
1. **Power BI Learning Project** - Generates a realistic mental health operations dataset for Power BI/Six Sigma training
2. **Ralph Wiggum Autonomous Agent** - Self-improving AI coding agent loop using OpenCode CLI + OpenRouter

### Key Directories
- `config/` - OpenCode configuration and API keys (`.openrouter.key` gitignored)
- `prompts/` - Agent system prompts
- `data/` - Runtime state: `prd.json` (user stories), `progress.txt` (agent log), `.verdicts` (verification results)
- `scripts/` - Automation scripts for agent loop and validation
- `verifier/` - Verification scripts for story acceptance criteria
- `workspace/` - Agent's working directory; will contain generated SQLite database and Python generator
- `AGENTS.md` - Persistent memory for AI agents (read this first when working as an agent)

## Core Commands

### Initial Setup
```bash
# Build Docker container first
docker-compose build

# Option 1: Use OpenAI with OAuth (recommended for ChatGPT Plus users)
./scripts/connect-openai.sh

# Option 2: Use OpenRouter with API key
./scripts/init-config.sh

# Or manually add keys
echo "your-openai-key" > config/.openai.key  # If using API key instead of OAuth
echo "your-openrouter-key" > config/.openrouter.key
```

### Agent Loop Operations
```bash
# Build Docker container for agent
docker-compose build

# Start agent loop (Docker-based, includes external verification)
./scripts/start-agent.sh

# Run agent loop locally (bypasses Docker)
./scripts/agent-loop.sh

# Run with custom max retries per story
./scripts/agent-loop.sh 15
```

### Validation & Verification
```bash
# Validate PRD JSON structure
./scripts/validate-prd.sh data/prd.json

# Verify specific story (must be run from verifier directory)
cd verifier && ./verify-story.sh US-001
```

### Linting
```bash
# Lint all shell scripts
./scripts/lint-scripts.sh
```

## Architecture Patterns

### Ralph Wiggum Pattern (Autonomous Agent)
This codebase implements a stateless, fresh-context agent iteration pattern:
- **No Conversational Memory**: Agent receives no context between runs; learns only from files and git
- **Story-Driven**: Works on one small story (1-3 acceptance criteria) at a time from `data/prd.json`
- **Verification-Gated**: Each story must pass explicit verification before marking complete
- **Self-Documenting**: Agent updates `AGENTS.md` with patterns and `data/progress.txt` with telemetry
- **Git as Memory**: Commits after each successful story completion

### Binding Documentation Contract
The agent MUST treat these files as authoritative:
- `README.md` - Learning objectives and DMAIC deliverables for Power BI project
- `architect.md` - Database schema, generation rules, and technical constraints
- `AGENTS.md` - Codebase conventions and gotchas

**Traceability Mechanism**: The Python generator must compute SHA256 hashes of `README.md` and `architect.md`, then:
1. Write hashes to SQLite `meta` table
2. Write hashes to `workspace/spec_fingerprint.json`
3. Verifier validates hashes match actual file contents

### Agent Loop Flow
1. Validates PRD schema (`validate-prd.sh`)
2. Reads highest priority incomplete story (sorts by priority asc, then id)
3. Builds prompt from `prompts/system-prompt.md` + current story
4. Runs OpenCode with 10-minute timeout
5. Checks for `<promise>COMPLETE</promise>` signal
6. Runs Docker-based verification (`verify-in-docker.sh`)
7. Logs telemetry to `data/progress.txt`
8. Retries up to `MAX_RETRIES_PER_STORY` (default: 5)

### Verification System
- **Internal Gate**: Agent signals completion with `<promise>COMPLETE</promise>`
- **External Gate**: `verify-in-docker.sh` actually executes tests/checks
- **Verdict File**: `data/.verdicts` tracks which stories PASS/FAIL (managed by external verifier, read-only to agent)
- **Agent Never Modifies**: Agent cannot change PRD, verdicts, or verification scripts

## Story Format in prd.json
```json
{
  "project": "Project Name",
  "branchName": "feature/branch-name",
  "userStories": [
    {
      "id": "US-001",
      "title": "Brief description",
      "description": "As a user...",
      "acceptanceCriteria": [
        "Criterion with explicit verification (e.g., 'tests pass', 'file exists at path')"
      ],
      "priority": 1,
      "passes": false
    }
  ]
}
```

**Story Discipline**:
- Maximum 1-3 acceptance criteria per story
- Must include explicit verification method
- Stories marked complete only by external verifier, not agent

## Git Workflow
- Standard git workflow
- Commit message format: `feat: [Story-ID] - [Brief description]`
- Include co-author line: `Co-Authored-By: Warp <agent@warp.dev>`
- Agent commits after each successful story

## Configuration Details

### OpenCode Configuration (`config/opencode.json`)
- Two agents: `build` (full tool access) and `plan` (read-only)
- Supports two providers: OpenAI and OpenRouter
- OpenAI models: gpt-4o (default), o1, o3-mini
- OpenRouter models: Claude Opus 4.5, GPT-5.2, Gemini 3.0 Pro, DeepSeek R1, Grok Code Fast 1

### Agent Loop Configuration (`config/agent-loop.conf`)
- `AI_PROVIDER="openai"` - Toggle between "openai" or "openrouter"
- `OPENAI_MODEL="gpt-4o"` - Model to use with OpenAI
- `OPENROUTER_MODEL="openrouter/x-ai/grok-code-fast-1"` - Model to use with OpenRouter
- `MAX_RETRIES_PER_STORY=5` - Configurable retry limit
- `SLEEP_BETWEEN_ITERATIONS=2` - Delay between iterations
- Paths for PRD, progress log, system prompt, archive directory

## Power BI Dataset Generation

### Technical Constraints
- Language: Python 3.x
- Libraries: Standard library only (`sqlite3`, `random`, `datetime`, `math`, `hashlib`, `json`, `pathlib`)
- Determinism: Must use `random.seed(42)`
- Foreign Keys: Enforce with `PRAGMA foreign_keys = ON`
- Date Keys: INTEGER format (YYYYMMDD)

### Output Artifacts
- `workspace/mental_health_demo.sqlite` - Star schema database
- `workspace/spec_fingerprint.json` - Traceability metadata

### Schema Pattern
Star schema with fact table `fact_encounter` and dimensions:
- `dim_date` (2+ years daily)
- `dim_facility`, `dim_provider`, `dim_patient`, `dim_diagnosis`, `dim_payer`

### Required Views for Black Belt Validation
- `vw_kpi_baseline` - One-row baseline totals (must match Power BI metrics)
- `vw_wait_time_audit` - One-row audit where `mismatch_count` must equal 0

### Data Quality Rules
- Controlled messiness: 5-10% facility names with inconsistent capitalization, 5-10% provider names with trailing whitespace
- Never dirty foreign keys
- Operational realism: seasonality, day-of-week effects, provider continuity, no-show cascades
- SPC-ready: `sigma_band` field with distribution (68% Within_1σ, 27% Within_2σ, 4% Within_3σ, 1% Outside_3σ)

## Docker Environment
- Base: Ubuntu 22.04
- Python 3 with standard library + pytest, pyyaml, jsonschema
- OpenCode CLI installed
- Git, jq, curl, bash
- Mounts: config (read-only), scripts (read-only), data (read-write), workspace (read-write), .git (read-write)
