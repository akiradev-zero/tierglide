import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useStore } from '../state/storeContext'
import { REPO_URL, TOKEN_SETUP_URL } from '../lib/githubPublisher'
import { ArrowLeftIcon } from '../components/Icons'

export function AuthoringSignInPage() {
  const { mode, auth, signIn, signOut } = useStore()
  const navigate = useNavigate()
  const [token, setToken] = useState('')
  const [remember, setRemember] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (mode === 'authoring') return <Navigate to="/" replace />

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await signIn(token, remember)
      navigate('/')
    } catch (err) {
      if (err instanceof Error && err.message === 'cancelled') {
        setError('Kept your local draft — sign-in aborted. Reload published to discard it.')
      } else {
        setError(err instanceof Error ? err.message : 'Sign-in failed.')
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-xl">
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-slate-900"
      >
        <ArrowLeftIcon /> All lists
      </Link>

      <h1 className="mt-3 font-serif text-2xl font-bold text-slate-900">Author sign-in</h1>
      <p className="mt-1 text-sm text-slate-500">
        Unlock editing on this live site. Visitors never see any of this.
      </p>

      {auth === 'signed-in' ? (
        <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
          <p className="text-sm font-medium text-emerald-900">
            You're signed in — the amber bar above is your control panel.
          </p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
            >
              Back to the lists
            </button>
            <button
              type="button"
              onClick={() => {
                signOut()
                setToken('')
              }}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-500"
            >
              Sign out
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 space-y-5" noValidate>
          <ol className="space-y-2 rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600">
            <li>
              1. On GitHub, open{' '}
              <a
                href={TOKEN_SETUP_URL}
                target="_blank"
                rel="noreferrer"
                className="font-medium text-slate-900 underline underline-offset-2"
              >
                Settings → Personal access tokens → Fine-grained tokens
              </a>{' '}
              and generate a new token for{' '}
              <a
                href={REPO_URL}
                target="_blank"
                rel="noreferrer"
                className="font-medium text-slate-900 underline underline-offset-2"
              >
                this repository only
              </a>
              .
            </li>
            <li>2. Under “Repository access”, select the repo; under “Permissions”, give <strong>Contents: Read and write</strong>. Nothing else is needed.</li>
            <li>3. Paste the token below. It stays in this browser only and can be revoked on GitHub at any time.</li>
          </ol>

          <div>
            <label htmlFor="pat" className="text-sm font-medium text-slate-700">
              Personal access token
            </label>
            <input
              id="pat"
              type="password"
              autoComplete="off"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="github_pat_…"
              className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 font-mono text-sm focus:border-slate-900 focus:ring-1 focus:ring-slate-900 focus:outline-none"
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 accent-slate-900"
            />
            Remember me on this device (otherwise you'll sign in again per session)
          </label>

          {error && (
            <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={busy || !token.trim()}
            className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300 sm:w-auto"
          >
            {busy ? 'Checking token…' : 'Sign in'}
          </button>
        </form>
      )}
    </div>
  )
}
