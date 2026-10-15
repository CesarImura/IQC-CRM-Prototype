"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

// Dot-matrix loader (reference: loading video): two rows of small dots that twinkle in the accent color, each dot on
// its own rhythm. Deterministic delays so server and client render the same markup.
const COLS = 28
const ROWS = 2
const rand = (i: number) => {
  const x = Math.sin(i * 91.17 + 7.31) * 10000
  return x - Math.floor(x)
}

export function DotLoader({ label = "Loading", className }: { label?: string; className?: string }) {
  return (
    <div role="status" aria-live="polite" className={cn("flex flex-col items-center gap-4", className)}>
      <div className="grid gap-[5px]" style={{ gridTemplateColumns: `repeat(${COLS}, 5px)` }} aria-hidden="true">
        {Array.from({ length: COLS * ROWS }, (_, i) => (
          <span
            key={i}
            className="size-[5px] rounded-full bg-(--accent)"
            style={{
              animation: `dot-twinkle ${900 + Math.round(rand(i) * 900)}ms ease-in-out ${-Math.round(rand(i + 99) * 1800)}ms infinite`,
            }}
          />
        ))}
      </div>
      <span className="text-xs text-(color:--content-tertiary)">{label}</span>
    </div>
  )
}

/** Full-screen loader on a page load: rendered in the server HTML, fades out once the app is interactive. */
export function BootLoader() {
  const [state, setState] = React.useState<"on" | "leaving" | "off">("on")
  React.useEffect(() => {
    const leave = window.setTimeout(() => setState("leaving"), 650)
    const off = window.setTimeout(() => setState("off"), 1050)
    return () => {
      window.clearTimeout(leave)
      window.clearTimeout(off)
    }
  }, [])
  if (state === "off") return null
  return (
    <div
      className={cn(
        "fixed inset-0 z-[100] flex items-center justify-center bg-(--surface-canvas) transition-opacity duration-400 ease-out",
        state === "leaving" && "pointer-events-none opacity-0"
      )}
    >
      <DotLoader label="Loading IQ Capital Admin" />
    </div>
  )
}
