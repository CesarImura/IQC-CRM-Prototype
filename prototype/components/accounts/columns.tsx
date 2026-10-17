"use client"

import { Edit, OverflowMenuVertical, PauseOutline, PlayOutline, Renew, Time, View } from "@carbon/icons-react"

import { daysUntil, lifetimeDays, type Account, type AccountStatus, type AccountType } from "@/lib/accounts/data"
import type { AccountsTab } from "@/lib/accounts/query"
import { ActionMenu, type ActionItem } from "@/components/dropdown"
import { LimitBar } from "@/components/user-profile/shared"
import { cn } from "@/lib/utils"
import { Badge, type BadgeColor } from "@/registry/iq/ui/badge"
import { createDataTableColumnHelper } from "@/registry/iq/ui/data-table"
import { Flag } from "@/registry/iq/ui/flag"
import { ValueNumber, ValueText } from "@/registry/iq/ui/value-slot"

// Figma Accounts tabs (4333:112751). Badge colours from the Product rules: Challenge green · Funded blue · Breached red · Reset yellow.
export const typeMeta: Record<AccountType, { label: string; color: BadgeColor }> = {
  challenge: { label: "Challenge", color: "green" },
  funded: { label: "Funded", color: "blue" },
  instant_funded: { label: "Instant Funded", color: "purple" },
}
export const accountStatusMeta: Record<AccountStatus, { label: string; color: BadgeColor }> = {
  active: { label: "Active", color: "gray" },
  challenge_passed: { label: "Challenge Passed", color: "green" },
  initialized: { label: "Initialized", color: "gray" },
  reset: { label: "Reset", color: "yellow" },
  breached: { label: "Breached", color: "red" },
  disabled: { label: "Disabled", color: "red" },
}

export type AccountAction = "view" | "extend" | "reset" | "limits" | "disable" | "enable"

const money = (n: number) => `${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} $`
const whole = (n: number) => `${n.toLocaleString("en-US")} $`
const signed = (n: number) => (n === 0 ? "0.00 $" : `${n > 0 ? "+" : "−"}${money(Math.abs(n))}`)
const day = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" })
const dayShort = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", timeZone: "UTC" })
const time = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "UTC" })
const shortMonth = (s: string) => s.replace("Sept", "Sep")

const POS = "text-(color:--stat-card-value-positive)"
const NEG = "text-(color:--stat-card-value-negative)"
const WARN = "text-(color:--status-dot-warning)"

const Empty = () => <ValueText className="text-(color:--content-disabled)">—</ValueText>

/** Two-line cell: value on top, 12px caption under it (Figma rows: ID + lineage, Rule + market, dates + time). */
function Stack({ top, sub, className }: { top: React.ReactNode; sub?: React.ReactNode; className?: string }) {
  return (
    <span className={cn("flex min-w-0 flex-col", className)}>
      <span className="truncate">{top}</span>
      {sub && <span className="truncate text-xs leading-normal text-(color:--content-tertiary)">{sub}</span>}
    </span>
  )
}

/** 16px ring before a used/limit value (Accounts list rule): yellow while in use, red once breached or disabled. */
export function MiniRing({ pct, danger = false }: { pct: number; danger?: boolean }) {
  const r = 6.5
  const c = 2 * Math.PI * r
  const p = Math.min(1, Math.max(0, pct))
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden className="shrink-0 -rotate-90">
      <circle cx="8" cy="8" r={r} fill="none" stroke="var(--chart-ring-track)" strokeWidth="1.5" />
      {p > 0 && <circle cx="8" cy="8" r={r} fill="none" stroke={danger ? "var(--status-dot-negative)" : "var(--status-dot-warning)"} strokeWidth="1.5" strokeDasharray={`${c * p} ${c}`} />}
    </svg>
  )
}

