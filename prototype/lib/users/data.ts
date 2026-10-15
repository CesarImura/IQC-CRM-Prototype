// Mock Users dataset. Deterministic (same rows on every load) and sized like the Figma screen:
// 63,989 users, 311 banned, 1,847 needing action (1,204 KYC pending + 643 suspended), 812 new in 7 days,
// 3,420 new in 30 days. The first 11 rows are the ones drawn in Figma.

export type UserStatus = "active" | "kyc_pending" | "suspended" | "banned"
export type Verification = "verified" | "pending" | "unverified"
export type Role = "client" | "owner" | "admin" | "affiliate"
export type UtmSource = "google" | "meta" | "youtube" | "tiktok" | "x" | "discord" | "newsletter"

export type User = {
  id: string
  email: string
  name: string
  username: string
  accounts: number
  /** Account types held, for the Accounts filter. */
  accountTypes: AccountType[]
  /** At least one account is breached. */
  breached: boolean
  status: UserStatus
  banReason: string | null
  verification: Verification
  affiliate: string | null
  /** ISO date (yyyy-mm-dd). */
  registered: string
  role: Role
  phone: string
  utm: UtmSource | null
}

export type AccountType = "challenge" | "funding" | "instant_funding" | "reset"

export const TOTAL_USERS = 63_989
/** "Today" for the prototype, so the dataset and the KPIs don't drift. */
export const TODAY = new Date("2026-10-14T12:00:00Z")

const DAY = 86_400_000
const isoDaysAgo = (days: number) => new Date(TODAY.getTime() - days * DAY).toISOString().slice(0, 10)

/* ---------------------------------- Figma rows ---------------------------------- */

const figmaRows: User[] = [
  { id: "3083cd1f9b2a4e0c8d71a5f2c6b0ece3", email: "cesar@yunicorn.vc", name: "Cesar Imura", username: "CI Trades", accounts: 6, accountTypes: ["challenge", "funding", "instant_funding"], breached: false, status: "active", banReason: null, verification: "verified", affiliate: null, registered: isoDaysAgo(0), role: "owner", phone: "+55 11 98123-0042", utm: "google" },
  { id: "d4v1k1in5ma2n4b7c9e1f3a5b7c9d0e2", email: "davi@iqcapital.io", name: "Davi Klinsmann", username: "davik", accounts: 1, accountTypes: ["instant_funding"], breached: false, status: "active", banReason: null, verification: "verified", affiliate: null, registered: isoDaysAgo(0), role: "client", phone: "+55 11 99876-5512", utm: "google" },
  { id: "a91c02de4f7b4d1e9a3c0b8e5d2f77b1", email: "maria.l@gmail.com", name: "Maria Lopes", username: "mlopes", accounts: 2, accountTypes: ["challenge", "funding"], breached: false, status: "active", banReason: null, verification: "verified", affiliate: "partner@alpha.io", registered: isoDaysAgo(1), role: "client", phone: "+55 21 99812-4410", utm: "meta" },
  { id: "5f2e8a10c3d94b7f8e2a1d6c9b40c03d", email: "trader.jp@proton.me", name: "Kenji Tanaka", username: "jp_scalper", accounts: 1, accountTypes: ["challenge"], breached: false, status: "active", banReason: null, verification: "verified", affiliate: null, registered: isoDaysAgo(1), role: "client", phone: "+81 90 4412 8803", utm: "youtube" },
  { id: "0de4b7f21a8c4e5d9f3b6a2c7e1d9a12", email: "ahmed.k@outlook.com", name: "Ahmed Karim", username: "akarim", accounts: 1, accountTypes: ["instant_funding"], breached: false, status: "active", banReason: null, verification: "verified", affiliate: "fx.guru@mail.com", registered: isoDaysAgo(2), role: "client", phone: "+971 50 118 2204", utm: "google" },
  { id: "c7a113e95b2d4f8a8c1e3d7b9a604f08", email: "lucas.m@yunicorn.vc", name: "Lucas Martins", username: "lucasm", accounts: 0, accountTypes: [], breached: false, status: "banned", banReason: "Account sharing", verification: "verified", affiliate: null, registered: isoDaysAgo(2), role: "client", phone: "+55 11 97710-3381", utm: null },
  { id: "e20b9c4d7f1a4c3e8b5d2a9f6c1e51aa", email: "sofia.r@gmail.com", name: "Sofia Rossi", username: "sofiatrades", accounts: 1, accountTypes: ["challenge"], breached: false, status: "kyc_pending", banReason: null, verification: "pending", affiliate: "partner@alpha.io", registered: isoDaysAgo(3), role: "client", phone: "+39 347 220 1187", utm: "tiktok" },
  { id: "77f0d2ab9e3c4a1f8d6b5c2e0a7fe6c4", email: "nina.b@icloud.com", name: "Nina Berg", username: "ninab", accounts: 2, accountTypes: ["challenge", "reset"], breached: true, status: "suspended", banReason: null, verification: "verified", affiliate: null, registered: isoDaysAgo(3), role: "client", phone: "+46 70 331 9920", utm: "newsletter" },
  { id: "1b9e4c70a5d24f6e9c8b3a1d7e2f08fd", email: "mark.t@gmail.com", name: "Mark Taylor", username: "mtaylor", accounts: 0, accountTypes: [], breached: false, status: "banned", banReason: "Cross-account hedging", verification: "verified", affiliate: null, registered: isoDaysAgo(4), role: "client", phone: "+44 7700 900 512", utm: "discord" },
  { id: "9c3f1e5762ab4d8e9f1c0b3a5d7eb2e0", email: "li.wei@qq.com", name: "Li Wei", username: "liwei88", accounts: 1, accountTypes: ["funding"], breached: true, status: "suspended", banReason: null, verification: "verified", affiliate: "asia@mail.com", registered: isoDaysAgo(5), role: "client", phone: "+86 138 0013 8000", utm: "x" },
  { id: "4d71ba08e6c94f2a8b1d3e5c7f90c5e2", email: "ana.duarte@gmail.com", name: "Ana Duarte", username: "anadr", accounts: 1, accountTypes: ["challenge"], breached: false, status: "active", banReason: null, verification: "verified", affiliate: null, registered: isoDaysAgo(5), role: "client", phone: "+351 912 345 678", utm: "meta" },
  { id: "b62e9f14c8a34d7e9b2f1a6c5d3e7d31", email: "tom.f@outlook.com", name: "Tom Fisher", username: "tfisher", accounts: 1, accountTypes: ["challenge"], breached: false, status: "kyc_pending", banReason: null, verification: "pending", affiliate: "fx.guru@mail.com", registered: isoDaysAgo(6), role: "client", phone: "+1 415 555 0134", utm: null },
]

