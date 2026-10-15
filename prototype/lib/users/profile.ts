// Mock User Profile (Figma: Platform file, section "1. Users", User Profile · Overview / Subscriptions / Trading /
// Activity / Notifications). Identity fields come from the Users row so the table and the profile always match;
// money, accounts and history come from the Figma example (Cesar Imura).

import type { User } from "./data"

export type ProfileTab = "overview" | "subscriptions" | "trading" | "activity" | "notifications"
export const PROFILE_TABS: { value: ProfileTab; label: string }[] = [
  { value: "overview", label: "Overview" },
  { value: "subscriptions", label: "Subscriptions" },
  { value: "trading", label: "Trading" },
  { value: "activity", label: "Activity" },
  { value: "notifications", label: "Notifications" },
]

export const money = (n: number, sign = false) => {
  const abs = Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return `${n < 0 ? "−" : sign && n > 0 ? "+" : ""}${abs} $`
}

/* ---------------------------------- Header ---------------------------------- */

export const lastActivity = "28 Aug 2026, 14:32 UTC"

export const headerKpis = [
  { title: "Net amount", value: money(-330.5), tone: "negative" as const, caption: "Lifetime balance" },
  { title: "Total orders", value: "8", caption: "712.00 $ volume" },
  { title: "Payout / purchase", value: "46.4%", caption: "2 payouts · −1,240.00 $" },
  { title: "Refunds", value: "1", caption: "−89.00 $" },
  { title: "Affiliate commissions", value: money(156.4), tone: "positive" as const, caption: "+42.10 $ manager" },
  { title: "Customer for", value: "9 months", caption: "Last purchase 28 Aug" },
]

/* ---------------------------------- Overview ---------------------------------- */

export const cashFlowKpis = [
  { title: "Collected", value: money(712), tone: "positive" as const, caption: "1 purchase · 5 renewals" },
  { title: "Paid out", value: money(-1240), tone: "negative" as const, caption: "2 payouts" },
  { title: "Refunded", value: money(-89), tone: "negative" as const, caption: "1 refund" },
  { title: "Payout / purchase", value: "46.4%", caption: "Firm-wide avg. 38.0%" },
]

/** Firm cash flow by month: money in (purchases, renewals) and out (payouts, refunds). */
export const cashFlow = [
  { month: "Jan", in: 267, out: 0 },
  { month: "Feb", in: 89, out: 0 },
  { month: "Mar", in: 89, out: -89 },
  { month: "Apr", in: 89, out: 0 },
  { month: "May", in: 89, out: -520 },
  { month: "Jun", in: 89, out: 0 },
  { month: "Jul", in: 0, out: 0 },
  { month: "Aug", in: 0, out: -720 },
]

export const lifetime: { metric: string; count?: number; amount: string; delta?: string }[] = [
  { metric: "First purchases", count: 3, amount: "267.00 $" },
  { metric: "Renewals", count: 5, amount: "445.00 $" },
  { metric: "Total orders", count: 8, amount: "712.00 $" },
  { metric: "Refunds", count: 1, amount: "−89.00 $" },
  { metric: "Trading payouts", count: 2, amount: "−1,240.00 $" },
  { metric: "Affiliate commissions", amount: "156.40 $", delta: "+18%" },
  { metric: "Affiliate manager commissions", amount: "42.10 $", delta: "+18%" },
  { metric: "Net amount", amount: "−330.50 $" },
  { metric: "Payout / purchase ratio", amount: "46.4%" },
]

export const upcomingCharges = [
  { date: "21 Oct 2026", ref: "SUB-2026-0418", amount: "89.00 $" },
  { date: "21 Nov 2026", ref: "SUB-2026-0418", amount: "89.00 $" },
]

/* ---------------------------------- Subscriptions ---------------------------------- */

export type AccountType = "Challenge" | "Funding" | "Breached" | "Reset" | "Passed"
export const accountTypeColor = { Challenge: "green", Funding: "blue", Breached: "red", Reset: "yellow", Passed: "yellow" } as const

export type Subscription = {
  id: string
  product: string
  type: AccountType
  status: "Active" | "Ended"
  step: string
  account: string
  amount: string
  payment: "Confirmed" | "Refunded"
  bought: string
  renewal: string | null
  end: string | null
}

