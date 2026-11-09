"use client"

import React, { ReactNode } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Construction } from "lucide-react"
import { slideUp } from "@/lib/animations"
import { useReducedMotion } from "@/hooks/useReducedMotion"

export interface EmptyStateProps {
  title: string
  description: string
  sprint?: string
  icon?: ReactNode
  actionLabel?: string
  onAction?: () => void
}

export function EmptyState({
  title,
  description,
  sprint,
  icon,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  const prefersReduced = useReducedMotion()

  return (
    <motion.div
      variants={prefersReduced ? undefined : slideUp}
      initial="hidden"
      animate="visible"
      className="w-full"
    >
      <Card className="border-slate-800 bg-slate-900/40 text-center py-12 px-4 max-w-2xl mx-auto mt-6 sm:mt-10 shadow-sm">
        <CardHeader className="flex flex-col items-center">
          <div
            className="h-12 w-12 rounded-full bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-3"
            aria-hidden="true"
          >
            {icon ? icon : <Construction className="h-6 w-6" />}
          </div>
          <CardTitle className="text-xl sm:text-2xl text-white font-semibold tracking-tight">
            {title}
          </CardTitle>
          <CardDescription className="text-slate-300 max-w-md mx-auto text-sm mt-1.5 leading-relaxed">
            {description}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          {sprint && (
            <div className="inline-flex items-center gap-2 text-xs font-mono text-blue-400 bg-blue-950/60 border border-blue-800/60 px-3 py-1.5 rounded-full font-medium">
              <span>Scheduled for:</span>
              <span className="font-semibold text-white">{sprint}</span>
            </div>
          )}
          {actionLabel && onAction && (
            <button
              type="button"
              onClick={onAction}
              className="mt-2 text-xs font-medium text-blue-400 hover:text-blue-300 underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              {actionLabel}
            </button>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
