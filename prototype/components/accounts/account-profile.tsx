"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Document, Edit, Launch, PauseOutline, PlayOutline, Renew, Time, User as UserIcon } from "@carbon/icons-react"

import { ActionMenu, type ActionItem } from "@/components/dropdown"
import { AdminNotes } from "@/components/user-profile/admin-notes"
import { Card, CompactStat, LimitBar, Section } from "@/components/user-profile/shared"
import type { Account } from "@/lib/accounts/data"
import { accountProfile, type Meter, type RuleRow } from "@/lib/accounts/profile"
import { getAllUsers } from "@/lib/users/data"
import { cn } from "@/lib/utils"
import { Alert } from "@/registry/iq/ui/alert"
import { Badge } from "@/registry/iq/ui/badge"
import { BalanceRangeChart } from "@/registry/iq/ui/balance-range-chart"
import { Button } from "@/registry/iq/ui/button"
import { createDataTableColumnHelper, DataTable } from "@/registry/iq/ui/data-table"
import { Empty } from "@/registry/iq/ui/empty"
import { FieldGrid, FieldGridRow } from "@/registry/iq/ui/field-grid"
import { Pill } from "@/registry/iq/ui/pill"
import { StatusDot } from "@/registry/iq/ui/status-dot"
import { Tabs, TabsContent, TabsLineList, TabsLineTrigger } from "@/registry/iq/ui/tabs"
import { toast } from "@/registry/iq/ui/toast"
import { ValueNumber, ValueText } from "@/registry/iq/ui/value-slot"
import { AccountModals, type AccountModal } from "./account-modals"
import { accountStatusMeta, typeMeta } from "./columns"

// Figma: Accounts · Account · <type> (Challenge 4333:119394, Funded 4333:118764, Breached 4333:120202, Disabled
// 4333:120798, Passed 4333:121389, Initialized 4333:122083, Reset 4333:122701, Instant Funded 4333:124943).
// One layout for every type; what changes (meters, rules card, alert, actions) comes from lib/accounts/profile.ts.

const money = (v: number) => `${v < 0 ? "−" : ""}${Math.abs(v).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} $`
const POS = "text-(color:--stat-card-value-positive)"
const NEG = "text-(color:--stat-card-value-negative)"

type Action = "extend" | "renewal" | "reset" | "limits" | "disable" | "enable" | "logs"

function actionSections(a: Account): ActionItem[][] {
  const logs: ActionItem = { value: "logs", label: "Account logs", icon: <Document /> }
  const limits: ActionItem = { value: "limits", label: "Change rule limits", icon: <Edit /> }
  const disable: ActionItem = { value: "disable", label: "Disable account", icon: <PauseOutline />, tone: "danger" }
  if (a.status === "disabled") return [[{ value: "enable", label: "Enable account", icon: <PlayOutline /> }, logs]]
  if (a.status === "breached") return [[{ value: "reset", label: "Reset account", icon: <Renew /> }, logs]]
  if (a.status === "initialized" || a.status === "challenge_passed") return [[logs], [disable]]
  if (a.type === "challenge") return [[{ value: "extend", label: "Extend expiry", icon: <Time /> }, { value: "reset", label: "Reset account", icon: <Renew /> }, limits, logs], [disable]]
  return [[{ value: "renewal", label: "Extend renewal", icon: <Time /> }, limits, logs], [disable]]
}

function StatusAlert({ a, onAction }: { a: Account; onAction: (v: Action) => void }) {
  if (a.status === "breached")
    return (
      <Alert
        tone="destructive"
        title={`Breached · ${a.cause === "Daily loss" ? "daily loss limit" : a.cause === "Hard breach" ? "3rd strike (hard breach)" : "maximum drawdown"}`}
        description={`Closed at ${money(a.balance)}. The account can’t trade again and its history is read-only. The trader can buy a reset for ${a.size === 50 ? "49.00" : "79.00"} $.`}
        action={<Button size="sm" variant="secondary" onClick={() => onAction("reset")}>Reset account</Button>}
      />
    )
  if (a.status === "disabled")
    return (
      <Alert
        tone="destructive"
        title={`Disabled · ${a.reason?.title ?? "manual review"}`}
        description={`${a.reason?.detail ?? ""}${a.disabledBy ? ` · by ${a.disabledBy.name} (${a.disabledBy.team})` : ""}`}
        action={<Button size="sm" variant="secondary" onClick={() => onAction("enable")}>Enable account</Button>}
      />
    )
  if (a.status === "challenge_passed")
    return <Alert tone="success" title="Challenge passed" description={`Profit target hit. A funded ${a.size}K account starts after the ${a.size === 50 ? "129.00" : "149.00"} $ activation fee.`} />
  if (a.status === "initialized")
    return <Alert title="Waiting for the activation fee" description={`The funded account was created from ${a.parentId ?? "a passed challenge"}. It starts trading once the ${a.size === 50 ? "129.00" : "149.00"} $ fee is paid.`} />
  if (a.status === "reset" && a.parentId)
    return <Alert title={`Reset of ${a.parentId}`} description="Balance, rules and stats started over on the reset. The 30-day window kept counting." />
  return null
}