export const subscriptions: Subscription[] = [
  { id: "SUB-2026-0418", product: "Core 100K · CFD + Crypto", type: "Challenge", status: "Active", step: "Step 1 — Evaluation", account: "IQCEV100K-7710243", amount: "89.00 $", payment: "Confirmed", bought: "02 Jun 2026", renewal: null, end: null },
  { id: "SUB-2026-0287", product: "Core 100K · funded", type: "Funding", status: "Active", step: "Step 2 — Verification", account: "IQCFEV100K-7708112", amount: "249.00 $", payment: "Confirmed", bought: "18 Mar 2026", renewal: "18 Oct 2026", end: null },
  { id: "SUB-2026-0611", product: "Instant Funding 50K · Futures", type: "Funding", status: "Active", step: "Funded from day one", account: "IQIF50K-7712004", amount: "349.00 $", payment: "Confirmed", bought: "01 Sep 2026", renewal: "01 Oct 2026", end: null },
  { id: "SUB-2026-0390", product: "Rapid 50K · Futures", type: "Breached", status: "Ended", step: "Closed by breach", account: "IQRA50K-7709455", amount: "135.00 $", payment: "Confirmed", bought: "01 Jun 2026", renewal: null, end: "16 Sep 2026" },
  { id: "SUB-2025-0964", product: "Core 50K · funded", type: "Funding", status: "Ended", step: "Cycle ended", account: "IQCF50K-7702118", amount: "129.00 $", payment: "Refunded", bought: "22 Dec 2025", renewal: null, end: "22 Jun 2026" },
  { id: "SUB-2026-0722", product: "Rapid 25K · Futures", type: "Challenge", status: "Active", step: "Step 1 — Evaluation", account: "IQRA25K-7713880", amount: "69.00 $", payment: "Confirmed", bought: "14 Aug 2026", renewal: null, end: null },
]

/* ---------------------------------- Trading ---------------------------------- */

export type Partner = "dxFeed" | "Tradovate" | "MT5" | "Atas" | "Trading View" | "Ninja Trader" | "Volumetrica"

export type Provider = {
  name: string
  partner: Partner
  kind: string
  connection: { tone: "positive" | "warning" | "negative" | "neutral"; label: string }
  fields: { label: string; value: string; tone?: "positive" | "warning" | "negative" | "neutral"; badge?: boolean }[]
}

const platform = (name: string, partner: Partner, since: string, login: string, accounts: string, account: string, status: Provider["fields"][number]): Provider => ({
  name,
  partner,
  kind: "Trading platform",
  connection: { tone: "positive", label: `Connected · ${since}` },
  fields: [
    { label: "Status", value: "Activated", tone: "positive" },
    { label: "Accounts", value: accounts },
    { label: "Login", value: login },
    { label: "Account", value: account },
    status,
  ],
})

export const providers: Provider[] = [
  {
    name: "dxFeed",
    partner: "dxFeed",
    kind: "Data provider",
    connection: { tone: "positive", label: "Connected · 12 May 2026" },
    fields: [
      { label: "Status", value: "Activated", tone: "positive" },
      { label: "BMS", value: "Activated", tone: "positive" },
      { label: "Provider ID", value: "71eacea0…cadbb34" },
      { label: "Funded agreement", value: "Accepted", badge: true },
      { label: "Certification", value: "No Pro", tone: "neutral" },
    ],
  },
  {
    name: "Tradovate · Market data",
    partner: "Tradovate",
    kind: "Data subscription",
    connection: { tone: "positive", label: "Active · renews every 30 days" },
    fields: [
      { label: "Price", value: "29.00 $ / 30 days" },
      { label: "Used by", value: "4 trading accounts" },
      { label: "Plan", value: "CME real-time · level 1" },
      { label: "Started", value: "12 May 2026" },
      { label: "Renews", value: "12 Oct 2026" },
    ],
  },
  platform("MetaTrader 5", "MT5", "02 Jun 2026", "7710243", "1 account", "Core 100K", { label: "Account status", value: "Active · evaluation", tone: "positive" }),
  platform("ATAS", "Atas", "12 Jun 2026", "7710988", "1 account", "Core 50K", { label: "Account status", value: "Active · evaluation", tone: "positive" }),
  platform("TradingView", "Trading View", "18 May 2026", "7708112", "1 account", "Core 100K", { label: "Account status", value: "Trading now", tone: "positive" }),
  platform("Tradovate", "Tradovate", "01 Sep 2026", "7712004", "1 account", "Instant 50K", { label: "Account status", value: "Trading now", tone: "positive" }),
  platform("NinjaTrader", "Ninja Trader", "01 Jun 2026", "7709455", "2 accounts", "Rapid 50K · Core 25K", { label: "Account status", value: "Breached", tone: "negative" }),
  platform("Volumetrica", "Volumetrica", "20 Sep 2026", "7711230", "1 account", "Core 50K", { label: "Account status", value: "Reset applied", tone: "warning" }),
]

