import { parseSiteContent } from '../domain/schema'
import type { SiteContent } from '../domain/types'
import publishedJson from '../../content/lists.json'

export function loadPublishedContent(): SiteContent {
  return parseSiteContent(publishedJson)
}
