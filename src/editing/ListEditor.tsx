import { useMemo, useState } from 'react'
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { TierList } from '../domain/types'
import { ENTRY_MAX, MAX_ENTRIES, MIN_ENTRIES, sortEntries } from '../domain/types'
import { validateDraft } from '../domain/rules'
import { useStore } from '../state/storeContext'
import { useUnsavedGuard } from './useUnsavedGuard'
import { SaveNoteDialog } from './SaveNoteDialog'
import { RankBadge } from '../components/RankBadge'
import { GripIcon, PlusIcon, TrashIcon } from '../components/Icons'

export interface Row {
  uid: string
  text: string
}

function newUid(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `row-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

function snapshotOf(title: string, texts: string[]): string {
  return JSON.stringify({ t: title.trim(), r: texts })
}

interface SortableRowProps {
  row: Row
  rank: number
  canRemove: boolean
  onChange(text: string): void
  onRemove(): void
}

function SortableRow({ row, rank, canRemove, onChange, onRemove }: SortableRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: row.uid,
  })

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex items-start gap-2 rounded-xl border bg-white p-3 ${
        isDragging ? 'z-10 border-amber-400 shadow-lg' : 'border-slate-200'
      }`}
    >
      <button
        type="button"
        aria-label={`Drag entry #${rank} to rerank`}
        className="mt-1 cursor-grab rounded p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripIcon />
      </button>
      <div className="pt-0.5">
        <RankBadge rank={rank} size="sm" />
      </div>
      <textarea
        value={row.text}
        onChange={(e) => onChange(e.target.value)}
        rows={2}
        maxLength={ENTRY_MAX}
        placeholder={`Entry #${rank}`}
        className="min-w-0 flex-1 resize-y rounded-lg border border-transparent px-2 py-1 text-sm leading-relaxed focus:border-slate-300 focus:bg-white focus:outline-none"
      />
      <button
        type="button"
        onClick={onRemove}
        disabled={!canRemove}
        title={
          canRemove ? 'Remove this entry' : `A list needs at least ${MIN_ENTRIES} entries`
        }
        className="mt-1 rounded p-1 text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:pointer-events-none disabled:text-slate-200"
      >
        <TrashIcon />
      </button>
    </li>
  )
}

interface ListEditorProps {  list: TierList
  onDone(): void
  onDeleted(): void
}

export function ListEditor({ list, onDone, onDeleted }: ListEditorProps) {
  const { ops } = useStore()
  const [title, setTitle] = useState(list.title)
  const [rows, setRows] = useState<Row[]>(() =>
    sortEntries(list.entries).map((e) => ({ uid: newUid(), text: e.text })),
  )
  const [dialogOpen, setDialogOpen] = useState(false)

  const baseline = useMemo(
    () => snapshotOf(list.title, sortEntries(list.entries).map((e) => e.text)),
    [list],
  )
  const current = snapshotOf(title, rows.map((r) => r.text))
  const dirty = current !== baseline

  const errors = useMemo(
    () => validateDraft(title, rows.map((r, i) => ({ position: i + 1, text: r.text }))).errors,
    [title, rows],
  )

  useUnsavedGuard(dirty)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    setRows((prev) => {
      const oldIndex = prev.findIndex((r) => r.uid === active.id)
      const newIndex = prev.findIndex((r) => r.uid === over.id)
      if (oldIndex < 0 || newIndex < 0) return prev
      return arrayMove(prev, oldIndex, newIndex)
    })
  }

  function updateRow(uid: string, text: string) {
    setRows((prev) => prev.map((r) => (r.uid === uid ? { ...r, text } : r)))
  }

  function removeRow(uid: string) {
    setRows((prev) => (prev.length <= MIN_ENTRIES ? prev : prev.filter((r) => r.uid !== uid)))
  }

  function addRow() {
    setRows((prev) =>
      prev.length >= MAX_ENTRIES ? prev : [...prev, { uid: newUid(), text: '' }],
    )
  }

  function discard() {
    setTitle(list.title)
    setRows(sortEntries(list.entries).map((e) => ({ uid: newUid(), text: e.text })))
  }

  function confirmSave(note: string) {
    if (!ops) return
    ops.saveListEdit(list.id, { title, entryTexts: rows.map((r) => r.text) }, note)
    onDone()
  }

  function handleDelete() {
    const sure = window.confirm(
      `Delete “${list.title}” and its entire version history?\n\nThis cannot be undone.`,
    )
    if (!sure || !ops) return
    ops.deleteList(list.id)
    onDeleted()
  }

  return (
    <div>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        maxLength={120}
        placeholder="List title"
        aria-label="List title"
        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 font-serif text-xl font-bold text-slate-900 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 focus:outline-none"
      />

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={rows.map((r) => r.uid)} strategy={verticalListSortingStrategy}>
          <ol className="mt-4 space-y-3">
            {rows.map((row, i) => (
              <SortableRow
                key={row.uid}
                row={row}
                rank={i + 1}
                canRemove={rows.length > MIN_ENTRIES}
                onChange={(text) => updateRow(row.uid, text)}
                onRemove={() => removeRow(row.uid)}
              />
            ))}
          </ol>
        </SortableContext>
      </DndContext>

      <div className="mt-3 flex items-center gap-3">
        <button
          type="button"
          onClick={addRow}
          disabled={rows.length >= MAX_ENTRIES}
          className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-slate-500 hover:text-slate-900 disabled:pointer-events-none disabled:text-slate-300"
        >
          <PlusIcon className="h-3.5 w-3.5" /> Add entry
        </button>
        <span className="text-xs text-slate-400">
          {rows.length} of {MIN_ENTRIES}–{MAX_ENTRIES} entries · drag the grip to rerank
        </span>
      </div>

      {errors.length > 0 && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-sm font-medium text-red-800">Fix before saving:</p>
          <ul className="mt-1 list-inside list-disc text-xs text-red-700">
            {errors.map((err) => (
              <li key={err}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4">
        <button
          type="button"
          onClick={handleDelete}
          className="text-xs font-medium text-red-500 underline-offset-2 transition hover:text-red-700 hover:underline"
        >
          Delete this list…
        </button>
        <div className="flex items-center gap-2">
          {dirty ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> Unsaved changes
            </span>
          ) : (
            <span className="text-xs text-slate-400">No changes yet</span>
          )}
          <button
            type="button"
            onClick={discard}
            disabled={!dirty}
            className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 disabled:pointer-events-none disabled:text-slate-300"
          >
            Discard
          </button>
          <button
            type="button"
            onClick={() => setDialogOpen(true)}
            disabled={!dirty || errors.length > 0}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            Save changes
          </button>
        </div>
      </div>

      {dialogOpen && (
        <SaveNoteDialog onCancel={() => setDialogOpen(false)} onConfirm={confirmSave} />
      )}
    </div>
  )
}
