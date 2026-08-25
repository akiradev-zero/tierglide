import { useCallback, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { SiteContent, TierList } from '../domain/types'
import {
  clearAuthoringContent,
  loadAuthoringContent,
  persistAuthoringContent,
} from '../lib/authoringStore'
import { loadPublishedContent } from '../lib/contentSource'
import type { AuthoringOps, StoreMode, StoreValue } from './storeContext'
import { StoreContext } from './storeContext'

function nowIso(): string {
  return new Date().toISOString()
}

function buildSnapshot(
  number: number,
  message: string,
  title: string,
  entryTexts: string[],
): TierList['versions'][number] {
  return {
    number,
    message,
    title,
    entries: entryTexts.map((text, i) => ({ position: i + 1, text })),
    savedAt: nowIso(),
  }
}

interface StoreProviderProps {
  children: ReactNode
  mode?: StoreMode
}

export default function StoreProvider({ children, mode }: StoreProviderProps) {
  const resolvedMode: StoreMode = mode ?? (import.meta.env.DEV ? 'authoring' : 'published')
  const [content, setContent] = useState<SiteContent>(() =>
    resolvedMode === 'authoring' ? loadAuthoringContent() : loadPublishedContent(),
  )

  const ops = useMemo<AuthoringOps | null>(() => {
    if (resolvedMode !== 'authoring') return null

    function mutate(listId: string, fn: (list: TierList) => TierList) {
      setContent((prev) => {
        const next: SiteContent = {
          lists: prev.lists.map((l) => (l.id === listId ? fn(l) : l)),
        }
        persistAuthoringContent(next)
        return next
      })
    }

    return {
      createList({ title, entryTexts, note }) {
        const timestamp = nowIso()
        const trimmedTitle = title.trim()
        const snapshot = buildSnapshot(1, note.trim(), trimmedTitle, entryTexts.map((t) => t.trim()))
        const list: TierList = {
          id:
            typeof crypto !== 'undefined' && 'randomUUID' in crypto
              ? crypto.randomUUID()
              : `list-${Date.now().toString(36)}`,
          title: trimmedTitle,
          createdAt: timestamp,
          updatedAt: timestamp,
          entries: snapshot.entries,
          versions: [snapshot],
        }
        setContent((prev) => {
          const next: SiteContent = { lists: [list, ...prev.lists] }
          persistAuthoringContent(next)
          return next
        })
        return list
      },

      saveListEdit(listId, { title, entryTexts }, note) {
        mutate(listId, (list) => {
          const nextNumber =
            list.versions.length > 0
              ? Math.max(...list.versions.map((v) => v.number)) + 1
              : 1
          const snapshot = buildSnapshot(
            nextNumber,
            note.trim(),
            title.trim(),
            entryTexts.map((t) => t.trim()),
          )
          return {
            ...list,
            title: snapshot.title,
            entries: snapshot.entries,
            updatedAt: snapshot.savedAt,
            versions: [...list.versions, snapshot],
          }
        })
      },

      deleteList(listId) {
        setContent((prev) => {
          const next: SiteContent = { lists: prev.lists.filter((l) => l.id !== listId) }
          persistAuthoringContent(next)
          return next
        })
      },

      resetToPublished() {
        clearAuthoringContent()
        setContent(loadPublishedContent())
      },
    }
  }, [resolvedMode])

  const exportJson = useCallback(() => JSON.stringify(content, null, 2), [content])

  const value = useMemo<StoreValue>(
    () => ({ mode: resolvedMode, content, exportJson, ops }),
    [resolvedMode, content, exportJson, ops],
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}
