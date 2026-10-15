"use client"

import * as React from "react"
import Link from "next/link"
import { UserAvatar } from "@carbon/icons-react"

import type { User } from "@/lib/users/data"
import { moneyProfile } from "@/lib/users/money"
import { identity, lastActivity, money, upcomingCharges, type CashEvent } from "@/lib/users/profile"
import { cn } from "@/lib/utils"
import { Badge, DeltaBadge } from "@/registry/iq/ui/badge"
import { Button } from "@/registry/iq/ui/button"
import { FieldGrid, FieldGridRow } from "@/registry/iq/ui/field-grid"
import { Pill } from "@/registry/iq/ui/pill"
import { StatusDot } from "@/registry/iq/ui/status-dot"
import { utmLabels } from "../users/columns"
import { Card, CompactStat, PeriodPills, Section } from "./shared"

const dateFormat = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" })

export function OverviewTab({ user }: { user: User }) {
  const [range, setRange] = React.useState<CashRange>("ytd")
  const profile = React.useMemo(() => moneyProfile(user.id), [user.id])
  const flow = React.useMemo(() => cashFlowFor(range, profile.events), [range, profile])
  const id = identity(user)

  return (
    <div className="flex flex-col gap-8">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Section
          title="Firm cash flow"
          info="Money the firm collected from this trader (purchases, renewals) against what it paid out (payouts, refunds)."
          actions={
            <PeriodPills value={range} options={CASH_RANGES} onValueChange={setRange} />
          }
        >
          <Card className="flex h-full flex-col">
            <div className="flex flex-wrap border-b border-(--border-divider)">
              {flow.kpis.map((k) => (
                <CompactStat key={k.title} title={k.title} value={k.value} caption={k.caption} tone={k.tone} />
              ))}
            </div>
            <CashFlowChart key={range} buckets={flow.buckets} dense={range === "30"} />
            {/* _Chart / Legend (DS line and donut charts): 14px swatches, radius 2, 8px to a 14px label, 24px between items. */}
            <div className="flex flex-wrap gap-x-6 gap-y-2 border-t border-(--border-grid) px-6 py-4 text-sm leading-[21px] text-(color:--chart-legend-label)">
              <Legend className="bg-(--chart-series-1)">Purchases &amp; renewals</Legend>
              <Legend className="bg-(--chart-series-3)">Payouts &amp; refunds</Legend>
            </div>
          </Card>
        </Section>

        <Section title="Lifetime activities">
          <Card className="flex h-full flex-col px-5">
            <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-x-6 border-b border-(--border-grid) py-3 text-xs text-(color:--content-muted)">
              <span>Metric</span>
              <span className="text-right">Count</span>
              <span className="min-w-[92px] text-right">Amount</span>
            </div>
            {profile.lifetime.map((row) => (
              <div
                key={row.metric}
                className="grid min-h-[47px] flex-1 grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-x-6 border-b border-(--border-grid) text-sm last:border-b-0"
              >
                <span className="text-(color:--content-secondary)">{row.metric}</span>
                <span className="min-w-6 text-right text-(color:--content-default)">{row.count ?? ""}</span>
                <span className="flex min-w-[92px] items-center justify-end gap-2 text-right whitespace-nowrap text-(color:--content-default)">
                  {row.delta && <DeltaBadge size="sm">{row.delta}</DeltaBadge>}
                  {row.amount}
                </span>
              </div>
            ))}
          </Card>
        </Section>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <Section title="Payment health" info="Charges and payment method of the trader’s active subscriptions.">
          <Card className="flex h-full flex-col">
            <dl className="flex flex-col px-6 pt-1">
              {[
                ["Next charge", "21 Oct 2026 · 89.00 $"],
                ["Payment method", "Visa ···· 4242"],
                ["Failed charges", "1 in the last 90 days"],
                ["Subscriptions", "4 active · 2 ended"],
                ["Auto-renew", "On"],
              ].map(([label, value]) => (
                <div key={label} className="flex min-h-[50px] items-center justify-between gap-4 border-b border-(--border-grid) text-sm">
                  <dt className="shrink-0 text-(color:--content-tertiary)">{label}</dt>
                  <dd className="flex min-w-0 items-center justify-end gap-2 text-right text-(color:--content-default)">
                    {value}
                    {label === "Payment method" && (
                      <Badge color="yellow" size="sm">
                        Expires 11/2026
                      </Badge>
                    )}
                  </dd>
                </div>
              ))}
            </dl>
            <div className="flex flex-col gap-3 px-6 py-4">
              <span className="text-xs text-(color:--content-muted)">Upcoming charges</span>
              {upcomingCharges.map((c) => (
                <div key={c.date} className="flex items-center justify-between text-sm">
                  <div className="flex flex-col">
                    <span className="text-(color:--content-default)">{c.date}</span>
                    <span className="text-xs text-(color:--content-muted)">{c.ref}</span>
                  </div>
                  <span className="tabular-nums text-(color:--content-default)">{c.amount}</span>
                </div>
              ))}
            </div>
            <div className="mt-auto border-t border-(--border-grid) px-6 py-4">
              <Button variant="secondary" size="sm" asChild>
                <Link href="/customers/renewals">View renewals</Link>
              </Button>
            </div>
          </Card>
        </Section>

        <Section title="Identity & verification">
          <Card className="flex h-full flex-col">
            {/* Rows share the card's height (Figma: 7 rows spread over the panel), no empty band at the bottom. */}
            <FieldGrid columns={2} className="flex-1 gap-x-5 px-6 py-2 [grid-auto-rows:1fr] [&>*]:!h-auto [&>*]:min-h-12">
              <FieldGridRow label="ID" copyValue={user.id}>
                {`${user.id.slice(0, 8)}…${user.id.slice(-8)}`}
              </FieldGridRow>
              <FieldGridRow label="Contact">
                <StatusDot tone={user.verification === "verified" ? "positive" : "warning"} className="font-normal">
                  {user.verification === "verified" ? "Verified" : "Pending"}
                </StatusDot>
              </FieldGridRow>
              <FieldGridRow label="Email" copyValue={user.email}>
                {user.email}
              </FieldGridRow>
              <FieldGridRow label="KYC">
                <Badge color={id.kyc === "Approved" ? "green" : id.kyc === "Pending" ? "yellow" : "gray"} size="sm">
                  {id.kyc}
                </Badge>
              </FieldGridRow>
              <FieldGridRow label="Phone" copyValue={user.phone}>
                {user.phone}
              </FieldGridRow>
              <FieldGridRow label="Funded agreement">
                <Badge color={id.fundedAgreement === "Signed" ? "green" : "gray"} size="sm">
                  {id.fundedAgreement}
                </Badge>
              </FieldGridRow>
              <FieldGridRow label="Phone attempts">1</FieldGridRow>
              <FieldGridRow label="Purchases">
                <StatusDot tone={id.purchases === "Allowed" ? "positive" : "negative"} className="font-normal">
                  {id.purchases}
                </StatusDot>
              </FieldGridRow>
              <FieldGridRow label="Registered">{dateFormat.format(new Date(user.registered))}</FieldGridRow>
              <FieldGridRow label="Fraud">
                <StatusDot tone={id.fraud === "Flagged" ? "negative" : "neutral"} className="font-normal">
                  {id.fraud}
                </StatusDot>
              </FieldGridRow>
              <FieldGridRow label="UTM source">{user.utm ? utmLabels[user.utm] : "—"}</FieldGridRow>
              <FieldGridRow label="Marketing comms">
                <StatusDot tone="positive" className="font-normal">
                  Opted in
                </StatusDot>
              </FieldGridRow>
              <FieldGridRow label="Affiliate">{user.affiliate ? <Pill icon={<UserAvatar />}>{user.affiliate}</Pill> : "—"}</FieldGridRow>
              <FieldGridRow label="Last login (UTC)">{lastActivity.replace(" UTC", "")}</FieldGridRow>
            </FieldGrid>
          </Card>
        </Section>
      </div>
    </div>
  )
}

