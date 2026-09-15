import { supabase } from '../lib/supabase'

export function Auth() {
  const signIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.href },
    })
  }

  return (
    <div className="auth-screen">
      <h1>Trading Log</h1>
      <p>Sign in to log and review your trades.</p>
      <button className="google-btn" onClick={signIn}>
        Sign in with Google
      </button>
    </div>
  )
}
