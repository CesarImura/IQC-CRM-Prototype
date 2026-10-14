// A stand-in for the Users API: filter, sort and page the mock dataset the way a server would.

import { TODAY, getAllUsers, type AccountType, type Role, type User, type UserStatus, type UtmSource } from "./data"

export type UsersTab = "all" | "needs_action" | "banned"
export type SearchField = "all" | "name" | "email" | "username" | "id"
export type AccountsFilter = "any" | AccountType | "breached" | "has_accounts" | "no_accounts"
export type RegisteredFilter = "any" | "7d" | "30d" | "90d" | "12m"
export type AffiliateFilter = "any" | "with" | "without"

export type UsersFilters = {
  search: string
  field: SearchField
  accounts: AccountsFilter
  status: "any" | UserStatus
  registered: RegisteredFilter
  /** Page-level period (Page Title date range). */
  period: { from: Date | null; to: Date | null }
  roles: Role[]
  affiliate: AffiliateFilter
  affiliateEmail: string
  utm: (UtmSource | "none")[]
}

export const emptyFilters: UsersFilters = {
  search: "",
  field: "all",
  accounts: "any",
  status: "any",
  registered: "any",
  period: { from: null, to: null },
  roles: [],
  affiliate: "any",
  affiliateEmail: "",
  utm: [],
}

export type UsersSort = { id: keyof User; desc: boolean } | null

export type UsersQuery = {
  tab: UsersTab
  filters: UsersFilters
  sort: UsersSort
  page: number // 0-based
  pageSize: number
}

const DAY = 86_400_000
const registeredDays: Record<Exclude<RegisteredFilter, "any">, number> = { "7d": 7, "30d": 30, "90d": 90, "12m": 365 }
const dateKey = (d: Date) => d.toISOString().slice(0, 10)

function matchesTab(u: User, tab: UsersTab) {
  if (tab === "banned") return u.status === "banned"
  if (tab === "needs_action") return u.status === "kyc_pending" || u.status === "suspended"
  return true
}

function matchesFilters(u: User, f: UsersFilters) {
  const q = f.search.trim().toLowerCase()
  if (q) {
    const fields = f.field === "all" ? [u.name, u.email, u.username, u.id] : [u[f.field]]
    if (!fields.some((v) => v.toLowerCase().includes(q))) return false
  }

  switch (f.accounts) {
    case "any":
      break
    case "breached":
      if (!u.breached) return false
      break
    case "has_accounts":
      if (u.accounts === 0) return false
      break
    case "no_accounts":
      if (u.accounts !== 0) return false
      break
    default:
      if (!u.accountTypes.includes(f.accounts)) return false
  }

  if (f.status !== "any" && u.status !== f.status) return false

  if (f.registered !== "any") {
    const since = dateKey(new Date(TODAY.getTime() - registeredDays[f.registered] * DAY))
    if (u.registered <= since) return false
  }
  if (f.period.from && u.registered < dateKey(f.period.from)) return false
  if (f.period.to && u.registered > dateKey(f.period.to)) return false

  if (f.roles.length && !f.roles.includes(u.role)) return false

  if (f.affiliate === "with" && !u.affiliate) return false
  if (f.affiliate === "without" && u.affiliate) return false
  const affiliateQ = f.affiliateEmail.trim().toLowerCase()
  if (affiliateQ && !u.affiliate?.toLowerCase().includes(affiliateQ)) return false

  if (f.utm.length && !f.utm.includes(u.utm ?? "none")) return false

  return true
}

/** Number of filters applied from the More filters panel (for the Filter Button count). */
export function countPanelFilters(f: UsersFilters) {
  return (f.roles.length ? 1 : 0) + (f.affiliate !== "any" || f.affiliateEmail.trim() ? 1 : 0) + (f.utm.length ? 1 : 0)
}

export type UsersResult = {
  rows: User[]
  total: number
  tabCounts: Record<UsersTab, number>
}

/**
 * Runs a query over the dataset. `overrides` (local edits: added, banned or suspended users)
 * are applied first, like a server that already saved them.
 */
export function queryUsers(query: UsersQuery, overrides: { added: User[]; patched: Map<string, Partial<User>> }): UsersResult {
  const all = [...overrides.added, ...getAllUsers()]
  const tabCounts: Record<UsersTab, number> = { all: 0, needs_action: 0, banned: 0 }
  const matching: User[] = []

  for (const base of all) {
    const patch = overrides.patched.get(base.id)
    const u = patch ? { ...base, ...patch } : base
    if (!matchesFilters(u, query.filters)) continue
    tabCounts.all++
    if (matchesTab(u, "needs_action")) tabCounts.needs_action++
    if (matchesTab(u, "banned")) tabCounts.banned++
    if (matchesTab(u, query.tab)) matching.push(u)
  }

  if (query.sort) {
    const { id, desc } = query.sort
    const dir = desc ? -1 : 1
    matching.sort((a, b) => {
      const x = a[id] ?? ""
      const y = b[id] ?? ""
      if (typeof x === "number" && typeof y === "number") return (x - y) * dir
      return String(x).localeCompare(String(y)) * dir
    })
  }

  const start = query.page * query.pageSize
  return { rows: matching.slice(start, start + query.pageSize), total: matching.length, tabCounts }
}

/** Headline numbers for the KPI strip (whole dataset, like the Figma screen). */
export function getUserStats() {
  const all = getAllUsers()
  const since = (days: number) => dateKey(new Date(TODAY.getTime() - days * DAY))
  const d7 = since(7)
  const d30 = since(30)
  let new7 = 0
  let new30 = 0
  let new30Bought = 0
  let verified = 0
  let pending = 0
  let banned = 0
  for (const u of all) {
    if (u.registered > d7) new7++
    if (u.registered > d30) {
      new30++
      if (u.accountTypes.includes("challenge")) new30Bought++
    }
    if (u.verification === "verified") verified++
    if (u.verification === "pending") pending++
    if (u.status === "banned") banned++
  }
  return {
    total: all.length,
    new7,
    new30,
    new30BoughtPct: new30 ? Math.round((new30Bought / new30) * 100) : 0,
    verifiedPct: (verified / all.length) * 100,
    pending,
    banned,
    bannedPct: (banned / all.length) * 100,
    bannedThisMonth: 12,
  }
}
