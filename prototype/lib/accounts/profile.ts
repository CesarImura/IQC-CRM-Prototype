// Account profile model (Figma Accounts · Account · <type> frames, 4333:118764 …). Everything is derived from the
// list row so the profile and the list never disagree. Texts follow the Figma templates; vault: Features/2026-10
// Account profiles by account type ("the meter shows the limit; the rules card shows only what the meter doesn't").

import { TODAY } from "@/lib/users/data"
import { daysUntil, getAccounts, type Account } from "./data"

export const findAccount = (id: string) => getAccounts().find((a) => a.id === id)

const DAY = 86_400_000
const money = (v: number) => `${v < 0 ? "−" : ""}${Math.abs(v).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} $`
const whole = (v: number) => `${Math.round(v).toLocaleString("en-US")} $`
const dateFmt = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" })
const timeFmt = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "UTC" })
const d = (iso: string | number) => dateFmt.format(new Date(iso)).replace("Sept", "Sep")
const dt = (iso: string | number) => `${d(iso)}, ${timeFmt.format(new Date(iso))}`

function rand(seed: number, salt: number) {
  let h = (seed * 2654435761 + salt * 40503) >>> 0
  h = Math.imul(h ^ (h >>> 16), 2246822507) >>> 0
  h = Math.imul(h ^ (h >>> 13), 3266489909) >>> 0
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}
const seedOf = (id: string) => [...id].reduce((s, c) => (s * 31 + c.charCodeAt(0)) >>> 0, 7)

export type Meter = { label: string; value: string; of: string; caption: string; pct: number; tone: "accent" | "danger" | "neutral" }
export type RuleRow = { label: string; value: string; caption: string; pct?: number; tone?: "accent" | "danger" | "neutral" }
export type Trade = { session: string; time: string; market: string; side: "Long" | "Short"; contracts: number; entry: string; exit: string; duration: string; pnl: number; note: string }
export type LogItem = { title: string; detail: string; tone: "neutral" | "warning" | "negative" | "positive" }
export type Session = { label: string; date: string; balance: number; equity: number; pnl: number; trades: number; high: number }

const MARKETS = { future: ["MNQ", "ES", "NQ", "CL", "MES", "GC"], crypto: ["BTCUSD", "ETHUSD", "SOLUSD", "XRPUSD"] }
const PLATFORM = { "dxFeed": "Quantower", "MT5 - IQ": "MetaTrader 5", VolumetricaFX: "Volumetrica" } as const

/** Max position loss per market: 1% of the start on Classic challenges, 0.5% on funded (Figma). */
const maxPositionLoss = (a: Account) => (a.type === "challenge" ? a.start * 0.01 : a.start * 0.005)