function MeterCard({ m }: { m: Meter }) {
  return (
    <Card className="flex flex-col gap-3 p-5">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm text-(color:--content-muted)">{m.label}</span>
        <span className={cn("text-xl leading-[1.3] font-medium tabular-nums text-(color:--content-default)", m.tone === "danger" && m.pct >= 100 && NEG)}>{m.value}</span>
      </div>
      <LimitBar pct={m.pct} tone={m.tone} />
      <div className="flex flex-col gap-0.5 text-xs leading-normal">
        <span className="text-(color:--content-default)">{m.of}</span>
        <span className="truncate text-(color:--content-tertiary)">{m.caption}</span>
      </div>
    </Card>
  )
}

function LimitRow({ r }: { r: RuleRow }) {
  return (
    <div className="flex flex-col gap-1.5 px-5 py-3">
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="text-(color:--content-default)">{r.label}</span>
        <span className="tabular-nums text-(color:--content-default)">{r.value}</span>
      </div>
      {r.pct !== undefined && (
        <div className="relative">
          <LimitBar pct={r.pct} tone={r.tone} />
          {/* Each bar ends in a red tick: the limit. */}
          <span aria-hidden className="absolute top-[-2px] right-0 h-2 w-px bg-(--status-dot-negative)" />
        </div>
      )}
      <span className="text-xs text-(color:--content-tertiary)">{r.caption}</span>
    </div>
  )
}

type TradeRow = ReturnType<typeof accountProfile>["trades"][number]
const tcol = createDataTableColumnHelper<TradeRow>()
const tradeColumns = tcol.columns([
  tcol.accessor("session", { header: "Session", size: 90, enableSorting: false, cell: (i) => <ValueText>{i.getValue()}</ValueText> }),
  tcol.accessor("time", { header: "Time", size: 80, enableSorting: false, cell: (i) => <ValueText>{i.getValue()}</ValueText> }),
  tcol.accessor("market", { header: "Market", size: 100, enableSorting: false, cell: (i) => <ValueText>{i.getValue()}</ValueText> }),
  tcol.accessor("side", { header: "Side", size: 80, enableSorting: false, cell: (i) => <Badge color={i.getValue() === "Long" ? "green" : "red"}>{i.getValue()}</Badge> }),
  tcol.accessor("contracts", { header: "Contracts", size: 100, enableSorting: false, cell: (i) => <ValueNumber>{i.getValue()}</ValueNumber> }),
  tcol.accessor("entry", { header: "Entry", size: 110, enableSorting: false, cell: (i) => <ValueNumber>{i.getValue()}</ValueNumber> }),
  tcol.accessor("exit", { header: "Exit", size: 110, enableSorting: false, cell: (i) => <ValueNumber>{i.getValue()}</ValueNumber> }),
  tcol.accessor("duration", { header: "Duration", size: 110, enableSorting: false, cell: (i) => <ValueText>{i.getValue()}</ValueText> }),
  tcol.accessor("pnl", { header: "Net P&L", size: 120, enableSorting: false, cell: (i) => <ValueNumber className={i.getValue() > 0 ? POS : i.getValue() < 0 ? NEG : undefined}>{money(i.getValue())}</ValueNumber> }),
  tcol.accessor("note", { header: "Note", size: 220, enableSorting: false, cell: (i) => (i.getValue() ? <ValueText className="text-(color:--content-tertiary)">{i.getValue()}</ValueText> : <ValueText className="text-(color:--content-disabled)">—</ValueText>) }),
])

