"use client"

import React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion } from "framer-motion"
import {
  BarChart3,
  Bot,
  Terminal,
  Anchor,
  Target,
  Search,
  Settings,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useReducedMotion } from "@/hooks/useReducedMotion"

export interface NavItem {
  href: string
  label: string
  emoji: string
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean | "true" | "false" }>
  badge?: string
  shortcut?: string
}

export const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", emoji: "📊", icon: BarChart3, shortcut: "G D" },
  { href: "/analytics", label: "Analytics", emoji: "📈", icon: BarChart3, shortcut: "G A" },
  { href: "/agents", label: "Agents", emoji: "🤖", icon: Bot, badge: "5" },
  { href: "/commands", label: "Commands", emoji: "⚡", icon: Terminal, badge: "3" },
  { href: "/dashboard/hooks", label: "Hooks", emoji: "🪝", icon: Anchor, badge: "4" },
  { href: "/dashboard/skills", label: "Skills", emoji: "🎯", icon: Target },
  { href: "/dashboard/sessions", label: "Sessions", emoji: "🔍", icon: Search },
  { href: "/dashboard/settings", label: "Settings", emoji: "⚙️", icon: Settings },
]

interface SidebarProps {
  className?: string
  onNavigate?: () => void
}

export function Sidebar({ className, onNavigate }: SidebarProps) {
  const pathname = usePathname()
  const prefersReduced = useReducedMotion()

  return (
    <aside
      className={cn(
        "w-[240px] border-r border-slate-800 bg-gradient-to-b from-slate-950 to-slate-900/90 flex flex-col shrink-0 min-h-screen text-slate-100",
        className
      )}
      aria-label="AgentOS Sidebar navigation"
    >
      {/* Brand Header */}
      <div className="h-14 flex items-center gap-2.5 px-5 border-b border-slate-800/80 shrink-0">
        <span className="text-xl" role="img" aria-label="AgentOS Logo">
          🧠
        </span>
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-base tracking-tight text-white">AgentOS</span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-950 text-blue-400 border border-blue-800/60 font-semibold">
            OS
          </span>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto" aria-label="Main Navigation">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href === "/analytics" && pathname === "/dashboard/analytics") ||
            (item.href === "/agents" && (pathname === "/agents" || pathname === "/dashboard/agents")) ||
            (item.href === "/commands" && (pathname === "/commands" || pathname === "/dashboard/commands"))

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "group relative flex items-center justify-between px-3 py-2.5 rounded-md text-sm transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 select-none",
                "border-l-2",
                isActive
                  ? "border-chart-agent text-white font-bold"
                  : "border-transparent text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 hover:border-chart-agent font-medium"
              )}
            >
              {isActive && !prefersReduced && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute inset-0 rounded-md bg-slate-800 border-l-2 border-chart-agent"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  aria-hidden="true"
                />
              )}
              {isActive && prefersReduced && (
                <div
                  className="absolute inset-0 rounded-md bg-slate-800 border-l-2 border-chart-agent"
                  aria-hidden="true"
                />
              )}

              <div className="relative z-10 flex items-center gap-2.5">
                <span className="text-base shrink-0" role="img" aria-hidden="true">
                  {item.emoji}
                </span>
                <span className="truncate">{item.label}</span>
              </div>

              <div className="relative z-10 flex items-center gap-1.5">
                {item.shortcut && (
                  <kbd
                    aria-label={`Shortcut: ${item.shortcut}`}
                    className="hidden group-hover:inline-block text-[10px] font-mono px-1 rounded bg-slate-900 text-slate-400 border border-slate-700/60"
                  >
                    {item.shortcut}
                  </kbd>
                )}
                {item.badge && (
                  <span
                    className={cn(
                      "text-[10px] font-mono px-1.5 py-0.5 rounded-full font-semibold",
                      isActive
                        ? "bg-slate-900 text-purple-300 border border-purple-500/30"
                        : "bg-slate-800 text-slate-300"
                    )}
                    aria-label={`${item.badge} active`}
                  >
                    {item.badge}
                  </span>
                )}
              </div>
            </Link>
          )
        })}
      </nav>

      {/* Version Footer */}
      <div className="p-4 border-t border-slate-800/80 text-xs text-slate-400 space-y-2 shrink-0">
        <div className="flex items-center justify-between font-mono text-[11px]">
          <span className="text-slate-500">Platform</span>
          <span className="text-slate-300 font-semibold">v0.1.0</span>
        </div>
      </div>
    </aside>
  )
}
