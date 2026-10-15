// Account families for manual account creation, from the product rules (pricing + help center, Oct 2026).
// Futures: Core (Classic in production), Core-DLL, Rapid, Instant Funding · 50K / 100K. Crypto & CFD: Core 50K–200K,
// Rapid, Instant Funding. No 25K accounts. Profit target: 6% Futures, 8% Crypto & CFD. Max drawdown is EOD trailing.

export type Market = "futures" | "crypto"

export type AccountFamily = {
  value: string
  label: string
  market: Market
  /** Account ID prefix used in production. */
  prefix: string
  size: number
  provider: { name: string; note: string }
  rule: string
  limits: { label: string; value: string }[]
  /** Days; null when the account doesn't expire. */
  duration: number | null
  platforms: string[]
}

const FUTURES_PLATFORMS = ["ATAS", "Quantower", "Deepchart", "Tradovate", "NinjaTrader", "TradingView"]
const CRYPTO_PLATFORMS = ["IQ MT5", "Volumetrica", "TradingView", "Phemex"]
const k = (n: number) => `${n / 1000}K`
const usd = (n: number) => `$${n.toLocaleString("en-US")}`

function family(
  market: Market,
  path: "Core" | "Core-DLL" | "Rapid" | "Instant Funding",
  size: number,
  opts: { prefix: string; target?: string; drawdown: number; loss: string; duration: number | null; extra?: { label: string; value: string }[] }
): AccountFamily {
  const marketLabel = market === "futures" ? "Futures" : "Crypto & CFD"
  const phase = path === "Instant Funding" ? "Funded" : "Evaluation"
  return {
    value: `${market}-${path.toLowerCase().replace(/\s+/g, "-")}-${size}`,
    label: `${path} ${k(size)} · ${marketLabel}`,
    market,
    prefix: opts.prefix,
    size,
    provider:
      market === "futures"
        ? { name: "dxFeed", note: "Streams the market data this account trades on." }
        : { name: "IQ MT5 · Volumetrica", note: "Crypto and CFD feed and execution for this account." },
    rule: `${path} ${k(size)} · ${phase}`,
    limits: [
      ...(opts.target ? [{ label: "Profit target", value: opts.target }] : []),
      { label: "Max drawdown", value: usd(opts.drawdown) },
      { label: opts.loss.startsWith("DLL") ? "Daily loss limit" : "Max position loss", value: opts.loss.replace("DLL ", "") },
      ...(opts.extra ?? []),
      { label: "Duration", value: opts.duration ? `${opts.duration} days` : "No expiry" },
    ],
    duration: opts.duration,
    platforms: market === "futures" ? FUTURES_PLATFORMS : CRYPTO_PLATFORMS,
  }
}

export const ACCOUNT_FAMILIES: AccountFamily[] = [
  family("futures", "Core", 50_000, { prefix: "IQCFEV", target: "6% · $3,000", drawdown: 3_000, loss: "1%", duration: 30 }),
  family("futures", "Core", 100_000, { prefix: "IQCFEV", target: "6% · $6,000", drawdown: 6_000, loss: "1%", duration: 30 }),
  family("futures", "Core-DLL", 50_000, { prefix: "IQDFEV", target: "6% · $3,000", drawdown: 2_000, loss: "DLL $1,000", duration: 30 }),
  family("futures", "Core-DLL", 100_000, { prefix: "IQDFEV", target: "6% · $6,000", drawdown: 3_000, loss: "DLL $1,500", duration: 30 }),
  family("futures", "Rapid", 50_000, { prefix: "IQRFEV", target: "$3,000", drawdown: 2_000, loss: "None", duration: 30, extra: [{ label: "Consistency", value: "40%" }] }),
  family("futures", "Rapid", 100_000, { prefix: "IQRFEV", target: "$6,000", drawdown: 3_000, loss: "None", duration: 30, extra: [{ label: "Consistency", value: "40%" }] }),
  family("futures", "Instant Funding", 50_000, { prefix: "IQIF", drawdown: 2_000, loss: "DLL $1,000", duration: 30, extra: [{ label: "Consistency", value: "30%" }] }),
  family("futures", "Instant Funding", 100_000, { prefix: "IQIF", drawdown: 3_000, loss: "DLL $1,500", duration: 30, extra: [{ label: "Consistency", value: "30%" }] }),
  family("crypto", "Core", 50_000, { prefix: "IQCEV", target: "8% · $4,000", drawdown: 3_000, loss: "1%", duration: 30 }),
  family("crypto", "Core", 100_000, { prefix: "IQCEV", target: "8% · $8,000", drawdown: 6_000, loss: "1%", duration: 30 }),
  family("crypto", "Core", 200_000, { prefix: "IQCEV", target: "8% · $16,000", drawdown: 10_000, loss: "1%", duration: 30 }),
  family("crypto", "Rapid", 50_000, { prefix: "IQRCEV", target: "$3,000", drawdown: 2_000, loss: "1%", duration: 30, extra: [{ label: "Consistency", value: "40%" }] }),
  family("crypto", "Rapid", 100_000, { prefix: "IQRCEV", target: "$6,000", drawdown: 3_000, loss: "1%", duration: 30, extra: [{ label: "Consistency", value: "40%" }] }),
  family("crypto", "Instant Funding", 50_000, { prefix: "IQIF", drawdown: 3_000, loss: "0.5%", duration: 30, extra: [{ label: "Consistency", value: "30%" }] }),
  family("crypto", "Instant Funding", 100_000, { prefix: "IQIF", drawdown: 6_000, loss: "0.5%", duration: 30, extra: [{ label: "Consistency", value: "30%" }] }),
]

export const PLATFORM_MARKS: Record<string, string> = {
  ATAS: "Atas",
  Quantower: "Quantower",
  Deepchart: "Deepcharts",
  Tradovate: "Tradovate",
  NinjaTrader: "Ninja Trader",
  TradingView: "Trading View",
  "IQ MT5": "MT5",
  Volumetrica: "Volumetrica",
  Phemex: "Phemex",
}
