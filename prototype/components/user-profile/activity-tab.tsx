"use client"

import * as React from "react"
import { Laptop, Mobile, Screen } from "@carbon/icons-react"

import { accountLogs, activity, engagement, heatmap, heatmapMonths, sessions, staffLogs, weekdays, type AccountLog, type ActivityEvent } from "@/lib/users/profile"
import { cn } from "@/lib/utils"
import { Badge, DeltaBadge } from "@/registry/iq/ui/badge"
import { Button } from "@/registry/iq/ui/button"
import { Dropdown } from "@/components/dropdown"
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
const LEVEL_OPACITY = [1, 0.3, 0.5, 0.72, 1]
const dayStyle = (level: number): React.CSSProperties =>
  level === 0 ? { background: EMPTY_DAY } : { background: "var(--accent)", opacity: LEVEL_OPACITY[level] }

function Engagement() {
  const [range, setRange] = React.useState("all")
  const weeks = React.useMemo(() => heatmap(), [])
  const maxDay = Math.max(...weekdays.map((d) => d.days))

  return (
    <Section
      title="Engagement"
      actions={
        <>
          <Button variant="secondary" size="sm" onClick={() => document.getElementById("sessions")?.scrollIntoView({ behavior: "smooth" })}>
            View sessions
          </Button>
          <Tabs value={range} onValueChange={setRange}>
            <TabsPillList size="sm" aria-label="Period">
              <TabsPillTrigger value="all">All</TabsPillTrigger>
              <TabsPillTrigger value="30">30 days</TabsPillTrigger>
              <TabsPillTrigger value="7">7 days</TabsPillTrigger>
            </TabsPillList>
          </Tabs>
        </>
      }
    >
      <Card>
        <div className="flex flex-wrap border-b border-(--border-divider)">
          {engagement.map((k) => (
            <CompactStat key={k.title} {...k} />
          ))}
        </div>
        <div className="flex flex-col gap-6 px-6 pt-5 pb-5">
          <div>
            <div
              className="grid w-full grid-cols-[29px_repeat(52,minmax(0,1fr))] gap-[4px]"
              role="img"
              aria-label="Active days over the last 12 months"
            >
              {heatmapMonths.map((m, i) => (
                <span
                  key={m}
                  className="row-start-1 text-[11px] leading-none text-(color:--content-tertiary)"
                  style={{ gridColumnStart: 2 + Math.round((i * 52) / 12) }}
                >
                  {m}
                </span>
              ))}
              {["Mon", "Wed", "Fri"].map((d, i) => (
                <span key={d} className="col-start-1 self-center text-[11px] leading-none text-(color:--content-tertiary)" style={{ gridRowStart: 2 + i * 2 }}>
                  {d}
                </span>
              ))}
              {weeks.flatMap((week, w) =>
                week.map((level, d) => (
                  <span key={`${w}-${d}`} className="aspect-square rounded-[2px]" style={{ gridColumnStart: w + 2, gridRowStart: d + 2, ...dayStyle(level) }} />
                ))
              )}
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-[14px] text-xs leading-4">
              <span className="text-[12.5px] text-(color:--content-tertiary)">Active days by weekday</span>
              {weekdays.map((d) => {
                const top = d.days === maxDay
                return (
                  <span key={d.day} className="flex items-center gap-2">
                    <span className="relative h-1.5 w-[34px] overflow-hidden rounded-[3px]" style={{ background: EMPTY_DAY }}>
                      <span
                        className="absolute inset-y-0 left-0 rounded-[3px] bg-(--accent)"
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
            <span className="flex items-center gap-1.5 text-[11px] text-(color:--content-tertiary)">
              Less
              {[0, 1, 2, 3, 4].map((l) => (
                <span key={l} className="size-[11px] rounded-[2px]" style={dayStyle(l)} />
              ))}
              More
            </span>
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
        pagination={{ showPageSize: false, summary: `${rows.length} items` }}
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
        pagination={{ showPageSize: false, summary: `${rows.length} events` }}
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
                <Dropdown
                  label="Period"
                  hideLabel
                  size="sm"
                  search={false}
                  value={period}
                  options={[
                    { value: "12m", label: "Last 12 months" },
                    { value: "30d", label: "Last 30 days" },
                    { value: "all", label: "All time" },
                  ]}
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
      <Card id="sessions" className="divide-y divide-(--border-grid)">
        {rows.map((s, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-4">
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
      <Card className="divide-y divide-(--border-grid)">
        {rows.map((l) => (
          <div key={l.title + l.date} className="flex items-start justify-between gap-3 px-4 py-4">
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
