"use client"

import * as React from "react"
import { Activity, Catalog, CheckmarkOutline, CloseOutline, Flag, Grid, List, OverflowMenuVertical, Renew, Unlink } from "@carbon/icons-react"

import { providers, tradingAccounts, type Provider, type TradingAccount, type TradingTab as TradingTabValue } from "@/lib/users/profile"
import { cn } from "@/lib/utils"
import { Badge } from "@/registry/iq/ui/badge"
import { Button } from "@/registry/iq/ui/button"
import { ActionMenu } from "@/components/dropdown"
import { PartnerMark } from "@/registry/iq/ui/partner-logo"
import { StatusDot } from "@/registry/iq/ui/status-dot"
import { Tabs, TabsLineList, TabsLineTrigger, TabsPillList, TabsPillTrigger } from "@/registry/iq/ui/tabs"
import { toast } from "@/registry/iq/ui/toast"
import { Card, LimitBar, Muted, Section, Stat, TypeBadge } from "./shared"

const notYet = (what: string) => toast.info(`${what} isn’t in this prototype yet`)

const TABS: { value: TradingTabValue; label: string; icon: React.ReactNode; tone: "accent" | "info" | "warning" | "danger" }[] = [
  { value: "challenge", label: "Challenge", icon: <Flag />, tone: "accent" },
  { value: "active", label: "Active", icon: <Activity />, tone: "info" },
  { value: "passed", label: "Passed", icon: <CheckmarkOutline />, tone: "warning" },
  { value: "breached", label: "Breached", icon: <CloseOutline />, tone: "danger" },
]

export function TradingTab({ onNewAccount }: { onNewAccount: () => void }) {
  const [tab, setTab] = React.useState<TradingTabValue>("challenge")
  const accounts = tradingAccounts.filter((a) => a.tab === tab)

  return (
    <div className="flex flex-col gap-8">
      <Section
        title="Connected providers"
        actions={
          <>
            <Button variant="secondary" size="sm" onClick={() => notYet("New platform")}>
              New platform
            </Button>
            <Button size="sm" onClick={() => notYet("New data subscription")}>
              New data subscription
            </Button>
          </>
        }
      >
        <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
          {providers.map((p) => (
            <ProviderCard key={p.name} provider={p} />
          ))}
        </div>
      </Section>

      <Section
        title="Trading accounts"
        actions={
          <>
            <Tabs defaultValue="cards">
              <TabsPillList size="sm" aria-label="View">
                <TabsPillTrigger value="cards" icon={<Grid />} aria-label="Cards" />
                <TabsPillTrigger value="table" icon={<List />} aria-label="Table" disabled />
              </TabsPillList>
            </Tabs>
            <Button variant="secondary" size="sm" onClick={() => notYet("Risk logs")}>
              Risk logs
            </Button>
            <Button size="sm" onClick={onNewAccount}>
              New account
            </Button>
          </>
        }
      >
        <Tabs value={tab} onValueChange={(v) => setTab(v as TradingTabValue)}>
          <TabsLineList aria-label="Account status">
            {TABS.map((t) => (
              <TabsLineTrigger key={t.value} value={t.value} tone={t.tone} icon={t.icon} count={tradingAccounts.filter((a) => a.tab === t.value).length}>
                {t.label}
              </TabsLineTrigger>
            ))}
          </TabsLineList>
        </Tabs>
        <div className="mt-2 grid gap-4 lg:grid-cols-2">
          {accounts.map((a) => (
            <AccountCard key={a.id} account={a} />
          ))}
        </div>
        <div className="flex items-center justify-between border-t border-(--border-grid) pt-3 text-xs text-(color:--content-muted)">
          <span>
            1 – {accounts.length} of {accounts.length} accounts
          </span>
          <span>Page 1 of 1</span>
        </div>
      </Section>
    </div>
  )
}

function ProviderCard({ provider }: { provider: Provider }) {
  return (
    <Card className="flex flex-col">
      <div className="flex items-start gap-3 p-4">
        <PartnerMark partner={provider.partner} size={32} />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="truncate text-sm font-medium text-(color:--content-default)">{provider.name}</span>
          <Muted>{provider.kind}</Muted>
          <StatusDot tone={provider.connection.tone} className="mt-1 text-xs font-normal">
            {provider.connection.label}
          </StatusDot>
        </div>
        <ActionMenu
          label={`Actions for ${provider.name}`}
          iconOnly={<OverflowMenuVertical />}
          sections={[
            [
              { value: "logs", label: "Connection logs", icon: <Catalog /> },
              { value: "resync", label: "Resync", icon: <Renew /> },
            ],
            [{ value: "disconnect", label: "Disconnect", icon: <Unlink />, tone: "danger" }],
          ]}
          onSelect={() => notYet("This action")}
        />
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-4 border-t border-(--border-grid) p-4">
        {provider.fields.map((f) => (
          <div key={f.label} className={cn("flex min-w-0 flex-col gap-1", provider.fields.length % 2 === 1 && f === provider.fields.at(-1) && "col-span-2")}>
            <Muted>{f.label}</Muted>
            {f.badge ? (
              <Badge color="green" size="sm" className="w-fit">
                {f.value}
              </Badge>
            ) : f.tone ? (
              <StatusDot tone={f.tone} className="text-xs font-normal">
                {f.value}
              </StatusDot>
            ) : (
              <span className="truncate text-xs text-(color:--content-default)">{f.value}</span>
            )}
          </div>
        ))}
      </div>
    </Card>
  )
}

function AccountCard({ account }: { account: TradingAccount }) {
  return (
    <Card className="flex flex-col">
      <div className="flex items-start gap-3 p-4">
        <PartnerMark partner={account.partner} size={32} />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="truncate text-sm font-medium text-(color:--content-default)">{account.title}</span>
          <StatusDot tone={account.status.tone} className="text-xs font-normal">
            {account.status.label}
          </StatusDot>
        </div>
        <TypeBadge type={account.type} />
      </div>
      {/* Phone (Figma Trading mobile): the three stats stack, one per row, so balances never truncate. */}
      <div className="grid grid-cols-1 border-y border-(--border-grid) sm:grid-cols-3">
        {account.stats.map((s, i) => (
          <Stat
            key={s.label}
            label={s.label}
            value={<span className="text-base">{s.value}</span>}
            caption={s.caption}
            tone={s.tone}
            className={cn("p-4", i > 0 && "border-t border-(--border-grid) sm:border-t-0 sm:border-l")}
          />
        ))}
      </div>
      <div className="flex flex-col gap-5 p-4">
        {account.limits.map((l) => (
          <div key={l.label} className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="text-(color:--content-muted)">
                {l.label}
                {l.rule && <span className="ml-2 text-(color:--content-disabled)">{l.rule}</span>}
              </span>
              <span className="tabular-nums text-(color:--content-default)">
                {l.value} <span className="text-(color:--content-muted)">/ {l.max}</span>
              </span>
            </div>
            <LimitBar pct={l.pct} tone={l.tone} />
          </div>
        ))}
      </div>
      <div className="mt-auto flex items-center justify-between gap-2 border-t border-(--border-grid) px-4 py-3">
        <Muted className="truncate">{account.footer}</Muted>
        <Button variant="secondary" size="xs" className="shrink-0" onClick={() => notYet(account.action)}>
          {account.action}
        </Button>
      </div>
    </Card>
  )
}
