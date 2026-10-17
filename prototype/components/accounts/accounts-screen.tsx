"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Add, Calendar, Close } from "@carbon/icons-react"

import { DataTable } from "@/components/data-table"
import { Dropdown, ExportMenu, TimeFilter } from "@/components/dropdown"
import { downloadCsv, downloadExcel } from "@/lib/export"
import type { Account, AccountStatus, AccountType, Family, Market, Provider } from "@/lib/accounts/data"
import {
  countAccountPanelFilters,
  emptyAccountFilters,
  queryAccounts,
  type AccountSearchField,
  type AccountsFilters,
  type AccountsTab,
  type CreatedFilter,
} from "@/lib/accounts/query"
import { TODAY } from "@/lib/users/data"
import type { DataTableProps } from "@/registry/iq/ui/data-table"
import { Button } from "@/registry/iq/ui/button"
import { FilterButton, FilterChip, FilterChipApplied, FilterGroup, FilterPanel, FilterResultsBar } from "@/registry/iq/ui/filter"
import { PageHeader } from "@/registry/iq/ui/page-header"
import { SearchBar } from "@/registry/iq/ui/search-bar"
import { StatCard } from "@/registry/iq/ui/stat-card"
import { Tabs, TabsLineList, TabsLineTrigger } from "@/registry/iq/ui/tabs"
import { toast } from "@/registry/iq/ui/toast"
import { Toolbar, ToolbarDivider } from "@/registry/iq/ui/toolbar"
import { accountStatusMeta, getAccountColumns, typeMeta, type AccountAction } from "./columns"

// Figma: Platform file · section Accounts (4333:112751), one frame per tab. KPI numbers are the frames' (all time).

const fmt = (n: number) => n.toLocaleString("en-US")

const TABS: { value: AccountsTab; label: string; tone: React.ComponentProps<typeof TabsLineTrigger>["tone"] }[] = [
  { value: "all", label: "All", tone: "accent" },
  { value: "challenge", label: "Challenge", tone: "accent" },
  { value: "funded", label: "Funded", tone: "info" },
  { value: "breached", label: "Breached", tone: "danger" },
  { value: "expiring", label: "Expiring", tone: "warning" },
  { value: "disabled", label: "Disabled", tone: "neutral" },
]

type Kpi = { title: string; value: string; caption: string; tone?: "positive" | "negative" }
const KPIS: Record<AccountsTab, Kpi[]> = {
  all: [
    { title: "Active accounts", value: "12,480", caption: "8,912 challenge · 3,568 funded" },
    { title: "Breach rate", value: "22.1%", caption: "3,574 of 16,150 accounts", tone: "negative" },
    { title: "Pass rate · 30 d", value: "9.4%", caption: "312 of 3,318 ended challenges" },
    { title: "Paid out", value: "2,514,806 $", caption: "all-time withdrawals" },
    { title: "Payout exposure", value: "2,169,245 $", caption: "if all funded withdrew today" },
  ],
  challenge: [
    { title: "In challenge", value: "8,912", caption: "1,204 started · 7 d" },
    { title: "Pass rate · 30 d", value: "9.4%", caption: "312 passed · 3,318 ended" },
    { title: "Near profit target", value: "214", caption: "80% or more of the target" },
    { title: "Expiring · 7 d", value: "418", caption: "5,604 $ in extensions at risk" },
  ],
  funded: [
    { title: "Payout exposure", value: "2,169,245 $", caption: "3,568 funded accounts" },
    { title: "Passes consistency", value: "1,682,410 $", caption: "2,731 accounts" },
    { title: "Hit profit target", value: "445,866 $", caption: "412 accounts" },
    { title: "Eligible now", value: "144,896 $", caption: "61 accounts can withdraw" },
  ],
  breached: [
    { title: "Breached · 7 d", value: "132", caption: "118 in the previous 7 d", tone: "negative" },
    { title: "Top cause", value: "Hard breach", caption: "61 of 132 · 46% · 3rd strike" },
    { title: "Median lifetime", value: "4.2 days", caption: "from start to breach" },
    { title: "Breach rate", value: "22.1%", caption: "3,574 of 16,150 accounts" },
  ],
  expiring: [
    { title: "Expiring · 7 d", value: "418", caption: "251 futures · 167 crypto" },
    { title: "Expire today", value: "61", caption: "extend or renew before 23:59 UTC", tone: "negative" },
    { title: "Extensions at risk", value: "5,604 $", caption: "251 × 19 $ futures · 167 × 5 $ crypto" },
    { title: "Extended · 30 d", value: "41%", caption: "of expiring accounts extended or renewed" },
  ],
  disabled: [
    { title: "Disabled · 7 d", value: "5", caption: "of 96 disabled accounts" },
    { title: "By risk team", value: "48", caption: "50% · prohibited practices" },
    { title: "Automatic", value: "31", caption: "inactivity, limits, chargebacks, provider sync" },
    { title: "By support or owner", value: "17", caption: "user requests and manual reviews" },
  ],
}

