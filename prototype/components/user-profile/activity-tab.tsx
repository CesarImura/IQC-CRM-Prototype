"use client"

import * as React from "react"
import { Calendar, Laptop, Mobile, Screen } from "@carbon/icons-react"

import { accountLogs, activity, engagement, heatmap, sessions, staffLogs, weekdays, type AccountLog, type ActivityEvent } from "@/lib/users/profile"
import { cn } from "@/lib/utils"
import { Badge, DeltaBadge } from "@/registry/iq/ui/badge"
import { Button } from "@/registry/iq/ui/button"
import { Dropdown, TimeFilter } from "@/components/dropdown"
import { createDataTableColumnHelper, DataTable } from "@/registry/iq/ui/data-table"
import { SearchBar } from "@/registry/iq/ui/search-bar"
import { toast } from "@/registry/iq/ui/toast"
import { Toolbar } from "@/registry/iq/ui/toolbar"
import { ValueDate, ValueText } from "@/registry/iq/ui/value-slot"
import { Card, CompactStat, Muted, PeriodPills, Section } from "./shared"

const exportMenu = (count: number, what: string) => (
  <Dropdown
    label="Export"
    placeholder="Export"
    hideLabel
    size="sm"
    align="end"
    search={false}
    value={null}
    options={[{ value: "csv", label: `CSV · ${count} ${what}` }]}
    onValueChange={() => toast.success(`Exported ${count} ${what}`, { description: "CSV downloaded" })}
  />
)

export function ActivityTab() {
  return (
    <div className="flex flex-col gap-8">
      <Engagement />
      <AccountLogs />
      <Timeline />
      <div className="grid gap-4 xl:grid-cols-2">
        <Sessions />
        <StaffLogs />
      </div>
    </div>
  )
}

/* ---------------------------------- Engagement ---------------------------------- */

// Figma (User Profile · Activity → Card · Engagement): 21px days on a 26px pitch, radius 2.27; L0 #1f2221, L1–L4 accent at
// 30 / 50 / 72 / 100%. Stats 108px tall, 24/18 padding, 13px labels, 20px Medium values.
// All = the Figma year calendar · 90 / 60 days = activity by hour · 30 days = one square per day.
const EMPTY_DAY = "#1f2221"
const LEVEL_OPACITY = [1, 0.3, 0.5, 0.72, 1]
const dayStyle = (level: number): React.CSSProperties =>
  level === 0 ? { background: EMPTY_DAY } : { background: "var(--accent)", opacity: LEVEL_OPACITY[level] }

const RANGES = [
  { value: "all", label: "All", days: 365 },
  { value: "90", label: "90D", days: 90 },
  { value: "60", label: "60D", days: 60 },
  { value: "30", label: "30D", days: 30 },
] as const
type RangeValue = (typeof RANGES)[number]["value"]
const DAY_MS = 86_400_000
// Monday of the week of the prototype's "today" (Wed 14 Oct 2026).
const LAST_WEEK_START = Date.UTC(2026, 9, 12)
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
const shortDate = (t: number) => `${String(new Date(t).getUTCDate()).padStart(2, "0")} ${MONTHS[new Date(t).getUTCMonth()]}`
const HOURS = Array.from({ length: 24 }, (_, h) => h)
const noise = (a: number, b: number) => {
  const x = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453
  return x - Math.floor(x)
}

type Day = { t: number; level: number; weekday: number; sessions: number; trades: number }

