import { cashEvents, money, type CashEvent } from "./profile"

/* Money story of one trader: dated purchases, renewals, payouts and refunds this year. The header KPIs, the Lifetime
   activities table and the Firm cash flow chart all read the same events, so their numbers always agree.
   Cesar keeps the hand-written story; every other profile gets its own, seeded by the user id (stable per user). */

const CESAR = "3083cd1f9b2a4e0c8d71a5f2c6b0ece3"
const TODAY = Date.UTC(2026, 9, 14)
const PLANS = [
  { name: "Classic 50K Future", price: 89 },
  { name: "Rapid 50K", price: 129 },
  { name: "Core 100K", price: 149 },
  { name: "Instant Funding 25K", price: 249 },
]

function seeded(id: string) {
  let h = 2166136261
  for (let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 16777619)
  return (k: number) => {
    let x = Math.imul(h ^ (k * 0x9e3779b9), 0x85ebca6b)
    x ^= x >>> 13
    x = Math.imul(x, 0xc2b2ae35)
    x ^= x >>> 16
    return (x >>> 0) / 4294967296
  }
}

const iso = (m: number, d: number) => `2026-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`

function generate(id: string): CashEvent[] {
  const r = seeded(id)
  const plan = PLANS[Math.floor(r(1) * PLANS.length)]
  const start = Math.floor(r(2) * 5) // first purchase between Jan and May
  const buys = 1 + Math.floor(r(3) * 3)
  const events: CashEvent[] = [{ date: iso(start, 3 + Math.floor(r(4) * 20)), kind: "purchase", amount: plan.price * buys, count: buys, plan: plan.name }]
  // Monthly renewals after the first purchase, with a few skipped months; one inside the last 30 days most of the time.
  for (let m = start + 1; m <= 9; m++) {
    if (r(10 + m) < 0.22) continue
    const day = m === 9 ? 2 + Math.floor(r(30 + m) * 11) : 4 + Math.floor(r(30 + m) * 22)
    events.push({ date: iso(m, day), kind: "renewal", amount: plan.price, plan: plan.name })
  }
  // 0–3 payouts, from two months after the first purchase.
  const payouts = Math.floor(r(50) * 4)
  for (let p = 0; p < payouts; p++) {
    const m = Math.min(9, start + 2 + Math.floor(r(51 + p) * (8 - start)))
    const day = m === 9 ? 1 + Math.floor(r(60 + p) * 12) : 2 + Math.floor(r(60 + p) * 25)
    events.push({ date: iso(m, day), kind: "payout", amount: -Math.round((300 + r(70 + p) * 2200) / 10) * 10, plan: plan.name })
  }
  if (r(80) < 0.4) {
    const m = Math.min(9, start + 1 + Math.floor(r(81) * 4))
    events.push({ date: iso(m, 5 + Math.floor(r(82) * 9)), kind: "refund", amount: -plan.price, plan: plan.name })
  }
  return events.filter((e) => Date.parse(`${e.date}T00:00:00Z`) <= TODAY).sort((a, b) => a.date.localeCompare(b.date))
}

export type MoneyProfile = ReturnType<typeof moneyProfile>

export function moneyProfile(id: string) {
  const events = id === CESAR ? cashEvents : generate(id)
  const r = seeded(id)
  const of = (kind: CashEvent["kind"]) => events.filter((e) => e.kind === kind)
  const count = (kind: CashEvent["kind"]) => of(kind).reduce((a, e) => a + (e.count ?? 1), 0)
  const total = (kind: CashEvent["kind"]) => of(kind).reduce((a, e) => a + e.amount, 0)
  const orders = total("purchase") + total("renewal")
  const ordersCount = count("purchase") + count("renewal")
  const net = orders + total("refund") + total("payout")
  const ratio = orders ? `${((Math.abs(total("payout")) / orders) * 100).toFixed(1)}%` : "—"
  const commission = id === CESAR ? 156.4 : Math.round(r(90) * 30000) / 100
  const manager = id === CESAR ? 42.1 : Math.round(commission * 27) / 100
  const first = events[0] ? new Date(`${events[0].date}T00:00:00Z`) : null
  const lastOrder = [...of("purchase"), ...of("renewal")].at(-1)
  const months = first ? Math.max(1, Math.round((TODAY - first.getTime()) / (30.4 * 86_400_000))) : 0
  const day = (iso: string) => {
    const d = new Date(`${iso}T00:00:00Z`)
    return `${d.getUTCDate()} ${d.toLocaleDateString("en-GB", { month: "short", timeZone: "UTC" }).slice(0, 3)}`
  }
  const plural = (n: number, w: string) => `${n} ${w}${n === 1 ? "" : "s"}`

  return {
    events,
    header: [
      { title: "Net amount", value: money(net), tone: net < 0 ? ("negative" as const) : ("positive" as const), caption: "Lifetime balance" },
      { title: "Total orders", value: String(ordersCount), caption: `${money(orders)} volume` },
      { title: "Payout / purchase", value: ratio, caption: count("payout") ? `${plural(count("payout"), "payout")} · ${money(total("payout"))}` : "No payouts yet" },
      { title: "Refunds", value: String(count("refund")), caption: count("refund") ? money(total("refund")) : "None" },
      { title: "Affiliate commissions", value: money(commission), tone: "positive" as const, caption: `${money(manager, true)} manager` },
      { title: "Customer for", value: plural(months, "month"), caption: lastOrder ? `Last purchase ${day(lastOrder.date)}` : "—" },
    ],
    lifetime: [
      { metric: "First purchases", count: count("purchase"), amount: money(total("purchase")) },
      { metric: "Renewals", count: count("renewal"), amount: money(total("renewal")) },
      { metric: "Total orders", count: ordersCount, amount: money(orders) },
      { metric: "Refunds", count: count("refund"), amount: money(total("refund")) },
      { metric: "Trading payouts", count: count("payout"), amount: money(total("payout")) },
      { metric: "Affiliate commissions", amount: money(commission), delta: "+18%" },
      { metric: "Affiliate manager commissions", amount: money(manager), delta: "+18%" },
      { metric: "Net amount", amount: money(net) },
      { metric: "Payout / purchase ratio", amount: ratio },
    ] as { metric: string; count?: number; amount: string; delta?: string }[],
  }
}
