# Agent Instructions & Project Rules

## AgentOS Implementation Guidelines
- Follow the Agent Loop: READ sprint file → PLAN (`agentOS-architect`) → BUILD backend → BUILD frontend → TEST → VERIFY → beacon-check.
- Never write code before `PLAN.md` exists.
- Always run `go build ./...` and `npm run type-check` to verify code integrity.

## Mandatory Completion Report Rule
- **CRITICAL**: After all work is executed on any prompt, sprint story, or feature task, you MUST return a comprehensive status report detailing:
  1. Executive Summary of work completed
  2. Inventory of created and modified files
  3. Pre-flight check and build verification results (`go build`, `npm run type-check`, tests)
  4. Acceptance criteria matrix (Pass / Pending / Fail)
  5. Infrastructure & environment discoveries (proxy, disk, ports)
  6. Next steps for the workflow

