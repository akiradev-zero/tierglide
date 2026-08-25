import { parseSiteContent } from '../domain/schema'
import type { SiteContent } from '../domain/types'
import { loadPublishedContent } from './contentSource'

const LS_KEY = 'tierglide.authoring.v1'

export function loadAuthoringContent(): SiteContent {
  const published = loadPublishedContent()
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return published
    return parseSiteContent(JSON.parse(raw))
  } catch (err) {
    console.warn('Could not read local authoring data; falling back to published content.', err)
    return published
  }
}

export function persistAuthoringContent(content: SiteContent): void {
  localStorage.setItem(LS_KEY, JSON.stringify(content))
}

export function clearAuthoringContent(): void {
  localStorage.removeItem(LS_KEY)
}
