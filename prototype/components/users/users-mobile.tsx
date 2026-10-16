"use client"

// Users list on a phone, built from the Figma mobile frames (Platform file · 1. Users: "01m Users · … · Mobile ·
// Table / Cards", and "Smart filter · mobile" + "Sort · mobile" in 1. Users · How it works). Its own layout, not the
// desktop one squeezed: header with period + Add User, tabs, Search + Filters, results row (count · sort · view
// switch), table (default) or cards, and bottom sheets for filters and sort. Same state as the desktop screen.

import * as React from "react"
import { useRouter } from "next/navigation"
import { Add, ArrowsVertical, Calendar, ChevronRight, CloseOutline, Grid, List, Time } from "@carbon/icons-react"

import { BottomSheet } from "@/components/bottom-sheet"
import { MobilePagination } from "@/components/mobile-pagination"
import { TimeFilter } from "@/components/dropdown"
import { AFFILIATES, type User } from "@/lib/users/data"
import { emptyFilters, type AccountsFilter, type RegisteredFilter, type UsersFilters, type UsersResult, type UsersTab } from "@/lib/users/query"
import { Badge } from "@/registry/iq/ui/badge"
import { Button } from "@/registry/iq/ui/button"
import { DataTable, type DataTableProps } from "@/registry/iq/ui/data-table"
import { FilterButton, FilterChip, FilterChipApplied } from "@/registry/iq/ui/filter"
import { OptionGroup, OptionItem, OptionPanel, OptionPanelList } from "@/registry/iq/ui/option-panel"
import { SearchBar } from "@/registry/iq/ui/search-bar"
import { Tabs, TabsLineList, TabsLineTrigger, TabsPillList, TabsPillTrigger } from "@/registry/iq/ui/tabs"
import { dateFormat, getMobileUserColumns, roleMeta, RowActions, statusMeta, utmLabels, type RowAction } from "./columns"
import { accountOptions, affiliateOptions, appliedChips, registeredOptions, roleOptions, utmOptions } from "./users-toolbar"

const fmt = (n: number) => n.toLocaleString("en-US")

type Sorting = NonNullable<DataTableProps<User>["sorting"]>
type Page = { pageIndex: number; pageSize: number }

// Sort · mobile (S2): grouped by the table columns, single choice, applies at once. Newest = no explicit sort.
const sortGroups = [
  { heading: "Registered", items: [{ key: "newest", label: "Newest first", short: "Newest", sort: [] }, { key: "oldest", label: "Oldest first", short: "Oldest", sort: [{ id: "registered", desc: false }] }] },
  { heading: "Name", items: [{ key: "az", label: "A to Z", short: "Name A–Z", sort: [{ id: "name", desc: false }] }, { key: "za", label: "Z to A", short: "Name Z–A", sort: [{ id: "name", desc: true }] }] },
  { heading: "Accounts", items: [{ key: "most", label: "Most accounts", short: "Most accounts", sort: [{ id: "accounts", desc: true }] }, { key: "fewest", label: "Fewest accounts", short: "Fewest accounts", sort: [{ id: "accounts", desc: false }] }] },
] satisfies { heading: string; items: { key: string; label: string; short: string; sort: Sorting }[] }[]
const sortItems = sortGroups.flatMap((g) => g.items)
const sortKeyOf = (s: Sorting) => sortItems.find((i) => i.sort.length === s.length && i.sort.every((x, n) => x.id === s[n].id && x.desc === s[n].desc))?.key ?? "newest"