export type TradingTab = "challenge" | "active" | "passed" | "breached"

export type Limit = { label: string; rule?: string; value: string; max: string; pct: number; tone?: "accent" | "danger" | "neutral" }

export type TradingAccount = {
  id: string
  title: string
  partner: Partner
  status: { tone: "positive" | "warning" | "negative"; label: string }
  type: AccountType
  tab: TradingTab
  stats: { label: string; value: string; caption: string; tone?: "positive" | "negative" }[]
  limits: Limit[]
  footer: string
  action: string
}

export const tradingAccounts: TradingAccount[] = [
  {
    id: "IQCEV100K-7710243",
    title: "Core 100K · MetaTrader 5",
    partner: "MT5",
    status: { tone: "positive", label: "Active · evaluation" },
    type: "Challenge",
    tab: "challenge",
    stats: [
      { label: "Balance", value: "104,120.00 $", caption: "start 100,000.00 $", tone: "positive" },
      { label: "Equity", value: "104,305.40 $", caption: "+185.40 $ floating" },
      { label: "Trading days", value: "6", caption: "no minimum in the challenge" },
    ],
    limits: [
      { label: "Profit target", rule: "8%", value: "4,120.00 $", max: "8,000.00 $", pct: 52, tone: "accent" },
      { label: "Max drawdown · trailing EoD", rule: "6%", value: "2,310.00 $", max: "6,000.00 $", pct: 39 },
      { label: "Max position loss", rule: "1%", value: "820.00 $", max: "1,000.00 $", pct: 82, tone: "danger" },
    ],
    footer: "Ends 02 Jul 2026 · 24 days left",
    action: "Open account",
  },
  {
    id: "IQCEV50K-7710988",
    title: "Core 50K · ATAS",
    partner: "Atas",
    status: { tone: "positive", label: "Active · evaluation" },
    type: "Challenge",
    tab: "challenge",
    stats: [
      { label: "Balance", value: "50,657.00 $", caption: "start 50,000.00 $", tone: "positive" },
      { label: "Equity", value: "51,034.50 $", caption: "+377.50 $ floating" },
      { label: "Trading days", value: "15", caption: "no minimum in the challenge" },
    ],
    limits: [
      { label: "Profit target", value: "657.00 $", max: "3,000.00 $", pct: 22, tone: "accent" },
      { label: "Max drawdown · trailing EoD", value: "150.00 $", max: "2,000.00 $", pct: 8 },
      { label: "Daily loss limit", value: "320.00 $", max: "1,000.00 $", pct: 32 },
    ],
    footer: "Ends 12 Jul 2026 · 4 days left · max 5 mini contracts",
    action: "Open account",
  },
  {
    id: "IQRA25K-7713880",
    title: "Core 25K · NinjaTrader",
    partner: "Ninja Trader",
    status: { tone: "warning", label: "Passed · activation fee pending" },
    type: "Passed",
    tab: "passed",
    stats: [
      { label: "Balance", value: "26,540.00 $", caption: "start 25,000.00 $", tone: "positive" },
      { label: "Equity", value: "26,540.00 $", caption: "no open positions" },
      { label: "Trading days", value: "9", caption: "evaluation complete" },
    ],
    limits: [
      { label: "Profit target", value: "1,540.00 $", max: "1,500.00 $", pct: 100, tone: "accent" },
      { label: "Max drawdown · trailing EoD", value: "380.00 $", max: "1,250.00 $", pct: 30 },
      { label: "Daily loss limit", value: "210.00 $", max: "625.00 $", pct: 34 },
    ],
    footer: "Passed 28 Sep 2026 · activation fee 149.00 $ due before funding",
    action: "Activate account",
  },
  {
    id: "IQCFEV100K-7708112",
    title: "Core 100K · TradingView",
    partner: "Trading View",
    status: { tone: "positive", label: "Trading now · payout in 4 days" },
    type: "Funding",
    tab: "active",
    stats: [
      { label: "Balance", value: "112,480.00 $", caption: "+12,480.00 $ since funding", tone: "positive" },
      { label: "Equity", value: "112,910.20 $", caption: "+430.20 $ floating" },
      { label: "Trading days", value: "6 of 10", caption: "minimum for a payout" },
    ],
    limits: [
      { label: "Consistency · best day", rule: "30%", value: "24%", max: "30% cap", pct: 80, tone: "accent" },
      { label: "Max drawdown · trailing EoD", rule: "6%", value: "1,940.00 $", max: "6,000.00 $", pct: 32 },
      { label: "Max position loss", rule: "0.5%", value: "310.00 $", max: "500.00 $", pct: 62 },
    ],
    footer: "Next payout up to 2,000.00 $ · split 90/10",
    action: "Open account",
  },
  {
    id: "IQIF50K-7712004",
    title: "Instant Funding 50K · Tradovate",
    partner: "Tradovate",
    status: { tone: "positive", label: "Trading now" },
    type: "Funding",
    tab: "active",
    stats: [
      { label: "Balance", value: "52,310.00 $", caption: "+2,310.00 $ since day one", tone: "positive" },
      { label: "Equity", value: "52,180.00 $", caption: "−130.00 $ floating" },
      { label: "Trading days", value: "8 of 10", caption: "minimum for a payout" },
    ],
    limits: [
      { label: "Consistency · best day", rule: "30%", value: "18%", max: "30% cap", pct: 60, tone: "accent" },
      { label: "Max drawdown · trailing EoD", value: "690.00 $", max: "2,000.00 $", pct: 35 },
      { label: "Daily loss limit", value: "240.00 $", max: "1,000.00 $", pct: 24 },
    ],
    footer: "Payout every 10 days · split 90/10 · max 5 mini contracts",
    action: "Open account",
  },
  {
    id: "IQRA50K-7709455",
    title: "Rapid 50K · NinjaTrader",
    partner: "Ninja Trader",
    status: { tone: "negative", label: "Hard breach · 3rd strike · 16 Sep 2026" },
    type: "Breached",
    tab: "breached",
    stats: [
      { label: "Final balance", value: "48,940.00 $", caption: "start 50,000.00 $", tone: "negative" },
      { label: "Equity", value: "48,940.00 $", caption: "no open positions" },
      { label: "Trading days", value: "11", caption: "closed on day 11" },
    ],
    limits: [
      { label: "Max position loss", rule: "1%", value: "500.00 $", max: "500.00 $", pct: 100, tone: "danger" },
      { label: "Max drawdown · trailing EoD", value: "1,060.00 $", max: "2,000.00 $", pct: 53 },
      { label: "Consistency · best day", rule: "40%", value: "36%", max: "40% cap", pct: 90, tone: "accent" },
    ],
    footer: "Closed 16 Sep 2026 · outstanding profits forfeited",
    action: "View breach log",
  },
  {
    id: "IQCF50K-7711230",
    title: "Core 50K · Volumetrica",
    partner: "Volumetrica",
    status: { tone: "warning", label: "Reset applied · counters back to zero" },
    type: "Reset",
    tab: "challenge",
    stats: [
      { label: "Balance", value: "50,000.00 $", caption: "back to the start" },
      { label: "Equity", value: "50,000.00 $", caption: "no open positions" },
      { label: "Trading days", value: "0", caption: "fresh 30-day window" },
    ],
    limits: [
      { label: "Profit target", rule: "6%", value: "0.00 $", max: "3,000.00 $", pct: 0, tone: "accent" },
      { label: "Max drawdown · trailing EoD", value: "0.00 $", max: "2,000.00 $", pct: 0 },
      { label: "Daily loss limit", value: "0.00 $", max: "1,000.00 $", pct: 0 },
    ],
    footer: "Reset fee 49.00 $ paid · new 30-day window ends 20 Oct 2026",
    action: "Open account",
  },
]