function Engagement() {
  const [range, setRange] = React.useState<RangeValue>("all")
  const days = RANGES.find((r) => r.value === range)?.days ?? 365

  // One calendar for every range: 52 weeks × 7 days ending this week; shorter ranges read the last N days up to today.
  const weeks = React.useMemo(() => heatmap(), [])
  const starts = weeks.map((_, i) => LAST_WEEK_START - (weeks.length - 1 - i) * 7 * DAY_MS)
  const calendar: Day[] = React.useMemo(
    () =>
      weeks.flatMap((w, wi) =>
        w.map((level, d) => ({
          t: starts[wi] + d * DAY_MS,
          level,
          weekday: d,
          sessions: level ? level * 2 + Math.round(noise(wi, d) * 3) : 0,
          trades: level ? level * 4 + Math.round(noise(d, wi) * 6) : 0,
        }))
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [weeks]
  )
  const todayIndex = (weeks.length - 1) * 7 + 2
  const visible = range === "all" ? calendar : calendar.slice(todayIndex - days + 1, todayIndex + 1)

  const active = visible.filter((d) => d.level > 0)
  let streak = 0
  let best = 0
  let bestEnd = 0
  visible.forEach((d) => {
    streak = d.level > 0 ? streak + 1 : 0
    if (streak > best) {
      best = streak
      bestEnd = d.t
    }
  })
  const byDay = weekdays.map((w, i) => ({ day: w.day, days: active.filter((d) => d.weekday === i).length }))
  const maxDay = Math.max(1, ...byDay.map((d) => d.days))

  const stats =
    range === "all"
      ? engagement
      : [
          { title: "Active days", value: String(active.length), caption: `${Math.round((active.length / days) * 100)}% of the last ${days} days` },
          { title: "Longest streak", value: `${best} days`, caption: best ? `${shortDate(bestEnd - (best - 1) * DAY_MS)} – ${shortDate(bestEnd)}` : "—" },
          { title: `Logins · ${days} days`, value: String(Math.round(active.length * 0.83)), caption: "3 devices · 1 country" },
          { title: `Trading days · ${days} days`, value: String(Math.round(active.length * 0.78)), caption: "across 4 accounts" },
          { title: `Orders · ${days} days`, value: days === 30 ? "1" : "2", caption: days === 30 ? "249.00 $ · renewal" : "338.00 $ · 2 renewals" },
        ]

  const levelLegend = (
    <span className="flex items-center gap-1.5 text-[11px] text-(color:--content-tertiary)">
      Less
      {[0, 1, 2, 3, 4].map((l) => (
        <span key={l} className="size-[11px] rounded-[2px]" style={dayStyle(l)} />
      ))}
      More
    </span>
  )

  return (
    <Section
      title="Engagement"
      actions={
        <>
          <Button variant="secondary" size="sm" onClick={() => document.getElementById("sessions")?.scrollIntoView({ behavior: "smooth" })}>
            View sessions
          </Button>
          <PeriodPills value={range} options={RANGES} onValueChange={setRange} />
        </>
      }
    >
      <Card>
        <div className="flex flex-wrap border-b border-(--border-divider)">
          {stats.map((k) => (
            <CompactStat key={k.title} {...k} />
          ))}
        </div>
        <div key={range} className={cn("flex flex-col px-6 pt-5 pb-5", range === "all" ? "gap-6" : "gap-3")}>
          {range === "all" ? (
            <YearCalendar days={calendar} starts={starts} />
          ) : (
            <DayStrip days={visible} />
          )}
          <div className={cn("flex flex-wrap items-center justify-between gap-4", range !== "all" && "mt-3")}>
            <div className="flex flex-wrap items-center gap-[14px] text-xs leading-4">
              <span className="text-[12.5px] text-(color:--content-tertiary)">Active days by weekday</span>
              {byDay.map((d) => {
                const top = d.days === maxDay
                return (
                  <span key={d.day} className="flex items-center gap-2">
                    <span className="relative h-1.5 w-[34px] overflow-hidden rounded-[3px]" style={{ background: EMPTY_DAY }}>
                      <span
                        className="absolute inset-y-0 left-0 rounded-[3px] bg-(--accent) transition-[width] duration-500"
                        style={{ width: `${(d.days / maxDay) * 100}%`, opacity: top ? 1 : 0.72 }}
                      />
                    </span>
                    <span className={top ? "text-(color:--content-default)" : "text-(color:--content-tertiary)"}>{d.day}</span>
                    <span className="font-medium" style={{ color: top ? "var(--accent)" : "#bbbebd" }}>
                      {d.days}
                    </span>
                  </span>
                )
              })}
            </div>
            {levelLegend}
          </div>
        </div>
      </Card>
    </Section>
  )
}

/* Day tooltip: the DS _Chart / Tooltip (balance range chart) — canvas surface, radius 4, 16px date, items with a 4px
   colour bar, label at 32%, value at 80%. Anchored beside the hovered day (flips near the right edge, sits above it in
   the lower half), glides between days and cross-fades its content. */
const LEVEL_NAMES = ["No activity", "Low", "Medium", "High", "Very high"]
type DayHover = { day: Day; x: number; y: number; w: number; h: number }

function useDayHover() {
  const ref = React.useRef<HTMLDivElement>(null)
  const [hover, setHover] = React.useState<DayHover | null>(null)
  const [last, setLast] = React.useState<DayHover | null>(null)
  const [box, setBox] = React.useState({ width: 0, height: 0 })
  // offset* are in the container's own (unzoomed) pixels, so the tooltip lines up under the 90% UI zoom too.
  const enter = (day: Day) => (e: React.MouseEvent<HTMLElement>) => {
    const el = e.currentTarget
    const next = { day, x: el.offsetLeft, y: el.offsetTop, w: el.offsetWidth, h: el.offsetHeight }
    if (ref.current) setBox({ width: ref.current.offsetWidth, height: ref.current.offsetHeight })
    setHover(next)
    setLast(next)
  }
  const leave = () => setHover(null)
  const tooltip = last && <DayTooltip hover={last} visible={hover !== null} box={box} />
  return { ref, hover, enter, leave, tooltip }
}

function DayTooltip({ hover, visible, box }: { hover: DayHover; visible: boolean; box: { width: number; height: number } }) {
  const flip = hover.x + hover.w + 12 + 210 > box.width
  const below = hover.y + hover.h / 2 < box.height / 2
  const { day } = hover
  const date = new Date(day.t)
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute z-20 transition-[left,top,opacity] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]"
      style={{
        left: flip ? hover.x - 12 : hover.x + hover.w + 12,
        top: below ? hover.y - 4 : hover.y + hover.h + 4,
        opacity: visible ? 1 : 0,
      }}
    >
      <div
        className="flex min-w-[195px] flex-col gap-1.5 rounded-(--chart-tooltip-radius) bg-(--chart-tooltip-bg) px-4 py-3.5 shadow-[0_0_0_1px_var(--border-divider),0_12px_32px_rgba(0,0,0,0.5)] transition-transform duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]"
        style={{
          transform: `translate(${flip ? "-100%" : "0"}, ${below ? "0" : "-100%"}) scale(${visible ? 1 : 0.94})`,
          transformOrigin: `${flip ? "right" : "left"} ${below ? "top" : "bottom"}`,
          animation: "tooltip-pop 260ms cubic-bezier(0.16,1,0.3,1) both",
        }}
      >
        <div key={day.t} className="flex flex-col gap-1.5 [animation:tooltip-swap_220ms_cubic-bezier(0.16,1,0.3,1)_both]">
          <p className="text-base leading-normal whitespace-nowrap text-(color:--chart-tooltip-date)">
            {date.toLocaleDateString("en-GB", { weekday: "short", timeZone: "UTC" })} · {shortDate(day.t)} {date.getUTCFullYear()}
          </p>
          <TooltipItem color={day.level ? `color-mix(in srgb, var(--accent) ${LEVEL_OPACITY[day.level] * 100}%, transparent)` : "#3a3d3c"} label="Activity" value={LEVEL_NAMES[day.level]} />
          <TooltipItem color="var(--chart-series-1)" label="Sessions" value={String(day.sessions)} />
          <TooltipItem color="var(--chart-series-2)" label="Trades" value={String(day.trades)} />
        </div>
      </div>
    </div>
  )
}