// Filters sheet (F3) chip lists: "Any …" first and neutral; one choice per group.
const accountChips = accountOptions.filter((o) => !o.group || o.group === "Account state")
const accountTypeChips = accountOptions.filter((o) => o.group === "Account type")
const statusChips = Object.entries(statusMeta).map(([value, m]) => ({ value: value as UsersFilters["status"], label: m.label }))
const registeredChips: { value: RegisteredFilter; label: string }[] = [
  { value: "any", label: "Any time" },
  { value: "24h", label: "Today" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
  { value: "12m", label: "Last year" },
]
const clearSheet = (f: UsersFilters): UsersFilters => ({ ...emptyFilters, search: f.search, field: f.field, period: f.period })
const sheetCount = (f: UsersFilters) =>
  (f.accounts !== "any" ? 1 : 0) + (f.status !== "any" ? 1 : 0) + (f.registered !== "any" ? 1 : 0) + (f.roles.length ? 1 : 0) + (f.affiliate !== "any" || f.affiliateEmail.trim() ? 1 : 0) + (f.utm.length ? 1 : 0)

type UsersMobileProps = {
  tab: UsersTab
  onTabChange: (tab: UsersTab) => void
  filters: UsersFilters
  onFiltersChange: (f: UsersFilters) => void
  countFor: (f: UsersFilters) => number
  sorting: Sorting
  onSortingChange: (s: Sorting) => void
  page: Page
  onPageChange: (p: Page) => void
  result: UsersResult
  onAction: (user: User, action: RowAction) => void
  onAddUser: () => void
}

export function UsersMobile(props: UsersMobileProps) {
  const { tab, onTabChange, filters, onFiltersChange, sorting, onSortingChange, page, onPageChange, result, onAction } = props
  const router = useRouter()
  const [view, setView] = React.useState<"table" | "cards">("table")
  const [filtersOpen, setFiltersOpen] = React.useState(false)
  const [sortOpen, setSortOpen] = React.useState(false)
  const columns = React.useMemo(() => getMobileUserColumns(onAction), [onAction])
  const chips = appliedChips({ ...filters, search: "" }, onFiltersChange)
  const sortKey = sortKeyOf(sorting)
  const open = (u: User) => router.push(`/customers/users/${u.id}`)

  return (
    <div data-slot="users-mobile" className="flex min-h-full flex-col lg:hidden">
      {/* Page header: eyebrow, title, period and Add User on one row. */}
      <header className="flex flex-col gap-1.5 px-4 pt-5 pb-3">
        <p className="text-xs leading-[18px] text-(color:--content-muted)">Customers &amp; transactions</p>
        <div className="flex items-center gap-2">
          <h1 className="flex-1 text-2xl leading-8 font-medium text-(color:--content-default)">Users</h1>
          <TimeFilter label="Period" icon={<Calendar />} align="end" options={registeredOptions} value={filters.registered} onValueChange={(v) => onFiltersChange({ ...filters, registered: v as RegisteredFilter })} />
          <Button size="sm" onClick={props.onAddUser}>
            Add User
            <Add />
          </Button>
        </div>
      </header>

      <Tabs value={tab} onValueChange={(v) => onTabChange(v as UsersTab)} className="gap-0">
        <div className="no-scrollbar overflow-x-auto border-b border-(--border-divider)">
          <TabsLineList aria-label="User views" className="w-max border-b-0 px-4">
            <TabsLineTrigger value="all" tone="accent" icon={<List />} count={fmt(result.tabCounts.all)}>
              All
            </TabsLineTrigger>
            <TabsLineTrigger value="needs_action" tone="warning" icon={<Time />} count={fmt(result.tabCounts.needs_action)}>
              Needs action
            </TabsLineTrigger>
            <TabsLineTrigger value="banned" tone="danger" icon={<CloseOutline />} count={fmt(result.tabCounts.banned)}>
              Banned
            </TabsLineTrigger>
          </TabsLineList>
        </div>
      </Tabs>

      {/* Search row: full-width search + Filters (count of applied filters). */}
      <div className="flex items-center gap-2 px-4 pt-3 pb-2">
        <div className="min-w-0 flex-1">
          <SearchBar placeholder="Search users" aria-label="Search users" value={filters.search} onValueChange={(v) => onFiltersChange({ ...filters, search: v })} />
        </div>
        <FilterButton label="Filters" count={sheetCount(filters)} open={filtersOpen} onClick={() => setFiltersOpen(true)} />
      </div>

      {/* F5: applied filters as removable chips under the search, with Clear all. */}
      {chips.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 px-4 pb-2">
          {chips.map((c) => (
            <FilterChipApplied key={c.key} label={c.label} value={c.value} onRemove={c.clear} />
          ))}
          <Button variant="ghost" size="sm" onClick={() => onFiltersChange(clearSheet(filters))}>
            Clear all
          </Button>
        </div>
      )}

      {/* Results row: count · sort (shows the current order) · view switch. */}
      <div className="flex items-center gap-2 px-4 py-2">
        <p className="min-w-0 flex-1 truncate text-sm leading-5 text-(color:--content-muted)">{fmt(result.total)} users</p>
        <Button variant="ghost" size="sm" onClick={() => setSortOpen(true)} aria-label={`Sort: ${sortItems.find((i) => i.key === sortKey)!.label}`}>
          <ArrowsVertical />
          {sortItems.find((i) => i.key === sortKey)!.short}
        </Button>
        <Tabs value={view} onValueChange={(v) => setView(v as "table" | "cards")}>
          <TabsPillList size="sm" aria-label="View">
            <TabsPillTrigger value="cards" aria-label="Cards" className="w-11 px-0">
              <Grid />
            </TabsPillTrigger>
            <TabsPillTrigger value="table" aria-label="Table" className="w-11 px-0">
              <List />
            </TabsPillTrigger>
          </TabsPillList>
        </Tabs>
      </div>

      {view === "table" ? (
        <DataTable
          className="min-w-0 flex-1 border-t border-(--border-divider)"
          columns={columns}
          data={result.rows}
          getRowId={(row) => row.id}
          sorting={sorting}
          onSortingChange={(updater) => onSortingChange(typeof updater === "function" ? updater(sorting) : updater)}
          manualSorting
          onRowClick={(row) => open(row.original)}
          emptyState={{
            title: "No users match",
            description: "Try another search or remove a filter.",
            action: (
              <Button variant="secondary" size="sm" onClick={() => onFiltersChange(emptyFilters)}>
                Clear filters
              </Button>
            ),
          }}
          pagination={false}
        />
      ) : null}
      {view === "table" && result.total > 0 && <MobilePagination pageIndex={page.pageIndex} pageSize={page.pageSize} total={result.total} onChange={onPageChange} />}
      {view === "cards" && (
        <div className="flex flex-1 flex-col">
          <ul className="flex flex-col gap-4 px-4 pt-2 pb-4">
            {result.rows.map((u) => (
              <UserCard key={u.id} user={u} onOpen={() => open(u)} onAction={onAction} />
            ))}
          </ul>
          {result.total === 0 ? (
            <div className="flex flex-col items-center gap-3 px-4 py-12 text-center">
              <p className="text-sm font-medium text-(color:--content-default)">No users match</p>
              <p className="text-sm text-(color:--content-muted)">Try another search or remove a filter.</p>
              <Button variant="secondary" size="sm" onClick={() => onFiltersChange(emptyFilters)}>
                Clear filters
              </Button>
            </div>
          ) : (
            <MobilePagination
              pageIndex={page.pageIndex}
              pageSize={page.pageSize}
              total={result.total}
              onChange={(p) => {
                onPageChange(p)
                window.scrollTo?.(0, 0)
              }}
            />
          )}
        </div>
      )}

      <FiltersSheet open={filtersOpen} onOpenChange={setFiltersOpen} filters={filters} onApply={onFiltersChange} countFor={props.countFor} />

      <BottomSheet open={sortOpen} onOpenChange={setSortOpen} title="Sort by" action={{ label: "Reset", onClick: () => (onSortingChange([]), setSortOpen(false)), disabled: sortKey === "newest" }}>
        <OptionPanel aria-label="Sort by" className="rounded-none border-0 bg-transparent px-4 pt-3 pb-6 backdrop-blur-none">
          <OptionPanelList className="max-h-none overflow-visible">
            {sortGroups.map((g) => (
              <OptionGroup key={g.heading} heading={g.heading} size="md" className="[&_[cmdk-group-heading]]:px-0 [&+&]:mt-3">
                {g.items.map((i) => (
                  <OptionItem
                    key={i.key}
                    value={i.key}
                    size="md"
                    label={i.label}
                    selection="checkmark"
                    checked={i.key === sortKey}
                    onSelect={() => {
                      onSortingChange(i.sort)
                      setSortOpen(false)
                    }}
                  />
                ))}
              </OptionGroup>
            ))}
          </OptionPanelList>
        </OptionPanel>
      </BottomSheet>
    </div>
  )
}

