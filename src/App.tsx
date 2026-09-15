import { useEffect, useState, useCallback } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './lib/supabase'
import { Auth } from './components/Auth'
import { TradeForm } from './components/TradeForm'
import { TradeList } from './components/TradeList'
import { Analytics } from './components/Analytics'
import type { Trade } from './types'
import './App.css'

type Tab = 'log' | 'analytics'

function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [trades, setTrades] = useState<Trade[]>([])
  const [tradesLoading, setTradesLoading] = useState(false)
  const [tab, setTab] = useState<Tab>('log')
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setAuthLoading(false)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  const loadTrades = useCallback(async () => {
    if (!session) return
    setTradesLoading(true)
    const { data, error } = await supabase
      .from('trades')
      .select('*')
      .order('trade_date', { ascending: false })
      .order('trade_time', { ascending: false })
    if (!error && data) setTrades(data as Trade[])
    setTradesLoading(false)
  }, [session])

  useEffect(() => {
    loadTrades()
  }, [loadTrades])

  if (authLoading) return <div className="centered">Loading…</div>
  if (!session) return <Auth />

  return (
    <div className="app">
      <header className="app-header">
        <h1>Trading Log</h1>
        <button className="text-btn" onClick={() => supabase.auth.signOut()}>
          Sign out
        </button>
      </header>

      <main className="app-main">
        {showForm ? (
          <TradeForm
            userId={session.user.id}
            onSaved={() => {
              setShowForm(false)
              loadTrades()
            }}
            onCancel={() => setShowForm(false)}
          />
        ) : tab === 'log' ? (
          tradesLoading ? (
            <p className="empty-state">Loading trades…</p>
          ) : (
            <TradeList trades={trades} onChanged={loadTrades} />
          )
        ) : (
          <Analytics trades={trades} />
        )}
      </main>

      {!showForm && (
        <nav className="bottom-nav">
          <button className={tab === 'log' ? 'active' : ''} onClick={() => setTab('log')}>
            Log
          </button>
          <button className="fab" onClick={() => setShowForm(true)}>
            +
          </button>
          <button className={tab === 'analytics' ? 'active' : ''} onClick={() => setTab('analytics')}>
            Analytics
          </button>
        </nav>
      )}
    </div>
  )
}

export default App
