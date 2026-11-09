# AgentOS — Claude Code Master Config

## Project
Name: AgentOS
Tagline: The Operating System for AI Agents
Type: Local-first AI agent monitoring & configuration platform

## Architecture
- Frontend: apps/web (Next.js 14 App Router)
- Backend: apps/api (Go + Chi)
- Telemetry Source: ~/.beacon/endpoint/logs/runtime.jsonl
- Shared Types: packages/shared-types
- Config Parser: packages/config-parser

## Five Platform Pillars
1. 👁️  OBSERVE  — Real-time token, cost, session monitoring via Beacon JSONL
2. 🎛️  CONTROL  — Agent, command, hook, skill management UI
3. 📊  UNDERSTAND — Analytics: model comparison, ROI, quality scoring
4. 🧠  EVOLVE   — Self-healing configs, auto-discovery, pattern learning
5. 🤝  COLLABORATE — Team mode, marketplace, shared agent configs

## Agent Loop Protocol
Every feature implementation MUST follow this loop:
  READ sprint file → PLAN (agentOS-architect) → BUILD backend → BUILD frontend → TEST → VERIFY → beacon-check

## Coding Standards
- TypeScript strict mode on all frontend code
- Go: use standard library + Chi for routing
- All API endpoints must be documented with comments
- Every component must have a corresponding test file
- No hardcoded paths — use env vars or config files
- Beacon JSONL path: ~/.beacon/endpoint/logs/runtime.jsonl

## Mandatory Reporting Rule
- Upon completing any implementation, task, or sprint story, you MUST always output a structured completion report detailing:
  1. Scope and summary of actions taken
  2. Files created and modified with exact paths
  3. Verification status (Go build, npm type-check, unit tests)
  4. Acceptance criteria checklist
  5. Environmental notes / resolutions
  6. Next immediate actions

## Sprint Files Location
All sprint files are in: ./sprints/sprint-N.md
Load with: /sprint N S

## Key Commands
- /sprint N S     → Load sprint N, story S and begin implementation
- /implement X    → Implement a named feature
- /beacon-check   → Verify telemetry pipeline is live

## Instruction Completeness Rule (MANDATORY)
When a prompt contains multiple numbered tasks or steps:
- Execute EVERY task. Never silently skip one.
- The Completion Report MUST contain a "Instruction Coverage" table listing
  every task from the prompt with status DONE / SKIPPED / BLOCKED + reason.
- If a task cannot be done, write it in BLOCKED.md and say so explicitly
  in the report. Silence is a protocol violation.
- Claims require proof: any "PASS ✅" for a command must include the actual
  pasted terminal output, not a summary.


