"use client"

import * as React from "react"
import { Checkmark, Grid, List, OverflowMenuVertical } from "@carbon/icons-react"

import { subscriptions, type Subscription } from "@/lib/users/profile"
import { Badge } from "@/registry/iq/ui/badge"
import { Button } from "@/registry/iq/ui/button"
import { Dropdown } from "@/components/dropdown"
import { createDataTableColumnHelper, DataTable } from "@/registry/iq/ui/data-table"
import { SearchBar } from "@/registry/iq/ui/search-bar"
import { StatusDot } from "@/registry/iq/ui/status-dot"
import { Tabs, TabsPillList, TabsPillTrigger } from "@/registry/iq/ui/tabs"
import { toast } from "@/registry/iq/ui/toast"
import { Toolbar, ToolbarDivider } from "@/registry/iq/ui/toolbar"
import { ValueDate, ValueText } from "@/registry/iq/ui/value-slot"
import { Card, Muted, Section, Stat, TypeBadge } from "./shared"

const notYet = (what: string) => toast.info(`${what} isn’t in this prototype yet`)

function Payment({ value }: { value: Subscription["payment"] }) {
  return value === "Confirmed" ? (
    <Badge color="green" size="sm">
      Confirmed
      <Checkmark />
    </Badge>
  ) : (
    <Badge color="gray" size="sm">
      Refunded
    </Badge>
  )
}

const Dash = () => <ValueText className="text-(color:--content-disabled)">—</ValueText>

