"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

// Logo loader: the IQ mark drawn as a grid of small squares that twinkle in the accent color, each on its own rhythm
// (same motion as the old dot-matrix loader). The mark is two ring arcs (Figma app icon, 40×40 box): a "C" around
// (19.72, 20) open at the bottom right, and a tail around (30.33, 20) closing it. Pure math, so server and client agree.
const GRID = 15
const CELL = 6
const GAP = 2
const X0 = 9.67
const Y0 = 10
const STEP = 20.66 / GRID
const ring = (x: number, y: number, cx: number, cy: number) => {
  const r = Math.hypot(x - cx, y - cy)
  return r <= 10 && r >= 5.28
}
const inMark = (x: number, y: number) =>
  (ring(x, y, 19.72, 20) && !(x > 19.72 && y > 20)) || (ring(x, y, 30.33, 20) && x < 30.33 && y > 20)
const rand = (i: number) => {
  const x = Math.sin(i * 91.17 + 7.31) * 10000
  return x - Math.floor(x)
}
const CELLS = Array.from({ length: GRID * GRID }, (_, i) => {
  const c = i % GRID
  const r = Math.floor(i / GRID)
  return { i, c, r, on: inMark(X0 + (c + 0.5) * STEP, Y0 + (r + 0.5) * STEP - (STEP * GRID - 20) / 2) }
}).filter((p) => p.on)

export function DotLoader({ label = "Loading", className }: { label?: string; className?: string }) {
  const size = GRID * CELL + (GRID - 1) * GAP
  return (
    <div role="status" aria-live="polite" className={cn("flex flex-col items-center gap-5", className)}>
      <div className="relative" style={{ width: size, height: size }} aria-hidden="true">
        {CELLS.map(({ i, c, r }) => (
          <span
            key={i}
            className="absolute rounded-[1px] bg-(--accent)"
            style={{
              width: CELL,
              height: CELL,
              left: c * (CELL + GAP),
              top: r * (CELL + GAP),
              animation: `logo-twinkle ${900 + Math.round(rand(i) * 900)}ms ease-in-out ${-Math.round(rand(i + 99) * 1800)}ms infinite`,
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
