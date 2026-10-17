// Trading accounts (Figma Platform file, section Accounts 4333:112751). The first rows are the Figma rows; the rest
// are seeded so the tab counts match the frames: Challenge 8,912 · Funded 3,568 · Breached 3,574 · Disabled 96
// (All 16,150); Expiring (418) is the challenges that end within 7 days. Rules: vault Reference/Product rules.md.

import { TODAY } from "@/lib/users/data"

export type AccountType = "challenge" | "funded" | "instant_funded"
export type AccountStatus = "active" | "challenge_passed" | "breached" | "reset" | "disabled" | "initialized"
export type Market = "future" | "crypto"
export type Family = "Classic" | "Classic DLL" | "Classic Advanced" | "Rapid" | "Instant"
export type Provider = "dxFeed" | "MT5 - IQ" | "VolumetricaFX"
export type BreachCause = "Drawdown" | "Daily loss" | "Hard breach"

export type Account = {
  id: string
  /** Lineage: the account this one continues (funded after a pass) or resets. */
  parentId: string | null
  mt5Login: number | null
  user: string
  country: string
  family: Family
  size: 50 | 100
  market: Market
  type: AccountType
  status: AccountStatus
  provider: Provider
  /** Strikes used / max; null when the rule has no strikes (Rapid challenge, DLL). */
  strikes: { used: number; max: number } | null
  drawdown: { used: number; limit: number }
  /** Challenges only. */
  profit: { current: number; target: number } | null
  /** Funded only: best day as a share of total profit (limit 30%). */
  consistency: number | null
  withdrawals: number
  start: number
  balance: number
  openPnl: number
  dailyPnl: number
  expires: string | null
  renews: string | null
  created: string
  disabledAt: string | null
  cause: BreachCause | null
  reason: { title: string; detail: string } | null
  disabledBy: { name: string; team: string } | null
}

export const ACCOUNT_TOTALS = { challenge: 8912, funded: 3568, breached: 3574, disabled: 96 }

const DAY = 86_400_000
const at = (days: number, hour = 9) => new Date(TODAY.getTime() - days * DAY + hour * 3_600_000).toISOString()
const ahead = (days: number) => new Date(TODAY.getTime() + days * DAY).toISOString()

function rand(i: number, salt: number) {
  let h = (i * 2654435761 + salt * 40503) >>> 0
  h = Math.imul(h ^ (h >>> 16), 2246822507) >>> 0
  h = Math.imul(h ^ (h >>> 13), 3266489909) >>> 0
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}
const pick = <T,>(list: readonly T[], i: number, salt: number) => list[Math.floor(rand(i, salt) * list.length)]

export function ddLimit(family: Family, size: 50 | 100) {
  if (family === "Rapid") return size === 50 ? 2000 : 3000
  if (family === "Classic DLL") return size === 50 ? 2000 : 3000
  return size === 50 ? 3000 : 6000
}
const target = (market: Market, size: 50 | 100) => (size === 100 ? 6000 : market === "crypto" ? 4000 : 3000)
const strikesFor = (family: Family, type: AccountType) =>
  family === "Classic DLL" || (family === "Rapid" && type === "challenge") ? null : { used: 0, max: family === "Rapid" ? 2 : 3 }

/** ID prefix by rule and phase (Product rules: IQCFEV, IQDFEV, IQCEV, IQRFEV · funded IQCF / IQCFN / IQRF / IQIF). */
function prefix(family: Family, market: Market, type: AccountType) {
  if (type === "instant_funded") return "IQIF"
  const fam = family === "Rapid" ? "R" : family === "Classic DLL" ? "D" : family === "Classic Advanced" ? "P" : "C"
  if (type === "challenge") return market === "crypto" && fam === "C" ? "IQCEV" : `IQ${fam}FEV`
  return market === "crypto" && fam === "C" ? "IQCFN" : `IQ${fam}F`
}

type Seed = Partial<Account> & Pick<Account, "id" | "user" | "country" | "family" | "size" | "market" | "type" | "status" | "provider" | "balance">

function make(s: Seed, created: string): Account {
  const start = s.size * 1000
  const limit = ddLimit(s.family, s.size)
  return {
    parentId: null,
    mt5Login: null,
    strikes: strikesFor(s.family, s.type),
    drawdown: { used: 0, limit },
    profit: s.type === "challenge" ? { current: Math.max(0, s.balance - start), target: target(s.market, s.size) } : null,
    consistency: null,
    withdrawals: 0,
    start,
    openPnl: 0,
    dailyPnl: 0,
    expires: s.type === "challenge" ? ahead(30) : null,
    renews: s.type === "challenge" ? null : ahead(20),
    disabledAt: null,
    cause: null,
    reason: null,
    disabledBy: null,
    created,
    ...s,
  }
}

