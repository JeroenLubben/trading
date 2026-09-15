import { useState } from 'react'
import type { FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import type { Direction, Trade } from '../types'
import { calcPosition, outcomeResult, riskAmountFromPct } from '../lib/positionCalc'
import type { Outcome } from '../lib/positionCalc'

const todayISO = () => new Date().toISOString().slice(0, 10)
const nowHM = () => new Date().toTimeString().slice(0, 5)

interface Props {
  userId: string
  trade?: Trade
  onSaved: () => void
  onCancel: () => void
}

interface FormState {
  trade_date: string
  trade_time: string
  symbol: string
  direction: Direction
  position_size: string
  risk_pct: string
  entry_price: string
  stop_loss: string
  take_profit: string
  outcome: Outcome
  exit_price: string
  risk_amount: string
  realized_pnl: string
}

const numToStr = (v: number | null) => (v == null ? '' : String(v))
const parse = (v: string): number | null => (v.trim() === '' ? null : Number(v))

const emptyForm = (): FormState => ({
  trade_date: todayISO(),
  trade_time: nowHM(),
  symbol: '',
  direction: 'long',
  position_size: '',
  risk_pct: '',
  entry_price: '',
  stop_loss: '',
  take_profit: '',
  outcome: 'open',
  exit_price: '',
  risk_amount: '',
  realized_pnl: '',
})

const inferOutcome = (pnl: number | null): Outcome => {
  if (pnl == null) return 'open'
  if (pnl > 0) return 'win'
  if (pnl < 0) return 'loss'
  return 'breakeven'
}

const formFromTrade = (t: Trade): FormState => {
  const riskPct =
    t.position_size && t.risk_amount ? (t.risk_amount / t.position_size) * 100 : null
  return {
    trade_date: t.trade_date,
    trade_time: t.trade_time ?? '',
    symbol: t.symbol,
    direction: t.direction,
    position_size: numToStr(t.position_size),
    risk_pct: riskPct == null ? '' : String(Number(riskPct.toFixed(4))),
    entry_price: numToStr(t.entry_price),
    stop_loss: numToStr(t.stop_loss),
    take_profit: numToStr(t.take_profit),
    outcome: inferOutcome(t.realized_pnl),
    exit_price: numToStr(t.exit_price),
    risk_amount: numToStr(t.risk_amount),
    realized_pnl: numToStr(t.realized_pnl),
  }
}

// Fields that feed the risk/exit/P&L calculation — changing any of these
// re-derives the calculated fields below, unless the outcome is "open".
const TRIGGER_KEYS = new Set<keyof FormState>([
  'position_size',
  'risk_pct',
  'entry_price',
  'stop_loss',
  'take_profit',
  'outcome',
])

function recalc(next: FormState): FormState {
  const positionSize = parse(next.position_size)
  const riskPct = parse(next.risk_pct)
  const entryPrice = parse(next.entry_price)
  const stopLoss = parse(next.stop_loss)
  const takeProfit = parse(next.take_profit)

  const derivedRisk = riskAmountFromPct(positionSize, riskPct)
  const riskAmount = derivedRisk ?? parse(next.risk_amount)

  const { rewardAtTp } = calcPosition(riskAmount, entryPrice, stopLoss, takeProfit)

  const result =
    next.outcome === 'open'
      ? { exitPrice: null, pnl: null }
      : outcomeResult(next.outcome, riskAmount, rewardAtTp, entryPrice, stopLoss, takeProfit)

  return {
    ...next,
    risk_amount: derivedRisk != null ? String(Number(derivedRisk.toFixed(2))) : next.risk_amount,
    exit_price: next.outcome === 'open' ? '' : numToStr(result.exitPrice),
    realized_pnl: next.outcome === 'open' ? '' : numToStr(result.pnl != null ? Number(result.pnl.toFixed(2)) : null),
  }
}

const toNumber = (v: string): number | null => (v.trim() === '' ? null : Number(v))

export function TradeForm({ userId, trade, onSaved, onCancel }: Props) {
  const isEdit = trade != null
  const [form, setForm] = useState<FormState>(trade ? formFromTrade(trade) : emptyForm())
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => {
      const next = { ...f, [key]: value }
      return TRIGGER_KEYS.has(key) ? recalc(next) : next
    })
  }

  const positionSize = parse(form.position_size)
  const entryPrice = parse(form.entry_price)
  const stopLoss = parse(form.stop_loss)
  const takeProfit = parse(form.take_profit)
  const riskPreview = riskAmountFromPct(positionSize, parse(form.risk_pct)) ?? parse(form.risk_amount)
  const preview = calcPosition(riskPreview, entryPrice, stopLoss, takeProfit)
  const showPreview = riskPreview != null && (preview.quantity != null || preview.rrr != null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!form.symbol.trim()) {
      setError('Symbol is required.')
      return
    }
    setSaving(true)
    setError(null)

    const payload = {
      trade_date: form.trade_date,
      trade_time: form.trade_time || null,
      symbol: form.symbol.trim().toUpperCase(),
      direction: form.direction,
      position_size: toNumber(form.position_size),
      entry_price: toNumber(form.entry_price),
      exit_price: toNumber(form.exit_price),
      stop_loss: toNumber(form.stop_loss),
      take_profit: toNumber(form.take_profit),
      risk_amount: toNumber(form.risk_amount),
      realized_pnl: toNumber(form.realized_pnl),
    }

    const { error: saveError } = isEdit
      ? await supabase.from('trades').update(payload).eq('id', trade.id)
      : await supabase.from('trades').insert({ ...payload, user_id: userId })

    setSaving(false)
    if (saveError) {
      setError(saveError.message)
      return
    }
    onSaved()
  }

  return (
    <form className="trade-form" onSubmit={handleSubmit}>
      <h2>{isEdit ? 'Edit trade' : 'Log a trade'}</h2>

      <div className="field-row">
        <label>
          Date
          <input
            type="date"
            value={form.trade_date}
            onChange={(e) => set('trade_date', e.target.value)}
            required
          />
        </label>
        <label>
          Time
          <input
            type="time"
            value={form.trade_time}
            onChange={(e) => set('trade_time', e.target.value)}
          />
        </label>
      </div>

      <div className="field-row">
        <label className="grow">
          Symbol
          <input
            type="text"
            placeholder="e.g. AAPL"
            value={form.symbol}
            onChange={(e) => set('symbol', e.target.value)}
            required
            autoFocus={!isEdit}
          />
        </label>
        <label>
          Direction
          <select
            value={form.direction}
            onChange={(e) => set('direction', e.target.value as Direction)}
          >
            <option value="long">Long</option>
            <option value="short">Short</option>
          </select>
        </label>
      </div>

      <div className="field-row">
        <label>
          Position size ($)
          <input
            type="number"
            step="any"
            inputMode="decimal"
            value={form.position_size}
            onChange={(e) => set('position_size', e.target.value)}
          />
        </label>
        <label>
          Risk (%)
          <input
            type="number"
            step="any"
            inputMode="decimal"
            placeholder="e.g. 1"
            value={form.risk_pct}
            onChange={(e) => set('risk_pct', e.target.value)}
          />
        </label>
      </div>

      <div className="field-row">
        <label>
          Entry price
          <input
            type="number"
            step="any"
            inputMode="decimal"
            value={form.entry_price}
            onChange={(e) => set('entry_price', e.target.value)}
          />
        </label>
        <label>
          Stop loss
          <input
            type="number"
            step="any"
            inputMode="decimal"
            value={form.stop_loss}
            onChange={(e) => set('stop_loss', e.target.value)}
          />
        </label>
        <label>
          Take profit
          <input
            type="number"
            step="any"
            inputMode="decimal"
            value={form.take_profit}
            onChange={(e) => set('take_profit', e.target.value)}
          />
        </label>
      </div>

      {showPreview && (
        <div className="calc-preview">
          {riskPreview != null && <span>Risk ${riskPreview.toFixed(2)}</span>}
          {preview.quantity != null && <span>Size {preview.quantity.toFixed(6)} units</span>}
          {preview.rewardAtTp != null && <span>Reward at TP ${preview.rewardAtTp.toFixed(2)}</span>}
          {preview.rrr != null && <span>RRR {preview.rrr.toFixed(2)}</span>}
        </div>
      )}

      <label className="outcome-label">
        Outcome
        <select value={form.outcome} onChange={(e) => set('outcome', e.target.value as Outcome)}>
          <option value="open">Open (no result yet)</option>
          <option value="win">Win (hit take profit)</option>
          <option value="loss">Loss (hit stop loss)</option>
          <option value="breakeven">Breakeven</option>
        </select>
      </label>

      <div className="field-row">
        <label>
          Risk ($)
          <input
            type="number"
            step="any"
            inputMode="decimal"
            value={form.risk_amount}
            onChange={(e) => set('risk_amount', e.target.value)}
          />
        </label>
        <label>
          Exit price
          <input
            type="number"
            step="any"
            inputMode="decimal"
            value={form.exit_price}
            onChange={(e) => set('exit_price', e.target.value)}
          />
        </label>
        <label>
          Realized P&amp;L ($)
          <input
            type="number"
            step="any"
            inputMode="decimal"
            value={form.realized_pnl}
            onChange={(e) => set('realized_pnl', e.target.value)}
          />
        </label>
      </div>

      {error && <p className="form-error">{error}</p>}

      <div className="form-actions">
        <button type="button" className="secondary" onClick={onCancel} disabled={saving}>
          Cancel
        </button>
        <button type="submit" disabled={saving}>
          {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Save trade'}
        </button>
      </div>
    </form>
  )
}
