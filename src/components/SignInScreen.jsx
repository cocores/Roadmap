import { useState } from 'react'
import { ALLOWED_DOMAIN, signIn } from '../lib/auth'

export default function SignInScreen({ loading }) {
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSignIn() {
    setError('')
    setBusy(true)
    try {
      await signIn()
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user') setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4 font-sans text-slate-100">
      <div className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center shadow-2xl">
        <img src="/bh-logo.png" alt="B&H" className="mx-auto h-12 w-12 shrink-0 rounded-full bg-white object-cover shadow-lg shadow-black/20 ring-1 ring-slate-700/50" />
        <h1 className="mt-4 text-lg font-semibold">PM Roadmap</h1>
        {loading ? (
          <p className="mt-2 text-sm text-slate-400">Checking your sign-in…</p>
        ) : (
          <>
            <p className="mt-2 text-sm text-slate-400">Sign in with your @{ALLOWED_DOMAIN} Microsoft (Outlook) work account.</p>
            <button
              type="button"
              onClick={handleSignIn}
              disabled={busy}
              className="mt-6 w-full rounded-full bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-500 disabled:opacity-60"
            >
              {busy ? 'Signing in…' : 'Sign in with Microsoft'}
            </button>
            {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
          </>
        )}
      </div>
    </div>
  )
}