// Figma rows (Accounts · All, top to bottom), with the extra columns filled to match their tab frames.
const FIGMA: Seed[] = [
  { id: "IQCFEV100K-158310", user: "Maria Lopes", country: "es", family: "Classic", size: 100, market: "future", type: "challenge", status: "active", provider: "dxFeed", strikes: { used: 0, max: 3 }, balance: 102400, openPnl: 320, dailyPnl: 410, profit: { current: 2400, target: 6000 }, expires: ahead(18) },
  { id: "IQCFN50K-160424", parentId: "IQCEV50K-151630", user: "Cesar Imura", country: "br", family: "Classic", size: 50, market: "crypto", type: "funded", status: "active", provider: "MT5 - IQ", strikes: { used: 1, max: 3 }, balance: 51240, consistency: 70, withdrawals: 2, openPnl: -60, dailyPnl: 140 },
  { id: "IQCFEV50K-160812", user: "Felix Braun", country: "de", family: "Classic", size: 50, market: "future", type: "challenge", status: "breached", provider: "dxFeed", drawdown: { used: 3100, limit: 3000 }, balance: 46900, cause: "Drawdown", dailyPnl: -1240, disabledAt: at(1, 15), expires: null },
  { id: "IQCFEV50K-160388", user: "Nikolai Ivanov", country: "bg", family: "Classic", size: 50, market: "future", type: "challenge", status: "disabled", provider: "dxFeed", balance: 50640, disabledAt: at(36, 9), reason: { title: "Hedging across accounts", detail: "Short NQ on IQCFEV50K-160389" }, disabledBy: { name: "Paula Mendes", team: "Risk team" }, expires: null },
  { id: "IQCEV50K-158102", mt5Login: 22296, user: "Sofia Reis", country: "pt", family: "Classic", size: 50, market: "crypto", type: "challenge", status: "challenge_passed", provider: "MT5 - IQ", strikes: { used: 1, max: 3 }, balance: 54180, profit: { current: 4180, target: 4000 } },
  { id: "IQCFN50K-161055", parentId: "IQCEV50K-158377", user: "Marta Kowalska", country: "pl", family: "Classic", size: 50, market: "crypto", type: "funded", status: "initialized", provider: "MT5 - IQ", balance: 50000, renews: null },
  { id: "IQCFEV50K-157455", parentId: "IQCFEV50K-150902", user: "Aoife Murphy", country: "ie", family: "Classic", size: 50, market: "future", type: "challenge", status: "reset", provider: "dxFeed", balance: 51240, profit: { current: 1240, target: 3000 } },
  { id: "IQIF50K-156401", mt5Login: 22341, user: "Kenji Sato", country: "jp", family: "Instant", size: 50, market: "crypto", type: "instant_funded", status: "active", provider: "MT5 - IQ", strikes: { used: 1, max: 3 }, drawdown: { used: 390, limit: 3000 }, balance: 49610, openPnl: -120, dailyPnl: -390 },
  { id: "IQDFEV100K-157903", user: "Mark Thompson", country: "gb", family: "Classic DLL", size: 100, market: "future", type: "challenge", status: "active", provider: "dxFeed", drawdown: { used: 631, limit: 3000 }, balance: 99686, dailyPnl: -314, profit: { current: 0, target: 6000 } },
  { id: "IQRFEV50K-161342", user: "Chloé Martin", country: "fr", family: "Rapid", size: 50, market: "future", type: "challenge", status: "active", provider: "dxFeed", balance: 51380, profit: { current: 1380, target: 3000 }, expires: ahead(1) },
  { id: "IQRF50K-151420", parentId: "IQRFEV50K-148207", user: "Lukas Novak", country: "cz", family: "Rapid", size: 50, market: "future", type: "funded", status: "active", provider: "dxFeed", balance: 51450, withdrawals: 1 },
  { id: "IQCEV50K-158221", parentId: "IQCEV50K-151077", user: "Pedro Alves", country: "br", family: "Classic", size: 50, market: "crypto", type: "challenge", status: "reset", provider: "MT5 - IQ", balance: 50000, profit: { current: 0, target: 4000 } },
]

