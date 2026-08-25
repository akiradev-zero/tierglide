import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useStore } from '../state/storeContext'
import { RankedList } from '../components/RankedList'
import { ListEditor } from '../editing/ListEditor'
import { ArrowLeftIcon, ClockIcon, PencilIcon } from '../components/Icons'
import { formatDateTime } from '../lib/time'

export function ListPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { content, mode } = useStore()
  const [editing, setEditing] = useState(false)

  const list = content.lists.find((l) => l.id === id)
  const authoring = mode === 'authoring'

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

  if (authoring && editing) {
    return (
      <div>
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-slate-900"
        >
          <ArrowLeftIcon /> Done editing
        </button>
        <h1 className="mt-2 font-serif text-xl font-bold text-slate-900">
          Editing “{list.title}”
        </h1>
        <p className="mt-1 text-xs text-slate-400">
          Changes stay local until saved as a new version — and published.
        </p>
        <div className="mt-5" key={list.updatedAt}>
          <ListEditor
            list={list}
            onDone={() => setEditing(false)}
            onDeleted={() => navigate('/')}
          />
        </div>
      </div>
    )
  }

  return (
    <article>
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-slate-900"
      >
        <ArrowLeftIcon /> All lists
      </Link>

      <header className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold tracking-tight text-slate-900">
            {list.title}
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Updated {formatDateTime(list.updatedAt)} ·{' '}
            <Link
              to={`/lists/${list.id}/history`}
              className="inline-flex items-center gap-1 font-medium text-slate-600 underline-offset-2 hover:text-slate-900 hover:underline"
            >
              <ClockIcon className="h-3.5 w-3.5" />
              Version history ({list.versions.length})
            </Link>
          </p>
        </div>
        {authoring && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 shadow-sm transition hover:border-slate-500"
          >
            <PencilIcon className="h-3.5 w-3.5" /> Edit list
          </button>
        )}
      </header>

      <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <RankedList entries={list.entries} />
      </section>
    </article>
  )
}
