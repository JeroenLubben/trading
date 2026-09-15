export type Direction = 'long' | 'short'

export interface Trade {
  id: string
  user_id: string
  trade_date: string // YYYY-MM-DD
  trade_time: string | null // HH:MM
  symbol: string
  direction: Direction
  position_size: number | null
  entry_price: number | null
  exit_price: number | null
  stop_loss: number | null
  take_profit: number | null
  risk_amount: number | null
  fees: number | null
  realized_pnl: number | null
  created_at: string
}

export type NewTrade = Omit<Trade, 'id' | 'user_id' | 'created_at'>