/* ---------------------------------- Generator ---------------------------------- */

const FIRST = ["Ana", "Bruno", "Carla", "Diego", "Elena", "Felipe", "Gabriela", "Hugo", "Isabel", "João", "Karin", "Leo", "Marta", "Nikolai", "Olga", "Pedro", "Quinn", "Rafael", "Sara", "Tiago", "Uma", "Victor", "Wen", "Ximena", "Yusuf", "Zoe", "Aiko", "Ben", "Chen", "Dmitri", "Emma", "Farah", "Giulia", "Hassan", "Ines", "Jakub", "Kofi", "Laila", "Mateo", "Noah", "Omar", "Priya", "Ravi", "Sofia", "Tariq", "Valentina", "Wei", "Yara"]
const LAST = ["Silva", "Santos", "Oliveira", "Costa", "Pereira", "Ferreira", "Almeida", "Smith", "Johnson", "Müller", "Schmidt", "Rossi", "Russo", "Nakamura", "Sato", "Kim", "Park", "Nguyen", "Garcia", "Martinez", "Lopez", "Novak", "Kowalski", "Ivanov", "Petrov", "Haddad", "Khan", "Patel", "Singh", "Okafor", "Mensah", "Andersson", "Larsen", "Dubois", "Moreau", "Fischer", "Weber", "Cohen", "Levi", "Yilmaz"]
const DOMAINS = ["gmail.com", "outlook.com", "icloud.com", "proton.me", "yahoo.com", "hotmail.com", "mail.com", "gmx.de"]
const AFFILIATES = ["partner@alpha.io", "fx.guru@mail.com", "asia@mail.com", "tradeclub@pro.net", "signals@edge.fm"]
const UTMS: UtmSource[] = ["google", "meta", "youtube", "tiktok", "x", "discord", "newsletter"]
const BAN_REASONS = ["Account sharing", "Cross-account hedging", "Chargeback fraud", "Copy trading abuse", "Multiple identities", "Terms violation"]
const PHONE_PREFIX = ["+55 11 9", "+55 21 9", "+1 415 555 ", "+44 7700 9", "+351 91", "+49 151 ", "+34 6", "+971 50 ", "+81 90 "]
const ACCOUNT_TYPES: AccountType[] = ["challenge", "funding", "instant_funding", "reset"]