/* -------------------------------------------------------------------------------------------------
 * Card (F2): avatar · name · email · ⋮, status + role badges, then Accounts / Registered / UTM Source.
 * -----------------------------------------------------------------------------------------------*/

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("")

function UserCard({ user, onOpen, onAction }: { user: User; onOpen: () => void; onAction: (user: User, action: RowAction) => void }) {
  const status = statusMeta[user.status]
  const role = roleMeta[user.role]
  return (
    <li
      data-reveal
      role="link"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => e.key === "Enter" && e.target === e.currentTarget && onOpen()}
      className="cursor-pointer rounded-[2px] border border-(--border-divider) bg-(--surface-raised) p-4 outline-none focus-visible:shadow-[0_0_0_var(--focus-spread)_var(--focus-ring)]"
    >
      <div className="flex items-start gap-3">
        <span aria-hidden="true" className="flex size-8 shrink-0 items-center justify-center rounded-full bg-(--table-avatar-bg) text-xs font-medium text-white/80">
          {initials(user.name)}
        </span>
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-sm leading-5 font-medium text-(color:--content-default)">{user.name}</span>
          <span className="truncate text-[13px] leading-5 text-(color:--content-muted)">{user.email}</span>
        </div>
        <div className="-mt-0.5 -mr-1 [&>div]:justify-end">
          <RowActions user={user} onAction={onAction} />
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Badge color={status.color}>{status.label}</Badge>
        <Badge color={role.color}>{role.label}</Badge>
      </div>
      <dl className="mt-4 grid grid-cols-3 gap-3 border-t border-(--border-divider) pt-3">
        <CardStat label="Accounts" value={String(user.accounts)} />
        <CardStat label="Registered" value={dateFormat.format(new Date(user.registered))} />
        <CardStat label="UTM Source" value={user.utm ? utmLabels[user.utm] : "—"} muted={!user.utm} />
      </dl>
    </li>
  )
}

