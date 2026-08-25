import { useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { useStore } from '../state/storeContext'
import { downloadText } from '../lib/download'
import { AuthError, ConflictError } from '../lib/githubPublisher'
import { PublishDialog } from './PublishDialog'
import {
  DownloadIcon,
  PlusIcon,
  ResetIcon,
} from './Icons'

function AuthoringBarDev() {
  const { exportJson, ops } = useStore()

  return (
    <div className="border-b border-amber-200 bg-amber-50">
      <div className="mx-auto flex max-w-3xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2 text-sm">
        <span className="rounded-full bg-amber-500 px-2.5 py-0.5 text-xs font-semibold text-white">
          Authoring mode
        </span>
        <span className="text-xs text-amber-800">
          Local drafts — publish via Export + <code className="font-mono">npm run publish</code>.
        </span>
        <div className="ml-auto flex items-center gap-2">
          <Link
            to="/new"
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-slate-700"
          >
            <PlusIcon className="h-3.5 w-3.5" /> New list
          </Link>
          <button
            type="button"
            onClick={() => downloadText('lists.json', exportJson())}
            title="Download lists.json to replace content/lists.json in the repo"
            className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-medium text-amber-900 transition hover:bg-amber-100"
          >
            <DownloadIcon className="h-3.5 w-3.5" /> Export for publish
          </button>
          <button
            type="button"
            onClick={() => {
              if (
                window.confirm(
                  'Discard all local authoring data and restore the published content?',
                )
              ) {
                ops?.resetToPublished()
              }
            }}
            className="inline-flex items-center gap-1.5 rounded-lg border border-transparent px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-white hover:text-slate-900"
          >
            <ResetIcon className="h-3.5 w-3.5" /> Reset to published
          </button>
        </div>
      </div>
    </div>
  )
}

function AuthoringBarLive() {
  const { publishDirty, signOut, reloadFromRepo, publish } = useStore()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState<
    | { kind: 'ok'; text: string; url?: string }
    | { kind: 'error'; text: string; conflict?: boolean }
    | null
  >(null)

  async function confirmPublish(message: string) {
    setBusy(true)
    try {
      const url = await publish(message)
      setDialogOpen(false)
      setStatus({
        kind: 'ok',
        text: 'Published — the live site updates once deployment finishes.',
        url,
      })
    } catch (err) {
      setDialogOpen(false)
      if (err instanceof ConflictError) {
        setStatus({ kind: 'error', text: err.message, conflict: true })
      } else if (err instanceof AuthError) {
        setStatus({ kind: 'error', text: `${err.message} Sign in again below.` })
      } else {
        setStatus({ kind: 'error', text: err instanceof Error ? err.message : 'Publish failed.' })
      }
    } finally {
      setBusy(false)
    }
  }

  const dirtyLabel =
    publishDirty === null
      ? 'Checking sync…'
      : publishDirty
        ? 'Unpublished changes'
        : 'All changes published'

  return (
    <div className="border-b border-amber-200 bg-amber-50">
      <div className="mx-auto max-w-3xl space-y-2 px-4 py-2">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
          <span className="rounded-full bg-amber-500 px-2.5 py-0.5 text-xs font-semibold text-white">
            Editing enabled
          </span>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
              publishDirty
                ? 'bg-amber-100 text-amber-800'
                : 'bg-emerald-100 text-emerald-800'
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                publishDirty ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
            />
            {dirtyLabel}
          </span>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <Link
              to="/new"
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-slate-700"
            >
              <PlusIcon className="h-3.5 w-3.5" /> New list
            </Link>
            <button
              type="button"
              onClick={() => {
                setStatus(null)
                setDialogOpen(true)
              }}
              disabled={publishDirty === false || busy}
              className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-amber-500 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              Publish to GitHub
            </button>
            <button
              type="button"
              onClick={async () => {
                try {
                  await reloadFromRepo()
                  setStatus({ kind: 'ok', text: 'Loaded the published version from GitHub.' })
                } catch (err) {
                  setStatus({
                    kind: 'error',
                    text: err instanceof Error ? err.message : 'Reload failed.',
                  })
                }
              }}
              className="rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-medium text-amber-900 transition hover:bg-amber-100"
            >
              Reload published
            </button>
            <button
              type="button"
              onClick={() => {
                signOut()
                setStatus(null)
              }}
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-white hover:text-slate-900"
            >
              Sign out
            </button>
          </div>
        </div>

        {status?.kind === 'ok' && (
          <p className="text-xs text-emerald-800">
            {status.text}
            {status.url && (
              <>
                {' '}
                <a href={status.url} target="_blank" rel="noreferrer" className="underline">
                  View commit ↗
                </a>
              </>
            )}
          </p>
        )}
        {status?.kind === 'error' && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-red-800">
            <span>{status.text}</span>
            {'conflict' in status && status.conflict && (
              <button
                type="button"
                onClick={async () => {
                  try {
                    await reloadFromRepo()
                    setStatus({ kind: 'ok', text: 'Loaded the published version — retry your edit.' })
                  } catch {
                    setStatus({ kind: 'error', text: 'Reload failed.' })
                  }
                }}
                className="rounded-md border border-red-300 bg-white px-2 py-0.5 font-medium hover:bg-red-50"
              >
                Discard local & reload
              </button>
            )}
          </div>
        )}
      </div>

      {dialogOpen && (
        <PublishDialog busy={busy} onCancel={() => setDialogOpen(false)} onConfirm={confirmPublish} />
      )}
    </div>
  )
}

export function Layout() {
  const { mode, auth } = useStore()

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <NavLink to="/" className="inline-flex items-baseline gap-2">
            <span className="font-serif text-xl font-bold tracking-tight">tierglide</span>
            <span className="hidden text-xs text-slate-500 sm:inline">
              ranked judgments, versioned
            </span>
          </NavLink>
          {mode === 'published' && auth === 'signed-out' && (
            <Link
              to="/authoring"
              className="text-xs font-medium text-slate-400 underline-offset-2 transition hover:text-slate-700 hover:underline"
            >
              Author sign-in
            </Link>
          )}
        </div>
      </header>
      {mode === 'authoring' ? <AuthoringBarDev /> : auth === 'signed-in' ? <AuthoringBarLive /> : null}
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
        <Outlet />
      </main>
      <footer className="border-t border-slate-100 py-6 text-center text-xs text-slate-400">
        tierglide · every edit becomes part of the history
      </footer>
    </div>
  )
}