const FIRST = ["Ana", "Bruno", "Liam", "Ines", "Arjun", "Lea", "Mateo", "Emma", "Ali", "Sophie", "Daniel", "Yara", "Jonas", "Igor", "Samir", "Nuno", "Hugo", "Kwan", "Tomas", "Erik", "Dana", "Priya", "Ethan", "Zoe", "Sara", "Marcos", "Pablo", "Rui", "Marek", "Anna", "Jorge", "Wei", "Leo", "Fatima", "Tiago", "Marco", "Omar", "Hannah", "Diego", "Nina", "Yuki", "Bianca", "Victor"]
const LAST = ["Lima", "O’Brien", "Moreau", "Rao", "Hoffmann", "Silva", "Wilson", "Hassan", "Laurent", "Kim", "Pfeiffer", "Petrov", "Aziz", "Dias", "Lefèvre", "Lee", "Varga", "Holm", "Rossi", "Nair", "Cole", "Adams", "Costa", "Teixeira", "Ortiz", "Nowak", "Berg", "Peña", "Zhang", "Martins", "Zahra", "Neves", "Bianchi", "Haddad", "Weber", "Ramos", "Brandt", "Tanaka", "Ferreira", "Lindqvist"]
const COUNTRIES = ["br", "br", "us", "gb", "de", "fr", "es", "pt", "it", "pl", "ie", "in", "jp", "kr", "mx", "ar", "ae", "ma", "eg", "se", "dk", "cz", "hu", "rs", "be", "at", "cn", "cl", "ca", "au"]
const FAMILIES: Family[] = ["Classic", "Classic", "Classic", "Classic DLL", "Classic Advanced", "Rapid", "Rapid"]
const DISABLE_REASONS = [
  { title: "API request", detail: "Provider sync", by: { name: "API", team: "MT5 - IQ bridge" } },
  { title: "Copy trading", detail: "Prohibited practice", by: { name: "Paula Mendes", team: "Risk team" } },
  { title: "Chargeback", detail: "Payment disputed", by: { name: "Billing", team: "Payment webhook" } },
  { title: "Inactivity > 30 days", detail: "No trade in 30 days", by: { name: "System", team: "Scheduled job" } },
  { title: "Account sharing", detail: "Same device on two users", by: { name: "Cesar Imura", team: "Owner" } },
  { title: "Account limit exceeded", detail: "6 Rapid accounts · limit is 5", by: { name: "System", team: "Limit audit" } },
  { title: "Multi-account", detail: "4 accounts on the same IP", by: { name: "Paula Mendes", team: "Risk team" } },
  { title: "Requested by user", detail: "Support ticket", by: { name: "Ana Souza", team: "Support" } },
  { title: "Promo code abuse", detail: "Same code on 3 accounts", by: { name: "Paula Mendes", team: "Risk team" } },
  { title: "Third-party EA", detail: "No source code access", by: { name: "Paula Mendes", team: "Risk team" } },
]

type Bucket = "challenge" | "funded" | "breached" | "disabled"