function TooltipItem({ color, label, value }: { color: string; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 text-base leading-normal whitespace-nowrap">
      <span aria-hidden="true" className="h-[21px] w-1 shrink-0 rounded-[2px]" style={{ background: color }} />
      <span className="text-(color:--chart-tooltip-label)">{label}</span>
      <span className="ml-auto pl-4 font-medium text-(color:--chart-tooltip-value)">{value}</span>
    </div>
  )
}

/** Hovered day lifts a little and gets a light ring; the rest dims, so the eye lands on it. */
const cellHoverStyle = (level: number, on: boolean, dim: boolean): React.CSSProperties => ({
  ...dayStyle(level),
  ...(dim && level ? { opacity: LEVEL_OPACITY[level] * 0.55 } : null),
  ...(on ? { transform: "scale(1.18)", boxShadow: "0 0 0 1px rgba(255,255,255,0.85)", zIndex: 1, position: "relative" as const } : null),
})

/** All: the Figma year calendar, 52 weeks × 7 days with month labels on top and Mon/Wed/Fri on the left. */
function YearCalendar({ days, starts }: { days: Day[]; starts: number[] }) {
  const { ref, hover, enter, leave, tooltip } = useDayHover()
  return (
    <div
      ref={ref}
      className="relative grid gap-[4px]"
      style={{ gridTemplateColumns: `29px repeat(${starts.length}, minmax(0,1fr))` }}
      role="img"
      aria-label="Active days over the last 12 months"
      onMouseLeave={leave}
    >
      {starts.map((t, i) => {
        const d = new Date(t)
        const prev = i > 0 ? new Date(starts[i - 1]) : null
        if (prev && prev.getUTCMonth() === d.getUTCMonth()) return null
        return (
          <span key={`m${i}`} className="row-start-1 text-[11px] leading-none whitespace-nowrap text-(color:--content-tertiary)" style={{ gridColumnStart: i + 2 }}>
            {MONTHS[d.getUTCMonth()]}
          </span>
        )
      })}
      {["Mon", "Wed", "Fri"].map((d, i) => (
        <span key={d} className="col-start-1 self-center text-[11px] leading-none text-(color:--content-tertiary)" style={{ gridRowStart: 2 + i * 2 }}>
          {d}
        </span>
      ))}
      {days.map((day, i) => {
        const w = Math.floor(i / 7)
        return (
          <span
            key={day.t}
            onMouseEnter={enter(day)}
            className="aspect-square rounded-[2px] transition-[opacity,transform,box-shadow] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]"
            style={{
              gridColumnStart: w + 2,
              gridRowStart: day.weekday + 2,
              ...cellHoverStyle(day.level, hover?.day.t === day.t, hover !== null && hover.day.t !== day.t),
              animation: `cell-in 420ms ${w * 9}ms cubic-bezier(0.16,1,0.3,1) both`,
            }}
          />
        )
      })}
      {tooltip}
    </div>
  )
}

