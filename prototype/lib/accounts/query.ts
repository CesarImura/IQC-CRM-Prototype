// API-like query layer for the Accounts list (same shape as lib/users/query.ts).

import { TODAY } from "@/lib/users/data"
import { getAccounts, isExpiring, type Account, type AccountStatus, type AccountType, type Family, type Market, type Provider } from "./data"

export type AccountsTab = "all" | "challenge" | "funded" | "breached" | "expiring" | "disabled"
export type AccountSearchField = "all" | "id" | "user" | "login"
export type CreatedFilter = "any" | "24h" | "7d" | "30d" | "90d" | "12m"

export type AccountsFilters = {
  search: string
  field: AccountSearchField
  market: Market | "any"
  family: Family | "any"
  created: CreatedFilter
  types: AccountType[]
  statuses: AccountStatus[]
  providers: Provider[]
}

export const emptyAccountFilters: AccountsFilters = { search: "", field: "all", market: "any", family: "any", created: "any", types: [], statuses: [], providers: [] }
export const countAccountPanelFilters = (f: AccountsFilters) => (f.types.length ? 1 : 0) + (f.statuses.length ? 1 : 0) + (f.providers.length ? 1 : 0)

export type AccountsSort = { id: string; desc: boolean } | null

const CREATED_DAYS: Record<Exclude<CreatedFilter, "any">, number> = { "24h": 1, "7d": 7, "30d": 30, "90d": 90, "12m": 365 }

export function inTab(a: Account, tab: AccountsTab) {
  const closed = a.status === "breached" || a.status === "disabled"
  switch (tab) {
    case "all":
      return true
    case "challenge":
      return a.type === "challenge" && !closed
    case "funded":
      return a.type !== "challenge" && !closed
    case "breached":
      return a.status === "breached"
    case "disabled":
      return a.status === "disabled"
    case "expiring":
      return isExpiring(a)
  }
}

function matches(a: Account, f: AccountsFilters) {
  const q = f.search.trim().toLowerCase()
  if (q) {
    const hay =
      f.field === "id" ? [a.id, a.parentId ?? ""] : f.field === "user" ? [a.user] : f.field === "login" ? [String(a.mt5Login ?? "")] : [a.id, a.parentId ?? "", a.user, String(a.mt5Login ?? "")]
    if (!hay.some((h) => h.toLowerCase().includes(q))) return false
  }
  if (f.market !== "any" && a.market !== f.market) return false
  if (f.family !== "any" && a.family !== f.family) return false
  if (f.created !== "any" && TODAY.getTime() - new Date(a.created).getTime() > CREATED_DAYS[f.created] * 86_400_000) return false
  if (f.types.length && !f.types.includes(a.type)) return false
  if (f.statuses.length && !f.statuses.includes(a.status)) return false
  if (f.providers.length && !f.providers.includes(a.provider)) return false
  return true
}

const sortValue = (a: Account, id: string): string | number => {
  switch (id) {
    case "drawdown":
      return a.drawdown.used / a.drawdown.limit
    case "profit":
      return a.profit ? a.profit.current / a.profit.target : -1
    case "totalPnl":
      return a.balance - a.start + a.openPnl
    case "strikes":
      return a.strikes?.used ?? -1
    case "lifetime":
      return a.disabledAt ? new Date(a.disabledAt).getTime() - new Date(a.created).getTime() : -1
    default: {
      const v = (a as unknown as Record<string, unknown>)[id]
      return typeof v === "number" ? v : String(v ?? "")
    }
  }
}

export function queryAccounts({ tab, filters, sort, page, pageSize }: { tab: AccountsTab; filters: AccountsFilters; sort: AccountsSort; page: number; pageSize: number }) {
  const all = getAccounts()
  const filtered = all.filter((a) => matches(a, filters))
  let rows = filtered.filter((a) => inTab(a, tab))
  if (sort) {
    const dir = sort.desc ? -1 : 1
    rows = [...rows].sort((x, y) => {
      const a = sortValue(x, sort.id)
      const b = sortValue(y, sort.id)
      return a < b ? -dir : a > b ? dir : 0
    })
  }
  const tabCounts = { all: 0, challenge: 0, funded: 0, breached: 0, expiring: 0, disabled: 0 } as Record<AccountsTab, number>
  for (const a of filtered) for (const t of Object.keys(tabCounts) as AccountsTab[]) if (inTab(a, t)) tabCounts[t]++
  return { rows: rows.slice(page * pageSize, page * pageSize + pageSize), total: rows.length, tabCounts }
}
