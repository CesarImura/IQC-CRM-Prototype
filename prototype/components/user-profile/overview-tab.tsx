"use client"

import * as React from "react"
import Link from "next/link"
import { Calendar, UserAvatar } from "@carbon/icons-react"

import type { User } from "@/lib/users/data"
import { cashFlow, cashFlowKpis, identity, lastActivity, lifetime, money, upcomingCharges } from "@/lib/users/profile"
import { cn } from "@/lib/utils"
import { Badge, DeltaBadge } from "@/registry/iq/ui/badge"
import { Button } from "@/registry/iq/ui/button"
import { TimeFilter } from "@/components/dropdown"
import { FieldGrid, FieldGridRow } from "@/registry/iq/ui/field-grid"
import { Pill } from "@/registry/iq/ui/pill"
import { StatusDot } from "@/registry/iq/ui/status-dot"
import { utmLabels } from "../users/columns"
import { Card, CompactStat, Section } from "./shared"

const dateFormat = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" })

export function OverviewTab({ user }: { user: User }) {
  const [range, setRange] = React.useState("year")
  const id = identity(user)

  return (
    <div className="flex flex-col gap-8">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Section
          title="Firm cash flow"
          info="Money the firm collected from this trader (purchases, renewals) against what it paid out (payouts, refunds)."
          actions={
            <TimeFilter
              label="Period"
              icon={<Calendar />}
              align="end"
              options={[
                { value: "all", label: "All time" },
                { value: "year", label: "This year" },
                { value: "12m", label: "Last 12 months" },
              ]}
              value={range}
              onValueChange={setRange}
            />
          }
        >
          <Card className="flex h-full flex-col">
            <div className="flex flex-wrap border-b border-(--border-divider)">
              {cashFlowKpis.map((k) => (
                <CompactStat key={k.title} title={k.title} value={k.value} caption={k.caption} tone={k.tone} />
              ))}
            </div>
            <CashFlowChart />
            <div className="flex gap-4 border-t border-(--border-grid) px-6 py-4 text-xs text-(color:--chart-legend-label)">
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
            {lifetime.map((row) => (
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
      <span className={cn("size-2", className)} />
      {children}
    </span>
  )
}

/** Diverging bars on one scale: money in above the baseline, money out below, labelled with the amount. */
function CashFlowChart() {
  const maxIn = Math.max(...cashFlow.map((m) => m.in))
  const maxOut = Math.max(...cashFlow.map((m) => -m.out))
  const px = 150 / Math.max(maxIn, maxOut)
  return (
    <div className="flex flex-1 items-end gap-2 px-6 pt-6 pb-4" role="img" aria-label="Firm cash flow by month">
      {cashFlow.map((m) => (
        <div key={m.month} className="flex min-w-0 flex-1 flex-col items-center">
          <div className="flex w-full flex-col items-center justify-end border-b border-(--chart-baseline)" style={{ height: maxIn * px + 20 }}>
            {m.in > 0 && <span className="mb-1 text-[11px] text-(color:--chart-axis-label) tabular-nums">{money(m.in)}</span>}
            <div className="w-1/4 min-w-3 bg-(--chart-series-1)" style={{ height: Math.max(m.in * px, m.in ? 2 : 0) }} />
          </div>
          <div className="flex w-full flex-col items-center" style={{ height: maxOut * px + 20 }}>
            <div className="w-1/4 min-w-3 bg-(--chart-series-3)" style={{ height: -m.out * px }} />
            {m.out < 0 && <span className="mt-1 text-[11px] text-(color:--chart-axis-label) tabular-nums">{money(m.out)}</span>}
          </div>
          <span className="mt-2 text-xs text-(color:--chart-axis-label)">{m.month}</span>
        </div>
      ))}
    </div>
  )
}