const searchScopes: { value: AccountSearchField; label: string }[] = [
  { value: "all", label: "All fields" },
  { value: "id", label: "Account ID" },
  { value: "user", label: "Owner" },
  { value: "login", label: "MT5 login" },
]
const marketOptions = [
  { value: "any", label: "Any market" },
  { value: "future", label: "Futures" },
  { value: "crypto", label: "Crypto" },
]
const FAMILIES: Family[] = ["Classic", "Classic DLL", "Classic Advanced", "Rapid", "Instant"]
const familyOptions = [{ value: "any", label: "Any family" }, ...FAMILIES.map((f) => ({ value: f, label: f }))]
export const createdOptions: { value: CreatedFilter; label: string }[] = [
  { value: "any", label: "All time" },
  { value: "24h", label: "Last 24 hours" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last month" },
  { value: "90d", label: "Last quarter" },
  { value: "12m", label: "Last year" },
]
const PROVIDERS: Provider[] = ["dxFeed", "MT5 - IQ", "VolumetricaFX"]
const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v])
const labelOf = (list: { value: string; label: string }[], v: string) => list.find((o) => o.value === v)?.label ?? v

type Sorting = NonNullable<DataTableProps<Account>["sorting"]>

export function AccountsScreen() {
  const router = useRouter()
  const [tab, setTab] = React.useState<AccountsTab>("all")
  const [filters, setFiltersState] = React.useState<AccountsFilters>(emptyAccountFilters)
  const [sorting, setSorting] = React.useState<Sorting>([])
  const [page, setPage] = React.useState({ pageIndex: 0, pageSize: 25 })
  const deferred = React.useDeferredValue(filters)

  const result = React.useMemo(
    () => queryAccounts({ tab, filters: deferred, sort: sorting[0] ? { id: sorting[0].id, desc: sorting[0].desc } : null, page: page.pageIndex, pageSize: page.pageSize }),
    [tab, deferred, sorting, page]
  )
  const countFor = React.useCallback((draft: AccountsFilters) => queryAccounts({ tab, filters: draft, sort: null, page: 0, pageSize: 0 }).total, [tab])

  const setFilters = (next: AccountsFilters) => {
    setFiltersState(next)
    setPage((p) => ({ ...p, pageIndex: 0 }))
  }
  const changeTab = (v: string) => {
    setTab(v as AccountsTab)
    setSorting([])
    setPage((p) => ({ ...p, pageIndex: 0 }))
  }

  const onAction = React.useCallback((a: Account, action: AccountAction) => {
    // Every row opens its profile; the menu actions open the matching overlay there.
    if (action === "view") return router.push(`/customers/accounts/${a.id}`)
    const labels: Record<AccountAction, string> = {
      view: "Account profile",
      extend: "Extend expiry",
      reset: "Reset account",
      limits: "Change rule limits",
      disable: "Disable account",
      enable: "Enable account",
    }
    toast.info(`${labels[action]}: open the account to confirm`, { description: a.id })
    router.push(`/customers/accounts/${a.id}?action=${action}`)
  }, [router])
  const columns = React.useMemo(() => getAccountColumns(tab, onAction), [tab, onAction])
  const mobileColumns = React.useMemo(() => getAccountColumns(tab, onAction, true), [tab, onAction])

  function exportFiles(choices: string[]) {
    const header = ["ID", "Parent", "MT5 login", "User", "Country", "Rule", "Market", "Account type", "Status", "Provider", "Drawdown used", "Drawdown limit", "Balance", "Created"]
    const row = (a: Account) => [a.id, a.parentId, a.mt5Login, a.user, a.country.toUpperCase(), `${a.family} · ${a.size}K`, a.market, typeMeta[a.type].label, accountStatusMeta[a.status].label, a.provider, a.drawdown.used, a.drawdown.limit, a.balance, a.created]
    const stamp = TODAY.toISOString().slice(0, 10)
    let total = 0
    for (const choice of choices) {
      const [scope, format] = choice.split("-") as ["view" | "all", "csv" | "xlsx"]
      const rows = queryAccounts({ tab: scope === "view" ? tab : "all", filters: scope === "view" ? filters : emptyAccountFilters, sort: null, page: 0, pageSize: Number.MAX_SAFE_INTEGER }).rows
      const name = `accounts-${scope === "view" ? `${tab}-view` : "all"}-${stamp}`
      if (format === "csv") downloadCsv(name, header, rows.map(row))
      else downloadExcel(name, "Accounts", header, rows.map(row))
      total = Math.max(total, rows.length)
    }
    toast.success(`Exported ${fmt(total)} accounts`, { description: "Download started" })
  }
  const exportMenu = (
    <ExportMenu
      options={[
        { value: "view-csv", label: "Current view · CSV" },
        { value: "view-xlsx", label: "Current view · Excel" },
        { value: "all-csv", label: "All accounts · CSV" },
        { value: "all-xlsx", label: "All accounts · Excel" },
      ]}
      onExport={exportFiles}
    />
  )
  const newAccount = () => toast.info("New account opens from the user profile in this prototype", { description: "Users → profile → Actions → New trading account" })
  const chips = appliedChips(filters, setFilters)
  const tableProps = {
    data: result.rows,
    getRowId: (row: Account) => row.id,
    sorting,
    onSortingChange: (u: Sorting | ((s: Sorting) => Sorting)) => {
      setSorting(typeof u === "function" ? u(sorting) : u)
      setPage((p) => ({ ...p, pageIndex: 0 }))
    },
    manualSorting: true,
    onRowClick: (row: { original: Account }) => onAction(row.original, "view"),
    emptyState: {
      title: "No accounts match",
      description: "Try another search or remove a filter.",
      action: (
        <Button variant="secondary" size="sm" onClick={() => setFilters(emptyAccountFilters)}>
          Clear filters
        </Button>
      ),
    },
    pagination: {
      state: page,
      onChange: (u: typeof page | ((p: typeof page) => typeof page)) => setPage(typeof u === "function" ? u(page) : u),
      manual: { rowCount: result.total },
      layout: "input" as const,
      pageSizeOptions: [25, 50, 100],
      showPageSize: true,
    },
  }

  const tabs = (
    <Tabs value={tab} onValueChange={changeTab} className="gap-0">
      <TabsLineList aria-label="Account views" className="border-x border-(--border-divider) bg-(--surface-raised) max-lg:w-max max-lg:border-0 max-lg:bg-transparent max-lg:px-4">
        {TABS.map((t) => (
          <TabsLineTrigger key={t.value} value={t.value} tone={t.tone} count={fmt(result.tabCounts[t.value])}>
            {t.label}
          </TabsLineTrigger>
        ))}
      </TabsLineList>
    </Tabs>
  )
  const filterDropdowns = (
    <>
      <Dropdown label="Market" placeholder="Market" hideLabel search={false} options={marketOptions} value={filters.market === "any" ? null : filters.market} onValueChange={(v) => setFilters({ ...filters, market: v as Market | "any" })} />
      <Dropdown label="Family" placeholder="Family" hideLabel search={false} options={familyOptions} value={filters.family === "any" ? null : filters.family} onValueChange={(v) => setFilters({ ...filters, family: v as Family | "any" })} />
    </>
  )

  return (
    <div data-page="flush" className="flex min-h-full flex-col">
      {/* ── Phone (same pattern as Users mobile) ── */}
      <div data-slot="accounts-mobile" data-touch-actions="" className="flex min-h-full flex-col lg:hidden">
        <header className="flex flex-col gap-1.5 px-4 pt-5 pb-3">
          <p className="text-xs leading-[18px] text-(color:--content-muted)">Customers &amp; transactions</p>
          <div className="flex items-center gap-2">
            <h1 className="flex-1 text-2xl leading-8 font-medium text-(color:--content-default)">Accounts</h1>
            <TimeFilter label="Created" icon={<Calendar />} align="end" options={createdOptions} value={filters.created} onValueChange={(v) => setFilters({ ...filters, created: v as CreatedFilter })} />
            <Button size="sm" onClick={newAccount}>
              New
              <Add />
            </Button>
          </div>
        </header>
        <div data-kpi-scroll className="scroll-no-arrows overflow-x-auto px-4 pb-1">
          <section aria-label="Key numbers" className="flex w-max [&>*]:w-[200px] [&>*:not(:first-child)]:-ml-px">
            {KPIS[tab].map((k) => (
              <StatCard key={k.title} title={k.title} value={k.value} caption={k.caption} valueTone={k.tone} />
            ))}
          </section>
        </div>
        <div className="no-scrollbar mt-4 overflow-x-auto border-b border-(--border-divider)">{tabs}</div>
        <div className="flex flex-col gap-2 px-4 pt-3 pb-2">
          <SearchBar placeholder="Search ID, owner or login" aria-label="Search accounts" value={filters.search} onValueChange={(v) => setFilters({ ...filters, search: v })} />
          <div className="no-scrollbar -mx-4 flex items-center gap-2 overflow-x-auto px-4 py-1 [&>*]:shrink-0">
            {filterDropdowns}
            <MoreFilters filters={filters} onApply={setFilters} countFor={countFor} />
          </div>
        </div>
        {chips.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 px-4 pb-2">
            {chips.map((c) => (
              <FilterChipApplied key={c.key} label={c.label} value={c.value} onRemove={c.clear} />
            ))}
            <Button variant="ghost" size="sm" onClick={() => setFilters(emptyAccountFilters)}>
              Clear all
            </Button>
          </div>
        )}
        <p className="px-4 py-2 text-sm leading-5 text-(color:--content-muted)">{fmt(result.total)} accounts</p>
        <DataTable className="min-w-0 flex-1 border-t border-(--border-divider)" columns={mobileColumns} {...tableProps} />
      </div>

      {/* ── Desktop (Figma 1920 frames) ── */}
      <div className="contents max-lg:hidden">
        <PageHeader
          title="Accounts"
          actions={<TimeFilter label="Created" placeholderWhenAny="Created · All time" icon={<Calendar />} align="end" options={createdOptions} value={filters.created} onValueChange={(v) => setFilters({ ...filters, created: v as CreatedFilter })} />}
        />
        <section aria-label="Key numbers" className="flex [&>*]:h-[140px] [&>*]:min-w-0 [&>*]:flex-1 [&>*:not(:first-child)]:-ml-px">
          {KPIS[tab].map((k) => (
            <StatCard key={k.title} title={k.title} value={k.value} caption={k.caption} valueTone={k.tone} />
          ))}
        </section>
        {tabs}
        <Toolbar
          className="relative z-10 -mt-px"
          filters={
            <>
              <div className="w-[398px] max-w-full">
                <SearchBar
                  placeholder="Search ID, owner, email or login"
                  aria-label="Search accounts"
                  value={filters.search}
                  onValueChange={(v) => setFilters({ ...filters, search: v })}
                  scope={{ label: "Search in", options: searchScopes, value: filters.field, onValueChange: (v) => setFilters({ ...filters, field: v as AccountSearchField }) }}
                />
              </div>
              {filterDropdowns}
              <ToolbarDivider />
              <div className="flex items-center">
                <MoreFilters filters={filters} onApply={setFilters} countFor={countFor} />
                {countAccountPanelFilters(filters) > 0 && (
                  <button
                    type="button"
                    aria-label="Clear more filters"
                    onClick={() => setFilters({ ...filters, types: [], statuses: [], providers: [] })}
                    className="relative -ml-px inline-flex h-(--button-size-sm-height) cursor-pointer items-center rounded-r-(--button-radius-control) border border-l-0 border-(--filter-chip-border-selected) bg-(--button-secondary-bg-default) pr-2.5 pl-1 text-(color:--badge-dismiss) outline-none hover:text-(color:--content-default)"
                  >
                    <Close size={16} />
                  </button>
                )}
              </div>
            </>
          }
          actions={
            <div className="flex items-center gap-2">
              {exportMenu}
              <Button size="sm" onClick={newAccount}>
                New account
              </Button>
            </div>
          }
        />
        {chips.length > 0 ? (
          <FilterResultsBar count={`${fmt(result.total)} accounts`} onClearAll={() => setFilters(emptyAccountFilters)} className="relative z-10 border-x border-b border-(--border-divider) bg-(--surface-raised)">
            {chips.map((c) => (
              <FilterChipApplied key={c.key} label={c.label} value={c.value} onRemove={c.clear} />
            ))}
          </FilterResultsBar>
        ) : (
          <p className="border-x border-b border-(--border-divider) px-4 py-4 text-sm text-(color:--content-muted)">
            <span className="font-medium text-(color:--content-default)">{fmt(result.total)}</span> accounts
          </p>
        )}
        <DataTable className="-mt-px min-w-0 flex-1" columns={columns} pinnedRight={["actions"]} {...tableProps} />
      </div>
    </div>
  )
}

