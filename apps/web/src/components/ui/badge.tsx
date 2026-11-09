import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-950",
  {
    variants: {
      variant: {
        default:
          "border-blue-500/30 bg-blue-600/15 text-blue-400 hover:bg-blue-600/25",
        secondary:
          "border-slate-800 bg-slate-800/80 text-slate-300 hover:bg-slate-700/80",
        destructive:
          "border-red-500/30 bg-red-600/15 text-red-400 hover:bg-red-600/25",
        success:
          "border-emerald-500/30 bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25",
        warning:
          "border-amber-500/30 bg-amber-500/15 text-amber-400 hover:bg-amber-500/25",
        outline: "text-slate-300 border-slate-700 bg-transparent hover:bg-slate-800/40",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }

