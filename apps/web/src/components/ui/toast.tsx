import * as React from "react"
import { cn } from "@/lib/utils"
import { CheckCircle2, AlertCircle, X } from "lucide-react"

export interface ToastProps {
  id?: string
  title?: string
  description?: string
  variant?: "default" | "destructive" | "success"
  onClose?: () => void
}

export function Toast({ title, description, variant = "default", onClose }: ToastProps) {
  const isDestructive = variant === "destructive"

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "pointer-events-auto flex w-full items-center justify-between space-x-3 overflow-hidden rounded-lg border p-3.5 shadow-lg transition-all",
        isDestructive
          ? "border-red-500/40 bg-red-950/90 text-red-200"
          : "border-slate-800 bg-slate-900/95 text-slate-100"
      )}
    >
      <div className="flex items-start gap-2.5">
        {isDestructive ? (
          <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" aria-hidden="true" />
        ) : (
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" aria-hidden="true" />
        )}
        <div className="space-y-0.5">
          {title && <div className="text-xs font-semibold">{title}</div>}
          {description && <div className="text-xs text-slate-400">{description}</div>}
        </div>
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Close notification"
          className="rounded-md p-1 text-slate-400 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <X className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      )}
    </div>
  )
}