function MoreFilters({ filters, onApply, countFor }: { filters: AccountsFilters; onApply: (f: AccountsFilters) => void; countFor: (f: AccountsFilters) => number }) {
  const [open, setOpen] = React.useState(false)
  const [draft, setDraft] = React.useState(filters)
  const count = React.useMemo(() => (open ? countFor(draft) : 0), [open, draft, countFor])
  const n = countAccountPanelFilters(filters)
  return (
    <FilterPanel
      open={open}
      onOpenChange={(next) => {
        if (next) setDraft(filters)
        setOpen(next)
      }}
      trigger={<FilterButton count={n} open={open} className={n > 0 ? "lg:rounded-r-none lg:border-r-0" : undefined} />}
      onClear={() => setDraft({ ...draft, types: [], statuses: [], providers: [] })}
      onCancel={() => setOpen(false)}
      applyLabel={`Show ${fmt(count)} results`}
      onApply={() => {
        onApply(draft)
        setOpen(false)
      }}
    >
      <FilterGroup label="Account type">
        <FilterChip neutral selected={draft.types.length === 0} onClick={() => setDraft({ ...draft, types: [] })}>
          Any type
        </FilterChip>
        {(Object.keys(typeMeta) as AccountType[]).map((t) => (
          <FilterChip key={t} selected={draft.types.includes(t)} onClick={() => setDraft({ ...draft, types: toggle(draft.types, t) })}>
            {typeMeta[t].label}
          </FilterChip>
        ))}
      </FilterGroup>
      <FilterGroup label="Status">
        <FilterChip neutral selected={draft.statuses.length === 0} onClick={() => setDraft({ ...draft, statuses: [] })}>
          Any status
        </FilterChip>
        {(Object.keys(accountStatusMeta) as AccountStatus[]).map((s) => (
          <FilterChip key={s} selected={draft.statuses.includes(s)} onClick={() => setDraft({ ...draft, statuses: toggle(draft.statuses, s) })}>
            {accountStatusMeta[s].label}
          </FilterChip>
        ))}
      </FilterGroup>
      <FilterGroup label="Provider">
        <FilterChip neutral selected={draft.providers.length === 0} onClick={() => setDraft({ ...draft, providers: [] })}>
          Any provider
        </FilterChip>
        {PROVIDERS.map((p) => (
          <FilterChip key={p} selected={draft.providers.includes(p)} onClick={() => setDraft({ ...draft, providers: toggle(draft.providers, p) })}>
            {p}
          </FilterChip>
        ))}
      </FilterGroup>
    </FilterPanel>
  )
}