/** 32-bit hash → [0, 1). */
function rand(i: number, salt: number) {
  let h = Math.imul(i ^ 0x9e3779b9, 0x85ebca6b) ^ Math.imul(salt + 1, 0xc2b2ae35)
  h ^= h >>> 16
  h = Math.imul(h, 0x7feb352d)
  h ^= h >>> 15
  h = Math.imul(h, 0x846ca68b)
  h ^= h >>> 16
  return (h >>> 0) / 4294967296
}
const pick = <T,>(list: readonly T[], i: number, salt: number) => list[Math.floor(rand(i, salt) * list.length)]
const hex = (i: number, salt: number, len: number) =>
  Array.from({ length: len }, (_, k) => Math.floor(rand(i, salt * 97 + k) * 16).toString(16)).join("")

/** A bijection on [0, n): spreads the exact-count buckets across the list. */
function permute(i: number, n: number, a: number) {
  return (a * i + 7_919) % n
}

const GENERATED = TOTAL_USERS - figmaRows.length
// Exact totals minus what the Figma rows already contribute.
const BANNED = 311 - 2
const KYC_PENDING = 1_204 - 2
const SUSPENDED = 643 - 2
const NEW_7D = 812 - figmaRows.length
const NEW_30D = 3_420 - figmaRows.length

function makeUser(i: number): User {
  const first = pick(FIRST, i, 1)
  const last = pick(LAST, i, 2)
  const handle = `${first}.${last}`.toLowerCase().normalize("NFD").replace(/[^a-z.]/g, "")
  const n = Math.floor(rand(i, 3) * 90) + 1

  const s = permute(i, GENERATED, 48_271) // gcd(48271, 63978) = 1
  const status: UserStatus =
    s < BANNED ? "banned" : s < BANNED + KYC_PENDING ? "kyc_pending" : s < BANNED + KYC_PENDING + SUSPENDED ? "suspended" : "active"

  // Newest first: rank r → days ago, with exact 7- and 30-day counts.
  const r = i
  const daysAgo = r < NEW_7D ? Math.floor((r / NEW_7D) * 7) : r < NEW_30D ? 7 + Math.floor(((r - NEW_7D) / (NEW_30D - NEW_7D)) * 23) : 30 + Math.floor(((r - NEW_30D) / (GENERATED - NEW_30D)) * 1_400)

  const verification: Verification =
    status === "kyc_pending" ? "pending" : status === "banned" || rand(i, 4) < 0.7277 ? "verified" : "unverified"
  const accounts = status === "banned" ? 0 : Math.floor(rand(i, 5) ** 2 * 6)
  const accountTypes = ACCOUNT_TYPES.filter((_, k) => rand(i, 20 + k) < (k === 0 ? 0.7 : 0.3)).slice(0, Math.max(accounts, 0))
  const roleRoll = rand(i, 6)

  return {
    id: hex(i, 7, 32),
    email: rand(i, 8) < 0.5 ? `${handle}@${pick(DOMAINS, i, 9)}` : `${handle.replace(".", "")}${n}@${pick(DOMAINS, i, 9)}`,
    name: `${first} ${last}`,
    username: rand(i, 10) < 0.5 ? `${first.toLowerCase().normalize("NFD").replace(/[^a-z]/g, "")}${n}` : `${first[0].toLowerCase()}${last.toLowerCase().normalize("NFD").replace(/[^a-z]/g, "")}`,
    accounts,
    accountTypes: accounts === 0 ? [] : accountTypes.length ? accountTypes : ["challenge"],
    breached: accounts > 0 && rand(i, 11) < 0.12,
    status,
    banReason: status === "banned" ? pick(BAN_REASONS, i, 12) : null,
    verification,
    affiliate: rand(i, 13) < 0.38 ? pick(AFFILIATES, i, 14) : null,
    registered: isoDaysAgo(daysAgo),
    role: roleRoll < 0.9 ? "client" : roleRoll < 0.96 ? "affiliate" : roleRoll < 0.99 ? "admin" : "owner",
    phone: `${pick(PHONE_PREFIX, i, 15)}${Math.floor(rand(i, 16) * 9e6 + 1e6)}`.replace(/(\d{4})(\d{3})$/, "$1-$2"),
    utm: rand(i, 17) < 0.18 ? null : pick(UTMS, i, 18),
  }
}

let cache: User[] | null = null

/** All users, newest first. Built once per session (~60k rows, a few ms). */
export function getAllUsers(): User[] {
  if (!cache) cache = [...figmaRows, ...Array.from({ length: GENERATED }, (_, i) => makeUser(i))]
  return cache
}