/* ---------------------------------- Activity ---------------------------------- */

export const engagement = [
  { title: "Active days", value: "228", caption: "63% of the last 12 months" },
  { title: "Longest streak", value: "18 days", caption: "04 Jun – 21 Jun 2026" },
  { title: "Logins · 30 days", value: "19", caption: "3 devices · 1 country" },
  { title: "Trading days · 30 days", value: "18", caption: "across 4 accounts" },
  { title: "Orders · 30 days", value: "1", caption: "249.00 $ · renewal" },
]

export const weekdays = [
  { day: "Mon", days: 40 },
  { day: "Tue", days: 44 },
  { day: "Wed", days: 43 },
  { day: "Thu", days: 41 },
  { day: "Fri", days: 38 },
  { day: "Sat", days: 14 },
  { day: "Sun", days: 8 },
]

/** 53 weeks × 7 days of activity levels 0–4, busier towards the present and on weekdays. */
export function heatmap(): number[][] {
  return Array.from({ length: 53 }, (_, w) =>
    Array.from({ length: 7 }, (_, d) => {
      const h = Math.sin(w * 12.9898 + d * 78.233) * 43758.5453
      const r = h - Math.floor(h)
      const weekend = d >= 5 ? 0.45 : 1
      const trend = 0.45 + (w / 52) * 0.55
      const v = r * weekend * trend * 5
      return v < 0.9 ? 0 : Math.min(4, Math.floor(v))
    })
  )
}

