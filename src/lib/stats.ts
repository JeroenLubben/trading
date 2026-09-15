import type { Trade } from '../types'

export interface TradeStats {
  count: number
  wins: number
  losses: number
  breakeven: number
  winRate: number | null // 0-100, null if no closed trades
  totalPnl: number
  avgR: number | null
  equityCurve: { date: string; cumulativePnl: number }[]
  rMultiples: { id: string; date: string; r: number }[]
}

/** R-multiple: realized P&L expressed as a multiple of what was risked. */
export function rMultiple(trade: Trade): number | null {
  if (trade.realized_pnl == null || !trade.risk_amount) return null
  return trade.realized_pnl / trade.risk_amount
}

export function computeStats(trades: Trade[]): TradeStats {
  const closed = trades.filter((t) => t.realized_pnl != null)
  const wins = closed.filter((t) => (t.realized_pnl ?? 0) > 0).length
  const losses = closed.filter((t) => (t.realized_pnl ?? 0) < 0).length
  const breakeven = closed.length - wins - losses

  const sorted = [...closed].sort((a, b) => a.trade_date.localeCompare(b.trade_date))
  let running = 0
  const equityCurve = sorted.map((t) => {
    running += t.realized_pnl ?? 0
    return { date: t.trade_date, cumulativePnl: running }
  })

  const rMultiples = sorted
    .map((t) => ({ id: t.id, date: t.trade_date, r: rMultiple(t) }))
    .filter((r): r is { id: string; date: string; r: number } => r.r != null)

  const avgR =
    rMultiples.length > 0 ? rMultiples.reduce((sum, r) => sum + r.r, 0) / rMultiples.length : null

  return {
    count: trades.length,
    wins,
    losses,
    breakeven,
    winRate: closed.length > 0 ? (wins / closed.length) * 100 : null,
    totalPnl: closed.reduce((sum, t) => sum + (t.realized_pnl ?? 0), 0),
    avgR,
    equityCurve,
    rMultiples,
  }
}
