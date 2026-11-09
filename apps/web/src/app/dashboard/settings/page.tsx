import React from "react"
import { EmptyState } from "@/components/shared/EmptyState"

export default function SettingsPage() {
  return (
    <EmptyState
      title="Platform Settings"
      description="Configure local paths, Beacon endpoint addresses, and database sync options."
      sprint="Sprint 0.2"
    />
  )
}

