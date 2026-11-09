import { BeaconEvent } from "@/lib/api"
import { Wrench, Bot, Radio, AlertCircle } from "lucide-react"

export type EventCategory = "TOOL" | "AGENT" | "SESSION" | "ERROR"

export const EVENT_STYLES = {
  tool: {
    badge: "bg-chart-tool/15 text-chart-tool border-chart-tool/30",
    dot: "bg-chart-tool",
  },
  agent: {
    badge: "bg-chart-agent/15 text-chart-agent border-chart-agent/30",
    dot: "bg-chart-agent",
  },
  session: {
    badge: "bg-chart-session/15 text-chart-session border-chart-session/30",
    dot: "bg-chart-session",
  },
  error: {
    badge: "bg-chart-error/15 text-chart-error border-chart-error/30",
    dot: "bg-chart-error",
  },
  unknown: {
    badge: "bg-slate-500/15 text-slate-400 border-slate-500/30",
    dot: "bg-slate-500",
  },
} as const

export interface EventCategoryInfo {
  category: EventCategory
  label: string
  badgeClass: string
  dotClass: string
  icon: typeof Wrench
}

export function getEventCategory(evt: BeaconEvent): EventCategoryInfo {
  const typeLower = (evt.event_type || "").toLowerCase()

  // 1. Error events
  if (typeLower.includes("error") || typeLower.includes("fail")) {
    return {
      category: "ERROR",
      label: "ERROR",
      badgeClass: EVENT_STYLES.error.badge,
      dotClass: EVENT_STYLES.error.dot,
      icon: AlertCircle,
    }
  }

  // 2. Tool events
  if (evt.tool_name || typeLower.includes("tool")) {
    return {
      category: "TOOL",
      label: "TOOL",
      badgeClass: EVENT_STYLES.tool.badge,
      dotClass: EVENT_STYLES.tool.dot,
      icon: Wrench,
    }
  }

  // 3. Session events
  if (typeLower.includes("session")) {
    return {
      category: "SESSION",
      label: "SESSION",
      badgeClass: EVENT_STYLES.session.badge,
      dotClass: EVENT_STYLES.session.dot,
      icon: Radio,
    }
  }

  // 4. Agent events (default)
  return {
    category: "AGENT",
    label: "AGENT",
    badgeClass: EVENT_STYLES.agent.badge,
    dotClass: EVENT_STYLES.agent.dot,
    icon: Bot,
  }
}