/** Strikes: one 8px dash per strike, filled in yellow (red on the last one). */
export function Segments({ used, max, tone }: { used: number; max: number; tone?: "danger" }) {
  return (
    <span aria-hidden className="flex gap-0.5">
      {Array.from({ length: max }, (_, i) => (
        <span
          key={i}
          className={cn(
            "h-0.5 w-2",
            i < used ? (tone === "danger" || used >= max - 1 && used > 1 ? "bg-(--status-dot-negative)" : "bg-(--status-dot-warning)") : "bg-white/16"
          )}
        />
      ))}
    </span>
  )
}

function Countdown({ iso }: { iso: string }) {
  const d = daysUntil(iso)
  return <Stack top={<span className={d <= 3 ? WARN : undefined}>{d === 0 ? "Today" : d === 1 ? "1 day" : `${d} days`}</span>} sub={shortMonth(day.format(new Date(iso)))} />
}

const When = ({ iso }: { iso: string }) => <Stack top={shortMonth(dayShort.format(new Date(iso)))} sub={time.format(new Date(iso))} />

const col = createDataTableColumnHelper<Account>()

function causeCell(cause: NonNullable<Account["cause"]>) {
  return cause === "Hard breach" ? (
    <span className={cn("flex items-center gap-2 text-xs", NEG)}>
      <Segments used={3} max={3} tone="danger" />
      Hard breach
    </span>
  ) : (
    <span className={cn("text-xs", NEG)}>{cause}</span>
  )
}
const totalPnl = (a: Account) => a.balance - a.start + a.openPnl

