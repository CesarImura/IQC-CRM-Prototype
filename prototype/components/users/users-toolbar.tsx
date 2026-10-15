"use client"

import * as React from "react"
import { Calendar, Close } from "@carbon/icons-react"

import type { Role, UtmSource } from "@/lib/users/data"
import {
  countPanelFilters,
  emptyFilters,
  type AccountsFilter,
  type AffiliateFilter,
  type RegisteredFilter,
  type SearchField,
  type UsersFilters,
} from "@/lib/users/query"
import { Dropdown, TimeFilter } from "@/components/dropdown"
import { FilterButton, FilterChip, FilterChipApplied, FilterGroup, FilterPanel, FilterResultsBar } from "@/registry/iq/ui/filter"
import { SearchBar } from "@/registry/iq/ui/search-bar"
import { Toolbar, ToolbarDivider } from "@/registry/iq/ui/toolbar"
import { roleMeta, statusMeta, utmLabels } from "./columns"

const searchScopes: { value: SearchField; label: string }[] = [
  { value: "all", label: "All fields" },
  { value: "name", label: "Name" },
  { value: "email", label: "Email" },
  { value: "username", label: "Username" },
  { value: "id", label: "User ID" },
]

// Option lists follow the hidden panels in the Figma frame (Accounts · panel, Status · panel, …).
const accountOptions: { value: AccountsFilter; label: string; group?: string }[] = [
  { value: "any", label: "Any account" },
  { value: "challenge", label: "Challenge", group: "Account type" },
  { value: "funding", label: "Funding", group: "Account type" },
  { value: "instant_funding", label: "Instant Funding", group: "Account type" },
  { value: "reset", label: "Reset", group: "Account type" },
  { value: "breached", label: "Breached", group: "Account type" },
  { value: "has_accounts", label: "Active", group: "Account state" },
  { value: "no_accounts", label: "No accounts", group: "Account state" },
]
const statusOptions = [
  { value: "any", label: "Any status" },
  ...Object.entries(statusMeta).map(([value, m]) => ({ value, label: m.label })),
]
const registeredOptions: { value: RegisteredFilter; label: string }[] = [
  { value: "any", label: "Any time" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
  { value: "12m", label: "Last 12 months" },
]
const roleOptions = Object.entries(roleMeta).map(([value, m]) => ({ value: value as Role, label: m.label }))
const utmOptions = Object.entries(utmLabels).map(([value, label]) => ({ value: value as UtmSource | "none", label }))
const affiliateOptions: { value: AffiliateFilter; label: string }[] = [
  { value: "any", label: "Any" },
  { value: "with", label: "With affiliate" },
  { value: "without", label: "Without affiliate" },
]

const labelOf = <T extends string>(list: { value: T; label: string }[], value: T) => list.find((o) => o.value === value)?.label ?? value
const toggle = <T,>(list: T[], value: T) => (list.includes(value) ? list.filter((v) => v !== value) : [...list, value])
const rangeFormat = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" })

type UsersToolbarProps = {
  filters: UsersFilters
  onFiltersChange: (filters: UsersFilters) => void
  /** Counts results for a draft (the panel's "Show N results"). */
  countFor: (filters: UsersFilters) => number
  exportMenu: React.ReactNode
}

export function UsersToolbar({ filters, onFiltersChange, countFor, exportMenu }: UsersToolbarProps) {
  const set = <K extends keyof UsersFilters>(key: K, value: UsersFilters[K]) => onFiltersChange({ ...filters, [key]: value })

  return (
    <Toolbar
      className="relative z-10 -mt-px max-lg:flex-wrap max-lg:[&>[data-slot=toolbar-filters]]:contents"
      filters={
        <>
          <div className="w-[398px] max-w-full max-lg:w-full">
            <SearchBar
              placeholder="Search name, email, username or ID"
              aria-label="Search users"
              value={filters.search}
              onValueChange={(v) => set("search", v)}
              scope={{ label: "Search in", options: searchScopes, value: filters.field, onValueChange: (v) => set("field", v as SearchField) }}
            />
          </div>
          <div className="contents max-lg:no-scrollbar max-lg:-my-1 max-lg:flex max-lg:min-w-0 max-lg:flex-1 max-lg:items-center max-lg:gap-(--toolbar-gap) max-lg:overflow-x-auto max-lg:py-1">
          <Dropdown
            label="Accounts"
            placeholder="Accounts"
            hideLabel
            search={false}
            options={accountOptions}
            value={filters.accounts === "any" ? null : filters.accounts}
            onValueChange={(v) => set("accounts", v as AccountsFilter)}
          />
          <Dropdown
            label="Status"
            placeholder="Status"
            hideLabel
            search={false}
            options={statusOptions}
            value={filters.status === "any" ? null : filters.status}
            onValueChange={(v) => set("status", v as UsersFilters["status"])}
          />
          <TimeFilter
            label="Registered"
            placeholderWhenAny="Registered"
            icon={<Calendar />}
            options={registeredOptions}
            value={filters.registered}
            onValueChange={(v) => set("registered", v as RegisteredFilter)}
          />
          <ToolbarDivider className="max-lg:hidden" />
          <div className="flex items-center">
            <MoreFilters filters={filters} onApply={onFiltersChange} countFor={countFor} />
            {countPanelFilters(filters) > 0 && (
              <button
                type="button"
                aria-label="Clear more filters"
                title="Clear more filters"
                onClick={() => onFiltersChange({ ...filters, roles: [], affiliate: "any", affiliateEmail: "", utm: [] })}
                className="relative -ml-px inline-flex h-(--button-size-sm-height) cursor-pointer items-center rounded-r-(--button-radius-control) border border-l-0 border-(--filter-chip-border-selected) bg-(--button-secondary-bg-default) pr-2.5 pl-1 text-(color:--badge-dismiss) outline-none hover:text-(color:--content-default) focus-visible:shadow-[0_0_0_var(--focus-spread)_var(--focus-ring)]"
              >
                <Close size={16} />
              </button>
            )}
          </div>
          </div>
        </>
      }
      actions={exportMenu}
    />
  )
}

function MoreFilters({ filters, onApply, countFor }: { filters: UsersFilters; onApply: (f: UsersFilters) => void; countFor: (f: UsersFilters) => number }) {
  const [open, setOpen] = React.useState(false)
  const [draft, setDraft] = React.useState(filters)
  const count = React.useMemo(() => (open ? countFor(draft) : 0), [open, draft, countFor])

  function openChange(next: boolean) {
    if (next) setDraft(filters)
    setOpen(next)
  }

  return (
    <FilterPanel
      open={open}
      onOpenChange={openChange}
      trigger={<FilterButton count={countPanelFilters(filters)} open={open} className={countPanelFilters(filters) > 0 ? "rounded-r-none border-r-0" : undefined} />}
      onClear={() => setDraft({ ...draft, roles: [], affiliate: "any", affiliateEmail: "", utm: [] })}
      onCancel={() => setOpen(false)}
      applyLabel={`Show ${count.toLocaleString("en-US")} results`}
      onApply={() => {
        onApply(draft)
        setOpen(false)
      }}
    >
      <FilterGroup label="Roles">
        <FilterChip neutral selected={draft.roles.length === 0} onClick={() => setDraft({ ...draft, roles: [] })}>
          Any role
        </FilterChip>
        {roleOptions.map((o) => (
          <FilterChip key={o.value} selected={draft.roles.includes(o.value)} onClick={() => setDraft({ ...draft, roles: toggle(draft.roles, o.value) })}>
            {o.label}
          </FilterChip>
        ))}
      </FilterGroup>

      <FilterGroup
        label="Affiliate"
        search={
          <SearchBar
            placeholder="Search affiliate email"
            aria-label="Search affiliate email"
            value={draft.affiliateEmail}
            onValueChange={(v) => setDraft({ ...draft, affiliateEmail: v })}
          />
        }
      >
        {affiliateOptions.map((o) => (
          <FilterChip
            key={o.value}
            neutral={o.value === "any"}
            selected={draft.affiliate === o.value}
            onClick={() => setDraft({ ...draft, affiliate: o.value })}
          >
            {o.label}
          </FilterChip>
        ))}
      </FilterGroup>

      <FilterGroup label="UTM Source">
        <FilterChip neutral selected={draft.utm.length === 0} onClick={() => setDraft({ ...draft, utm: [] })}>
          Any source
        </FilterChip>
        {utmOptions.map((o) => (
          <FilterChip key={o.value} selected={draft.utm.includes(o.value)} onClick={() => setDraft({ ...draft, utm: toggle(draft.utm, o.value) })}>
            {o.label}
          </FilterChip>
        ))}
      </FilterGroup>
    </FilterPanel>
  )
}

/** Applied filters as removable chips, plus the result count. Hidden while nothing is filtered. */
export function UsersResultsBar({ filters, onFiltersChange, total }: { filters: UsersFilters; onFiltersChange: (f: UsersFilters) => void; total: number }) {
  const reset = (patch: Partial<UsersFilters>) => onFiltersChange({ ...filters, ...patch })
  const chips: { key: string; label: string; value: string; clear: () => void }[] = []

  if (filters.search.trim())
    chips.push({ key: "search", label: labelOf(searchScopes, filters.field), value: `“${filters.search.trim()}”`, clear: () => reset({ search: "" }) })
  if (filters.period.from)
    chips.push({
      key: "period",
      label: "Period",
      value: `${rangeFormat.format(filters.period.from)} – ${filters.period.to ? rangeFormat.format(filters.period.to) : "…"}`,
      clear: () => reset({ period: emptyFilters.period }),
    })
  if (filters.accounts !== "any") chips.push({ key: "accounts", label: "Accounts", value: labelOf(accountOptions, filters.accounts), clear: () => reset({ accounts: "any" }) })
  if (filters.status !== "any") chips.push({ key: "status", label: "Status", value: statusMeta[filters.status].label, clear: () => reset({ status: "any" }) })
  if (filters.registered !== "any")
    chips.push({ key: "registered", label: "Registered", value: labelOf(registeredOptions, filters.registered), clear: () => reset({ registered: "any" }) })
  if (filters.roles.length)
    chips.push({ key: "roles", label: "Roles", value: filters.roles.map((r) => roleMeta[r].label).join(", "), clear: () => reset({ roles: [] }) })
  if (filters.affiliate !== "any" || filters.affiliateEmail.trim())
    chips.push({
      key: "affiliate",
      label: "Affiliate",
      value: filters.affiliateEmail.trim() || labelOf(affiliateOptions, filters.affiliate),
      clear: () => reset({ affiliate: "any", affiliateEmail: "" }),
    })
  if (filters.utm.length) chips.push({ key: "utm", label: "UTM", value: filters.utm.map((u) => utmLabels[u]).join(", "), clear: () => reset({ utm: [] }) })

  if (chips.length === 0) return null
  return (
    <FilterResultsBar count={`${total.toLocaleString("en-US")} users`} onClearAll={() => onFiltersChange(emptyFilters)} className="relative z-10 border-x border-b border-(--border-divider) bg-(--surface-raised)">
      {chips.map((c) => (
        <FilterChipApplied key={c.key} label={c.label} value={c.value} onRemove={c.clear} />
      ))}
    </FilterResultsBar>
  )
}
