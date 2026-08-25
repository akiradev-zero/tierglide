import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { SiteContent, TierList } from '../domain/types'
import {
  hasLocalDraft,
  loadAuthoringContent,
  loadLastPublishedSnapshot,
  persistAuthoringContent,
  saveLastPublishedSnapshot,
} from '../lib/authoringStore'
import { loadPublishedContent } from '../lib/contentSource'
import {
  clearStoredToken,
  fetchContentFile,
  getStoredToken,
  putContentFile,
  storeToken,
} from '../lib/githubPublisher'
import type { AuthStatus, AuthoringOps, StoreMode, StoreValue } from './storeContext'
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
  const [auth, setAuth] = useState<AuthStatus>('signed-out')
  const [baselineJson, setBaselineJson] = useState<string | null>(() =>
    loadLastPublishedSnapshot(),
  )

  const applyBaseline = useCallback((json: string) => {
    saveLastPublishedSnapshot(json)
    setBaselineJson(json)
  }, [])

  const canEdit = resolvedMode === 'authoring' || auth === 'signed-in'

  // Restore an existing session on the live site: validate the stored token
  // against the repo copy and adopt it as the publish baseline.
  useEffect(() => {
    if (resolvedMode !== 'published') return
    const token = getStoredToken()
    if (!token) return
    let cancelled = false
    void (async () => {
      try {
        const { content: repoContent } = await fetchContentFile(token)
        if (cancelled) return
        const repoJson = JSON.stringify(repoContent)
        applyBaseline(repoJson)
        setAuth('signed-in')
        setContent((prev) => {
          if (JSON.stringify(prev) === repoJson) return prev
          if (hasLocalDraft()) return prev // preserve unpublished local edits
          persistAuthoringContent(repoContent)
          return repoContent
        })
      } catch {
        if (!cancelled) clearStoredToken()
      }
    })()
    return () => {
      cancelled = true
    }
  }, [resolvedMode, applyBaseline])

  const ops = useMemo<AuthoringOps | null>(() => {
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
        clearStoredToken()
        const published = loadPublishedContent()
        persistAuthoringContent(published)
        setAuth('signed-out')
        setContent(published)
      },
    }
  }, [])

  const signIn = useCallback(
    async (rawToken: string, remember: boolean) => {
      const token = rawToken.trim()
      if (!token) throw new Error('Paste a token first.')
      const { content: repoContent } = await fetchContentFile(token)
      const repoJson = JSON.stringify(repoContent)

      if (hasLocalDraft()) {
        const localJson = JSON.stringify(loadAuthoringContent())
        if (localJson !== repoJson) {
          const discard = window.confirm(
            'This browser holds unpublished local changes that differ from the version on GitHub.\n\n' +
              'OK — discard them and load the published version.\n' +
              'Cancel — keep them and abort sign-in.',
          )
          if (!discard) throw new Error('cancelled')
        }
      }

      storeToken(token, remember)
      persistAuthoringContent(repoContent)
      applyBaseline(repoJson)
      setContent(repoContent)
      setAuth('signed-in')
    },
    [applyBaseline],
  )

  const signOut = useCallback(() => {
    clearStoredToken()
    setAuth('signed-out')
    setContent(loadPublishedContent())
  }, [])

  const publish = useCallback(
    async (message?: string) => {
      const token = getStoredToken()
      if (!token) throw new Error('Sign in first.')
      const jsonText = JSON.stringify(content, null, 2)
      const { sha } = await fetchContentFile(token)
      const result = await putContentFile(token, jsonText, message?.trim() || 'Publish list updates', sha)
      applyBaseline(JSON.stringify(content))
      return result.commitUrl
    },
    [content, applyBaseline],
  )

  const reloadFromRepo = useCallback(async () => {
    const token = getStoredToken()
    if (!token) throw new Error('Sign in first.')
    const { content: repoContent } = await fetchContentFile(token)
    persistAuthoringContent(repoContent)
    applyBaseline(JSON.stringify(repoContent))
    setContent(repoContent)
  }, [applyBaseline])

  const exportJson = useCallback(() => JSON.stringify(content, null, 2), [content])

  const publishDirty =
    resolvedMode === 'published' && auth === 'signed-in'
      ? baselineJson === null
        ? null
        : JSON.stringify(content) !== baselineJson
      : null

  const value = useMemo<StoreValue>(
    () => ({
      mode: resolvedMode,
      canEdit,
      auth,
      publishDirty,
      content,
      exportJson,
      ops,
      signIn,
      signOut,
      publish,
      reloadFromRepo,
    }),
    [
      resolvedMode,
      canEdit,
      auth,
      publishDirty,
      content,
      exportJson,
      ops,
      signIn,
      signOut,
      publish,
      reloadFromRepo,
    ],
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}