const COLUMNS = {
  id: col.accessor("id", {
    header: "ID",
    size: 160,
    enableSorting: false,
    cell: ({ row: { original: a } }) => (
      <ValueText>
        <Stack top={a.id} sub={a.parentId ? `↳ ${a.parentId}` : a.mt5Login ? `MT5 login ${a.mt5Login}` : undefined} />
      </ValueText>
    ),
  }),
  user: col.accessor("user", { header: "User", size: 150, cell: (i) => <ValueText>{i.getValue()}</ValueText> }),
  country: col.accessor("country", {
    header: "Country",
    size: 112,
    cell: (i) => (
      <span className="flex items-center gap-2 text-sm text-(color:--value-slot-text)">
        <Flag code={i.getValue()} size="sm" />
        {i.getValue().toUpperCase()}
      </span>
    ),
  }),
  rule: col.accessor("family", {
    id: "rule",
    header: "Rule",
    size: 150,
    cell: ({ row: { original: a } }) => (
      <ValueText>
        <Stack top={`${a.family} · ${a.size}K`} sub={a.market === "future" ? "Future" : "Crypto"} />
      </ValueText>
    ),
  }),
  type: col.accessor("type", {
    header: "Account type",
    size: 128,
    cell: (i) => <Badge color={typeMeta[i.getValue()].color}>{typeMeta[i.getValue()].label}</Badge>,
  }),
  status: col.accessor("status", {
    header: "Status",
    size: 150,
    cell: (i) => <Badge color={accountStatusMeta[i.getValue()].color}>{accountStatusMeta[i.getValue()].label}</Badge>,
  }),
  provider: col.accessor("provider", { header: "Provider", size: 120, cell: (i) => <ValueText>{i.getValue()}</ValueText> }),
  strikes: col.display({
    id: "strikes",
    header: "Strikes",
    size: 110,
    // Breached rows show what broke the account here (Figma All tab: "Drawdown" in red).
    cell: ({ row: { original: a } }) =>
      a.status === "breached" && a.cause ? (
        causeCell(a.cause)
      ) : a.strikes ? (
        <span className="flex items-center gap-2 text-sm text-(color:--value-slot-text) tabular-nums">
          <Segments used={a.strikes.used} max={a.strikes.max} />
          {a.strikes.used} / {a.strikes.max}
        </span>
      ) : (
        <Empty />
      ),
  }),
  drawdown: col.display({
    id: "drawdown",
    header: "Drawdown used",
    size: 160,
    cell: ({ row: { original: a } }) => (
      <span className="flex items-center gap-2 text-sm tabular-nums">
        <MiniRing pct={a.drawdown.used / a.drawdown.limit} danger={a.status === "breached" || a.status === "disabled"} />
        <span className="text-(color:--value-slot-text)">{whole(a.drawdown.used)}</span>
        <span className="text-xs text-(color:--content-tertiary)">/ {whole(a.drawdown.limit)}</span>
      </span>
    ),
  }),
  profit: col.display({
    id: "profit",
    header: "Profit target",
    size: 150,
    cell: ({ row: { original: a } }) =>
      a.profit ? (
        <span className="flex w-full min-w-0 flex-col gap-1.5">
          <span className="text-sm tabular-nums">
            <span className="text-(color:--value-slot-text)">{whole(a.profit.current)}</span>{" "}
            <span className="text-xs text-(color:--content-tertiary)">/ {whole(a.profit.target)}</span>
          </span>
          <LimitBar pct={(a.profit.current / a.profit.target) * 100} tone="accent" />
        </span>
      ) : (
        <Empty />
      ),
  }),
  consistency: col.accessor("consistency", {
    header: "Consistency",
    size: 120,
    cell: (i) =>
      i.getValue() === null ? (
        <Empty />
      ) : (
        <span className="flex items-center gap-2 text-sm tabular-nums">
          <MiniRing pct={i.getValue()! / 100} />
          <span className={i.getValue()! > 30 ? NEG : "text-(color:--value-slot-text)"}>{i.getValue()}%</span>
          <span className="text-xs text-(color:--content-tertiary)">/ 30%</span>
        </span>
      ),
  }),
  withdrawals: col.accessor("withdrawals", { header: "Withdrawals", size: 110, cell: (i) => (i.getValue() ? <ValueNumber>{i.getValue()}</ValueNumber> : <Empty />) }),
  balance: col.accessor("balance", {
    header: "Balance",
    size: 130,
    cell: ({ row: { original: a } }) => <ValueNumber className={a.balance >= a.start ? POS : NEG}>{money(a.balance)}</ValueNumber>,
  }),
  totalPnl: col.display({
    id: "totalPnl",
    header: "Total P&L",
    size: 120,
    cell: ({ row: { original: a } }) => <ValueNumber className={totalPnl(a) > 0 ? POS : totalPnl(a) < 0 ? NEG : undefined}>{signed(totalPnl(a))}</ValueNumber>,
  }),
  openPnl: col.accessor("openPnl", {
    header: "Open P&L",
    size: 110,
    cell: (i) => <ValueNumber className={i.getValue() > 0 ? POS : i.getValue() < 0 ? NEG : undefined}>{signed(i.getValue())}</ValueNumber>,
  }),
  dailyPnl: col.accessor("dailyPnl", {
    header: "Daily P&L",
    size: 110,
    cell: (i) => <ValueNumber className={i.getValue() > 0 ? POS : i.getValue() < 0 ? NEG : undefined}>{signed(i.getValue())}</ValueNumber>,
  }),
  expires: col.accessor("expires", { header: "Expires", size: 110, cell: (i) => (i.getValue() ? <Countdown iso={i.getValue()!} /> : <Empty />) }),
  renews: col.accessor("renews", { header: "Renews", size: 110, cell: (i) => (i.getValue() ? <Countdown iso={i.getValue()!} /> : <Empty />) }),
  created: col.accessor("created", { header: "Created", size: 100, cell: (i) => <When iso={i.getValue()} /> }),
  disabledAt: col.accessor("disabledAt", { header: "Disabled at", size: 110, cell: (i) => (i.getValue() ? <When iso={i.getValue()!} /> : <Empty />) }),
  cause: col.accessor("cause", {
    header: "Cause",
    size: 140,
    cell: (i) => (i.getValue() ? causeCell(i.getValue()!) : <Empty />),
  }),
  lifetime: col.display({
    id: "lifetime",
    header: "Lifetime",
    size: 100,
    cell: ({ row: { original: a } }) => {
      const d = lifetimeDays(a)
      return d === null ? <Empty /> : <ValueNumber>{d < 1 ? `${Math.max(1, Math.round(d * 24))} h` : `${d.toFixed(1)} days`}</ValueNumber>
    },
  }),
  reason: col.display({
    id: "reason",
    header: "Reason",
    size: 220,
    cell: ({ row: { original: a } }) => (a.reason ? <ValueText><Stack top={a.reason.title} sub={a.reason.detail} /></ValueText> : <Empty />),
  }),
  disabledBy: col.display({
    id: "disabledBy",
    header: "Disabled by",
    size: 140,
    cell: ({ row: { original: a } }) => (a.disabledBy ? <ValueText><Stack top={a.disabledBy.name} sub={a.disabledBy.team} /></ValueText> : <Empty />),
  }),
}

