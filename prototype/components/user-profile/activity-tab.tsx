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
import { Tabs, TabsPillList, TabsPillTrigger } from "@/registry/iq/ui/tabs"
import { toast } from "@/registry/iq/ui/toast"
import { Toolbar } from "@/registry/iq/ui/toolbar"
import { ValueDate, ValueText } from "@/registry/iq/ui/value-slot"
import { Card, CompactStat, Muted, Section } from "./shared"

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
  { value: "90", label: "90 days", days: 90 },
  { value: "60", label: "60 days", days: 60 },
  { value: "30", label: "30 days", days: 30 },
] as const
type RangeValue = (typeof RANGES)[number]["value"]
const DAY_MS = 86_400_000
// Monday of the week of the prototype's "today" (Wed 14 Oct 2026).
const LAST_WEEK_START = Date.UTC(2026, 9, 12)
const shortDate = (t: number) => new Date(t).toLocaleDateString("en-GB", { day: "2-digit", month: "short", timeZone: "UTC" })
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
          <Tabs value={range} onValueChange={(v) => setRange(v as RangeValue)}>
            <TabsPillList size="sm" aria-label="Period">
              {RANGES.map((r) => (
                <TabsPillTrigger key={r.value} value={r.value}>
                  {r.label}
                </TabsPillTrigger>
              ))}
            </TabsPillList>
          </Tabs>
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
            <YearCalendar weeks={weeks} starts={starts} />
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

/** All: the Figma year calendar, 52 weeks × 7 days with month labels on top and Mon/Wed/Fri on the left. */
function YearCalendar({ weeks, starts }: { weeks: number[][]; starts: number[] }) {
  return (
    <div
      className="grid gap-[4px]"
      style={{ gridTemplateColumns: `29px repeat(${weeks.length}, minmax(0,1fr))` }}
      role="img"
      aria-label="Active days over the last 12 months"
    >
      {starts.map((t, i) => {
        const d = new Date(t)
        const prev = i > 0 ? new Date(starts[i - 1]) : null
        if (prev && prev.getUTCMonth() === d.getUTCMonth()) return null
        return (
          <span key={`m${i}`} className="row-start-1 text-[11px] leading-none whitespace-nowrap text-(color:--content-tertiary)" style={{ gridColumnStart: i + 2 }}>
            {d.toLocaleDateString("en-GB", { month: "short", timeZone: "UTC" })}
          </span>
        )
      })}
      {["Mon", "Wed", "Fri"].map((d, i) => (
        <span key={d} className="col-start-1 self-center text-[11px] leading-none text-(color:--content-tertiary)" style={{ gridRowStart: 2 + i * 2 }}>
          {d}
        </span>
      ))}
      {weeks.flatMap((week, w) =>
        week.map((level, d) => (
          <span
            key={`${w}-${d}`}
            title={`${shortDate(starts[w] + d * DAY_MS)} · ${level ? "active" : "no activity"}`}
            className="aspect-square rounded-[2px]"
            style={{ gridColumnStart: w + 2, gridRowStart: d + 2, ...dayStyle(level), animation: `cell-in 420ms ${w * 9}ms cubic-bezier(0.16,1,0.3,1) both` }}
          />
        ))
      )}
    </div>
  )
}

const tooltipClass =
  "pointer-events-none absolute top-full z-10 mt-1 w-[168px] -translate-x-1/2 rounded-[4px] border border-(--option-panel-border) bg-(--option-panel-bg) p-3 shadow-[0_8px_24px_rgba(0,0,0,0.45)] backdrop-blur-(--option-panel-blur) transition-[left] duration-150 ease-out"

/** 90 / 60 days: one band per series, 24 contiguous hour cells, tooltip on hover (reference: activity heatmap video). */
/** 30 / 60 / 90 days: one square per day in rows of 30 (oldest row on top, today last), levels from the year
 *  calendar, tooltip with the day's sessions and trades. Same look for every short range. */
function DayStrip({ days }: { days: Day[] }) {
  const [hover, setHover] = React.useState<{ r: number; c: number } | null>(null)
  const weekday = (t: number) => new Date(t).toLocaleDateString("en-GB", { weekday: "short", timeZone: "UTC" })
  const rows = Array.from({ length: Math.ceil(days.length / 30) }, (_, r) => days.slice(r * 30, r * 30 + 30))
  const hovered = hover ? rows[hover.r][hover.c] : null
  return (
    <>
      <p className="text-[13px] font-medium text-(color:--content-default)">Active days · last {days.length} days</p>
      <div className="flex flex-col gap-[6px]" onMouseLeave={() => setHover(null)}>
        {rows.map((row, r) => (
          <div key={r} className="relative">
            <div className="grid grid-cols-[repeat(30,minmax(0,1fr))] gap-[4px]">
              {row.map((d, c) => {
                const on = hover?.r === r && hover.c === c
                return (
                  <span
                    key={d.t}
                    onMouseEnter={() => setHover({ r, c })}
                    className="aspect-square rounded-[2px] transition-[opacity,box-shadow] duration-200 ease-out"
                    style={{
                      ...dayStyle(d.level),
                      ...(hover && !on && d.level ? { opacity: LEVEL_OPACITY[d.level] * 0.55 } : null),
                      boxShadow: on ? "inset 0 0 0 1px rgba(255,255,255,0.7)" : undefined,
                      animation: `cell-in 420ms ${(r * 30 + c) * 8}ms cubic-bezier(0.16,1,0.3,1) both`,
                    }}
                  />
                )
              })}
            </div>
            {on(hover, r) && hovered && (
              <div role="tooltip" className={cn(tooltipClass, "mt-1")} style={{ left: `${((hover!.c + 0.5) / 30) * 100}%` }}>
                <p className="flex items-center justify-between text-xs text-(color:--content-secondary)">
                  Sessions <span className="font-medium text-(color:--content-default)">{hovered.sessions}</span>
                </p>
                <p className="flex items-center justify-between text-xs text-(color:--content-secondary)">
                  Trades <span className="font-medium text-(color:--content-default)">{hovered.trades}</span>
                </p>
                <p className="mt-2 flex justify-between border-t border-(--border-divider) pt-2 text-[11px] text-(color:--content-tertiary)">
                  {weekday(hovered.t)}
                  <span>{shortDate(hovered.t)}</span>
                </p>
              </div>
            )}
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
      </div>
    </>
  )
}

const on = (hover: { r: number } | null, r: number) => hover !== null && hover.r === r

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
