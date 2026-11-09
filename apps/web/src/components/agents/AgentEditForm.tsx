"use client"

import React, { useState } from "react"
import { motion } from "framer-motion"
import { AgentConfig, updateAgent } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Toast } from "@/components/ui/toast"
import { DataTooltip } from "@/components/shared/DataTooltip"
import { ErrorBoundary } from "@/components/shared/ErrorBoundary"
import { fadeIn } from "@/lib/animations"
import { useReducedMotion } from "@/hooks/useReducedMotion"
import { Save, X, Loader2, HelpCircle } from "lucide-react"

export interface AgentEditFormProps {
  agent: AgentConfig
  onSaveSuccess: (updated: AgentConfig) => void
  onCancel: () => void
}

function AgentEditFormContent({ agent, onSaveSuccess, onCancel }: AgentEditFormProps) {
  const prefersReduced = useReducedMotion()

  const [description, setDescription] = useState(agent.description)
  const [toolsString, setToolsString] = useState(agent.tools.join(", "))
  const [isSaving, setIsSaving] = useState(false)
  const [toastNotification, setToastNotification] = useState<{
    title: string
    description?: string
    variant: "default" | "destructive" | "success"
  } | null>(null)

  const trimmedDesc = description.trim()
  const parsedTools = toolsString
    .split(",")
    .map((t) => t.trim())
    .filter((t) => t.length > 0)

  const isDescValid = trimmedDesc.length > 0
  const isToolsValid = parsedTools.length > 0
  const isFormValid = isDescValid && isToolsValid

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isFormValid || isSaving) return

    setIsSaving(true)
    setToastNotification(null)

    try {
      const updated = await updateAgent(agent.name, {
        description: trimmedDesc,
        tools: parsedTools,
      })
      setToastNotification({
        title: "Agent saved",
        description: `Configuration for ${agent.name} was successfully updated.`,
        variant: "success",
      })
      onSaveSuccess(updated)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to update agent"
      setToastNotification({
        title: `Save failed: ${errorMsg}`,
        description: errorMsg,
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setDescription(agent.description)
    setToolsString(agent.tools.join(", "))
    setToastNotification(null)
    onCancel()
  }

  return (
    <motion.form
      onSubmit={handleSave}
      variants={prefersReduced ? undefined : fadeIn}
      initial={prefersReduced ? undefined : "hidden"}
      animate={prefersReduced ? undefined : "visible"}
      className="space-y-5"
      noValidate
    >
      {/* Toast Notification Banner */}
      {toastNotification && (
        <Toast
          title={toastNotification.title}
          description={toastNotification.description}
          variant={toastNotification.variant}
          onClose={() => setToastNotification(null)}
        />
      )}

      {/* Description Field */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label
            htmlFor="agent-edit-description"
            className="text-xs font-mono font-medium text-slate-300 uppercase tracking-wider"
          >
            Description
          </label>
          <span className="text-[11px] text-slate-500 font-mono">Required</span>
        </div>
        <Textarea
          id="agent-edit-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe the agent's role, system instructions, and boundaries..."
          rows={4}
          disabled={isSaving}
          aria-invalid={!isDescValid}
          aria-describedby={!isDescValid ? "desc-error" : undefined}
          className="font-sans text-sm"
        />
        {!isDescValid && (
          <p id="desc-error" className="text-xs text-red-400">
            Description must not be empty.
          </p>
        )}
      </div>

      {/* Tools Field */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <label
              htmlFor="agent-edit-tools"
              className="text-xs font-mono font-medium text-slate-300 uppercase tracking-wider"
            >
              Tools
            </label>
            <DataTooltip content="Comma-separated list of tool names (e.g. Read, Write, Bash)">
              <span className="inline-flex items-center text-slate-400 hover:text-slate-300 cursor-help">
                <HelpCircle className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="sr-only">Tool input help</span>
              </span>
            </DataTooltip>
          </div>
          <span className="text-[11px] text-slate-500 font-mono">
            {parsedTools.length} {parsedTools.length === 1 ? "tool" : "tools"}
          </span>
        </div>
        <Input
          id="agent-edit-tools"
          type="text"
          value={toolsString}
          onChange={(e) => setToolsString(e.target.value)}
          placeholder="Read, Write, Bash"
          disabled={isSaving}
          aria-invalid={!isToolsValid}
          aria-describedby={!isToolsValid ? "tools-error" : undefined}
          className="font-mono text-xs"
        />
        {!isToolsValid && (
          <p id="tools-error" className="text-xs text-red-400">
            At least one tool is required.
          </p>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleCancel}
          disabled={isSaving}
          aria-label="Cancel editing agent config"
          className="h-8 px-3 text-xs border-slate-800 bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
        >
          <X className="h-3.5 w-3.5 mr-1.5 text-slate-400" aria-hidden="true" />
          <span>Cancel</span>
        </Button>

        <Button
          type="submit"
          size="sm"
          disabled={!isFormValid || isSaving}
          aria-label="Save agent config"
          className="h-8 px-4 text-xs bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors disabled:opacity-50"
        >
          {isSaving ? (
            <>
              <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" aria-hidden="true" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <Save className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
              <span>Save Changes</span>
            </>
          )}
        </Button>
      </div>
    </motion.form>
  )
}

export function AgentEditForm(props: AgentEditFormProps) {
  return (
    <ErrorBoundary name="AgentEditForm">
      <AgentEditFormContent {...props} />
    </ErrorBoundary>
  )
}

