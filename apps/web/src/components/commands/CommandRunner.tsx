"use client"

import React, { useState, useEffect, useRef } from "react"
import { Play, Loader2, Trash2, Terminal, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ErrorBoundary } from "@/components/shared/ErrorBoundary"
import { useBeaconSocket } from "@/hooks/useBeaconSocket"
import { runCommand, CommandConfig } from "@/lib/api"
import { cn } from "@/lib/utils"

export const EXIT_STYLES = {
  success: "border-chart-cache/30 bg-chart-cache/20 text-chart-cache",
  error: "border-chart-error/30 bg-chart-error/20 text-chart-error",
} as const

export interface CommandRunnerProps {
  command: CommandConfig | { name: string; title?: string }
}

function CommandRunnerInner({ command }: CommandRunnerProps) {
  const { lastEvent } = useBeaconSocket()
  const [args, setArgs] = useState<string>("")
  const [outputLines, setOutputLines] = useState<string[]>([])
  const [exitCode, setExitCode] = useState<number | null>(null)
  const [isRunning, setIsRunning] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const terminalRef = useRef<HTMLPreElement | null>(null)

  // Auto-scroll terminal output as new lines arrive
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight
    }
  }, [outputLines])

  // Filter WebSocket telemetry messages for command_output and command_done events
  useEffect(() => {
    if (!lastEvent) return
    const targetCommand = `/${command.name}`

    if ("type" in lastEvent) {
      if (lastEvent.type === "command_output" && lastEvent.command === targetCommand) {
        setOutputLines((prev) => [...prev, lastEvent.line])
      } else if (lastEvent.type === "command_done" && lastEvent.command === targetCommand) {
        setExitCode(lastEvent.exit_code)
        setIsRunning(false)
      }
    }
  }, [lastEvent, command.name])

  const handleRun = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (isRunning) return

    setIsRunning(true)
    setError(null)
    setExitCode(null)

    try {
      await runCommand(command.name, args.trim())
    } catch (err) {
      setIsRunning(false)
      setError(err instanceof Error ? err.message : "Failed to run command")
    }
  }

  const handleClear = () => {
    setOutputLines([])
    setExitCode(null)
    setError(null)
  }

  return (
    <div className="space-y-4 rounded-xl border border-slate-800 bg-slate-900/50 p-4">
      {/* Header & Title */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-blue-400" aria-hidden="true" />
          <h4 className="text-xs font-mono font-medium text-slate-200 uppercase tracking-wider">
            Command Runner
          </h4>
        </div>
        <div className="flex items-center gap-2">
          {isRunning && (
            <span
              data-testid="command-running-indicator"
              className="text-xs font-mono text-blue-400 flex items-center gap-1.5"
              role="status"
              aria-live="polite"
            >
              <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse inline-block" />
              Command running…
            </span>
          )}
          {exitCode !== null && (
            <Badge
              variant="outline"
              data-testid="exit-code-badge"
              className={cn(
                "font-mono text-xs px-2 py-0.5",
                exitCode === 0 ? EXIT_STYLES.success : EXIT_STYLES.error
              )}
            >
              Exit: {exitCode}
            </Badge>
          )}
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div
          role="alert"
          className="p-3 rounded-lg border border-chart-error/30 bg-chart-error/10 text-chart-error text-xs flex items-center gap-2.5"
        >
          <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      {/* Execution Form */}
      <form onSubmit={handleRun} className="flex items-end gap-2.5">
        <div className="flex-1 space-y-1.5">
          <label
            htmlFor={`command-args-${command.name}`}
            className="text-xs font-medium text-slate-300 flex items-center justify-between"
          >
            <span>Arguments</span>
            <span className="text-[11px] font-mono text-slate-500">Optional</span>
          </label>
          <Input
            id={`command-args-${command.name}`}
            placeholder="e.g. 1 4"
            value={args}
            onChange={(e) => setArgs(e.target.value)}
            disabled={isRunning}
            aria-label="Command arguments"
            className="h-8 font-mono text-xs bg-slate-950 border-slate-800 text-slate-200 placeholder:text-slate-600 focus-visible:ring-blue-500"
          />
        </div>
        <Button
          type="submit"
          disabled={isRunning}
          aria-label={isRunning ? "Command is running" : `Run command /${command.name}`}
          size="sm"
          className="h-8 px-4 text-xs font-medium gap-1.5 bg-blue-600 hover:bg-blue-500 text-white shrink-0 shadow-sm transition-colors focus-visible:ring-2 focus-visible:ring-blue-400 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isRunning ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
              <span>Running...</span>
            </>
          ) : (
            <>
              <Play className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Run</span>
            </>
          )}
        </Button>
      </form>

      {/* Terminal Output Header & Clear */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
            Live Output
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClear}
            disabled={isRunning || (outputLines.length === 0 && exitCode === null && !error)}
            aria-label="Clear output terminal"
            className="h-6 px-2 text-[11px] font-mono text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 gap-1 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Trash2 className="h-3 w-3" aria-hidden="true" />
            <span>Clear</span>
          </Button>
        </div>

        {/* Scrollable Live Output Terminal */}
        <pre
          ref={terminalRef}
          tabIndex={0}
          role="log"
          aria-label="Command execution output"
          aria-live="polite"
          className="p-3.5 rounded-lg border border-slate-800 bg-slate-950 font-mono text-xs text-slate-300 overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-[240px] min-h-[100px] overflow-y-auto select-all scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent"
        >
          {outputLines.length > 0
            ? outputLines.join("\n")
            : "No output yet. Enter arguments (optional) and click Run."}
        </pre>
      </div>
    </div>
  )
}

export function CommandRunner(props: CommandRunnerProps) {
  return (
    <ErrorBoundary name="CommandRunner">
      <CommandRunnerInner {...props} />
    </ErrorBoundary>
  )
}