type Key = keyof typeof COLUMNS
const BASE: Key[] = ["id", "user", "country", "rule", "type", "status", "provider"]
// Column order per tab, from the Figma header rows.
const TAB_COLUMNS: Record<AccountsTab, Key[]> = {
  all: [...BASE, "strikes", "drawdown", "balance", "totalPnl", "openPnl", "dailyPnl", "withdrawals", "expires", "created", "disabledAt"],
  challenge: [...BASE, "strikes", "drawdown", "profit", "balance", "totalPnl", "openPnl", "dailyPnl", "expires", "created"],
  funded: [...BASE, "strikes", "drawdown", "consistency", "withdrawals", "balance", "totalPnl", "openPnl", "dailyPnl", "renews", "created"],
  breached: [...BASE, "cause", "drawdown", "balance", "totalPnl", "dailyPnl", "created", "disabledAt", "lifetime"],
  expiring: [...BASE, "strikes", "drawdown", "expires", "profit", "balance", "totalPnl", "openPnl", "dailyPnl", "created"],
  disabled: [...BASE, "reason", "disabledBy", "created", "disabledAt", "balance", "totalPnl"],
}
// Phone: ID first, the phase column and Balance right after it; the rest scrolls.
const MOBILE_COLUMNS: Record<AccountsTab, Key[]> = {
  all: ["id", "status", "balance", "user", "rule", "type", "drawdown", "created"],
  challenge: ["id", "profit", "balance", "status", "user", "rule", "drawdown", "expires"],
  funded: ["id", "consistency", "balance", "status", "user", "rule", "drawdown", "renews"],
  breached: ["id", "cause", "balance", "user", "rule", "drawdown", "disabledAt"],
  expiring: ["id", "expires", "balance", "status", "user", "rule", "drawdown", "profit"],
  disabled: ["id", "reason", "disabledBy", "user", "rule", "disabledAt"],
}

export function getAccountColumns(tab: AccountsTab, onAction: (a: Account, action: AccountAction) => void, mobile = false) {
  const keys = (mobile ? MOBILE_COLUMNS : TAB_COLUMNS)[tab]
  return col.columns([
    ...keys.map((k) => COLUMNS[k]),
    col.display({
      id: "actions",
      size: 64,
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => <AccountRowActions account={row.original} onAction={onAction} />,
    }),
  ])
}

export function AccountRowActions({ account, onAction }: { account: Account; onAction: (a: Account, action: AccountAction) => void }) {
  const closed = account.status === "disabled"
  const sections: ActionItem[][] = [
    [
      { value: "view", label: "View account", icon: <View /> },
      ...(account.type === "challenge" && !closed && account.status !== "breached" ? [{ value: "extend", label: "Extend expiry", icon: <Time /> }] : []),
      ...(account.type !== "instant_funded" && !closed ? [{ value: "reset", label: "Reset account", icon: <Renew /> }] : []),
      { value: "limits", label: "Change rule limits", icon: <Edit /> },
    ],
    [closed ? { value: "enable", label: "Enable account", icon: <PlayOutline /> } : { value: "disable", label: "Disable account", icon: <PauseOutline />, tone: "danger" }],
  ]
  return (
    <div className="flex justify-center" onClick={(e) => e.stopPropagation()}>
      <ActionMenu label={`Actions for ${account.id}`} iconOnly={<OverflowMenuVertical />} align="end" sections={sections} onSelect={(v) => onAction(account, v as AccountAction)} />
    </div>
  )
}