export function SubscriptionsTab() {
  const [view, setView] = React.useState<"cards" | "table">("cards")
  const [status, setStatus] = React.useState("all")
  const [type, setType] = React.useState("all")
  const [search, setSearch] = React.useState("")

  const rows = subscriptions.filter(
    (s) =>
      (status === "all" || s.status.toLowerCase() === status) &&
      (type === "all" || s.type.toLowerCase() === type) &&
      (!search || `${s.product} ${s.id} ${s.account}`.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <Section
      title="Subscriptions"
      actions={
        <>
          {view === "cards" && (
            <Dropdown
              label="Status"
              hideLabel
              size="sm"
              search={false}
              value={status}
              options={[
                { value: "all", label: "All subscriptions" },
                { value: "active", label: "Active" },
                { value: "ended", label: "Ended" },
              ]}
              onValueChange={setStatus}
            />
          )}
          <Dropdown
            label="Export"
            placeholder="Export"
            hideLabel
            size="sm"
            align="end"
            search={false}
            value={null}
            options={[{ value: "csv", label: `CSV · ${rows.length} subscriptions` }]}
            onValueChange={() => toast.success(`Exported ${rows.length} subscriptions`, { description: "CSV downloaded" })}
          />
          <Button size="sm" onClick={() => notYet("Add subscription")}>
            Add subscription
          </Button>
          <ToolbarDivider />
          <Tabs value={view} onValueChange={(v) => setView(v as "cards" | "table")}>
            <TabsPillList size="sm" aria-label="View">
              <TabsPillTrigger value="cards" icon={<Grid />} aria-label="Cards" />
              <TabsPillTrigger value="table" icon={<List />} aria-label="Table" />
            </TabsPillList>
          </Tabs>
        </>
      }
    >
      {view === "cards" ? (
        <div className="grid items-start gap-4 md:grid-cols-2 xl:grid-cols-3">
          {rows.map((s) => (
            <SubscriptionCard key={s.id} sub={s} />
          ))}
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={rows}
          getRowId={(r) => r.id}
          pinnedRight={["actions"]}
          pagination={false}
          toolbar={
            <Toolbar surface={false} className="w-full"
              filters={
                <>
                  <div className="w-60">
                    <SearchBar placeholder="Search subscription or account" aria-label="Search subscriptions" value={search} onValueChange={setSearch} />
                  </div>
                  <Dropdown
                    label="Type"
                    hideLabel
                    size="sm"
                    search={false}
                    value={type}
                    options={[
                      { value: "all", label: "All types" },
                      { value: "challenge", label: "Challenge" },
                      { value: "funding", label: "Funding" },
                      { value: "breached", label: "Breached" },
                    ]}
                    onValueChange={setType}
                  />
                  <Dropdown
                    label="Status"
                    hideLabel
                    size="sm"
                    search={false}
                    value={status}
                    options={[
                      { value: "all", label: "All status" },
                      { value: "active", label: "Active" },
                      { value: "ended", label: "Ended" },
                    ]}
                    onValueChange={setStatus}
                  />
                </>
              }
            />
          }
          emptyState={{ title: "No subscriptions match", description: "Try another search or filter." }}
        />
      )}
    </Section>
  )
}

function SubscriptionCard({ sub }: { sub: Subscription }) {
  const [open, setOpen] = React.useState(false)
  const details: [string, React.ReactNode][] = [
    ["Start", sub.bought],
    ["Renewal", sub.renewal ?? "—"],
    [
      "Source",
      <Badge key="s" color="gray" size="sm">
        {sub.source}
      </Badge>,
    ],
    ["End", sub.end ?? "—"],
    ["Add-on", sub.addOn ?? "—"],
    [
      "Free reset",
      sub.freeResets > 0 ? (
        <Badge key="r" color="green" size="sm">
          Available: {sub.freeResets}
        </Badge>
      ) : (
        "—"
      ),
    ],
  ]
  return (
    <Card className="flex flex-col self-start">
      <div className="flex items-start justify-between gap-3 px-4 pt-4">
        <div className="flex min-w-0 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-(color:--content-default)">{sub.product}</span>
            <TypeBadge type={sub.type} />
          </div>
          <Muted>
            {sub.id} · bought {sub.bought}
          </Muted>
        </div>
        <StatusDot tone={sub.status === "Active" ? "positive" : "neutral"} className="text-xs font-normal">
          {sub.status}
        </StatusDot>
      </div>
      <div className="grid grid-cols-[1.4fr_1fr_1fr] gap-3 border-b border-(--border-grid) px-4 py-5">
        <Stat label="Step" value={sub.step} />
        <Stat label="Amount" value={sub.amount} />
        <div className="flex flex-col items-start gap-1">
          <span className="text-xs text-(color:--content-muted)">Payment</span>
          <Payment value={sub.payment} />
        </div>
      </div>
      {open && (
        <dl id={`${sub.id}-details`} className="flex flex-col border-b border-(--border-grid) px-4">
          {details.map(([label, value]) => (
            <div key={label} className="flex min-h-10 items-center justify-between gap-3 border-b border-(--border-grid) text-sm last:border-b-0">
              <dt className="text-(color:--content-tertiary)">{label}</dt>
              <dd className="text-right text-(color:--content-default)">{value}</dd>
            </div>
          ))}
        </dl>
      )}
      <div className="mt-auto flex items-center justify-between gap-2 px-4 py-3">
        <Muted className="truncate">Trading account {sub.account}</Muted>
        <div className="flex shrink-0 gap-2">
          <Button variant="secondary" size="xs" aria-expanded={open} aria-controls={`${sub.id}-details`} onClick={() => setOpen((o) => !o)}>
            {open ? "Hide details" : "Show details"}
          </Button>
          <Button variant="secondary" size="xs" onClick={() => notYet("Subscription page")}>
            Open
          </Button>
        </div>
      </div>
    </Card>
  )
}

const col = createDataTableColumnHelper<Subscription>()
const columns = col.columns([
  col.accessor("product", {
    header: "Subscription",
    size: 240,
    cell: ({ row }) => (
      <div className="flex min-w-0 flex-col">
        <ValueText className="font-medium">{row.original.product}</ValueText>
        <span className="truncate text-xs text-(color:--content-muted)">{row.original.id}</span>
      </div>
    ),
  }),
  col.accessor("type", { header: "Type", size: 110, cell: (i) => <TypeBadge type={i.getValue()} /> }),
  col.accessor("status", {
    header: "Status",
    size: 100,
    cell: (i) => (
      <StatusDot tone={i.getValue() === "Active" ? "positive" : "neutral"} className="font-normal">
        {i.getValue()}
      </StatusDot>
    ),
  }),
  col.accessor("step", { header: "Step", size: 180, cell: (i) => <ValueText>{i.getValue()}</ValueText> }),
  col.accessor("account", { header: "Trading account", size: 190, cell: (i) => <ValueText>{i.getValue()}</ValueText> }),
  col.accessor("amount", { header: "Amount", size: 110, cell: (i) => <ValueText className="tabular-nums">{i.getValue()}</ValueText> }),
  col.accessor("payment", { header: "Payment", size: 120, cell: (i) => <Payment value={i.getValue()} /> }),
  col.accessor("bought", { header: "Bought", size: 120, cell: (i) => <ValueDate date={i.getValue()} /> }),
  col.accessor("renewal", { header: "Renewal", size: 120, cell: (i) => (i.getValue() ? <ValueDate date={i.getValue()} /> : <Dash />) }),
  col.accessor("end", { header: "End", size: 120, cell: (i) => (i.getValue() ? <ValueDate date={i.getValue()} /> : <Dash />) }),
  col.display({
    id: "actions",
    size: 64,
    header: () => <span className="sr-only">Actions</span>,
    cell: ({ row }) => (
      <div className="flex justify-center" onClick={(e) => e.stopPropagation()}>
        <Dropdown
          label={`Actions for ${row.original.id}`}
          iconOnly={<OverflowMenuVertical />}
          align="end"
          search={false}
          value={null}
          options={[
            { value: "open", label: "Open subscription" },
            { value: "account", label: "Open trading account" },
            { value: "reset", label: "Add free reset" },
            { value: "cancel", label: "Cancel subscription", tone: "danger" },
          ]}
          onValueChange={(v) => notYet(v === "cancel" ? "Cancel subscription" : "This action")}
        />
      </div>
    ),
  }),
])
