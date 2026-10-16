import * as React from "react"

import { cn } from "@/lib/utils"
import { Badge } from "@/registry/iq/ui/badge"
import { Tabs, TabsPillList, TabsPillTrigger } from "@/registry/iq/ui/tabs"
import { InformationFilled } from "@carbon/icons-react"
import { Tooltip } from "@/registry/iq/ui/tooltip"
import { Dropdown } from "@/components/dropdown"

// Section pattern of the detail screens (reference: User Profile · Activity): Medium 18 title outside the card,
// actions on the right, card = surface/raised + 1px border/grid, radius 4.

export function Section({
  title,
  info,
  actions,
  swipe = false,
  children,
  className,
}: {
  title: React.ReactNode
  info?: string
  actions?: React.ReactNode
  /** Mobile (Figma Subscriptions 3391:95988): the action buttons get their own row under the title, edge to edge,
   *  and swipe sideways with no scrollbar; buttons that don't fit hide past the screen edge. */
  swipe?: boolean
  children: React.ReactNode
  className?: string
}) {
  return (
    <section data-reveal className={cn("flex min-w-0 flex-col gap-3", className)}>
      <div className="flex min-h-8 flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h2 className="text-lg leading-[1.3] font-medium text-(color:--content-default)">{title}</h2>
          {info && <InfoTip text={info} />}
        </div>
        {actions && (
          <div
            className={cn(
              "flex flex-wrap items-center gap-2",
              swipe && "max-lg:[scrollbar-width:none] max-lg:[&::-webkit-scrollbar]:hidden max-lg:-mx-4 max-lg:basis-[calc(100%+2rem)] max-lg:flex-nowrap max-lg:overflow-x-auto max-lg:px-4 max-lg:[&>*]:shrink-0"
            )}
          >
            {actions}
          </div>
        )}
      </div>
      {children}
    </section>
  )
}

/** Info icon of the section titles (Figma: filled, not outline; lights up on hover). The bubble stays the DS white
 *  Tooltip. Desktop opens on hover/focus; on touch a tap toggles it and a tap anywhere else closes it.
 *  Differs from the DS (outline PageHeaderInfoIcon, hover only) — on the audit list. */
export function InfoTip({ text }: { text: string }) {
  const [open, setOpen] = React.useState(false)
  const ref = React.useRef<HTMLButtonElement>(null)
  React.useEffect(() => {
    if (!open) return
    const close = (e: PointerEvent) => !ref.current?.contains(e.target as Node) && setOpen(false)
    document.addEventListener("pointerdown", close)
    return () => document.removeEventListener("pointerdown", close)
  }, [open])
  return (
    <Tooltip content={text} open={open} onOpenChange={setOpen}>
      <button
        ref={ref}
        type="button"
        aria-label={text}
        data-open={open || undefined}
        onClick={() => setOpen((o) => !o)}
        className="flex cursor-pointer rounded-full text-(color:--page-header-info) outline-none transition-colors duration-150 hover:text-white/80 focus-visible:shadow-[0_0_0_var(--focus-spread)_var(--focus-ring)] data-open:text-white/80"
      >
        <InformationFilled size={16} />
      </button>
    </Tooltip>
  )
}

export function Card({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("min-w-0 rounded-[4px] border border-(--border-divider) bg-(--surface-raised)", className)} {...props} />
}

/** Stat of the profile bands (Figma Stat · Net amount / Collected / Active days): 108px, 24/18/20 padding,
 *  13px label and caption, 20px Medium value. Neighbours share a 1px divider. */
