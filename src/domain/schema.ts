import { z } from 'zod'
import { ENTRY_MAX, MAX_ENTRIES, MIN_ENTRIES, TITLE_MAX, type SiteContent } from './types'

const rankedEntrySchema = z.object({
  position: z.number().int().min(1),
  text: z.string(),
})

const listVersionSchema = z.object({
  number: z.number().int().min(1),
  message: z.string().min(1),
  title: z.string(),
  entries: z.array(rankedEntrySchema),
  savedAt: z.string(),
})

const tierListSchema = z
  .object({
    id: z.string().min(1),
    title: z.string(),
    createdAt: z.string(),
    updatedAt: z.string(),
    entries: z.array(rankedEntrySchema),
    versions: z.array(listVersionSchema),
  })
  .refine((l) => l.entries.length >= MIN_ENTRIES && l.entries.length <= MAX_ENTRIES, {
    message: `entries must number between ${MIN_ENTRIES} and ${MAX_ENTRIES}`,
  })
  .refine(
    (l) =>
      l.title.trim().length > 0 &&
      l.entries.every((e) => e.text.trim().length > 0 && e.text.length <= ENTRY_MAX) &&
      l.title.length <= TITLE_MAX,
    { message: 'list violates content rules' },
  )
  .refine(
    (l) => {
      const positions = l.entries.map((e) => e.position)
      return (
        positions.every((p) => Number.isInteger(p) && p >= 1) &&
        new Set(positions).size === positions.length
      )
    },
    { message: 'entry positions must be unique positive integers' },
  )

export const siteContentSchema = z.object({
  lists: z.array(tierListSchema),
})

export function parseSiteContent(raw: unknown): SiteContent {
  const result = siteContentSchema.safeParse(raw)
  if (!result.success) {
    const summary = result.error.issues
      .slice(0, 5)
      .map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`)
      .join('; ')
    throw new Error(`Content failed validation — ${summary}`)
  }
  return result.data
}
