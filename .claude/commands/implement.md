# /implement — Implement a Named Feature

## Usage
/implement [FEATURE_NAME]
Example: /implement token-usage-chart

## What this command does
1. Ask user for feature description if not obvious from name
2. Locate relevant sprint story (search sprints/ directory)
3. Invoke agentOS-architect to produce PLAN.md
4. Invoke agentOS-backend for API changes
5. Invoke agentOS-frontend for UI changes
6. Invoke agentOS-tester for tests
7. Report completion with file list