function generated(i: number, bucket: Bucket, expiring: boolean): Account {
  let family = pick(FAMILIES, i, 1)
  const market: Market = family === "Classic" && rand(i, 2) < 0.45 ? "crypto" : "future"
  const size: 50 | 100 = rand(i, 3) < 0.7 ? 50 : 100
  let type: AccountType = bucket === "funded" || ((bucket === "breached" || bucket === "disabled") && rand(i, 4) < 0.25) ? "funded" : "challenge"
  if (type === "funded" && rand(i, 5) < 0.22) {
    type = "instant_funded"
    family = "Instant"
  }
  const start = size * 1000
  const limit = ddLimit(family, size)
  const status: AccountStatus =
    bucket === "breached" ? "breached" : bucket === "disabled" ? "disabled" : type === "challenge" ? (rand(i, 6) < 0.06 ? "reset" : rand(i, 6) < 0.09 ? "challenge_passed" : "active") : rand(i, 6) < 0.04 ? "initialized" : "active"
  const ddUsed = bucket === "breached" ? Math.round(limit * (0.4 + rand(i, 7) * 0.65)) : rand(i, 7) < 0.7 ? 0 : Math.round(limit * rand(i, 8) * 0.6)
  const pnl = bucket === "breached" ? -ddUsed - Math.round(rand(i, 9) * 300) : Math.round((rand(i, 9) - 0.35) * (type === "challenge" ? target(market, size) : 2500))
  const balance = status === "initialized" ? start : start + pnl
  const strikes = strikesFor(family, type)
  if (strikes && bucket !== "breached") strikes.used = rand(i, 10) < 0.7 ? 0 : rand(i, 10) < 0.92 ? 1 : 2
  const createdDays = Math.floor(rand(i, 11) ** 1.6 * 540) + 1
  const reason = bucket === "disabled" ? pick(DISABLE_REASONS, i, 12) : null
  const login = family === "Classic" && market === "crypto" ? 22000 + (i % 900) : type === "instant_funded" ? 22000 + (i % 900) : null
  const n = 140000 + ((i * 7919) % 22000)
  const p = prefix(family, market, type)
  return {
    id: `${p}${size}K-${n}`,
    parentId: rand(i, 13) < 0.18 ? `${type === "challenge" ? p : prefix(family, market, "challenge")}${size}K-${n - 6000 - (i % 900)}` : null,
    mt5Login: login,
    user: `${pick(FIRST, i, 14)} ${pick(LAST, i, 15)}`,
    country: pick(COUNTRIES, i, 16),
    family,
    size,
    market,
    type,
    status,
    provider: market === "crypto" || type === "instant_funded" ? "MT5 - IQ" : family === "Classic Advanced" ? "VolumetricaFX" : "dxFeed",
    strikes: bucket === "breached" ? null : strikes,
    drawdown: { used: ddUsed, limit },
    profit: type === "challenge" ? { current: Math.max(0, pnl), target: target(market, size) } : null,
    consistency: type !== "challenge" && rand(i, 17) < 0.75 ? Math.round(8 + rand(i, 18) * 40) : null,
    withdrawals: type !== "challenge" && rand(i, 19) < 0.4 ? 1 + Math.floor(rand(i, 20) * 3) : 0,
    start,
    balance,
    openPnl: status === "active" && rand(i, 21) < 0.4 ? Math.round((rand(i, 22) - 0.5) * 800) : 0,
    dailyPnl: status === "active" || bucket === "breached" ? Math.round((rand(i, 23) - 0.5) * 900) : 0,
    expires: type === "challenge" && bucket === "challenge" ? ahead(expiring ? Math.floor(rand(i, 24) * 8) : 8 + Math.floor(rand(i, 24) * 52)) : null,
    renews: type !== "challenge" && status === "active" ? ahead(1 + Math.floor(rand(i, 25) * 29)) : null,
    created: at(createdDays, 6 + Math.floor(rand(i, 26) * 14)),
    disabledAt: bucket === "breached" || bucket === "disabled" ? at(Math.max(0, createdDays - 1 - Math.floor(rand(i, 27) * Math.min(30, createdDays))), 8 + Math.floor(rand(i, 28) * 12)) : null,
    cause: bucket === "breached" ? (strikes ? (rand(i, 29) < 0.3 ? "Hard breach" : "Drawdown") : rand(i, 29) < 0.4 ? "Daily loss" : "Drawdown") : null,
    reason: reason && { title: reason.title, detail: reason.detail },
    disabledBy: reason?.by ?? null,
  }
}

function bucketOf(a: Account): Bucket {
  if (a.status === "breached") return "breached"
  if (a.status === "disabled") return "disabled"
  return a.type === "challenge" ? "challenge" : "funded"
}

let cache: Account[] | null = null

/** All 16,150 accounts, newest first (Figma rows on top). */
export function getAccounts(): Account[] {
  if (cache) return cache
  const figma = FIGMA.map((s, i) => make(s, at(i < 6 ? 0 : 1, 18 - i)))
  const left: Record<Bucket, number> = { ...ACCOUNT_TOTALS }
  for (const a of figma) left[bucketOf(a)]--
  const figmaExpiring = figma.filter((a) => isExpiring(a)).length
  const list: Account[] = []
  let i = 1
  let expiringLeft = 418 - figmaExpiring
  for (const bucket of ["challenge", "funded", "breached", "disabled"] as Bucket[]) {
    for (let k = 0; k < left[bucket]; k++, i++) {
      const expiring = bucket === "challenge" && expiringLeft > 0 && k % 21 === 0
      if (expiring) expiringLeft--
      const a = generated(i, bucket, expiring)
      // Reset / passed challenges don't expire in this view.
      if (expiring && a.type !== "challenge") expiringLeft++
      list.push(a)
    }
  }
  list.sort((a, b) => (a.created < b.created ? 1 : -1))
  cache = [...figma, ...list]
  return cache
}

export function isExpiring(a: Account) {
  return a.type === "challenge" && a.status !== "breached" && a.status !== "disabled" && a.expires !== null && new Date(a.expires).getTime() - TODAY.getTime() <= 7 * DAY
}

export const daysUntil = (iso: string) => Math.max(0, Math.round((new Date(iso).getTime() - TODAY.getTime()) / DAY))
export const lifetimeDays = (a: Account) => (a.disabledAt ? Math.max(0, (new Date(a.disabledAt).getTime() - new Date(a.created).getTime()) / DAY) : null)
