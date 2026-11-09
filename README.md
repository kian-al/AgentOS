# 🧠 AgentOS

> **The Operating System for AI Agents**  
> An open-source, local-first monitoring, configuration, and orchestration platform for developers running Claude Code and autonomous AI agents.

[![Go Version](https://img.shields.io/badge/Go-1.22+-00ADD8?style=flat&logo=go)](https://golang.org)
[![Next.js](https://img.shields.io/badge/Next.js-14_App_Router-000000?style=flat&logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178C6?style=flat&logo=typescript)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS_v3-38B2AC?style=flat&logo=tailwind-css)](https://tailwindcss.com)
[![Radix UI](https://img.shields.io/badge/UI-shadcn%2Fui-111827?style=flat)](https://ui.shadcn.com)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## 📖 Table of Contents

- [What is AgentOS?](#-what-is-agentos)
- [The Five Platform Pillars](#-the-five-platform-pillars)
- [Architecture & Data Pipeline](#-architecture--data-pipeline)
- [Key Features](#-key-features)
- [Prerequisites](#-prerequisites)
- [How to Run the Application](#-how-to-run-the-application)
  - [1. Clone Repository](#1-clone-repository)
  - [2. Start the Backend API (Go)](#2-start-the-backend-api-go)
  - [3. Seed Demo Data (Optional)](#3-seed-demo-data-optional)
  - [4. Start the Frontend Web App (Next.js)](#4-start-the-frontend-web-app-nextjs)
- [How to Use AgentOS](#-how-to-use-agentos)
  - [Overview Dashboard](#1-overview-dashboard-dashboard)
  - [Token Analytics](#2-token-analytics-analytics)
  - [Agent Manager](#3-agent-manager-agents)
  - [Command Center](#4-command-center-commands)
- [Configuration & Environment Variables](#-configuration--environment-variables)
- [Verification & Testing](#-verification--testing)
- [Project Directory Structure](#-project-directory-structure)
- [Roadmap](#-roadmap)

---

## 💡 What is AgentOS?

Developers running autonomous AI coding agents (such as **Claude Code**) often face significant challenges:
- **Zero visibility into token burn**: Agents run subtasks, consume tokens, and rack up API costs across various models with little to no real-time transparency.
- **Scattered configurations**: Custom agents (`.claude/agents/*.md`), slash commands (`.claude/commands/*.md`), and hooks are buried in dot-directories without a central UI.
- **Manual workflow triggering**: Running workflows requires remembering CLI syntax and typing complex commands into a terminal instead of having an interactive control deck.

**AgentOS** solves this by providing a unified, local-first dashboard that sits alongside your agent workflow:
1. **Listens** to real-time agent telemetry via the Agent Beacon JSONL stream.
2. **Aggregates** token metrics, model usage, costs, and session timelines in a high-speed SQLite database.
3. **Presents** a dark developer-tool dashboard with sub-second WebSocket updates.
4. **Enables** direct inspection, editing, and execution of agent configurations and slash commands with live terminal streaming.

---

## 🏛️ The Five Platform Pillars

```
┌─────────────────────────────────────────────────────────────┐
│                    🏛️ AgentOS Platform                       │
│                                                             │
│  👁️ OBSERVE    — Real-time tokens, costs, sessions & feed   │
│  🎛️ CONTROL    — Agent manager, slash commands, hooks & skills│
│  📊 UNDERSTAND — Model comparison, ROI & spend projections   │
│  🧠 EVOLVE     — Auto-discovery, self-healing configs & router│
│  🤝 COLLABORATE— Team mode, marketplace, shared blueprints    │
└─────────────────────────────────────────────────────────────┘
```

| Layer | Purpose |
|---|---|
| 👁️ **OBSERVE** | Real-time telemetry ingestion from Beacon (`runtime.jsonl`), live event feeds, and KPI cards. |
| 🎛️ **CONTROL** | Inspect and edit Claude Code agent configs, trigger slash commands, and stream command output. |
| 📊 **UNDERSTAND** | Multi-model cost vs. speed tables, 90-day activity heatmaps, and spend forecasting. |
| 🧠 **EVOLVE** | Self-healing configurations, automated error detection, and model routing *(Sprint 7+)*. |
| 🤝 **COLLABORATE**| Shared team agent configurations, blueprint libraries, and community extensions *(Sprint 15+)*. |

---

## 🏗️ Architecture & Data Pipeline

AgentOS is built with a **local-first, privacy-respecting architecture**. No agent code, proprietary data, or telemetry leaves your machine.

```
┌─────────────────────────┐
│   Agent Beacon Logs     │  (~/.beacon/endpoint/logs/runtime.jsonl)
└────────────┬────────────┘
             │ File Watcher (Tail)
             ▼
┌─────────────────────────┐       SQLite
│    AgentOS API (Go)     │ ───► agentOS.db (SQL-Aggregated Metrics)
│  (Chi Router + WS Hub)  │
└────────────┬────────────┘
             │ WebSocket (/ws) + REST (/api/*)
             ▼
┌─────────────────────────┐
│   AgentOS Web App       │  (Next.js 14 App Router)
│   (React / Tailwind)    │  Live Charts, Agent Configs, Terminal Output
└─────────────────────────┘
```

- **Backend (`apps/api`)**: High-performance Go application using the `chi` router. Monitors Beacon JSONL log streams, persists event records to SQLite, computes metrics exclusively in SQL, and broadcasts live events over WebSocket.
- **Frontend (`apps/web`)**: Next.js 14 App Router, TypeScript (strict mode), Tailwind CSS, Radix UI primitives, Recharts, and Zustand for responsive, accessible (WCAG 2.2 AA compliant) data rendering.

---

## ⚡ Key Features

### 1. Real-Time Overview Dashboard (`/dashboard`)
- **Live KPI Metrics**: Tokens Today, Cost (USD), Active Sessions, Total Events with trend deltas.
- **Token Timeline Chart**: Interactive area chart showing Input, Output, and Cache tokens over 1h, 24h, 7d, and 30d timeframes.
- **Live Event Feed**: Sub-second telemetry stream with pause/resume controls, event type filtering, and deep-inspection JSON drawer.
- **Breakdown Panels**: Instant proportional distribution by model (Sonnet, Opus, Haiku) and by agent (`agentOS-architect`, `agentOS-backend`, etc.).

### 2. Token Analytics & Intelligence (`/analytics`)
- **Token Heatmap Calendar**: GitHub-style 90-day activity matrix tracking daily token consumption.
- **Model Comparison Table**: Side-by-side benchmark comparing token burn, total spend, event frequency, and cost-efficiency across LLMs.
- **Projected Spend Calculator**: Forecasting engine predicting daily and monthly spend based on recent 24h/7d velocity with confidence indicators.
- **Session Explorer**: Drill down into individual agent sessions to inspect duration, total cost, and chronological event timelines.

### 3. Agent Manager (`/agents`)
- **Auto-Discovery**: Automatically scans `.claude/agents/*.md` for configured agents.
- **Live Agent Stats**: Inspect aggregated token usage, cost, and event count computed directly in SQL.
- **In-Place YAML Config Editor**: Safely edit agent descriptions and tool allocations (`Read`, `Write`, `Bash`, etc.) with atomic disk writes that preserve markdown body instructions.

### 4. Command Center (`/commands`)
- **Command Library Browser**: Discovers all slash commands from `.claude/commands/*.md`.
- **Integrated Command Runner**: Execute slash commands directly from the UI with custom parameters.
- **Real-Time Terminal Output**: Live stdout and stderr streaming over WebSocket into a scrollable terminal container (`role="log"`).
- **Concurrency Guard**: Server-enforced process locking returns `409 Conflict` if another command is active.

---

## 📋 Prerequisites

Before running AgentOS, ensure you have the following installed on your local machine:

1. **Go**: Version `1.22` or later ([Download Go](https://go.dev/dl/))
2. **Node.js**: Version `18.18` or later ([Download Node.js](https://nodejs.org/))
3. **npm**: Version `9` or later (bundled with Node.js)
4. **Git**: Version `2.30` or later
5. *(Optional)* **Claude Code CLI**: For executing slash commands locally via the Command Runner.

---

## 🚀 How to Run the Application

### 1. Clone Repository

```bash
git clone https://github.com/kian-al/AgentOS.git
cd AgentOS
```

---

### 2. Start the Backend API (Go)

The backend handles database persistence, log tailing, REST endpoints, and WebSocket broadcasting.

```bash
cd apps/api

# Run the API server
go run ./cmd/api
```

> **API Default Port:** `http://localhost:8080`  
> **WebSocket Stream:** `ws://localhost:8080/ws`  
> **Database:** Automatically creates `apps/api/agentOS.db` on first run.

---

### 3. Seed Demo Data (Optional)

If you don't yet have active Claude Code sessions generating live Beacon logs, you can seed realistic synthetic telemetry:

```bash
# Open a new terminal in apps/api:
cd apps/api

# Populate agentOS.db with 200 demo events
go run ./cmd/seed
```

You can now refresh the dashboard to see populated KPI cards, timeline charts, heatmap data, and model breakdowns.

---

### 4. Start the Frontend Web App (Next.js)

```bash
# Open a new terminal in apps/web:
cd apps/web

# Install frontend dependencies
npm install

# Start the Next.js development server
npm run dev
```

Open your browser and navigate to:
👉 **[http://localhost:3000](http://localhost:3000)**

---

## 🖥️ How to Use AgentOS

### 1. Overview Dashboard (`/dashboard`)
- **Change Time Ranges**: Click the range toggle pills (`24h`, `7d`, `30d`) in the top bar to update all KPIs, charts, and breakdowns simultaneously.
- **Inspect Events**: Click on any event row in the Live Event Feed to slide open the **Event Detail Drawer**, which displays raw JSON parameters, model metadata, and token breakdowns.
- **Pause Live Stream**: Hover over the feed and hit "Pause Stream" to freeze the log while you inspect incoming events; click "Resume" to flush buffered events.

### 2. Token Analytics (`/analytics`)
- **Hover Heatmap Cells**: Hover over any day block in the 90-day heatmap to view that day's exact token count and date.
- **Compare Models**: Sort the Model Comparison Table by tokens, cost, or events to discover which LLM is consuming the largest share of your budget.
- **Review Cost Projections**: Check the Projected Spend card to assess projected 30-day runway based on current agent workload.
- **Session Drilldown**: Click any session row in the session table to open the chronological event timeline for that specific agent run.

### 3. Agent Manager (`/agents`)
- **Browse Agents**: View all local Claude Code agents parsed from `.claude/agents/*.md` with their respective tool badges.
- **View Stats**: Click any agent card to open the **Agent Detail Sheet**, displaying total tokens burned, total cost in USD, and last active timestamp.
- **Edit Agent Config**: Click "Edit Agent" inside the sheet to modify descriptions or add/remove tools (e.g. `Read`, `Write`, `Bash`). Click "Save Changes" to atomically update the file on disk.

### 4. Command Center (`/commands`)
- **Inspect Slash Commands**: Browse commands parsed from `.claude/commands/*.md` (e.g. `/sprint`, `/beacon-check`, `/implement`).
- **Open Runner**: Click any command row to view its full markdown instructions and activate the integrated **Command Runner**.
- **Run Workflow**: Enter optional CLI arguments (e.g. `4 2`) and click **Run**.
- **Watch Live Streaming**: Observe stdout and stderr streaming into the terminal buffer in real-time. Notice the exit badge (`Exit: 0` in emerald/cache or non-zero in red/error) upon completion.
- **Clear Terminal**: Hit **Clear** to flush the output buffer.

---

## ⚙️ Configuration & Environment Variables

### Backend Configuration (`apps/api`)

You can customize runtime behavior by passing environment variables:

| Variable | Default Value | Description |
|---|---|---|
| `PORT` | `8080` | Port for HTTP and WebSocket server. |
| `DB_PATH` | `./agentOS.db` | Path to SQLite database file. |
| `BEACON_JSONL` | `~/.beacon/endpoint/logs/runtime.jsonl` | Path to the active Beacon JSONL log file. |
| `AGENTOS_AGENTS_DIR` | `.claude/agents` | Directory containing agent markdown files. |
| `AGENTOS_COMMANDS_DIR` | `.claude/commands` | Directory containing slash command markdown files. |
| `AGENTOS_CLAUDE_BIN` | `claude` | Binary executable used by Command Runner. |

### Frontend Configuration (`apps/web`)

Configure via `apps/web/.env.local`:

| Variable | Default Value | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8080/api` | Base URL for REST API calls. |
| `NEXT_PUBLIC_WS_URL` | `ws://localhost:8080/ws` | WebSocket URL for telemetry and command streaming. |

---

## 🧪 Verification & Testing

AgentOS adheres to strict quality and accessibility standards:
- Zero raw hex, rgb, rgba, or numeric hsl colors (static Tailwind HSL design tokens only).
- Strict TypeScript with zero `any` types.
- WCAG 2.2 Level AA accessibility compliance with keyboard navigation and ARIA landmarks.

### Running Backend Tests
```bash
cd apps/api
go test -v -p 1 ./...
go build ./...
```

### Running Frontend Tests & Type Checking
```bash
cd apps/web

# Run Vitest test suites (119+ tests)
npm run test

# Run TypeScript strict type-check
npm run type-check

# Run production build
npm run build
```

---

## 📂 Project Directory Structure

```text
AgentOS/
├── .agents/                    # Agent skills & WCAG guidelines
├── .beacon/                    # Beacon telemetry configuration
├── .claude/
│   ├── agents/                 # Claude Code agent definitions (*.md)
│   ├── commands/               # Slash command definitions (*.md)
│   └── hooks/                  # Hook configurations (hooks.json)
├── apps/
│   ├── api/                    # Go Backend Service
│   │   ├── cmd/
│   │   │   ├── api/            # API entry point (main.go)
│   │   │   └── seed/           # Synthetic demo data generator
│   │   └── internal/
│   │       ├── agentconfig/    # Agent YAML frontmatter parser
│   │       ├── beacon/         # Beacon JSONL watcher & parser
│   │       ├── commandconfig/  # Markdown slash command parser
│   │       ├── db/             # SQLite connection & SQL aggregation queries
│   │       ├── handlers/       # REST & WebSocket route handlers
│   │       ├── models/         # Go data structs
│   │       └── ws/             # Gorilla WebSocket connection hub
│   │
│   └── web/                    # Next.js 14 Frontend Application
│       ├── src/
│       │   ├── app/            # App Router pages (/dashboard, /analytics, /agents, /commands)
│       │   ├── components/     # UI components (dashboard, analytics, agents, commands, ui)
│       │   ├── hooks/          # React hooks (useBeaconSocket, useCommands, useAgents, etc.)
│       │   ├── lib/            # Utilities, API client, formatters, animations
│       │   └── store/          # Zustand global stores (rangeStore, etc.)
│       └── tailwind.config.ts  # Design system token configuration
│
├── docs/                       # Design system, accessibility audits & component specs
├── sprints/                    # Sprint specifications (Sprints 0 through 16)
└── README.md                   # You are here
```

---

## 🗺️ Roadmap

- [x] **Sprint 0: Foundation & Architecture** (Go Chi backend, SQLite, Next.js UI shell)
- [x] **Sprint 1: Overview Dashboard** (Real-time KPIs, Token timeline, Event feed, Breakdown panels)
- [x] **Sprint 2: Token Analytics** (Heatmap calendar, Model comparison, Spend projection, Session drilldown)
- [x] **Sprint 3: Agent Manager** (Agent discovery, Live SQL metrics, YAML config editor)
- [x] **Sprint 4: Command Center** (Command browser, Detail drawer, Live WebSocket runner)
- [ ] **Sprint 5: Hook Manager** (PreToolUse, PostToolUse, and Stop hook viewer & toggle)
- [ ] **Sprint 6: Skill & MCP Store** (Browse installed skills, discover extensions, manage MCP servers)
- [ ] **Sprint 7: Visual Flow Graph** (Interactive React Flow diagram of agent-to-tool relationships)
- [ ] **Sprint 8: Chat-to-Config** (Natural language agent & tool configuration assistant)
- [ ] **Sprint 9: Budget & Safety** (Hard spending limits, killswitches, token quota alerts)
- [ ] **Sprint 10: Session Explorer & Time-Travel** (Step-by-step playback of agent decision paths)
- [ ] **Sprint 11: Model Intelligence** (Automated model routing, cost vs. quality optimization)
- [ ] **Sprint 12: ROI Analytics & Quality** (Task completion rate, cost per pull request)
- [ ] **Sprint 13: Auto-Discovery & Self-Healing** (Detect config errors and propose fixes)
- [ ] **Sprint 14: Dependency Map & Versioning** (Git-backed config rollback and dependency graphs)
- [ ] **Sprint 15: Team & Marketplace** (Multi-developer team mode and public blueprint marketplace)
- [ ] **Sprint 16: What-If Simulator & Alerts** (Predict token spend changes before running workflows)

---

## 📄 License

This project is open-source under the [MIT License](LICENSE).
Built with ❤️ for the AI agent developer community.
