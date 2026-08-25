import { createContext, useContext } from 'react'
import type { SiteContent, TierList } from '../domain/types'

export type StoreMode = 'authoring' | 'published'

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
  content: SiteContent
  exportJson(): string
  ops: AuthoringOps | null
}

export const StoreContext = createContext<StoreValue | null>(null)

export function useStore(): StoreValue {
  const value = useContext(StoreContext)
  if (!value) throw new Error('useStore must be used within StoreProvider')
  return value
}
