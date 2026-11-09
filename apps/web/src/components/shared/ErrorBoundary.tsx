"use client"

import React, { Component, ErrorInfo, ReactNode } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { AlertTriangle, RefreshCw, Copy, Check } from "lucide-react"

interface ErrorBoundaryProps {
  children: ReactNode
  name?: string
  fallback?: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  copied: boolean
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private copyTimeout: ReturnType<typeof setTimeout> | null = null

  public state: ErrorBoundaryState = {
    hasError: false,
    error: null,
    errorInfo: null,
    copied: false,
  }

  public static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo })
    console.error(`[ErrorBoundary] Uncaught error in ${this.props.name || "Component"}:`, error, errorInfo)
  }

  public componentWillUnmount() {
    if (this.copyTimeout) {
      clearTimeout(this.copyTimeout)
    }
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null, copied: false })
  }

  private handleCopy = async () => {
    const componentName = this.props.name || "Component"
    const report = [
      `[AgentOS Error Report] Component: ${componentName}`,
      `Error: ${this.state.error?.message || "Unknown error"}`,
      `Stack: ${this.state.error?.stack || "No stack trace"}`,
      `Component Stack: ${this.state.errorInfo?.componentStack || "N/A"}`,
    ].join("\n\n")

    try {
      if (typeof navigator !== "undefined" && navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(report)
      } else if (typeof document !== "undefined") {
        const textarea = document.createElement("textarea")
        textarea.value = report
        document.body.appendChild(textarea)
        textarea.select()
        document.execCommand("copy")
        document.body.removeChild(textarea)
      }
      this.setState({ copied: true })
      if (this.copyTimeout) clearTimeout(this.copyTimeout)
      this.copyTimeout = setTimeout(() => {
        this.setState({ copied: false })
      }, 2000)
    } catch (e) {
      console.warn("Failed to copy error to clipboard", e)
    }
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      const componentName = this.props.name || "Analytics Component"

      return (
        <Card
          role="alert"
          aria-live="assertive"
          className="border border-chart-error/20 bg-chart-error/5 text-slate-200 p-6 shadow-sm my-4"
        >
          <CardHeader className="p-0 pb-3 flex flex-row items-center gap-3">
            <div className="p-2 rounded-lg bg-chart-error/10 border border-chart-error/20 text-chart-error">
              <AlertTriangle className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold text-red-200">
                Failed to render {componentName}
              </CardTitle>
              <p className="text-xs text-red-400/80 mt-0.5">
                An unexpected runtime error occurred while mounting this widget.
              </p>
            </div>
          </CardHeader>

          <CardContent className="p-0 pt-2 space-y-3">
            {this.state.error?.message && (
              <pre className="text-[11px] font-mono text-red-300 bg-slate-950/60 p-2.5 rounded border border-chart-error/20 overflow-x-auto">
                {this.state.error.message}
              </pre>
            )}

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={this.handleRetry}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-chart-error/20 text-red-200 border border-chart-error/30 hover:bg-chart-error/30 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chart-error"
              >
                <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Retry Component</span>
              </button>

              <button
                type="button"
                onClick={this.handleCopy}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
              >
                {this.state.copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
                    <span className="text-emerald-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                    <span>Report</span>
                  </>
                )}
              </button>
            </div>
          </CardContent>
        </Card>
      )
    }

    return this.props.children
  }
}
