# /beacon-check — Verify Telemetry Pipeline

## What this command does
1. Run: beacon endpoint status
2. Check if file exists: ~/.beacon/endpoint/logs/runtime.jsonl
3. Read last 5 lines of runtime.jsonl and display
4. Hit: curl http://localhost:8080/api/events/latest (AgentOS backend)
5. Report:
   ✅ Beacon running
   ✅ JSONL file found (N lines)
   ✅ Last event: [timestamp] [agent] [model] $[cost]
   ✅ AgentOS backend receiving events
   OR explain what is broken and how to fix it