export function AccountProfile({ account }: { account: Account }) {
  const router = useRouter()
  const [a, setA] = React.useState(account)
  const [modal, setModal] = React.useState<AccountModal>(null)
  const [tab, setTab] = React.useState("overview")
  const p = React.useMemo(() => accountProfile(a), [a])
  const owner = React.useMemo(() => getAllUsers().find((u) => u.name === a.user), [a.user])
  const logsRef = React.useRef<HTMLDivElement>(null)
  // The list's row menu lands here with ?action=… and opens that overlay.
  React.useEffect(() => {
    const v = new URLSearchParams(window.location.search).get("action")
    const map: Record<string, AccountModal> = { extend: a.type === "challenge" ? "extend" : "renewal", reset: "reset", limits: "limits", disable: "disable", enable: "enable" }
    if (v && map[v]) setModal(map[v])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const patch = (next: Partial<Account>, message: string, description?: string) => {
    const before = a
    setA({ ...a, ...next })
    setModal(null)
    toast.success(message, { description, action: { label: "Undo", onClick: () => setA(before) } })
  }
  const onAction = (v: Action) => {
    if (v === "logs") {
      setTab("overview")
      requestAnimationFrame(() => logsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }))
      return
    }
    setModal(v)
  }

  return (
    <div data-page className="mx-auto flex w-full max-w-[1544px] flex-col gap-5 px-4 pt-8 pb-10 lg:px-14 lg:pt-10 lg:pb-14">
      <header className="flex flex-col">
        <Button variant="ghost" size="sm" className="mb-4 w-fit" onClick={() => (window.history.length > 1 ? router.back() : router.push("/customers/accounts"))}>
          <ArrowLeft size={16} />
          Accounts
        </Button>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex min-w-0 flex-col">
            <h1 className="truncate text-2xl leading-[1.5] font-medium text-white/80">Account: {a.id}</h1>
            <span className="text-sm leading-normal text-white/50">
              {a.family} {a.size}K · {a.market === "future" ? "Future" : "Crypto"} · {typeMeta[a.type].label}
            </span>
            <div className="flex flex-wrap items-center gap-4 pt-2 pb-4 text-sm max-lg:gap-y-2 max-lg:pt-4 [&_[data-slot=status-dot]]:gap-2 [&_[data-slot=status-dot]]:text-sm [&_[data-slot=status-dot]]:font-medium [&_[data-slot=status-dot]]:text-white/50">
              {owner ? (
                <Link href={`/customers/users/${owner.id}`} className="rounded-full outline-none focus-visible:shadow-[0_0_0_var(--focus-spread)_var(--focus-ring)]">
                  <Pill icon={<UserIcon />} className="cursor-pointer hover:bg-white/12">
                    {a.user}
                  </Pill>
                </Link>
              ) : (
                <Pill icon={<UserIcon />}>{a.user}</Pill>
              )}
              <span aria-hidden className="h-4 w-px bg-[#2e3130]" />
              <Badge color={typeMeta[a.type].color}>{typeMeta[a.type].label}</Badge>
              <Badge color={accountStatusMeta[a.status].color}>{accountStatusMeta[a.status].label}</Badge>
              <StatusDot tone={p.tradingNow ? "positive" : "neutral"} className={p.tradingNow ? undefined : "[&>span:first-child]:bg-white/20"}>
                {p.tradingNow ? "Trading now" : a.status === "breached" || a.status === "disabled" ? "Closed" : "Not trading"}
              </StatusDot>
              {a.strikes && (
                <StatusDot tone={a.strikes.used ? "warning" : "neutral"} className={a.strikes.used ? undefined : "[&>span:first-child]:bg-white/20"}>
                  Strikes {a.strikes.used} of {a.strikes.max}
                </StatusDot>
              )}
              <span className="border-l border-[#2e3130] pl-4 text-(color:--content-tertiary) max-lg:basis-full max-lg:border-l-0 max-lg:pl-0">
                Last session · {p.lastSession}
                {a.expires ? (p.kpis[5].value === "Today" ? " · Expires today" : ` · Expires in ${p.kpis[5].value}`) : ""}
              </span>
            </div>
          </div>
          <div data-touch-actions="" className="flex shrink-0 items-center gap-2 max-lg:w-full max-lg:flex-row-reverse">
            <ActionMenu label="Actions" sections={actionSections(a)} onSelect={(v) => onAction(v as Action)} />
            {a.status !== "breached" && a.status !== "disabled" && (
              <Button variant="secondary" size="sm" onClick={() => setModal("limits")}>
                Change rule limits
              </Button>
            )}
            <Button size="sm" className="max-lg:flex-1" onClick={() => toast.info(`Opens ${a.provider} in a new tab`, { description: "Not wired in this prototype" })}>
              Open in provider
              <Launch />
            </Button>
          </div>
        </div>
      </header>

      <StatusAlert a={a} onAction={onAction} />

      {/* KPI strip: one row on desktop, sideways scroll on a phone (same as the user profile). */}
      <div data-kpi-scroll className="scroll-no-arrows -mx-4 overflow-x-auto px-4 pb-1 lg:mx-0 lg:overflow-visible lg:px-0 lg:pb-0">
        <Card aria-label="Key numbers" className="flex max-lg:w-max">
          {p.kpis.map((k) => (
            <CompactStat key={k.title} title={k.title} value={k.value} caption={k.caption} tone={k.tone} />
          ))}
        </Card>
      </div>

      {/* Row · Limits: the four meters. */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {p.meters.map((m) => (
          <MeterCard key={m.label} m={m} />
        ))}
      </div>

      <Tabs value={tab} onValueChange={setTab} className="mt-3 gap-8">
        <TabsLineList aria-label="Account sections" data-edge-tabs>
          <TabsLineTrigger value="overview" tone="accent">Overview</TabsLineTrigger>
          <TabsLineTrigger value="report" tone="accent">Report</TabsLineTrigger>
          <TabsLineTrigger value="historical" tone="accent">Historical</TabsLineTrigger>
        </TabsLineList>

        <TabsContent value="overview" className="flex flex-col gap-8">
          <Section title="Snapshots" info="Start balance in the centre · green band above the target, red band below the breach line · hover a session for the full snapshot.">
            <Card className="flex flex-col">
              <div className="flex flex-wrap border-b border-(--border-divider)">
                <CompactStat title="Balance" value={money(p.snapshot.balance)} />
                <CompactStat title="Equity" value={money(p.snapshot.equity)} />
                <CompactStat title="Daily net P&L" value={money(p.snapshot.daily)} tone={p.snapshot.daily > 0 ? "positive" : p.snapshot.daily < 0 ? "negative" : undefined} />
                <CompactStat title="Sessions" value={String(p.snapshot.sessions)} />
              </div>
              <div className="overflow-x-auto p-5">
                <div className="min-w-[640px]">
                  <BalanceRangeChart start={a.start} sessions={p.sessions} maxLoss={p.maxLoss} trailing={p.trailing} target={p.target} height={300} />
                </div>
              </div>
            </Card>
          </Section>

          <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            <Section title="Recent trades">
              <DataTable className="rounded-[4px] border border-(--border-divider)" columns={tradeColumns} data={p.trades} pagination={false} />
            </Section>
            <Section title={a.type === "challenge" ? "Rule compliance" : "Payout readiness"}>
              <Card className="flex flex-col">
                <div className="flex flex-col gap-3 border-b border-(--border-divider) p-5">
                  {p.statusText.map((s) => (
                    <div key={s.label} className="flex flex-col gap-0.5">
                      <span className="text-xs text-(color:--content-muted)">{s.label}</span>
                      <span className="text-sm text-(color:--content-default)">{s.value}</span>
                    </div>
                  ))}
                </div>
                <p className="px-5 pt-4 text-xs text-(color:--content-tertiary)">Limits · each bar ends at the limit</p>
                <div className="flex flex-col py-1">
                  {p.limits.map((r) => (
                    <LimitRow key={r.label} r={r} />
                  ))}
                </div>
              </Card>
            </Section>
          </div>

          <div ref={logsRef} className="grid scroll-mt-16 gap-8 lg:grid-cols-2">
            <Section title="Risk logs">
              <Card className="flex flex-col">
                <ul className="flex flex-col">
                  {p.logs.map((l) => (
                    <li key={l.title + l.detail} className="flex gap-3 border-b border-(--border-divider) px-5 py-4">
                      <StatusDot tone={l.tone === "neutral" ? "neutral" : l.tone} className={l.tone === "neutral" ? "mt-1.5 [&>span:first-child]:bg-white/20" : "mt-1.5"} />
                      <div className="flex min-w-0 flex-col gap-0.5">
                        <span className="text-sm font-medium text-(color:--content-default)">{l.title}</span>
                        <span className="text-xs text-(color:--content-tertiary)">{l.detail}</span>
                      </div>
                    </li>
                  ))}
                </ul>
                <p className="px-5 py-4 text-xs text-(color:--content-tertiary)">
                  A position that breaks max position loss is closed automatically (soft breach). The last strike closes the account. Every manual action is logged with the admin name.
                </p>
              </Card>
            </Section>
            <AdminNotes />
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            <Section title="Account setup">
              <Card className="p-2">
                <FieldGrid>
                  {p.setup.map((f) => (
                    <FieldGridRow key={f.label} label={f.label} copyValue={f.copy ? f.value : undefined}>
                      {f.value}
                    </FieldGridRow>
                  ))}
                </FieldGrid>
              </Card>
            </Section>
            <Section title="Account economics">
              <Card className="flex flex-col">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-(--border-divider) text-left text-xs text-(color:--content-muted)">
                      <th className="px-5 py-3 font-normal">ID</th>
                      <th className="px-5 py-3 font-normal">Title</th>
                      <th className="px-5 py-3 text-right font-normal">Count</th>
                      <th className="px-5 py-3 text-right font-normal">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {p.economics.map((e) => (
                      <tr key={e.id} className="border-b border-(--border-divider) last:border-0">
                        <td className="px-5 py-3 text-(color:--content-tertiary)">{e.id}</td>
                        <td className="px-5 py-3 text-(color:--content-default)">{e.title}</td>
                        <td className="px-5 py-3 text-right tabular-nums text-(color:--content-default)">{e.count}</td>
                        <td className={cn("px-5 py-3 text-right tabular-nums", e.amount < 0 ? NEG : "text-(color:--content-default)")}>{money(e.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            </Section>
          </div>
        </TabsContent>
        <TabsContent value="report">
          <Empty title="Report isn’t designed yet" description="Session-by-session report of this account. Next in the Accounts flow." className="mx-auto w-full max-w-[441px]" />
        </TabsContent>
        <TabsContent value="historical">
          <Empty title="Historical isn’t designed yet" description="Every snapshot and trade since the account started. Next in the Accounts flow." className="mx-auto w-full max-w-[441px]" />
        </TabsContent>
      </Tabs>

      <AccountModals
        account={a}
        open={modal}
        onOpenChange={setModal}
        onExtend={(days, cost) => {
          const key = modal === "renewal" ? "renews" : "expires"
          const from = a[key] ? new Date(a[key]!).getTime() : Date.now()
          patch({ [key]: new Date(from + days * 86_400_000).toISOString() }, modal === "renewal" ? "Renewal extended" : "Expiry extended", cost ? `${days} days · ${money(cost)} charged` : `${days} days`)
        }}
        onReset={() =>
          patch(
            { status: "reset", balance: a.start, openPnl: 0, dailyPnl: 0, drawdown: { ...a.drawdown, used: 0 }, profit: a.profit ? { ...a.profit, current: 0 } : null, strikes: a.strikes ? { ...a.strikes, used: 0 } : null, cause: null, disabledAt: null, parentId: a.parentId ?? a.id },
            "Account reset",
            `${a.size === 50 ? "49.00" : "79.00"} $ charged · balance back to ${money(a.start)}`
          )
        }
        onLimits={(l) => patch({ drawdown: { ...a.drawdown, limit: l.drawdown }, profit: a.profit && l.target ? { ...a.profit, target: l.target } : a.profit }, "Rule limits saved", "Logged in Risk logs")}
        onDisable={(reason, note) => patch({ status: "disabled", disabledAt: new Date().toISOString(), reason: { title: reason, detail: note || "Manual review" }, disabledBy: { name: "Davi Klinsmann", team: "Admin" } }, "Account disabled", a.id)}
        onEnable={() => patch({ status: "active", reason: null, disabledBy: null, disabledAt: null }, "Account enabled", a.id)}
      />
    </div>
  )
}
