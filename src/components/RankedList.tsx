import type { RankedEntry } from '../domain/types'
import { sortEntries } from '../domain/types'
import { RankBadge } from './RankBadge'

function DecayBar({ rank, total, size }: { rank: number; total: number; size: 'md' | 'sm' }) {
  const ratio = (total - rank + 1) / total
  return (
    <div
      className={`overflow-hidden rounded-full bg-slate-100 ${size === 'md' ? 'mt-2 h-1.5' : 'mt-1.5 h-1'}`}
      aria-hidden
    >
      <div
        className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-500"
        style={{ width: `${Math.max(ratio * 100, 8)}%`, opacity: 0.3 + 0.7 * ratio }}
      />
    </div>
  )
}

interface RankedListProps {
  entries: RankedEntry[]
  size?: 'md' | 'sm'
  showBars?: boolean
}

export function RankedList({ entries, size = 'md', showBars = true }: RankedListProps) {
  const sorted = sortEntries(entries)
  const total = sorted.length

  return (
    <ol className="space-y-4">
      {sorted.map((entry) => (
        <li key={entry.position} className="flex items-start gap-3">
          <RankBadge rank={entry.position} size={size} />
          <div className="min-w-0 flex-1 pt-0.5">
            <p
              className={`whitespace-pre-wrap break-words text-slate-800 ${
                size === 'md' ? 'text-[15px] leading-relaxed' : 'text-sm leading-relaxed'
              }`}
            >
              {entry.text}
            </p>
            {showBars && <DecayBar rank={entry.position} total={total} size={size} />}
          </div>
        </li>
      ))}
    </ol>
  )
}
