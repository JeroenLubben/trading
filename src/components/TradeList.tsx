import { supabase } from '../lib/supabase'
import { rMultiple } from '../lib/stats'
import type { Trade } from '../types'

interface Props {
  trades: Trade[]
  onChanged: () => void
}

const fmtMoney = (v: number | null) =>
  v == null ? '—' : `${v < 0 ? '-' : ''}$${Math.abs(v).toFixed(2)}`

export function TradeList({ trades, onChanged }: Props) {
  const handleDelete = async (id: string) => {
    if (!confirm('Delete this trade?')) return
    const { error } = await supabase.from('trades').delete().eq('id', id)
    if (error) {
      alert(error.message)
      return
    }
    onChanged()
  }

  if (trades.length === 0) {
    return <p className="empty-state">No trades logged yet. Tap "+ Log trade" to add your first one.</p>
  }

  return (
    <ul className="trade-list">
      {trades.map((t) => {
        const r = rMultiple(t)
        const pnlClass =
          t.realized_pnl == null ? '' : t.realized_pnl > 0 ? 'pnl-pos' : t.realized_pnl < 0 ? 'pnl-neg' : ''
        return (
          <li key={t.id} className="trade-card">
            <div className="trade-card-top">
              <span className="symbol">{t.symbol}</span>
              <span className={`direction-badge ${t.direction}`}>{t.direction}</span>
              <span className="date">
                {t.trade_date}
                {t.trade_time ? ` · ${t.trade_time}` : ''}
              </span>
            </div>
            <div className="trade-card-body">
              <span>
                Entry {t.entry_price ?? '—'} → Exit {t.exit_price ?? '—'}
              </span>
              <span className={pnlClass}>{fmtMoney(t.realized_pnl)}</span>
              {r != null && <span className="r-badge">{r.toFixed(2)}R</span>}
            </div>
            <button className="delete-btn" onClick={() => handleDelete(t.id)} aria-label="Delete trade">
              ×
            </button>
          </li>
        )
      })}
    </ul>
  )
}
