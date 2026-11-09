import React from "react"
import { AppShell } from "@/components/layout/AppShell"

export default function CommandsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AppShell>{children}</AppShell>
}

