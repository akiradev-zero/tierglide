import { createContext, useContext } from 'react'
import type { SiteContent, TierList } from '../domain/types'

export type StoreMode = 'authoring' | 'published'
export type AuthStatus = 'signed-out' | 'signed-in'

export interface NewListInput {
  title: string
  entryTexts: string[]
  note: string
}

export interface ListEditInput {
  title: string
  entryTexts: string[]
}

export interface AuthoringOps {
  createList(input: NewListInput): TierList
  saveListEdit(listId: string, input: ListEditInput, note: string): void
  deleteList(listId: string): void
  resetToPublished(): void
}

export interface StoreValue {
  mode: StoreMode
  /** Editing unlocked: always in local dev; on the live site once signed in with a PAT. */
  canEdit: boolean
  auth: AuthStatus
  /** true/false vs last published snapshot; null while unknown (session restore pending). */
  publishDirty: boolean | null
  content: SiteContent
  exportJson(): string
  ops: AuthoringOps | null
  signIn(token: string, remember: boolean): Promise<void>
  signOut(): void
  /** Commits current content to GitHub; resolves with the commit URL. */
  publish(message?: string): Promise<string>
  /** Replaces the working draft with the published copy from GitHub. */
  reloadFromRepo(): Promise<void>
}

export const StoreContext = createContext<StoreValue | null>(null)

export function useStore(): StoreValue {
  const value = useContext(StoreContext)
  if (!value) throw new Error('useStore must be used within StoreProvider')
  return value
}
