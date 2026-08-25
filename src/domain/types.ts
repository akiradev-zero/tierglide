export interface RankedEntry {
  position: number
  text: string
}

export interface ListVersion {
  number: number
  message: string
  title: string
  entries: RankedEntry[]
  savedAt: string
}

export interface TierList {
  id: string
  title: string
  createdAt: string
  updatedAt: string
  entries: RankedEntry[]
  versions: ListVersion[]
}

export interface SiteContent {
  lists: TierList[]
}

export const MIN_ENTRIES = 3
export const MAX_ENTRIES = 10
export const TITLE_MAX = 120
export const ENTRY_MAX = 280

export function sortEntries(entries: RankedEntry[]): RankedEntry[] {
  return [...entries].sort((a, b) => a.position - b.position)
}
