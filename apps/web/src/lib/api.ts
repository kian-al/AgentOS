export const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";
export const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8080/ws";

export interface BeaconEvent {
  id: number;
  event_type: string;
  session_id: string;
  agent?: string;
  timestamp: string;
  input_tokens: number;
  output_tokens: number;
  cache_read_tokens: number;
  model?: string;
  cost_usd: number;
  tool_name?: string;
  raw_json: string;
  created_at: string;
}

export interface HealthResponse {
  status: string;
  version: string;
}

export async function fetchHealth(): Promise<HealthResponse> {
  const res = await fetch(`${API_BASE}/health`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch health");
  return res.json();
}

export async function fetchLatestEvents(limit = 20): Promise<BeaconEvent[]> {
  const res = await fetch(`${API_BASE}/events/latest?limit=${limit}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch latest events");
  return res.json();
}

export interface MetricsSummary {
  tokens_today: number;
  cost_today_usd: number;
  active_sessions: number;
  agents_seen: number;
  events_total: number;
  tokens_delta_pct: number;
  cost_delta_pct: number;
}

export async function fetchMetricsSummary(): Promise<MetricsSummary> {
  const res = await fetch(`${API_BASE}/metrics/summary`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch metrics summary");
  return res.json();
}

export interface TimelineBucket {
  bucket: string;
  input_tokens: number;
  output_tokens: number;
  cache_read_tokens: number;
  cost_usd: number;
}

export async function fetchTimeline(range = "24h"): Promise<TimelineBucket[]> {
  const res = await fetch(`${API_BASE}/metrics/timeline?range=${range}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch timeline metrics");
  return res.json();
}

export interface BreakdownItem {
  key: string;
  tokens: number;
  cost_usd: number;
  events: number;
  pct: number;
}

export async function fetchBreakdown(
  by: "model" | "agent",
  range = "24h"
): Promise<BreakdownItem[]> {
  const res = await fetch(`${API_BASE}/metrics/breakdown?by=${by}&range=${range}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Failed to fetch breakdown by ${by}`);
  return res.json();
}

export interface HeatmapDay {
  day: string;
  tokens: number;
}

export async function fetchHeatmap(range = "90d"): Promise<HeatmapDay[]> {
  const res = await fetch(`${API_BASE}/metrics/heatmap?range=${range}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to fetch heatmap data");
  return res.json();
}

export interface ModelStat {
  model: string;
  events: number;
  tokens: number;
  cost_usd: number;
  cost_per_million: number;
}

export async function fetchModelStats(range = "24h"): Promise<ModelStat[]> {
  const res = await fetch(`${API_BASE}/metrics/models?range=${range}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to fetch model comparison statistics");
  return res.json();
}

export interface ProjectionPoint {
  date: string;
  cost_usd: number;
  tokens: number;
}

export interface ProjectionResult {
  daily_avg_usd: number;
  trend_slope: number;
  projected_month_usd: number;
  projected_month_tokens: number;
  confidence: "low" | "medium" | "high";
  data_points: number;
  history?: ProjectionPoint[];
}

export async function fetchProjection(): Promise<ProjectionResult> {
  const res = await fetch(`${API_BASE}/metrics/projection`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to fetch cost projection");
  return res.json();
}

export interface SessionSummary {
  session_id: string;
  events: number;
  tokens: number;
  cost_usd: number;
  started_at: string;
  ended_at: string;
}

export interface SessionEvent {
  id: number;
  event_type: string;
  agent: string;
  model: string;
  tool_name: string;
  token_usage_input: number;
  token_usage_output: number;
  token_usage_cache_read: number;
  cost_usd: number;
  timestamp: string;
}

export async function fetchSessions(): Promise<SessionSummary[]> {
  const res = await fetch(`${API_BASE}/sessions`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to fetch sessions");
  return res.json();
}

export async function fetchSessionEvents(sessionId: string): Promise<SessionEvent[]> {
  const res = await fetch(`${API_BASE}/sessions/${encodeURIComponent(sessionId)}/events`, {
    cache: "no-store",
  });
  if (!res.ok) {
    if (res.status === 404) throw new Error("Session not found");
    if (res.status === 400) throw new Error("Invalid session identifier");
    throw new Error("Failed to fetch session events");
  }
  return res.json();
}

export interface AgentConfig {
  name: string;
  description: string;
  tools: string[];
  file_path: string;
  updated_at: string;
}

export async function fetchAgents(refresh = false): Promise<AgentConfig[]> {
  const url = `${API_BASE}/agents${refresh ? "?refresh=true" : ""}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch agents");
  return res.json();
}

export interface AgentStats {
  total_tokens: number;
  total_cost_usd: number;
  total_events: number;
  last_seen: string | null;
}

export interface AgentDetail {
  config: AgentConfig;
  stats: AgentStats;
}

export async function fetchAgentDetail(name: string): Promise<AgentDetail> {
  const res = await fetch(`${API_BASE}/agents/${encodeURIComponent(name)}`, { cache: "no-store" });
  if (!res.ok) {
    if (res.status === 404) throw new Error("Agent not found");
    if (res.status === 400) throw new Error("Invalid agent name");
    throw new Error("Failed to fetch agent details");
  }
  return res.json();
}

export interface UpdateAgentPayload {
  description: string;
  tools: string[];
}

export async function updateAgent(
  name: string,
  patch: UpdateAgentPayload
): Promise<AgentConfig> {
  const res = await fetch(`${API_BASE}/agents/${encodeURIComponent(name)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `Failed to update agent: ${res.statusText}`);
  }
  return res.json();
}

export interface CommandConfig {
  name: string;
  title: string;
  description: string;
  file_path: string;
  body: string;
  updated_at: string;
}

export async function fetchCommands(refresh = false): Promise<CommandConfig[]> {
  const url = `${API_BASE}/commands${refresh ? "?refresh=true" : ""}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch commands");
  return res.json();
}

export interface CommandOutputMessage {
  type: "command_output";
  command: string;
  line: string;
  ts: string;
}

export interface CommandDoneMessage {
  type: "command_done";
  command: string;
  exit_code: number;
}

export interface RunCommandResponse {
  status: string;
  command: string;
  error?: string;
}

export async function runCommand(name: string, args = ""): Promise<RunCommandResponse> {
  const res = await fetch(`${API_BASE}/commands/${encodeURIComponent(name)}/run`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ args }),
  });

  if (res.status === 409) {
    throw new Error("Another command is currently running");
  }

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `Failed to run command: ${res.statusText}`);
  }

  return res.json();
}










