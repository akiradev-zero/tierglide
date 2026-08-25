import { Link, NavLink, Outlet } from 'react-router-dom'
import { useStore } from '../state/storeContext'
import { downloadText } from '../lib/download'
import { DownloadIcon, PlusIcon, ResetIcon } from './Icons'

function AuthoringBar() {
  const { exportJson, ops } = useStore()

  return (
    <div className="border-b border-amber-200 bg-amber-50">
      <div className="mx-auto flex max-w-3xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2 text-sm">
        <span className="rounded-full bg-amber-500 px-2.5 py-0.5 text-xs font-semibold text-white">
          Authoring mode
        </span>
        <span className="text-xs text-amber-800">
          Editing is local-only until you publish — visitors never see this bar.
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

export function Layout() {
  const { mode } = useStore()
  const authoring = mode === 'authoring'

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-3xl px-4 py-4">
          <NavLink to="/" className="inline-flex items-baseline gap-2">
            <span className="font-serif text-xl font-bold tracking-tight">tierglide</span>
            <span className="hidden text-xs text-slate-500 sm:inline">
              ranked judgments, versioned
            </span>
          </NavLink>
        </div>
      </header>
      {authoring && <AuthoringBar />}
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
        <Outlet />
      </main>
      <footer className="border-t border-slate-100 py-6 text-center text-xs text-slate-400">
        tierglide · every edit becomes part of the history
      </footer>
    </div>
  )
}
