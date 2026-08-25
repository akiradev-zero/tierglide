import { ENTRY_MAX, MAX_ENTRIES, MIN_ENTRIES, TITLE_MAX, type RankedEntry } from './types'

export interface DraftValidationResult {
  errors: string[]
}

export function validateDraft(title: string, entries: RankedEntry[]): DraftValidationResult {
  const errors: string[] = []
  const trimmedTitle = title.trim()

  if (!trimmedTitle) errors.push('The list needs a title.')
  if (trimmedTitle.length > TITLE_MAX)
    errors.push(`Titles are limited to ${TITLE_MAX} characters (currently ${trimmedTitle.length}).`)

  if (entries.length < MIN_ENTRIES)
    errors.push(`A list needs at least ${MIN_ENTRIES} entries.`)
  if (entries.length > MAX_ENTRIES)
    errors.push(`A list can hold at most ${MAX_ENTRIES} entries.`)

  entries.forEach((entry, i) => {
    const trimmed = entry.text.trim()
    if (!trimmed) errors.push(`Entry #${i + 1} is empty.`)
    else if (trimmed.length > ENTRY_MAX)
      errors.push(`Entry #${i + 1} exceeds ${ENTRY_MAX} characters.`)
  })

  return { errors }
}

export function normalizeEntries(entries: RankedEntry[]): RankedEntry[] {
  return entries.map((e, i) => ({ position: i + 1, text: e.text.trim() }))
}