function appliedChips(f: AccountsFilters, set: (f: AccountsFilters) => void) {
  const chips: { key: string; label: string; value: string; clear: () => void }[] = []
  if (f.search.trim()) chips.push({ key: "search", label: labelOf(searchScopes, f.field), value: `“${f.search.trim()}”`, clear: () => set({ ...f, search: "" }) })
  if (f.market !== "any") chips.push({ key: "market", label: "Market", value: labelOf(marketOptions, f.market), clear: () => set({ ...f, market: "any" }) })
  if (f.family !== "any") chips.push({ key: "family", label: "Family", value: f.family, clear: () => set({ ...f, family: "any" }) })
  if (f.created !== "any") chips.push({ key: "created", label: "Created", value: labelOf(createdOptions, f.created), clear: () => set({ ...f, created: "any" }) })
  if (f.types.length) chips.push({ key: "types", label: "Type", value: f.types.map((t) => typeMeta[t].label).join(", "), clear: () => set({ ...f, types: [] }) })
  if (f.statuses.length) chips.push({ key: "statuses", label: "Status", value: f.statuses.map((s) => accountStatusMeta[s].label).join(", "), clear: () => set({ ...f, statuses: [] }) })
  if (f.providers.length) chips.push({ key: "providers", label: "Provider", value: f.providers.join(", "), clear: () => set({ ...f, providers: [] }) })
  return chips
}