function CardStat({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <dt className="truncate text-xs leading-4 text-(color:--content-muted)">{label}</dt>
      <dd className={muted ? "text-sm leading-5 text-(color:--content-disabled)" : "truncate text-sm leading-5 text-(color:--content-default)"}>{value}</dd>
    </div>
  )
}

/* -------------------------------------------------------------------------------------------------
 * Filters sheet (F3) + Affiliate / UTM sub-sheets (F4). Works on a draft; Show results applies and closes.
 * -----------------------------------------------------------------------------------------------*/

function FiltersSheet({
  open,
  onOpenChange,
  filters,
  onApply,
  countFor,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  filters: UsersFilters
  onApply: (f: UsersFilters) => void
  countFor: (f: UsersFilters) => number
}) {
  const [draft, setDraft] = React.useState(filters)
  const [sub, setSub] = React.useState<null | "affiliate" | "utm">(null)
  const count = React.useMemo(() => (open ? countFor(draft) : 0), [open, draft, countFor])
  const set = (patch: Partial<UsersFilters>) => setDraft((d) => ({ ...d, ...patch }))

  React.useEffect(() => {
    if (open) {
      setDraft(filters)
      setSub(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  // One choice per group; tapping the chosen chip again goes back to "Any".
  const pick = <T extends string>(current: T, value: T, any: T) => (current === value ? any : value)
  const affiliateValue = draft.affiliateEmail.trim() || (draft.affiliate === "any" ? "Any affiliate" : affiliateOptions.find((o) => o.value === draft.affiliate)!.label)
  const utmValue = draft.utm.length ? utmLabels[draft.utm[0]] : "Any source"

  const footer = (
    <Button className="w-full" onClick={() => (onApply(draft), onOpenChange(false))}>
      Show {fmt(count)} results
    </Button>
  )

  if (sub === "affiliate") {
    const q = draft.affiliateEmail.trim().toLowerCase()
    const referrers = AFFILIATES.filter((a) => !q || a.includes(q))
    return (
      <BottomSheet open={open} onOpenChange={onOpenChange} tall title="Affiliate" leading="back" onBack={() => setSub(null)} action={{ label: "Clear", onClick: () => set({ affiliate: "any", affiliateEmail: "" }) }} footer={footer}>
        <div className="flex flex-col gap-3 px-4 pt-4 pb-6">
          <SearchBar placeholder="Search affiliate email" aria-label="Search affiliate email" value={draft.affiliateEmail} onValueChange={(v) => set({ affiliateEmail: v, affiliate: "any" })} />
          <OptionPanel aria-label="Affiliate" shouldFilter={false} className="rounded-none border-0 bg-transparent p-0 backdrop-blur-none">
            <OptionPanelList className="max-h-none overflow-visible">
              {affiliateOptions.map((o) => (
                <OptionItem
                  key={o.value}
                  value={o.value}
                  size="md"
                  label={o.value === "any" ? "Any affiliate" : o.label}
                  selection="checkmark"
                  checked={!draft.affiliateEmail.trim() && draft.affiliate === o.value}
                  onSelect={() => (set({ affiliate: o.value, affiliateEmail: "" }), setSub(null))}
                />
              ))}
              <OptionGroup heading="Referred by" size="md" className="mt-3 [&_[cmdk-group-heading]]:px-0">
                {referrers.map((a) => (
                  <OptionItem
                    key={a}
                    value={a}
                    size="md"
                    label={a}
                    secondary={`${fmt(countFor({ ...emptyFilters, affiliateEmail: a }))} users`}
                    selection="checkmark"
                    checked={draft.affiliateEmail.trim().toLowerCase() === a}
                    onSelect={() => (set({ affiliate: "any", affiliateEmail: a }), setSub(null))}
                  />
                ))}
              </OptionGroup>
            </OptionPanelList>
          </OptionPanel>
        </div>
      </BottomSheet>
    )
  }

  if (sub === "utm") {
    return (
      <BottomSheet open={open} onOpenChange={onOpenChange} tall title="UTM Source" leading="back" onBack={() => setSub(null)} action={{ label: "Clear", onClick: () => set({ utm: [] }) }} footer={footer}>
        <OptionPanel aria-label="UTM Source" className="rounded-none border-0 bg-transparent px-4 pt-4 pb-6 backdrop-blur-none">
          <OptionPanelList className="max-h-none overflow-visible">
            <OptionItem value="any" size="md" label="Any source" selection="checkmark" checked={draft.utm.length === 0} onSelect={() => (set({ utm: [] }), setSub(null))} />
            {utmOptions.map((o) => (
              <OptionItem key={o.value} value={o.value} size="md" label={o.label} selection="checkmark" checked={draft.utm[0] === o.value} onSelect={() => (set({ utm: [o.value] }), setSub(null))} />
            ))}
          </OptionPanelList>
        </OptionPanel>
      </BottomSheet>
    )
  }

  return (
    <BottomSheet open={open} onOpenChange={onOpenChange} tall title="Filters" action={{ label: "Clear all", onClick: () => setDraft(clearSheet(draft)), disabled: sheetCount(draft) === 0 }} footer={footer}>
      <div className="flex flex-col gap-6 px-4 pt-4 pb-6">
        <SheetSection title="Accounts">
          <Chips options={accountChips} value={draft.accounts} any="any" onPick={(v) => set({ accounts: pick(draft.accounts, v, "any" as AccountsFilter) })} />
          <p className="text-xs leading-4 text-(color:--content-muted)">Account type</p>
          <Chips options={accountTypeChips} value={draft.accounts} any="any" onPick={(v) => set({ accounts: pick(draft.accounts, v, "any" as AccountsFilter) })} />
        </SheetSection>
        <SheetSection title="Status">
          <Chips options={statusChips} value={draft.status} any="any" onPick={(v) => set({ status: pick(draft.status, v, "any") })} />
        </SheetSection>
        <SheetSection title="Registered">
          <Chips options={registeredChips} value={draft.registered} any="any" onPick={(v) => set({ registered: pick(draft.registered, v, "any") })} />
        </SheetSection>
        <SheetSection title="Roles">
          <Chips options={roleOptions} value={draft.roles[0] ?? ""} any="" onPick={(v) => set({ roles: draft.roles[0] === v ? [] : [v] })} />
        </SheetSection>
        <div className="flex flex-col border-y border-(--border-divider) [&>*+*]:border-t [&>*+*]:border-(--border-divider)">
          <SheetRow label="Affiliate" value={affiliateValue} onClick={() => setSub("affiliate")} />
          <SheetRow label="UTM Source" value={utmValue} onClick={() => setSub("utm")} />
        </div>
      </div>
    </BottomSheet>
  )
}

function SheetSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2.5">
      <h3 className="text-sm leading-5 font-medium text-white/72">{title}</h3>
      {children}
    </section>
  )
}

function Chips<T extends string>({ options, value, any, onPick }: { options: { value: T; label: string }[]; value: T | ""; any: T | ""; onPick: (v: T) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <FilterChip key={o.value} neutral={o.value === any} selected={o.value === value} onClick={() => onPick(o.value)}>
          {o.label}
        </FilterChip>
      ))}
    </div>
  )
}

function SheetRow({ label, value, onClick }: { label: string; value: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex h-13 cursor-pointer items-center gap-2 text-left outline-none focus-visible:shadow-[0_0_0_var(--focus-spread)_var(--focus-ring)]">
      <span className="flex-1 text-sm leading-5 font-medium text-white/72">{label}</span>
      <span className="max-w-[55%] truncate text-sm leading-5 text-(color:--content-muted)">{value}</span>
      <ChevronRight size={16} className="shrink-0 text-(color:--content-muted)" />
    </button>
  )
}