export const heatmapMonths = ["Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep"]

export type AccountLog = { account: string; profit: string; date: string; time: string; action: string; actionColor: "yellow" | "red" | "green"; reason: string; rule: string; detail: string | null }

export const accountLogs: AccountLog[] = [
  { account: "IQCFEV50K-7713901", profit: "+18%", date: "08 Sep 2026", time: "21:38:56", action: "Partial flat", actionColor: "yellow", reason: "Maximum position open loss", rule: "Future · Classic 50k Promo — Evaluation", detail: null },
  { account: "IQCFEV50K-7713901", profit: "+18%", date: "08 Sep 2026", time: "21:38:56", action: "Partial flat", actionColor: "yellow", reason: "Maximum position open loss", rule: "Future · Classic 50k Promo — Evaluation", detail: null },
  { account: "IQCEV100K-7710243", profit: "+4%", date: "21 Aug 2026", time: "16:04:12", action: "Warning", actionColor: "yellow", reason: "Max position loss above 80% of the limit", rule: "Crypto · Core 100K — Evaluation", detail: null },
  { account: "IQRA50K-7709455", profit: "−2%", date: "16 Sep 2026", time: "13:22:40", action: "Hard breach", actionColor: "red", reason: "Third strike · max position loss", rule: "Future · Rapid 50k — Evaluation", detail: "Strike 3" },
  { account: "IQIF50K-7712004", profit: "+5%", date: "12 Sep 2026", time: "23:59:00", action: "Cleared", actionColor: "green", reason: "Daily drawdown back inside the limit", rule: "Future · Instant Funding 50k", detail: null },
]

export type ActivityEvent = { title: string; detail: string; actor: string; link: string; date: string; time: string; tone: "positive" | "neutral" | "negative" }

export const activity: ActivityEvent[] = [
  { title: "Payout paid", detail: "720.00 $ sent to the trader · 90/10 split", actor: "System", link: "PAY-00412 · Core 100K · funding", date: "28 Aug 2026", time: "14:32 UTC", tone: "positive" },
  { title: "Payout requested", detail: "720.00 $ · 4 eligibility checks passed", actor: "Cesar Imura", link: "Core 100K · funding", date: "27 Aug 2026", time: "09:14 UTC", tone: "neutral" },
  { title: "Login", detail: "Chrome on macOS · São Paulo, BR · 189.32.14.7", actor: "Cesar Imura", link: "Session S-77120", date: "26 Aug 2026", time: "21:02 UTC", tone: "neutral" },
  { title: "Moved to Funding", detail: "Challenge passed · profit target reached", actor: "System", link: "Core 100K · funding", date: "14 Aug 2026", time: "00:05 UTC", tone: "positive" },
  { title: "Challenge started", detail: "First trade on MT5 · Core 100K", actor: "Cesar Imura", link: "Core 100K · challenge", date: "02 Jun 2026", time: "11:05 UTC", tone: "positive" },
  { title: "Payout paid", detail: "520.00 $ sent to the trader", actor: "System", link: "PAY-00318 · Core 50K · funding", date: "18 May 2026", time: "16:40 UTC", tone: "positive" },
  { title: "Order placed", detail: "Instant Funding 50K · pending payment", actor: "Cesar Imura", link: "ORD-99231", date: "11 Mar 2026", time: "13:22 UTC", tone: "neutral" },
  { title: "Refund issued", detail: "89.00 $ returned · duplicate purchase", actor: "Julian (admin)", link: "ORD-99118", date: "09 Mar 2026", time: "10:03 UTC", tone: "negative" },
  { title: "KYC approved manually", detail: "Identity approved after document review", actor: "Julian (admin)", link: "Profile", date: "14 Jan 2026", time: "15:48 UTC", tone: "positive" },
  { title: "KYC accepted", detail: "Synced from provider", actor: "System", link: "Profile", date: "14 Jan 2026", time: "15:44 UTC", tone: "positive" },
  { title: "First purchase", detail: "267.00 $ · Core 50K · challenge", actor: "Cesar Imura", link: "ORD-98004", date: "12 Jan 2026", time: "19:26 UTC", tone: "neutral" },
]

