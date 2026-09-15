import { useState } from 'react'
import type { FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import type { Direction, Trade } from '../types'

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
  entry_price: string
  exit_price: string
  stop_loss: string
  take_profit: string
  risk_amount: string
  realized_pnl: string
}

const numToStr = (v: number | null) => (v == null ? '' : String(v))

const emptyForm = (): FormState => ({
  trade_date: todayISO(),
  trade_time: nowHM(),
  symbol: '',
  direction: 'long',
  position_size: '',
  entry_price: '',
  exit_price: '',
  stop_loss: '',
  take_profit: '',
  risk_amount: '',
  realized_pnl: '',
})

const formFromTrade = (t: Trade): FormState => ({
  trade_date: t.trade_date,
  trade_time: t.trade_time ?? '',
  symbol: t.symbol,
  direction: t.direction,
  position_size: numToStr(t.position_size),
  entry_price: numToStr(t.entry_price),
  exit_price: numToStr(t.exit_price),
  stop_loss: numToStr(t.stop_loss),
  take_profit: numToStr(t.take_profit),
  risk_amount: numToStr(t.risk_amount),
  realized_pnl: numToStr(t.realized_pnl),
})

const toNumber = (v: string): number | null => (v.trim() === '' ? null : Number(v))

export function TradeForm({ userId, trade, onSaved, onCancel }: Props) {
  const isEdit = trade != null
  const [form, setForm] = useState<FormState>(trade ? formFromTrade(trade) : emptyForm())
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }))

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
          Exit price
          <input
            type="number"
            step="any"
            inputMode="decimal"
            value={form.exit_price}
            onChange={(e) => set('exit_price', e.target.value)}
          />
        </label>
      </div>

      <div className="field-row">
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
      </div>

      <div className="field-row">
        <label className="grow">
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
