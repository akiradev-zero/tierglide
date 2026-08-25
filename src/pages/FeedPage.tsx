import { Link } from 'react-router-dom'
import { useStore } from '../state/storeContext'
import { ListCard } from '../components/ListCard'
import { PlusIcon } from '../components/Icons'

export function FeedPage() {
  const { content, canEdit } = useStore()
  const lists = [...content.lists].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  )

  return (
    <div>
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-slate-900">Latest judgments</h1>
          <p className="mt-1 text-sm text-slate-500">
            Every list is ranked — position is the point.
          </p>
        </div>
        {canEdit && (
          <span className="text-xs text-slate-400">{lists.length} published</span>
        )}
      </div>

      {lists.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <p className="font-serif text-lg font-bold text-slate-700">Nothing here yet.</p>
          <p className="mt-1 text-sm text-slate-500">
            {canEdit
              ? 'Create your first ranked list to get started.'
              : 'Check back soon.'}
          </p>
          {canEdit && (
            <Link
              to="/new"
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
            >
              <PlusIcon className="h-4 w-4" /> New list
            </Link>
          )}
        </div>
      ) : (
        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          {lists.map((list) => (
            <ListCard key={list.id} list={list} />
          ))}
        </div>
      )}
    </div>
  )
}