export function accountProfile(a: Account) {
  const seed = seedOf(a.id)
  const r = (salt: number) => rand(seed, salt)
  const isChallenge = a.type === "challenge"
  const closed = a.status === "breached" || a.status === "disabled"
  const createdMs = new Date(a.created).getTime()
  const endMs = a.disabledAt ? new Date(a.disabledAt).getTime() : TODAY.getTime()
  const tradingDays = Math.max(1, Math.min(isChallenge ? 30 : 60, Math.round((endMs - createdMs) / DAY * 0.7)))
  const sessionsCount = Math.max(5, Math.min(15, tradingDays))

  // Sessions: a walk from the start balance to the current balance (closing on the breach for Breached).
  const sessions: Session[] = []
  const finalBal = a.balance
  let high = a.start
  for (let i = 0; i < sessionsCount; i++) {
    const t = (i + 1) / sessionsCount
    const noise = i === sessionsCount - 1 ? 0 : (r(100 + i) - 0.5) * a.start * 0.02
    const balance = Math.round(a.start + (finalBal - a.start) * t + noise)
    const prev = i ? sessions[i - 1].balance : a.start
    const equity = i === sessionsCount - 1 ? balance + a.openPnl : balance
    high = Math.max(high, balance, equity)
    const at = createdMs + ((endMs - createdMs) * (i + 1)) / sessionsCount
    sessions.push({ label: `#${i + 1}`, date: `${d(at)} · ${timeFmt.format(new Date(at))} UTC`, balance, equity, pnl: balance - prev, trades: 1 + Math.floor(r(200 + i) * 6), high: Math.max(balance, equity) })
  }
  const last = sessions[sessions.length - 1]
  const lastSessionAt = endMs - (r(3) * 6 + 1) * 3_600_000

  // Meters (Row · Limits): Drawdown · Max position loss (Daily loss on DLL) · Profit target (Consistency on funded) · Trading days.
  const mpl = maxPositionLoss(a)
  const worstPosition = Math.round(mpl * (closed ? 1 : 0.2 + r(4) * 0.78))
  const room = a.balance - (a.start - a.drawdown.limit)
  const ddPct = (a.drawdown.used / a.drawdown.limit) * 100
  const market = MARKETS[a.market][Math.floor(r(5) * MARKETS[a.market].length)]
  const meters: Meter[] = [
    {
      label: "Drawdown",
      value: whole(a.drawdown.used),
      of: `of ${money(a.drawdown.limit)}`,
      caption: a.status === "breached" && a.cause !== "Daily loss" ? `breached · ${whole(a.drawdown.used - a.drawdown.limit)} past the line` : `${a.family === "Classic" && isChallenge && a.size === 100 ? "trailing" : "static"} line · ${money(Math.max(0, room))} of room`,
      pct: ddPct,
      tone: ddPct >= 100 ? "danger" : ddPct >= 70 ? "danger" : "neutral",
    },
    a.family === "Classic DLL"
      ? {
          label: "Daily loss",
          value: whole(Math.max(0, -a.dailyPnl)),
          of: `of ${money(a.size === 50 ? 1000 : 1500)}`,
          caption: a.cause === "Daily loss" ? "breached today · account closed" : "resets 00:00 UTC · DLL rule",
          pct: (Math.max(0, -a.dailyPnl) / (a.size === 50 ? 1000 : 1500)) * 100,
          tone: a.cause === "Daily loss" ? "danger" : "neutral",
        }
      : {
          label: "Max position loss",
          value: whole(worstPosition),
          of: `of ${money(mpl)}`,
          caption: `${isChallenge ? "1%" : "0.5%"} per market · largest loss on ${market}`,
          pct: (worstPosition / mpl) * 100,
          tone: worstPosition / mpl >= 0.9 ? "danger" : "neutral",
        },
    isChallenge
      ? {
          label: "Profit target",
          value: whole(a.profit?.current ?? 0),
          of: `of ${money(a.profit?.target ?? 0)}`,
          caption: `${Math.round(((a.profit?.current ?? 0) / (a.profit?.target ?? 1)) * 100)}% reached · realized profit only`,
          pct: ((a.profit?.current ?? 0) / (a.profit?.target ?? 1)) * 100,
          tone: "accent",
        }
      : {
          label: "Consistency",
          value: a.consistency === null ? "—" : `${a.consistency}%`,
          of: "of 30% max",
          caption: a.consistency === null ? "no realized profit yet" : `best day is ${a.consistency}% of the realized profit`,
          pct: a.consistency === null ? 0 : (a.consistency / 30) * 100,
          tone: (a.consistency ?? 0) > 30 ? "danger" : "accent",
        },
    {
      label: "Trading days",
      value: String(tradingDays),
      of: isChallenge ? "of 30 days" : "of 10 needed",
      caption: closed ? `stopped on day ${tradingDays} · ${a.status} ${a.disabledAt ? d(a.disabledAt).slice(0, 6) : ""}` : isChallenge ? `${Math.max(0, 30 - tradingDays)} days left · no minimum on ${a.family}` : tradingDays >= 10 ? "requirement met · 10 trading days for a payout" : `${10 - tradingDays} more days before a payout`,
      pct: isChallenge ? (tradingDays / 30) * 100 : Math.min(100, (tradingDays / 10) * 100),
      tone: "neutral",
    },
  ]

  // Header KPI strip (Stat · Balance / Equity / Daily net P&L / Profit target or Payout / Drawdown room / Expiration).
  const totalPnl = a.balance - a.start + a.openPnl
  const kpis = [
    { title: "Balance", value: money(a.balance), caption: `start ${money(a.start)}`, tone: a.balance >= a.start ? ("positive" as const) : ("negative" as const) },
    { title: "Equity", value: money(a.balance + a.openPnl), caption: a.openPnl ? `${money(a.openPnl)} open` : "no open positions" },
    { title: "Daily net P&L", value: money(a.dailyPnl), caption: `total ${money(totalPnl)}`, tone: a.dailyPnl > 0 ? ("positive" as const) : a.dailyPnl < 0 ? ("negative" as const) : undefined },
    isChallenge
      ? { title: "To target", value: money(Math.max(0, (a.profit?.target ?? 0) - (a.profit?.current ?? 0))), caption: `of ${money(a.profit?.target ?? 0)}` }
      : { title: "Withdrawals", value: String(a.withdrawals), caption: a.withdrawals ? `${money(a.withdrawals * a.size * 22)} paid` : "no payout yet" },
    { title: "Drawdown room", value: money(Math.max(0, room)), caption: `line at ${money(a.start - a.drawdown.limit)}`, tone: room <= 0 ? ("negative" as const) : undefined },
    a.expires
      ? { title: "Expiration", value: daysUntil(a.expires) === 0 ? "Today" : `${daysUntil(a.expires)} days`, caption: d(a.expires) }
      : a.renews
        ? { title: "Renews", value: `${daysUntil(a.renews)} days`, caption: d(a.renews) }
        : { title: closed ? "Closed" : "Expiration", value: a.disabledAt ? d(a.disabledAt) : "—", caption: a.disabledAt ? timeFmt.format(new Date(a.disabledAt)) + " UTC" : "no expiry" },
  ]

  // Rules card: Rule compliance (Challenge) or Payout readiness (Funded). Text on top, then limit bars.
  const scalping = Math.round(3 + r(6) * 10)
  const maxSize = a.size === 50 ? 50 : 100
  const largest = Math.min(maxSize, 5 + Math.floor(r(7) * 10))
  const statusText: { label: string; value: string }[] = isChallenge
    ? a.status === "breached"
      ? [
          { label: "Status", value: `${a.cause === "Daily loss" ? "daily loss limit" : a.cause === "Hard breach" ? "3rd strike" : "maximum drawdown"} · ${a.disabledAt ? dt(a.disabledAt) : ""} UTC · closed at ${money(a.balance)}` },
          { label: "Next step", value: `${a.size === 50 ? "49.00" : "79.00"} $ reset · balance back to ${money(a.start)} · days keep counting` },
        ]
      : a.status === "challenge_passed"
        ? [
            { label: "Status", value: `target hit with ${money(a.profit?.current ?? 0)} · funded account created` },
            { label: "Next step", value: `activation fee ${a.size === 50 ? "129.00" : "149.00"} $ · then the funded account starts` },
          ]
        : [
            { label: "Status", value: `${money(Math.max(0, (a.profit?.target ?? 0) - (a.profit?.current ?? 0)))} left to the ${money(a.profit?.target ?? 0)} profit target` },
            { label: "After passing", value: `consistency 30% · 90/10 split · first payout up to ${a.size === 50 ? "1,500" : "2,000"} $` },
          ]
    : a.status === "initialized"
      ? [
          { label: "Status", value: `waiting for the ${a.size === 50 ? "129.00" : "149.00"} $ activation fee` },
          { label: "Continues", value: a.parentId ?? "—" },
        ]
      : [
          { label: "Status", value: (a.consistency ?? 0) > 30 ? "consistency above 30% · payout locked" : tradingDays < 10 ? `${10 - tradingDays} trading days before a payout` : "ready to withdraw" },
          { label: "Withdrawable when unlocked", value: money(Math.max(0, totalPnl) * 0.9) },
          { label: "Next payout cap", value: a.size === 50 ? ["1,500.00 $", "2,000.00 $", "2,500.00 $"][Math.min(2, a.withdrawals)] : ["2,000.00 $", "2,500.00 $", "3,000.00 $"][Math.min(2, a.withdrawals)] },
        ]
  const limits: RuleRow[] = [
    ...(a.strikes ? [{ label: "Strikes", value: `${a.strikes.used} / ${a.strikes.max}`, caption: "each breach closes the position · the last one closes the account", pct: (a.strikes.used / a.strikes.max) * 100, tone: a.strikes.used >= a.strikes.max - 1 && a.strikes.used > 0 ? ("danger" as const) : ("neutral" as const) }] : []),
    { label: "Scalping rule", value: `${scalping}% / 50% max`, caption: "trades closed in under 15 s · 50% is the limit", pct: (scalping / 50) * 100, tone: "neutral" },
    { label: "Max position size", value: `${largest} / ${maxSize} Micros`, caption: `largest order · ${largest} ${MARKETS[a.market][0]} · ${maxSize / 10} Minis or ${maxSize} Micros allowed`, pct: (largest / maxSize) * 100, tone: "neutral" },
  ]

  // Recent trades (library Data Table).
  const trades: Trade[] = Array.from({ length: 6 }, (_, i) => {
    const s = sessions[Math.max(0, sessions.length - 1 - Math.floor(i / 2))]
    const pnl = Math.round((r(300 + i) - 0.48) * mpl * 1.4)
    const m = MARKETS[a.market][Math.floor(r(310 + i) * MARKETS[a.market].length)]
    const price = a.market === "crypto" ? 2000 + r(320 + i) * 60000 : 4000 + r(320 + i) * 16000
    const mins = 1 + Math.floor(r(330 + i) * 90)
    return {
      session: s.label,
      time: `${String(9 + Math.floor(r(340 + i) * 10)).padStart(2, "0")}:${String(Math.floor(r(350 + i) * 60)).padStart(2, "0")}`,
      market: m,
      side: r(360 + i) < 0.55 ? "Long" : "Short",
      contracts: 1 + Math.floor(r(370 + i) * 8),
      entry: price.toLocaleString("en-US", { maximumFractionDigits: 2 }),
      exit: (price * (1 + pnl / a.start / 4)).toLocaleString("en-US", { maximumFractionDigits: 2 }),
      duration: mins < 60 ? `${mins} min` : `${Math.floor(mins / 60)} h ${mins % 60} min`,
      pnl,
      note: pnl <= -mpl * 0.9 ? "close to max position loss" : pnl > mpl * 0.6 ? "best trade of the session" : "",
    }
  })

  // Risk logs (newest first).
  const logs: LogItem[] = []
  if (a.status === "breached")
    logs.push({ title: `Account breached · ${a.cause === "Daily loss" ? "daily loss" : a.cause === "Hard breach" ? "3rd strike" : "maximum drawdown"}`, detail: `${a.disabledAt ? dt(a.disabledAt) : ""} · equity ${money(a.balance)} · all positions closed`, tone: "negative" })
  if (a.status === "disabled" && a.reason)
    logs.push({ title: `Disabled · ${a.reason.title}`, detail: `${a.disabledAt ? dt(a.disabledAt) : ""} · ${a.reason.detail} · by ${a.disabledBy?.name} (${a.disabledBy?.team})`, tone: "negative" })
  if (a.status === "challenge_passed") logs.push({ title: "Challenge passed", detail: `${d(endMs)} · profit target hit · funded account waiting for the activation fee`, tone: "positive" })
  if ((a.consistency ?? 0) > 30) logs.push({ title: "Consistency above 30%", detail: `${d(endMs - DAY)} · best day is ${a.consistency}% of the realized profit · payout locked`, tone: "warning" })
  if (a.strikes && a.strikes.used > 0) logs.push({ title: "Strike 1 · max position loss", detail: `${d(createdMs + (endMs - createdMs) * 0.6)} · ${market} position closed at −${money(mpl * 1.04)} · limit ${money(mpl)}`, tone: "warning" })
  if (ddPct >= 20 && a.status !== "breached") logs.push({ title: "Drawdown check", detail: `${d(endMs - 2 * DAY)} · ${Math.round(ddPct)}% of the drawdown used · ${money(Math.max(0, room))} of room`, tone: "neutral" })
  if (a.status === "reset" && a.parentId) logs.push({ title: "Account reset", detail: `${d(createdMs)} · reset from ${a.parentId} · balance, rules and stats zeroed, time kept`, tone: "neutral" })
  const best = sessions.reduce((b, s) => (s.pnl > b.pnl ? s : b), sessions[0])
  logs.push({ title: "Best session", detail: `${best.date.split(" · ")[0]} · ${money(best.pnl)} · balance ${money(best.balance)}`, tone: "positive" })
  logs.push({ title: a.type === "challenge" ? "Account activated" : "Funded account activated", detail: `${d(createdMs)} · first session · ${PLATFORM[a.provider]} login ${a.mt5Login ?? 5000000 + (seed % 900000)}${a.parentId && a.type !== "challenge" ? ` · continues ${a.parentId}` : ""}`, tone: "neutral" })

  // Account setup (Field Grid) and economics (subscription & billing).
  const setup: { label: string; value: string; copy?: boolean }[] = [
    { label: "Account ID", value: a.id, copy: true },
    { label: "Rule", value: `${a.family} ${a.size}K · ${a.market === "future" ? "Futures" : "Crypto"}` },
    { label: "Account type", value: a.type === "challenge" ? "Challenge" : a.type === "funded" ? "Funded" : "Instant Funded" },
    { label: "Provider", value: a.provider },
    { label: "Platform", value: PLATFORM[a.provider] },
    { label: "Login", value: String(a.mt5Login ?? 5000000 + (seed % 900000)), copy: true },
    { label: "Starting balance", value: money(a.start) },
    { label: "Drawdown", value: `${money(a.drawdown.limit)} · ${a.family === "Classic" && isChallenge && a.size === 100 ? "trailing" : "static"}` },
    { label: "Created", value: `${dt(a.created)} UTC` },
    { label: a.expires ? "Expires" : a.renews ? "Renews" : "Closed", value: a.expires ? d(a.expires) : a.renews ? d(a.renews) : a.disabledAt ? `${dt(a.disabledAt)} UTC` : "—" },
    { label: "Lineage", value: a.parentId ? `↳ ${a.parentId}` : "first account" },
    { label: "Owner", value: a.user },
  ]
  const price = isChallenge ? (a.size === 50 ? 89 : 159) : a.type === "instant_funded" ? (a.size === 50 ? 299 : 599) : a.size === 50 ? 129 : 149
  const economics = [
    { id: `ORD-${(seed % 90000) + 10000}`, title: isChallenge ? `${a.family} ${a.size}K challenge` : a.type === "instant_funded" ? `Instant Funding ${a.size}K` : "Activation fee", count: 1, amount: price },
    ...(a.status === "reset" ? [{ id: `ORD-${(seed % 90000) + 10001}`, title: "Reset", count: 1, amount: a.size === 50 ? 49 : 79 }] : []),
    ...(isChallenge && r(8) < 0.4 ? [{ id: `ORD-${(seed % 90000) + 10002}`, title: "Extension · 7 days", count: 1, amount: 19 }] : []),
    ...(a.withdrawals ? [{ id: `PAY-${(seed % 9000) + 1000}`, title: "Payouts", count: a.withdrawals, amount: -a.withdrawals * a.size * 22 }] : []),
  ]

  return {
    lastSession: `${dt(lastSessionAt)} UTC`,
    tradingNow: !closed && a.openPnl !== 0,
    kpis,
    meters,
    sessions,
    snapshot: { balance: last.balance, equity: last.equity, daily: a.dailyPnl, sessions: sessions.length },
    statusText,
    limits,
    trades,
    logs,
    setup,
    economics,
    maxLoss: a.start - a.drawdown.limit,
    trailing: a.family === "Classic" && isChallenge && a.size === 100,
    target: isChallenge ? a.start + (a.profit?.target ?? 0) : undefined,
  }
}

export type AccountProfileModel = ReturnType<typeof accountProfile>
