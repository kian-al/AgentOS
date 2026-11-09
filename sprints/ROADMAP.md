# AgentOS — Official Roadmap (SOURCE OF TRUTH)

⚠️ RULE: Only stories listed here may be implemented.
Never invent, rename, or reorder stories. If a sprint-N.md file is
missing, STOP and ask the user for it. Do not guess its content.

| Sprint | Name                               | Stories | File          | Status |
|--------|------------------------------------|---------|---------------|--------|
| 0      | Foundation & Architecture          | 2       | sprint-0.md   | ✅ DONE |
| 1      | Overview Dashboard                 | 4       | sprint-1.md   | ✅ DONE |
| 2      | Token Analytics                    | 4       | sprint-2.md   | ✅ DONE |
| 3      | Agent Manager (GET /api/agents)    | 3       | sprint-3.md   | 🔄 NOW  |
| 4      | Command Center                     | 3       | sprint-4.md   | ⏳      |
| 5      | Hook Manager                       | 2       | sprint-5.md   | ⏳      |
| 6      | Skill & MCP Store                  | 2       | sprint-6.md   | ⏳      |
| 7      | Visual Flow Graph                  | 2       | sprint-7.md   | ⏳      |
| 8      | Chat-to-Config                     | 2       | sprint-8.md   | ⏳      |
| 9      | Budget & Safety                    | 3       | sprint-9.md   | ⏳      |
| 10     | Session Explorer & Time-Travel     | 3       | sprint-10.md  | ⏳      |
| 11     | Model Intelligence                 | 3       | sprint-11.md  | ⏳      |
| 12     | ROI Analytics & Quality            | 2       | sprint-12.md  | ⏳      |
| 13     | Auto-Discovery & Self-Healing      | 2       | sprint-13.md  | ⏳      |
| 14     | Dependency Map & Versioning        | 2       | sprint-14.md  | ⏳      |
| 15     | Team & Marketplace                 | 2       | sprint-15.md  | ⏳      |
| 16     | What-If Simulator & Alerts         | 2       | sprint-16.md  | ⏳      |

## Sprint 0 (DONE)
- 0.1 Beacon Telemetry Pipeline ✅
- 0.2 Base UI Shell & Navigation ✅

## Sprint 1 (DONE)
- 1.1 KPI Cards (Real-Time Metrics) ✅
- 1.2 Token Usage Timeline Chart ✅
- 1.3 Live Event Feed (Enhanced) ✅
- 1.4 Breakdown Panels (By Model / By Agent) ✅

## Sprint 2 (DONE)
- 2.1 Token Heatmap Calendar ✅
- 2.2 Model Comparison Table ✅
- 2.3 Projected Spend Calculator ✅
- 2.4 Token Anomaly Detector ✅

## NOT NOW (common hallucinations — do NOT implement early)
- "Agent Config Reader / GET /api/agents" → belongs to Sprint 3, not Sprint 0, 1, or 2
- "Settings page" → Sprint 9
- "Session detail view" → Sprint 10

