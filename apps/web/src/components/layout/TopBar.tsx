"use client"

import React from "react"
import { usePathname } from "next/navigation"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { Menu, Search, ChevronRight } from "lucide-react"

interface TopBarProps {
  onMenuClick?: () => void
}

export function TopBar({ onMenuClick }: TopBarProps) {
  const pathname = usePathname()

  const getPageTitle = (path: string) => {
    if (path.includes("/analytics")) return "Analytics"
    if (path.includes("/agents")) return "Agents"
    if (path.includes("/commands")) return "Commands"
    if (path.includes("/hooks")) return "Hooks"
    if (path.includes("/skills")) return "Skills"
    if (path.includes("/sessions")) return "Sessions"
    if (path.includes("/settings")) return "Settings"
    return "Dashboard"
  }

  const pageTitle = getPageTitle(pathname)

  return (
    <header className="h-14 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between shrink-0 sticky top-0 z-20">
      {/* Left: Mobile Toggle + Breadcrumbs */}
      <div className="flex items-center gap-3">
        {/* Mobile Hamburger Menu button */}
        <button
          type="button"
          onClick={onMenuClick}
          className="md:hidden p-2 -ml-2 rounded-md text-slate-400 hover:text-white hover:bg-slate-800/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-colors"
          aria-label="Open mobile navigation menu"
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
        </button>

        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs">
          <span className="font-semibold text-slate-400 hover:text-slate-200 transition-colors">
            AgentOS
          </span>
          <ChevronRight className="h-3.5 w-3.5 text-slate-600 shrink-0" aria-hidden="true" />
          <h1 className="text-sm font-semibold text-white tracking-tight">
            {pageTitle}
          </h1>
        </nav>
      </div>

      {/* Center: Search input mockup with ⌘K shortcut */}
      <div className="hidden md:flex items-center">
        <div
          role="search"
          className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-slate-800 bg-slate-900/60 text-slate-400 text-xs w-48 lg:w-64 transition-all focus-within:border-slate-700"
        >
          <Search className="h-3.5 w-3.5 text-slate-500 shrink-0" aria-hidden="true" />
          <input
            type="text"
            placeholder="Search telemetry..."
            aria-label="Search telemetry"
            className="bg-transparent border-none outline-none text-slate-200 placeholder-slate-500 text-xs w-full focus:ring-0"
            readOnly
          />
          <kbd
            aria-label="Command K shortcut"
            className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 shrink-0"
          >
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Right: Beacon Status Badge (Online/Offline) */}
      <div className="flex items-center gap-2 sm:gap-3">
        <StatusBadge intervalMs={10000} />
      </div>
    </header>
  )
}
