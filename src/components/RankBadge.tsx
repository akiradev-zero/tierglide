interface RankBadgeProps {
  rank: number
  size?: 'md' | 'sm'
}

const podium = {
  1: 'bg-amber-500 text-white border-amber-500',
  2: 'bg-slate-400 text-white border-slate-400',
  3: 'bg-amber-700 text-white border-amber-700',
} as const

export function RankBadge({ rank, size = 'md' }: RankBadgeProps) {
  const podiumClass = podium[rank as 1 | 2 | 3]
  const isPodium = Boolean(podiumClass)

  const sizeClass =
    size === 'md'
      ? rank === 1
        ? 'h-11 w-11 text-xl'
        : rank <= 3
          ? 'h-10 w-10 text-lg'
          : 'h-8 w-8 text-sm'
      : rank === 1
        ? 'h-9 w-9 text-lg'
        : rank <= 3
          ? 'h-8 w-8 text-base'
          : 'h-7 w-7 text-xs'

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full border font-serif font-bold tabular-nums ${
        isPodium ? podiumClass : 'border-slate-300 bg-white text-slate-600'
      } ${sizeClass}`}
    >
      {rank}
    </span>
  )
}