/** 30 / 60 / 90 days: one square per day in rows of 30 (oldest row on top, today last), levels from the year
 *  calendar, tooltip with the day's activity, sessions and trades. Same look for every short range. */
function DayStrip({ days }: { days: Day[] }) {
  const { ref, hover, enter, leave, tooltip } = useDayHover()
  const rows = Array.from({ length: Math.ceil(days.length / 30) }, (_, r) => days.slice(r * 30, r * 30 + 30))
  return (
    <>
      <p className="text-[13px] font-medium text-(color:--content-default)">Active days · last {days.length} days</p>
      <div ref={ref} className="relative flex flex-col gap-[6px]" onMouseLeave={leave}>
        {rows.map((row, r) => (
          <div key={r} className="grid grid-cols-[repeat(30,minmax(0,1fr))] gap-[4px]">
            {row.map((d, c) => (
              <span
                key={d.t}
                onMouseEnter={enter(d)}
                className="aspect-square rounded-[2px] transition-[opacity,transform,box-shadow] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]"
                style={{
                  ...cellHoverStyle(d.level, hover?.day.t === d.t, hover !== null && hover.day.t !== d.t),
                  animation: `cell-in 420ms ${(r * 30 + c) * 8}ms cubic-bezier(0.16,1,0.3,1) both`,
                }}
              />
            ))}
          </div>
        ))}
        <div className="relative h-4 text-[11px] text-(color:--content-tertiary)">
          {rows[rows.length - 1].map((d, i, last) =>
            (i % 7 === 0 && i < last.length - 4) || i === last.length - 1 ? (
              <span key={d.t} className="absolute -translate-x-1/2 whitespace-nowrap" style={{ left: `${((i + 0.5) / 30) * 100}%` }}>
                {i === last.length - 1 ? "Today" : shortDate(d.t)}
              </span>
            ) : null
          )}
        </div>
        {tooltip}
      </div>
    </>
  )
}

/* ---------------------------------- Account logs ---------------------------------- */