export const sessions = [
  { device: "Chrome on macOS", meta: "São Paulo, BR · 189.32.14.7 · trusted device", when: "2 days ago", kind: "laptop" as const },
  { device: "Chrome on macOS", meta: "São Paulo, BR · 189.32.14.7", when: "5 days ago", kind: "laptop" as const },
  { device: "Safari on iPhone", meta: "São Paulo, BR · 177.92.8.41 · new device", when: "12 days ago", kind: "phone" as const },
  { device: "Chrome on Windows", meta: "Lisbon, PT · 85.240.17.9 · new country", when: "28 Jul 2026", kind: "desktop" as const },
  { device: "Chrome on Android", meta: "Rio de Janeiro, BR · 191.245.30.12 · new device", when: "14 Jun 2026", kind: "phone" as const },
]

export const staffLogs = [
  { title: "Impersonation", role: "Owner" as const, detail: "Maria opened the trader view for 6 minutes", date: "22 Aug 2026" },
  { title: "Note added", role: "Admin" as const, detail: "Julian: extension approved after the platform outage", date: "18 Sep 2026" },
  { title: "Free reset granted", role: "Owner" as const, detail: "Maria added 1 free reset to SUB-2026-0418", date: "02 Sep 2026" },
  { title: "Refund issued", role: "Admin" as const, detail: "Julian returned 89.00 $ on a duplicate purchase", date: "09 Mar 2026" },
  { title: "KYC approved manually", role: "Admin" as const, detail: "Julian approved the identity after document review", date: "14 Jan 2026" },
].sort((a, b) => Date.parse(b.date) - Date.parse(a.date))

/* ---------------------------------- Notifications ---------------------------------- */

export type Notice = { id: string; source: "Email" | "Web" | "External"; date: string; time: string; type: string; category: string; status: "Delivered" | "Opened" | "Failed" | "Pending" | "Bounced" }

const NOTICE_TYPES = ["User created", "User created", "Payout processed", "Account breached", "Order paid", "KYC approved", "Challenge passed", "Renewal reminder"]
const NOTICE_CATEGORIES = ["User", "Verification", "Payment intent", "Payout", "Account", "Order", "Subscription"]
const NOTICE_STATUS: Notice["status"][] = ["Delivered", "Delivered", "Opened", "Delivered", "Failed", "Pending", "Bounced", "Delivered"]
const NOTICE_SOURCES: Notice["source"][] = ["Email", "Email", "Web", "External"]

export const notifications: Notice[] = Array.from({ length: 42 }, (_, i) => {
  const day = 13 - Math.floor(i / 3)
  const date = new Date(Date.UTC(2026, 7, day > 0 ? day : 1, 23 - ((i * 7) % 15), (i * 17) % 60))
  return {
    id: `evt_7f21c9a4e${i.toString(16)}`,
    source: NOTICE_SOURCES[(i * 5) % 4],
    date: date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" }),
    time: date.toISOString().slice(11, 16),
    type: NOTICE_TYPES[i % NOTICE_TYPES.length],
    category: NOTICE_CATEGORIES[(i * 3) % NOTICE_CATEGORIES.length],
    status: NOTICE_STATUS[(i * 3) % NOTICE_STATUS.length],
  }
})

/* ---------------------------------- Identity ---------------------------------- */

export function identity(user: User) {
  return {
    kyc: user.verification === "verified" ? "Approved" : user.verification === "pending" ? "Pending" : "Not started",
    fundedAgreement: user.accountTypes.some((t) => t === "funding" || t === "instant_funding") ? "Signed" : "Not signed",
    purchases: user.status === "banned" ? "Blocked" : "Allowed",
    fraud: user.status === "banned" ? "Flagged" : "No fraud flag",
  }
}
