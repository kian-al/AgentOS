"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Sidebar } from "./Sidebar"
import { TopBar } from "./TopBar"
import { X } from "lucide-react"

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const router = useRouter()

  // Global Keyboard Shortcuts (Phase 4.1):
  // G then D -> /dashboard
  // G then A -> /analytics
  // Esc -> closes mobile drawer or sheet
  useEffect(() => {
    let gPressed = false
    let gTimeout: ReturnType<typeof setTimeout> | null = null

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return
      }

      if (e.key === "Escape") {
        if (mobileMenuOpen) {
          setMobileMenuOpen(false)
        }
        return
      }

      const key = e.key.toLowerCase()

      if (key === "g" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        gPressed = true
        if (gTimeout) clearTimeout(gTimeout)
        gTimeout = setTimeout(() => {
          gPressed = false
        }, 1000)
        return
      }

      if (gPressed) {
        if (key === "d") {
          e.preventDefault()
          router.push("/dashboard")
          gPressed = false
          if (gTimeout) clearTimeout(gTimeout)
        } else if (key === "a") {
          e.preventDefault()
          router.push("/analytics")
          gPressed = false
          if (gTimeout) clearTimeout(gTimeout)
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      if (gTimeout) clearTimeout(gTimeout)
    }
  }, [mobileMenuOpen, router])

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex relative">
      {/* Skip to Main Content Link for Keyboard Accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-md focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-white font-medium text-xs"
      >
        Skip to main content
      </a>

      {/* Desktop Sidebar: 240px wide, hidden on mobile */}
      <Sidebar className="hidden md:flex w-[240px]" />

      {/* Mobile Slide-Over Drawer */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 md:hidden flex"
          role="dialog"
          aria-modal="true"
          aria-label="Mobile Navigation"
        >
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer content */}
          <div className="relative flex flex-col w-[260px] max-w-[85vw] bg-slate-950 border-r border-slate-800 shadow-2xl z-10">
            <div className="absolute top-3.5 right-3.5 z-20">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-colors"
                aria-label="Close mobile navigation"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            <Sidebar
              className="w-full border-r-0"
              onNavigate={() => setMobileMenuOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Main Layout Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar onMenuClick={() => setMobileMenuOpen(true)} />
        <main
          id="main-content"
          tabIndex={-1}
          className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto bg-gradient-to-b from-slate-950 via-slate-900/20 to-slate-950 focus:outline-none"
        >
          {children}
        </main>
      </div>
    </div>
  )
}
