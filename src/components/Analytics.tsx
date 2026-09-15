import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { computeStats } from '../lib/stats'
import type { Trade } from '../types'

interface Props {
  trades: Trade[]
}

function histogram(values: number[], binSize = 0.5) {
  if (values.length === 0) return []
  const min = Math.floor(Math.min(...values) / binSize) * binSize
  const max = Math.ceil(Math.max(...values) / binSize) * binSize
  const bins = new Map<string, number>()
  for (let b = min; b < max; b += binSize) {
    bins.set(b.toFixed(2), 0)
  }
  for (const v of values) {
    const key = (Math.floor(v / binSize) * binSize).toFixed(2)
    bins.set(key, (bins.get(key) ?? 0) + 1)
  }
  return Array.from(bins.entries())
    .map(([bin, count]) => ({ bin: `${bin}R`, count, value: Number(bin) }))
    .sort((a, b) => a.value - b.value)
}

export function Analytics({ trades }: Props) {
  const stats = computeStats(trades)

  if (stats.count === 0) {
    return <p className="empty-state">Log a few trades to see your stats here.</p>
  }

  const rHistogram = histogram(stats.rMultiples.map((r) => r.r))

  return (
    <div className="analytics">
      <div className="stat-grid">
        <StatCard label="Trades logged" value={String(stats.count)} />
        <StatCard
          label="Win rate"
          value={stats.winRate == null ? '—' : `${stats.winRate.toFixed(0)}%`}
        />
        <StatCard
          label="Total P&L"
          value={`${stats.totalPnl < 0 ? '-' : ''}$${Math.abs(stats.totalPnl).toFixed(2)}`}
          className={stats.totalPnl > 0 ? 'pnl-pos' : stats.totalPnl < 0 ? 'pnl-neg' : ''}
        />
        <StatCard label="Avg R" value={stats.avgR == null ? '—' : `${stats.avgR.toFixed(2)}R`} />
      </div>

      <section className="chart-card">
        <h3>P&amp;L over time</h3>
        {stats.equityCurve.length > 1 ? (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={stats.equityCurve}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip
                formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Cumulative P&L']}
              />
              <Line type="monotone" dataKey="cumulativePnl" stroke="var(--accent)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="empty-state">Need at least two closed trades to chart a trend.</p>
        )}
      </section>

      <section className="chart-card">
        <h3>R-multiple distribution</h3>
        {rHistogram.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={rHistogram}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="bin" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" fill="var(--accent)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="empty-state">
            Log risk ($) and realized P&amp;L on your trades to see R-multiples here.
          </p>
        )}
      </section>
    </div>
  )
}

function StatCard({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className="stat-card">
      <span className="stat-label">{label}</span>
      <span className={`stat-value ${className ?? ''}`}>{value}</span>
    </div>
  )
}
