"use client"

import React, { useState } from "react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { BeaconEvent } from "@/lib/api"
import { getEventCategory } from "@/lib/eventTypes"
import { formatTokens, formatUsd } from "@/lib/format"
import { Copy, Check, Terminal } from "lucide-react"
import { Button } from "@/components/ui/button"

interface EventDetailSheetProps {
  event: BeaconEvent | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EventDetailSheet({
  event,
  open,
  onOpenChange,
}: EventDetailSheetProps) {
  const [copied, setCopied] = useState<boolean>(false)

  if (!event) return null

  let formattedJSON = event.raw_json
  try {
    const parsed = JSON.parse(event.raw_json)
    formattedJSON = JSON.stringify(parsed, null, 2)
  } catch {
    // Keep raw_json as-is if unparseable
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(formattedJSON)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const category = getEventCategory(event)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto max-h-screen">
        <SheetHeader className="pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-bold uppercase tracking-wider border ${category.badgeClass}`}
            >
              {category.label}
            </span>
            <SheetTitle className="text-base font-mono">
              Event #{event.id || "live"}
            </SheetTitle>
          </div>
          <SheetDescription className="text-xs font-mono text-slate-400">
            {event.timestamp || event.created_at} · Session: {event.session_id}
          </SheetDescription>
        </SheetHeader>

        {/* Metadata Grid */}
        <div className="grid grid-cols-2 gap-3 my-4 p-3 rounded-lg border border-slate-800 bg-slate-900/60 text-xs font-mono">
          <div>
            <span className="text-slate-400 block text-[10px] uppercase">Agent</span>
            <span className="text-slate-200 font-semibold">{event.agent || "—"}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase">Model</span>
            <span className="text-slate-200">{event.model || "—"}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase">Tool Name</span>
            <span className="text-slate-200">{event.tool_name || "—"}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase">Cost (USD)</span>
            <span className="text-emerald-400 font-semibold">
              {formatUsd(event.cost_usd)}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase">Input Tokens</span>
            <span className="text-slate-200">{formatTokens(event.input_tokens)}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase">Output Tokens</span>
            <span className="text-slate-200">{formatTokens(event.output_tokens)}</span>
          </div>
        </div>

        {/* Raw JSON viewer */}
        <div className="flex-1 flex flex-col min-h-0 mt-2">
          <div className="flex items-center justify-between pb-2">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Terminal className="h-3.5 w-3.5 text-blue-400" />
              Raw Telemetry Payload
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="h-7 px-2.5 text-xs border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 mr-1 text-emerald-400" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 mr-1 text-slate-400" />
                  Copy JSON
                </>
              )}
            </Button>
          </div>

          <div className="flex-1 overflow-auto rounded-lg border border-slate-800 bg-slate-950/90 p-4 font-mono text-[11px] leading-relaxed text-slate-300">
            <pre className="whitespace-pre-wrap break-all">
              <code>{formattedJSON}</code>
            </pre>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