export function CompactStat({
  title,
  value,
  caption,
  tone,
}: {
  title: React.ReactNode
  value: React.ReactNode
  caption?: React.ReactNode
  tone?: "positive" | "negative"
}) {
  return (
    <div data-slot="compact-stat" className="flex min-h-[110px] min-w-0 flex-1 flex-col justify-center gap-1 px-6 pt-[18px] pb-5 [&:not(:first-child)]:border-l [&:not(:first-child)]:border-(--border-divider)">
      <span className="truncate text-[13px] leading-[17px] text-(color:--content-tertiary)">{title}</span>
      <span
        className={cn(
          "truncate text-xl leading-[1.3] font-medium text-(color:--content-default)",
          tone === "positive" && "text-(color:--stat-card-value-positive)",
          tone === "negative" && "text-(color:--stat-card-value-negative)"
        )}
      >
        {value}
      </span>
      {caption && <span className="truncate text-[13px] leading-[17px] text-(color:--content-tertiary)">{caption}</span>}
    </div>
  )
}

/** Label over value, as in the profile cards. */
export function Stat({
  label,
  value,
  caption,
  tone,
  className,
}: {
  label: React.ReactNode
  value: React.ReactNode
  caption?: React.ReactNode
  tone?: "positive" | "negative"
  className?: string
}) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-1", className)}>
      <span className="text-xs leading-normal text-(color:--content-muted)">{label}</span>
      <span
        className={cn(
          "truncate text-sm leading-normal font-medium text-(color:--content-default)",
          tone === "positive" && "text-(color:--stat-card-value-positive)",
          tone === "negative" && "text-(color:--stat-card-value-negative)"
        )}
      >
        {value}
      </span>
      {caption && <span className="truncate text-xs leading-normal text-(color:--content-muted)">{caption}</span>}
    </div>
  )
}

export function Muted({ className, ...props }: React.ComponentProps<"span">) {
  return <span className={cn("text-xs leading-normal text-(color:--content-muted)", className)} {...props} />
}

export const typeBadge = { Challenge: "green", Funding: "blue", Breached: "red", Reset: "yellow", Passed: "yellow" } as const

export function TypeBadge({ type }: { type: keyof typeof typeBadge }) {
  return (
    <Badge color={typeBadge[type]} size="sm">
      {type}
    </Badge>
  )
}

/** Limit bar: continuous track that ends at the limit. Accent for targets, red when close to breaching. */
export function LimitBar({ pct, tone = "neutral" }: { pct: number; tone?: "accent" | "danger" | "neutral" }) {
  return (
    <div className="h-1 w-full overflow-hidden bg-(--chart-ring-track)">
      <div
        className={cn(
          "h-full",
          tone === "accent" && "bg-(--chart-series-1)",
          tone === "danger" && "bg-(--chart-series-3)",
          tone === "neutral" && "bg-(--chart-neutral-line)"
        )}
        style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
      />
    </div>
  )
}

/** Period switch for charts: Tab Pill sm (same 32px height as the sm buttons), every pill the same width. Labels "All", "YTD", "90D"… */
// Long names for the mobile dropdown (the pills keep All / YTD / 90D …).
const periodLong = (label: string) =>
  label === "All" ? "All time" : label === "YTD" ? "This year" : /^(\d+)D$/.test(label) ? `Last ${label.slice(0, -1)} days` : label

/** Period selector: Tab Pill on desktop; on mobile (Figma 3338:13713) a Dropdown trigger ("This year ⌄"). */
export function PeriodPills<T extends string>({ value, options, onValueChange }: { value: T; options: readonly { value: T; label: string }[]; onValueChange: (v: T) => void }) {
  return (
    <>
      <span className="lg:hidden">
        <Dropdown
          label="Period"
          hideLabel
          search={false}
          align="end"
          options={options.map((o) => ({ value: o.value, label: periodLong(o.label) }))}
          value={value}
          onValueChange={(v) => onValueChange(v as T)}
        />
      </span>
      <Tabs value={value} onValueChange={(v) => onValueChange(v as T)} className="max-lg:hidden">
        <TabsPillList size="sm" aria-label="Period">
          {options.map((o) => (
            <TabsPillTrigger key={o.value} value={o.value} className="w-13 px-0">
              {o.label}
            </TabsPillTrigger>
          ))}
        </TabsPillList>
      </Tabs>
    </>
  )
}