function Legend({ className, children }: { className: string; children: React.ReactNode }) {
  return (
    <span className="flex items-center gap-2">
      <span aria-hidden="true" className={cn("size-3.5 shrink-0 rounded-[2px]", className)} />
      {children}
    </span>
  )
}

/* Firm cash flow periods: this year by month, 90 / 60 days by week, 30 days by day. Every range reads the same dated events. */
const CASH_RANGES = [
  { value: "ytd", label: "YTD" },
  { value: "90", label: "90D" },
  { value: "60", label: "60D" },
  { value: "30", label: "30D" },
] as const
type CashRange = (typeof CASH_RANGES)[number]["value"]
type DatedEvent = CashEvent & { t: number }
type CashBucket = { label: string; title: string; in: number; out: number; payouts: number; refunds: number; events: DatedEvent[]; netToDate: number }
const DAY_MS = 86_400_000
const CASH_TODAY = Date.UTC(2026, 9, 14)
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
const dayMonth = (t: number) => `${String(new Date(t).getUTCDate()).padStart(2, "0")} ${MONTHS[new Date(t).getUTCMonth()]}`
const weekday = (t: number) => new Date(t).toLocaleDateString("en-GB", { weekday: "short", timeZone: "UTC" })
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`
const KIND_LABEL = { purchase: "Purchase", renewal: "Renewal", payout: "Payout", refund: "Refund" } as const

function cashFlowFor(range: CashRange, source: CashEvent[]) {
  const events: DatedEvent[] = source.map((e) => ({ ...e, t: Date.parse(`${e.date}T00:00:00Z`) }))
  const start = range === "ytd" ? Date.UTC(2026, 0, 1) : CASH_TODAY - (Number(range) - 1) * DAY_MS
  const inRange = events.filter((e) => e.t >= start && e.t <= CASH_TODAY)

  const bucket = (from: number, to: number, label: string, title: string): CashBucket => {
    const list = inRange.filter((e) => e.t >= from && e.t < to)
    const upTo = events.filter((e) => e.t < to && e.t <= CASH_TODAY)
    return {
      label,
      title,
      in: list.reduce((a, e) => a + Math.max(e.amount, 0), 0),
      out: list.reduce((a, e) => a + Math.min(e.amount, 0), 0),
      payouts: list.filter((e) => e.kind === "payout").reduce((a, e) => a + e.amount, 0),
      refunds: list.filter((e) => e.kind === "refund").reduce((a, e) => a + e.amount, 0),
      events: list,
      netToDate: upTo.reduce((a, e) => a + e.amount, 0),
    }
  }
  let buckets: CashBucket[]
  if (range === "ytd") {
    buckets = Array.from({ length: new Date(CASH_TODAY).getUTCMonth() + 1 }, (_, m) =>
      bucket(Date.UTC(2026, m, 1), Date.UTC(2026, m + 1, 1), MONTHS[m], `${new Date(Date.UTC(2026, m, 1)).toLocaleDateString("en-GB", { month: "long", timeZone: "UTC" })} 2026`)
    )
  } else {
    const size = range === "30" ? 1 : 7
    const count = Math.ceil(Number(range) / size)
    buckets = Array.from({ length: count }, (_, i) => {
      const from = start + i * size * DAY_MS
      const to = Math.min(from + size * DAY_MS, CASH_TODAY + DAY_MS)
      const last = i === count - 1
      // 30 days: a date under every 7th day and "Today" under the last one, so the labels never collide.
      const label = range === "30" ? (last ? "Today" : i % 7 === 0 && i < count - 4 ? dayMonth(from) : "") : dayMonth(from)
      const title = size === 1 ? `${weekday(from)} · ${dayMonth(from)} 2026` : `Week · ${dayMonth(from)} – ${dayMonth(to - DAY_MS)}`
      return bucket(from, to, label, title)
    })
  }

  const count = (kind: string) => inRange.filter((e) => e.kind === kind).reduce((a, e) => a + (e.count ?? 1), 0)
  const total = (kind: string) => inRange.filter((e) => e.kind === kind).reduce((a, e) => a + e.amount, 0)
  const collected = total("purchase") + total("renewal")
  const orders = [count("purchase") && plural(count("purchase"), "purchase"), count("renewal") && plural(count("renewal"), "renewal")].filter(Boolean)
  const tone = (n: number) => (n > 0 ? ("positive" as const) : n < 0 ? ("negative" as const) : undefined)
  const kpis = [
    { title: "Collected", value: money(collected), tone: tone(collected), caption: orders.length ? orders.join(" · ") : "No orders" },
    { title: "Paid out", value: money(total("payout")), tone: tone(total("payout")), caption: count("payout") ? plural(count("payout"), "payout") : "No payouts" },
    { title: "Refunded", value: money(total("refund")), tone: tone(total("refund")), caption: count("refund") ? plural(count("refund"), "refund") : "No refunds" },
    {
      title: "Payout / purchase",
      value: collected ? `${((Math.abs(total("payout")) / collected) * 100).toFixed(1)}%` : "—",
      caption: "Firm-wide avg. 38.0%",
    },
  ]
  return { buckets, kpis }
}

/** Diverging bars on one scale: money in above the baseline, money out below, labelled with the amount. Same height in
 *  every range. Hovering a column highlights it and opens the _Chart / Tooltip with what moved in that period. */
function CashFlowChart({ buckets, dense }: { buckets: CashBucket[]; dense?: boolean }) {
  // Each side keeps at least a third of the plot, so the baseline doesn't jump to the edge when a range has no money out (or in).
  const peakIn = Math.max(0, ...buckets.map((m) => m.in))
  const peakOut = Math.max(0, ...buckets.map((m) => -m.out))
  const maxIn = Math.max(peakIn, peakOut / 2, 1)
  const maxOut = Math.max(peakOut, peakIn / 2)
  const px = 170 / (maxIn + maxOut)
  const ref = React.useRef<HTMLDivElement>(null)
  const [hover, setHover] = React.useState<number | null>(null)
  const [last, setLast] = React.useState<{ i: number; x: number; w: number; width: number } | null>(null)
  const enter = (i: number) => (e: React.MouseEvent<HTMLElement>) => {
    const el = e.currentTarget
    setHover(i)
    setLast({ i, x: el.offsetLeft, w: el.offsetWidth, width: ref.current?.offsetWidth ?? 0 })
  }
  return (
    <div className="no-scrollbar flex flex-1 overflow-x-auto overflow-y-hidden lg:overflow-visible">
    <div
      ref={ref}
      className={cn("relative flex flex-1 items-end px-6 pt-6 pb-4 max-lg:min-w-(--plot-min)", dense ? "gap-1" : "gap-2")}
      style={{ "--plot-min": `${buckets.length * (dense ? 22 : 64) + 48}px` } as React.CSSProperties}
      role="img"
      aria-label="Firm cash flow"
      onMouseLeave={() => setHover(null)}
    >
      {buckets.map((m, i) => {
        const dim = hover !== null && hover !== i
        return (
          <div
            key={i}
            onMouseEnter={enter(i)}
            className={cn("flex min-w-0 flex-1 flex-col items-center rounded-[2px] transition-[background-color,opacity] duration-200", hover === i && "bg-white/[0.03]", dim && "opacity-45")}
          >
            <div className="flex w-full flex-col items-center justify-end border-b border-(--chart-baseline)" style={{ height: maxIn * px + 20 }}>
              {m.in > 0 && <span className="mb-1 text-[11px] whitespace-nowrap text-(color:--chart-axis-label) tabular-nums">{money(m.in)}</span>}
              <div
                className={cn("min-w-3 origin-bottom bg-(--chart-series-1)", dense ? "w-full max-w-3" : "w-1/4")}
                style={{ height: Math.max(m.in * px, m.in ? 2 : 0), animation: `bar-grow 500ms ${i * 25}ms cubic-bezier(0.16,1,0.3,1) both` }}
              />
            </div>
            <div className="flex w-full flex-col items-center" style={{ height: maxOut * px + 20 }}>
              <div
                className={cn("min-w-3 origin-top bg-(--chart-series-3)", dense ? "w-full max-w-3" : "w-1/4")}
                style={{ height: -m.out * px, animation: `bar-grow 500ms ${i * 25}ms cubic-bezier(0.16,1,0.3,1) both` }}
              />
              {m.out < 0 && <span className="mt-1 text-[11px] whitespace-nowrap text-(color:--chart-axis-label) tabular-nums">{money(m.out)}</span>}
            </div>
            <span className="mt-2 h-[18px] text-xs whitespace-nowrap text-(color:--chart-axis-label)">{m.label}</span>
          </div>
        )
      })}
      {last && <CashTooltip bucket={buckets[last.i]} anchor={last} visible={hover !== null} />}
    </div>
    </div>
  )
}

/** DS _Chart / Tooltip (balance range chart): period, money in / out / net with colour bars, net to date, then the
 *  events behind the numbers. Sits beside the column, flips near the right edge, glides between columns. */
function CashTooltip({ bucket, anchor, visible }: { bucket: CashBucket; anchor: { x: number; w: number; width: number }; visible: boolean }) {
  const flip = anchor.x + anchor.w + 12 + 280 > anchor.width
  const net = bucket.in + bucket.out
  const collected = bucket.events.filter((e) => e.kind === "purchase" || e.kind === "renewal")
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute top-4 z-20 transition-[left,opacity] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]"
      style={{ left: flip ? anchor.x - 8 : anchor.x + anchor.w + 8, opacity: visible ? 1 : 0 }}
    >
      <div
        className="flex min-w-[240px] flex-col gap-1.5 rounded-(--chart-tooltip-radius) bg-(--chart-tooltip-bg) px-4 py-3.5 shadow-[0_0_0_1px_var(--border-divider),0_12px_32px_rgba(0,0,0,0.5)] transition-transform duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]"
        style={{
          transform: `translateX(${flip ? "-100%" : "0"}) scale(${visible ? 1 : 0.94})`,
          transformOrigin: flip ? "right top" : "left top",
          animation: "tooltip-pop 260ms cubic-bezier(0.16,1,0.3,1) both",
        }}
      >
        <div key={bucket.title} className="flex flex-col gap-1.5 [animation:tooltip-swap_220ms_cubic-bezier(0.16,1,0.3,1)_both]">
          <p className="text-base leading-normal whitespace-nowrap text-(color:--chart-tooltip-date)">{bucket.title}</p>
          <CashTooltipItem color="var(--chart-series-1)" label={`Collected${collected.length ? ` · ${collected.length}` : ""}`} value={money(bucket.in)} />
          <CashTooltipItem color="var(--chart-series-3)" label="Paid out" value={money(bucket.payouts)} />
          {bucket.refunds !== 0 && <CashTooltipItem color="var(--chart-series-3)" label="Refunded" value={money(bucket.refunds)} />}
          <CashTooltipItem color="var(--content-default)" label="Net" value={money(net, true)} />
          <div className="mt-1 flex flex-col gap-1 border-t border-(--border-divider) pt-2.5">
            {bucket.events.length === 0 ? (
              <p className="text-[13px] text-(color:--chart-tooltip-label)">No money moved</p>
            ) : (
              bucket.events.slice(0, 4).map((e, i) => (
                <p key={i} className="flex items-center justify-between gap-4 text-[13px] leading-5 whitespace-nowrap">
                  <span className="text-(color:--chart-tooltip-label)">
                    {dayMonth(e.t)} · {KIND_LABEL[e.kind]}
                    {e.count && e.count > 1 ? ` ×${e.count}` : ""}
                    {e.plan ? ` · ${e.plan}` : ""}
                  </span>
                  <span className="font-medium text-(color:--chart-tooltip-value) tabular-nums">{money(e.amount)}</span>
                </p>
              ))
            )}
            {bucket.events.length > 4 && <p className="text-[13px] text-(color:--chart-tooltip-label)">+{bucket.events.length - 4} more</p>}
          </div>
          <p className="flex items-center justify-between gap-4 text-[13px] leading-5 whitespace-nowrap">
            <span className="text-(color:--chart-tooltip-label)">Net to date</span>
            <span className={cn("font-medium tabular-nums", bucket.netToDate < 0 ? "text-(color:--chart-series-3)" : "text-(color:--chart-series-1)")}>{money(bucket.netToDate, true)}</span>
          </p>
        </div>
      </div>
    </div>
  )
}

function CashTooltipItem({ color, label, value }: { color: string; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 text-base leading-normal whitespace-nowrap">
      <span aria-hidden="true" className="h-[21px] w-1 shrink-0 rounded-[2px]" style={{ background: color }} />
      <span className="text-(color:--chart-tooltip-label)">{label}</span>
      <span className="ml-auto pl-4 font-medium text-(color:--chart-tooltip-value) tabular-nums">{value}</span>
    </div>
  )
}
