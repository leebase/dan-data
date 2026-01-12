# Dandata - Agent Memory

This file is the persistent memory and source of truth for AI agents working on this codebase. It is read before each agent iteration and updated after successful completions.

## Project Overview

Dual-purpose project:
1. **Power BI Learning Dataset** - Generate a realistic mental health operations dataset (SQLite) for Six Sigma Black Belt training in Power BI
2. **Ralph Wiggum Agent Loop** - Self-improving autonomous coding agent

Autonomous AI coding agent loop using:
- **OpenCode CLI** - Go-based terminal AI coding assistant
- **OpenRouter** - Unified API for 500+ AI models
- **Ralph Wiggum Pattern** - Fresh context iterations with forced verification
- **Docker** - Containerized, reproducible environment

## Conventions

### Git Workflow
- Standard git workflow
- Format commit messages: `feat: [Story-ID] - [Brief description]`
- Include co-author line: `Co-Authored-By: Warp <agent@warp.dev>`

### Story Discipline
- Stories MUST be small (1-3 acceptance criteria maximum)
- Every story MUST include explicit verification method
- Acceptable verification: tests pass, typecheck passes, output file created
- Agent commits after each successful story

## Codebase Patterns

### Configuration
- API keys stored in `config/.openrouter.key` (gitignored)
- OpenCode config in `config/opencode.json`
- Agent loop settings in `config/agent-loop.conf`

### Agent Loop
- Validates PRD schema at startup (`scripts/validate-prd.sh`)
- Reads highest priority incomplete story from `data/prd.json` (sorts by priority asc, then id)
- Pipes system prompt + story to OpenCode with 10-minute timeout
- Checks for `<promise>COMPLETE</promise>` signal
- Logs structured telemetry to `data/progress.txt`
- Per-story retry limit (MAX_RETRIES_PER_STORY=5)

## Known Gotchas

### Binding Documentation Contract
- `README.md` and `architect.md` are AUTHORITATIVE - agent must follow them exactly
- Python generator MUST compute SHA256 hashes of these files
- Hashes written to SQLite `meta` table and `workspace/spec_fingerprint.json`
- Verifier checks hashes match actual file contents - mismatch = FAIL

### Generation Order (Critical)
1. Load README.md and architect.md, compute SHA256
2. Create SQLite with `PRAGMA foreign_keys = ON`
3. Populate dimensions first (cache keys in memory)
4. Generate facts using ONLY cached keys
5. Create views and indexes
6. Run integrity checks
7. Write meta table with hashes
8. Write spec_fingerprint.json

### Date Logic (No Time Travel)
- request_date_key <= scheduled_date_key
- If status='Completed': completed_date_key NOT NULL and >= scheduled_date_key
- wait_days MUST equal (scheduled - request) in days

### Data Quality
- 5-10% facility names: inconsistent capitalization (Power Query practice)
- 5-10% provider names: trailing whitespace
- NEVER dirty foreign keys or make them NULL
- sigma_band distribution: 68% Within_1σ, 27% Within_2σ, 4% Within_3σ, 1% Outside_3σ

## Testing Strategy

- Each story includes verification in acceptance criteria
- Verification scripts in `verifier/` directory
- External verification runs in Docker (`verify-in-docker.sh`)
- Key validation views:
  - `vw_kpi_baseline` - one-row baseline totals
  - `vw_wait_time_audit` - mismatch_count MUST be 0
- Integrity checks: orphan FK checks, date logic validation, foreign key enforcement

## Technology Decisions

- **OpenCode over Amp**: Open source, provider-agnostic, terminal-first
- **OpenRouter over direct APIs**: Single API for multiple models, cost flexibility
- **File-based config over env vars**: Better security, easier mounting in Docker