const logCol = createDataTableColumnHelper<AccountLog>()
const logColumns = logCol.columns([
  logCol.accessor("account", { header: "Account", size: 190, cell: (i) => <ValueText>{i.getValue()}</ValueText> }),
  logCol.accessor("profit", { header: "Acc. Profits", size: 130, cell: (i) => <DeltaBadge size="sm">{i.getValue()}</DeltaBadge> }),
  logCol.accessor("date", { header: "Date/Time", size: 130, cell: ({ row }) => <ValueDate date={row.original.date} time={row.original.time} /> }),
  logCol.accessor("action", {
    header: "Action",
    size: 120,
    cell: ({ row }) => (
      <Badge color={row.original.actionColor} size="sm">
        {row.original.action}
      </Badge>
    ),
  }),
  logCol.accessor("reason", { header: "Reason", size: 280, cell: (i) => <ValueText>{i.getValue()}</ValueText> }),
  logCol.accessor("rule", { header: "Rule", size: 300, cell: (i) => <ValueText>{i.getValue()}</ValueText> }),
  logCol.accessor("detail", {
    header: "Detail",
    size: 100,
    cell: (i) => (i.getValue() ? <ValueText>{i.getValue()}</ValueText> : <ValueText className="text-(color:--content-disabled)">—</ValueText>),
  }),
])

function AccountLogs() {
  const [search, setSearch] = React.useState("")
  const [action, setAction] = React.useState("all")
  const rows = accountLogs.filter(
    (l) => (action === "all" || l.action === action) && (!search || `${l.account} ${l.reason}`.toLowerCase().includes(search.toLowerCase()))
  )
  return (
    <Section title="Account logs" info="What the risk engine did to this trader’s accounts. Staff actions are in Staff logs.">
      <DataTable
        columns={logColumns}
        data={rows}
        pagination={{ showPageSize: true, pageSizeOptions: [10, 25, 50] }}
        toolbar={
          <Toolbar surface={false} className="w-full"
            filters={
              <>
                <div className="w-60">
                  <SearchBar placeholder="Search account or reason" aria-label="Search account logs" value={search} onValueChange={setSearch} />
                </div>
                <Dropdown
                  label="Action"
                  hideLabel
                  size="sm"
                  search={false}
                  value={action}
                  options={[{ value: "all", label: "All actions" }, ...["Partial flat", "Warning", "Hard breach", "Cleared"].map((a) => ({ value: a, label: a }))]}
                  onValueChange={setAction}
                />
              </>
            }
            actions={exportMenu(rows.length, "logs")}
          />
        }
        emptyState={{ title: "No logs match", description: "Try another search or action." }}
      />
    </Section>
  )
}

/* ---------------------------------- Activity timeline ---------------------------------- */

const evCol = createDataTableColumnHelper<ActivityEvent>()
const evColumns = evCol.columns([
  evCol.accessor("title", {
    header: "Event",
    size: 420,
    cell: ({ row }) => (
      <div className="flex min-w-0 items-start gap-3">
        <span
          className={cn(
            "mt-1.5 size-1.5 shrink-0",
            row.original.tone === "positive" ? "bg-(--status-dot-positive)" : row.original.tone === "negative" ? "bg-(--status-dot-negative)" : "bg-(--status-dot-neutral)"
          )}
        />
        <div className="flex min-w-0 flex-col">
          <ValueText className="font-medium">{row.original.title}</ValueText>
          <span className="truncate text-xs text-(color:--content-muted)">{row.original.detail}</span>
        </div>
      </div>
    ),
  }),
  evCol.accessor("actor", { header: "Actor", size: 160, cell: (i) => <ValueText>{i.getValue()}</ValueText> }),
  evCol.accessor("link", { header: "Linked to", size: 280, cell: (i) => <ValueText>{i.getValue()}</ValueText> }),
  evCol.accessor("date", { header: "When", size: 140, cell: ({ row }) => <ValueDate date={row.original.date} time={row.original.time} /> }),
])

