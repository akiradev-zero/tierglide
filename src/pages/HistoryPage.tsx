import { Link, useParams } from 'react-router-dom'
import { useStore } from '../state/storeContext'
import { RankedList } from '../components/RankedList'
import { ArrowLeftIcon } from '../components/Icons'
import { formatDateTime } from '../lib/time'

export function HistoryPage() {
  const { id } = useParams()
  const { content } = useStore()

  const list = content.lists.find((l) => l.id === id)

  if (!list) {
    return (
      <div className="py-16 text-center">
        <p className="font-serif text-lg font-bold text-slate-700">List not found.</p>
        <Link
          to="/"
          className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          <ArrowLeftIcon /> Back to all lists
        </Link>
      </div>
    )
  }

  const versions = [...list.versions].sort((a, b) => b.number - a.number)

  return (
    <div>
      <Link
        to={`/lists/${list.id}`}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-slate-900"
      >
        <ArrowLeftIcon /> Back to “{list.title}”
      </Link>

      <h1 className="mt-3 font-serif text-2xl font-bold text-slate-900">Version history</h1>
      <p className="mt-1 text-sm text-slate-500">
        How “{list.title}” transformed, one deliberate change at a time.
      </p>

      <ol className="relative mt-8 space-y-8 border-l-2 border-slate-200 pl-6">
        {versions.map((version, i) => (
          <li key={version.number} className="relative">
            <span
              className={`absolute top-1.5 -left-[31px] h-3 w-3 rounded-full border-2 border-white ${
                i === 0 ? 'bg-amber-500' : 'bg-slate-300'
              }`}
              aria-hidden
            />
            <div className="flex flex-wrap items-baseline gap-x-3">
              <span
                className={`font-serif text-base font-bold ${
                  i === 0 ? 'text-amber-600' : 'text-slate-700'
                }`}
              >
                v{version.number}
              </span>
              <span className="text-xs text-slate-400">
                {formatDateTime(version.savedAt)}
                {i === 0 && ' · latest'}
              </span>
            </div>
            <p className="mt-1.5 text-[15px] leading-relaxed text-slate-800">
              <span className="mr-1 text-slate-300" aria-hidden>
                “
              </span>
              {version.message}
              <span className="mr-1 text-slate-300" aria-hidden>
                ”
              </span>
            </p>
            <details className="group mt-2">
              <summary className="cursor-pointer list-none text-xs font-medium text-slate-500 transition hover:text-slate-900">
                <span className="group-open:hidden">Show ranked snapshot</span>
                <span className="hidden group-open:inline">Hide ranked snapshot</span>
              </summary>
              {i === 0 ? (
                <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50/50 p-4">
                  <RankedList entries={version.entries} size="sm" />
                </div>
              ) : (
                <div className="mt-3 rounded-xl border border-slate-200 bg-white p-4">
                  <RankedList entries={version.entries} size="sm" />
                </div>
              )}
              {version.title !== list.title && (
                <p className="mt-2 text-xs text-slate-400">Titled: “{version.title}”</p>
              )}
            </details>
          </li>
        ))}
      </ol>
    </div>
  )
}
