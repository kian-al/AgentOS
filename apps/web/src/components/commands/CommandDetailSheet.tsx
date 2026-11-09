"use client"

import React from "react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/shared/Skeleton"
import { ErrorBoundary } from "@/components/shared/ErrorBoundary"
import { CommandConfig } from "@/lib/api"
import { Terminal, X, FileCode, Clock, FileText } from "lucide-react"
import { CommandRunner } from "./CommandRunner"

export interface CommandDetailSheetProps {
  command: CommandConfig | null
  open: boolean
  onClose: () => void
  loading?: boolean
}

function CommandDetailSheetContent({
  command,
  open,
  onClose,
  loading = false,
}: CommandDetailSheetProps) {
  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent
        className="w-full sm:max-w-xl overflow-y-auto bg-slate-950 border-l border-slate-800 text-slate-200 p-6 space-y-6"
        aria-describedby="command-detail-desc"
      >
        {/* Accessible close button with required aria-label */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close command detail"
          className="absolute right-4 top-4 rounded-md p-1.5 text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <X className="h-4 w-4" aria-hidden="true" />
          <span className="sr-only">Close command detail</span>
        </button>

        <SheetHeader className="pb-4 border-b border-slate-800/80 pr-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-950/60 border border-blue-800/40 text-blue-400 shrink-0">
              <Terminal className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <SheetTitle className="text-lg font-bold font-mono text-white tracking-tight">
                  {command ? `/${command.name}` : "Command Details"}
                </SheetTitle>
                <Badge
                  variant="outline"
                  className="border-blue-500/30 bg-blue-600/10 font-mono text-[10px] text-blue-400"
                >
                  Slash Command
                </Badge>
              </div>
              <SheetDescription
                id="command-detail-desc"
                className="text-xs text-slate-400 mt-0.5 line-clamp-1"
              >
                Claude Code slash command definition
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        {loading ? (
          <div data-testid="command-detail-skeleton" className="space-y-6 pt-2">
            <div className="space-y-2">
              <Skeleton variant="text" className="h-5 w-3/4 bg-slate-800" />
              <Skeleton variant="text" className="h-4 w-1/2 bg-slate-800" />
            </div>
            <Skeleton variant="card" count={2} />
            <Skeleton variant="row" count={3} />
          </div>
        ) : command ? (
          <div className="space-y-6">
            {/* Description & Action Header */}
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold text-slate-100">{command.title}</h3>
              </div>

              {command.description && (
                <p className="text-sm text-slate-300 leading-relaxed bg-slate-900/40 p-3 rounded-lg border border-slate-800/80">
                  {command.description}
                </p>
              )}

              {/* File metadata */}
              <div className="flex flex-col gap-1.5 p-3 rounded-lg border border-slate-800 bg-slate-900/40 text-xs font-mono text-slate-400">
                <div className="flex items-center gap-1.5">
                  <FileCode className="h-3.5 w-3.5 text-slate-500 shrink-0" aria-hidden="true" />
                  <span className="text-slate-500">Path:</span>
                  <span className="text-slate-300 truncate" title={command.file_path}>
                    {command.file_path}
                  </span>
                </div>
                {command.updated_at && (
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-slate-500 shrink-0" aria-hidden="true" />
                    <span className="text-slate-500">Updated:</span>
                    <span className="text-slate-300">
                      {new Date(command.updated_at).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Interactive Command Runner */}
            <CommandRunner command={command} />

            {/* Markdown Body Area */}
            <div className="space-y-2">
              <h3 className="text-xs font-mono font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-blue-400" aria-hidden="true" />
                <span>Command Definition Body</span>
              </h3>
              <pre
                tabIndex={0}
                aria-label="Command body content"
                className="p-4 rounded-lg border border-slate-800 bg-slate-900/60 font-mono text-xs text-slate-300 overflow-x-auto whitespace-pre-wrap leading-relaxed select-all max-h-[300px] overflow-y-auto"
              >
                {command.body || "No body content provided."}
              </pre>
            </div>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}

export function CommandDetailSheet(props: CommandDetailSheetProps) {
  return (
    <ErrorBoundary name="CommandDetailSheet">
      <CommandDetailSheetContent {...props} />
    </ErrorBoundary>
  )
}