function Timeline() {
  const [kind, setKind] = React.useState("all")
  const [period, setPeriod] = React.useState("12m")
  const [search, setSearch] = React.useState("")
  const rows = activity.filter(
    (e) =>
      (kind === "all" || (kind === "system" ? e.actor === "System" : kind === "staff" ? e.actor.includes("(admin)") : !e.actor.includes("(admin)") && e.actor !== "System")) &&
      (!search || `${e.title} ${e.detail} ${e.link}`.toLowerCase().includes(search.toLowerCase()))
  )
  return (
    <Section title="Activity">
      <DataTable
        columns={evColumns}
        data={rows}
        pagination={{ showPageSize: true, pageSizeOptions: [10, 25, 50] }}
        toolbar={
          <Toolbar surface={false} className="w-full"
            filters={
              <>
                <div className="w-60">
                  <SearchBar placeholder="Search events" aria-label="Search events" value={search} onValueChange={setSearch} />
                </div>
                <Dropdown
                  label="Actor"
                  hideLabel
                  size="sm"
                  search={false}
                  value={kind}
                  options={[
                    { value: "all", label: "All actions" },
                    { value: "trader", label: "By the trader" },
                    { value: "system", label: "By the system" },
                    { value: "staff", label: "By staff" },
                  ]}
                  onValueChange={setKind}
                />
                <TimeFilter
                  label="Period"
                  icon={<Calendar />}
                  options={[
                    { value: "all", label: "All time" },
                    { value: "30d", label: "Last 30 days" },
                    { value: "90d", label: "Last 90 days" },
                    { value: "12m", label: "Last 12 months" },
                  ]}
                  value={period}
                  onValueChange={setPeriod}
                />
              </>
            }
            actions={exportMenu(rows.length, "events")}
          />
        }
        emptyState={{ title: "No events match", description: "Try another search or filter." }}
      />
    </Section>
  )
}

/* ---------------------------------- Sessions and staff logs ---------------------------------- */

const deviceIcon = { laptop: <Laptop size={20} />, phone: <Mobile size={20} />, desktop: <Screen size={20} /> }

function Sessions() {
  const [filter, setFilter] = React.useState("all")
  const rows = sessions.filter((s) => filter === "all" || s.meta.includes("new"))
  return (
    <Section
      title="Sessions & devices"
      actions={
        <Dropdown
          label="Sessions"
          hideLabel
          size="sm"
          align="end"
          search={false}
          value={filter}
          options={[
            { value: "all", label: "All" },
            { value: "new", label: "New devices and countries" },
          ]}
          onValueChange={setFilter}
        />
      }
    >
      <Card id="sessions" className="flex flex-1 flex-col divide-y divide-(--border-grid)">
        {rows.map((s, i) => (
          <div key={i} className="flex flex-1 items-center gap-3 px-4 py-4">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-[2px] border border-(--border-grid) text-(color:--content-secondary)">
              {deviceIcon[s.kind]}
            </span>
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="text-sm text-(color:--content-default)">{s.device}</span>
              <Muted className="truncate">{s.meta}</Muted>
            </div>
            <Muted className="shrink-0">{s.when}</Muted>
          </div>
        ))}
      </Card>
    </Section>
  )
}

function StaffLogs() {
  const [role, setRole] = React.useState("all")
  const rows = staffLogs.filter((l) => role === "all" || l.role === role)
  return (
    <Section
      title="Staff logs"
      info="What the team did on this profile, newest first."
      actions={
        <Dropdown
          label="Role"
          hideLabel
          size="sm"
          align="end"
          search={false}
          value={role}
          options={[
            { value: "all", label: "All" },
            { value: "Owner", label: "Owner" },
            { value: "Admin", label: "Admin" },
          ]}
          onValueChange={setRole}
        />
      }
    >
      <Card className="flex flex-1 flex-col divide-y divide-(--border-grid)">
        {rows.map((l) => (
          <div key={l.title + l.date} className="flex flex-1 items-center justify-between gap-3 px-4 py-4">
            <div className="flex min-w-0 flex-col gap-1">
              <span className="text-sm text-(color:--content-default)">{l.title}</span>
              <span className="flex min-w-0 items-center gap-2">
                <Badge color={l.role === "Owner" ? "purple" : "blue"} size="sm">
                  {l.role}
                </Badge>
                <Muted className="truncate">{l.detail}</Muted>
              </span>
            </div>
            <Muted className="shrink-0">{l.date}</Muted>
          </div>
        ))}
      </Card>
    </Section>
  )
}
