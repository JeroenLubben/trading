export type Outcome = 'open' | 'win' | 'loss' | 'breakeven'

export function riskAmountFromPct(
  positionSize: number | null,
  riskPct: number | null,
): number | null {
  return positionSize != null && riskPct != null ? (positionSize * riskPct) / 100 : null
}

export interface PositionCalc {
  quantity: number | null
  rewardAtTp: number | null
  rrr: number | null
}

/** Same math as a typical position-size calculator: quantity sized so that
 * hitting the stop loses exactly `riskAmount`. */
export function calcPosition(
  riskAmount: number | null,
  entryPrice: number | null,
  stopLoss: number | null,
  takeProfit: number | null,
): PositionCalc {
  const stopDistance =
    entryPrice != null && stopLoss != null ? Math.abs(entryPrice - stopLoss) : null
  const quantity =
    riskAmount != null && stopDistance ? riskAmount / stopDistance : null
  const rewardAtTp =
    quantity != null && entryPrice != null && takeProfit != null
      ? quantity * Math.abs(takeProfit - entryPrice)
      : null
  const rrr = rewardAtTp != null && riskAmount ? rewardAtTp / riskAmount : null

  return { quantity, rewardAtTp, rrr }
}

export function outcomeResult(
  outcome: Outcome,
  riskAmount: number | null,
  rewardAtTp: number | null,
  entryPrice: number | null,
  stopLoss: number | null,
  takeProfit: number | null,
): { exitPrice: number | null; pnl: number | null } {
  switch (outcome) {
    case 'win':
      return { exitPrice: takeProfit, pnl: rewardAtTp }
    case 'loss':
      return { exitPrice: stopLoss, pnl: riskAmount != null ? -riskAmount : null }
    case 'breakeven':
      return { exitPrice: entryPrice, pnl: 0 }
    case 'open':
      return { exitPrice: null, pnl: null }
  }
}
