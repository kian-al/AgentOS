# /sprint — Load and Execute a Sprint Story

## Usage
/sprint [SPRINT_NUMBER] [STORY_NUMBER]
Example: /sprint 0 1

## What this command does
1. Read ./sprints/sprint-$1.md
2. Find Story $2 section in that file
3. Confirm story title and acceptance criteria to user
4. Run: beacon endpoint status
5. Invoke agentOS-architect → outputs PLAN.md
6. Invoke agentOS-backend → implements API layer
7. Invoke agentOS-frontend → implements UI layer
8. Invoke agentOS-tester → runs tests, outputs TEST_REPORT.md
9. Run /beacon-check to verify telemetry
10. Report: DONE ✅ or BLOCKED ❌ with reason

