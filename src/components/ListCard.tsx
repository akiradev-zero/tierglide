import { Link } from 'react-router-dom'
import type { TierList } from '../domain/types'
import { sortEntries } from '../domain/types'
import { formatDate } from '../lib/time'
import { RankBadge } from './RankBadge'

export function ListCard({ list }: { list: TierList }) {
  const entries = sortEntries(list.entries)
  const total = entries.length
  const ratio = (rank: number) => (total - rank + 1) / total

  return (
    <Link
      to={`/lists/${list.id}`}
      className="block rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
    >
      <h2 className="font-serif text-lg font-bold text-slate-900">{list.title}</h2>
      <ol className="mt-4 space-y-3">
        {entries.map((entry) => (
          <li key={entry.position} className="flex items-start gap-3">
            <RankBadge rank={entry.position} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="line-clamp-2 whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-700">
                {entry.text}
              </p>
              <div
                className="mt-1.5 h-1 overflow-hidden rounded-full bg-slate-100"
                aria-hidden
              >
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-500"
                  style={{
                    width: `${Math.max(ratio(entry.position) * 100, 8)}%`,
                    opacity: 0.3 + 0.7 * ratio(entry.position),
                  }}
                />
              </div>
            </div>
          </li>
        ))}
      </ol>
      <p className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-500">
        Updated {formatDate(list.updatedAt)} · {list.versions.length}{' '}
        {list.versions.length === 1 ? 'version' : 'versions'} · {total}{' '}
        {total === 1 ? 'entry' : 'entries'}
      </p>
    </Link>
  )
}
