"use client"

import * as React from "react"
import { Calendar, Laptop, Mobile, Screen } from "@carbon/icons-react"

import { accountLogs, activity, engagement, sessions, staffLogs, weekdays, type AccountLog, type ActivityEvent } from "@/lib/users/profile"
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
const EMPTY_DAY = "#1f2221"

const RANGES = [
  { value: "all", label: "All", days: 365 },
  { value: "90", label: "90 days", days: 90 },
  { value: "60", label: "60 days", days: 60 },
  { value: "30", label: "30 days", days: 30 },
] as const
type RangeValue = (typeof RANGES)[number]["value"]
const HOURS = Array.from({ length: 24 }, (_, h) => h)

// Hour-of-day activity for the trader (logins, trades) and for staff (actions on this profile), in UTC.
// Deterministic so the chart doesn't change between renders.
function hourly(days: number) {
  const bump = (h: number, center: number, width: number) => Math.exp(-((h - center) ** 2) / (2 * width ** 2))
  const noise = (h: number, s: number) => {
    const x = Math.sin(h * 12.9898 + s * 78.233) * 43758.5453
    return x - Math.floor(x)
  }
  const scale = days / 30
  return {
    trader: HOURS.map((h) => Math.round((bump(h, 14, 3.2) * 40 + bump(h, 21, 1.6) * 12 + noise(h, 1) * 4) * scale)),
    staff: HOURS.map((h) => Math.round((h >= 8 && h <= 19 ? bump(h, 12.5, 2.6) * 22 + noise(h, 2) * 3 : noise(h, 3) * 1.2) * scale)),
  }
}

const SERIES = [
  { key: "trader", label: "Trader", color: "var(--accent)" },
  { key: "staff", label: "Staff", color: "var(--status-dot-info)" },
] as const

function Engagement() {
  const [range, setRange] = React.useState<RangeValue>("all")
  const [hover, setHover] = React.useState<number | null>(null)
  const days = RANGES.find((r) => r.value === range)?.days ?? 365
  const data = React.useMemo(() => hourly(days), [days])
  const max = Math.max(...data.trader, ...data.staff, 1)
  const peak = data.trader.indexOf(Math.max(...data.trader))

  const stats =
    range === "all"
      ? engagement
      : [
          { title: "Active days", value: String(Math.round(days * 0.71)), caption: `71% of the last ${days} days` },
          { title: "Busiest hour", value: `${String(peak).padStart(2, "0")}:00 UTC`, caption: `${data.trader[peak]} sessions in that hour` },
          { title: `Logins · ${days} days`, value: String(Math.round(days * 0.62)), caption: "3 devices · 1 country" },
          { title: `Trading days · ${days} days`, value: String(Math.round(days * 0.58)), caption: "across 4 accounts" },
          { title: `Orders · ${days} days`, value: days === 30 ? "1" : "2", caption: days === 30 ? "249.00 $ · renewal" : "338.00 $ · 2 renewals" },
        ]

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
        <div className="flex flex-col gap-3 px-6 pt-5 pb-5">
          <div className="flex items-center justify-between">
            <p className="text-[13px] font-medium text-(color:--content-default)">Activity by hour · UTC</p>
            <div className="flex items-center gap-4 text-xs text-(color:--content-tertiary)">
              {SERIES.map((s) => (
                <span key={s.key} className="flex items-center gap-2">
                  <span className="size-2 rounded-[2px]" style={{ background: s.color }} />
                  {s.label}
                </span>
              ))}
            </div>
          </div>
          {/* Heatmap (reference: activity heatmap video): one band per series, 24 contiguous hour cells, tooltip on hover. */}
          <div className="relative grid grid-cols-[56px_minmax(0,1fr)] gap-x-3 gap-y-1.5" onMouseLeave={() => setHover(null)}>
            {SERIES.map((s) => (
              <React.Fragment key={s.key}>
                <span className="self-center text-xs text-(color:--content-tertiary)">{s.label}</span>
                <div className="flex h-6 overflow-hidden rounded-[3px]">
                  {HOURS.map((h) => {
                    const v = data[s.key][h]
                    const strength = 0.07 + (v / max) * 0.93
                    return (
                      <span
                        key={h}
                        onMouseEnter={() => setHover(h)}
                        className="relative flex-1 transition-[opacity,box-shadow] duration-200 ease-out"
                        style={{
                          background: s.color,
                          opacity: hover === null ? strength : hover === h ? 1 : strength * 0.55,
                          boxShadow: hover === h ? "inset 0 0 0 1px rgba(255,255,255,0.7)" : undefined,
                          animation: `heat-in 500ms ${h * 18}ms cubic-bezier(0.16,1,0.3,1) both`,
                        }}
                      />
                    )
                  })}
                </div>
              </React.Fragment>
            ))}
            <span />
            <div className="relative h-4 text-[11px] text-(color:--content-tertiary)">
              {[0, 3, 6, 9, 12, 15, 18, 21].map((h) => (
                <span key={h} className="absolute -translate-x-1/2" style={{ left: `${((h + 0.5) / 24) * 100}%` }}>
                  {h}
                </span>
              ))}
            </div>
            {hover !== null && (
              <div
                role="tooltip"
                className="pointer-events-none absolute top-full z-10 mt-1 w-[168px] -translate-x-1/2 rounded-[4px] border border-(--option-panel-border) bg-(--option-panel-bg) p-3 shadow-[0_8px_24px_rgba(0,0,0,0.45)] backdrop-blur-(--option-panel-blur) transition-[left] duration-150 ease-out"
                style={{ left: `calc(68px + (100% - 68px) * ${(hover + 0.5) / 24})` }}
              >
                {SERIES.map((s) => (
                  <p key={s.key} className="flex items-center justify-between text-xs text-(color:--content-secondary)">
                    {s.label}
                    <span className="flex items-center gap-2 font-medium text-(color:--content-default)">
                      {data[s.key][hover]}
                      <span className="size-1.5 rounded-full" style={{ background: s.color }} />
                    </span>
                  </p>
                ))}
                <p className="mt-2 flex justify-between border-t border-(--border-divider) pt-2 text-[11px] text-(color:--content-tertiary)">
                  {range === "all" ? "Last 12 months" : `Last ${days} days`}
                  <span>
                    {String(hover).padStart(2, "0")}:00–{String((hover + 1) % 24).padStart(2, "0")}:00
                  </span>
                </p>
              </div>
            )}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-[14px] text-xs leading-4">
            <span className="text-[12.5px] text-(color:--content-tertiary)">Active days by weekday</span>
            {weekdays.map((d) => {
              const top = d.days === Math.max(...weekdays.map((w) => w.days))
              const width = (d.days / Math.max(...weekdays.map((w) => w.days))) * 100
              return (
                <span key={d.day} className="flex items-center gap-2">
                  <span className="relative h-1.5 w-[34px] overflow-hidden rounded-[3px]" style={{ background: EMPTY_DAY }}>
                    <span className="absolute inset-y-0 left-0 rounded-[3px] bg-(--accent) transition-[width] duration-500" style={{ width: `${width}%`, opacity: top ? 1 : 0.72 }} />
                  </span>
                  <span className={top ? "text-(color:--content-default)" : "text-(color:--content-tertiary)"}>{d.day}</span>
                  <span className="font-medium" style={{ color: top ? "var(--accent)" : "#bbbebd" }}>
                    {Math.round((d.days * days) / 365)}
                  </span>
                </span>
              )
            })}
          </div>
        </div>
      </Card>
    </Section>
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
