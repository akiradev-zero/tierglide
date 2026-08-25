import { useMemo, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { ENTRY_MAX, MAX_ENTRIES, MIN_ENTRIES, TITLE_MAX } from '../domain/types'
import { validateDraft } from '../domain/rules'
import { useStore } from '../state/storeContext'
import { RankBadge } from '../components/RankBadge'
import { PlusIcon, TrashIcon } from '../components/Icons'
import type { Row } from '../editing/ListEditor'

function newUid(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `row-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

export function NewListPage() {
  const { mode, ops } = useStore()
  const navigate = useNavigate()

  const [title, setTitle] = useState('')
  const [rows, setRows] = useState<Row[]>(() =>
    Array.from({ length: MIN_ENTRIES }, () => ({ uid: newUid(), text: '' })),
  )
  const [note, setNote] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const errors = useMemo(
    () =>
      [
        ...validateDraft(title, rows.map((r, i) => ({ position: i + 1, text: r.text }))).errors,
        ...(note.trim() ? [] : ['A short reason is required for the first version.']),
      ] as string[],
    [title, rows, note],
  )

  if (mode !== 'authoring' || !ops) return <Navigate to="/" replace />

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

  function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!ops || errors.length > 0) {
      setSubmitted(true)
      return
    }
    const list = ops.createList({
      title,
      entryTexts: rows.map((r) => r.text),
      note,
    })
    navigate(`/lists/${list.id}`)
  }

  return (
    <div>
      <Link
        to="/"
        className="text-sm font-medium text-slate-500 transition hover:text-slate-900"
      >
        ← All lists
      </Link>
      <h1 className="mt-3 font-serif text-2xl font-bold text-slate-900">New ranked list</h1>
      <p className="mt-1 text-sm text-slate-500">
        Order is everything — the first row is your top judgment.
      </p>

      <form onSubmit={handleCreate} className="mt-6 space-y-5" noValidate>
        <div>
          <label htmlFor="new-title" className="text-sm font-medium text-slate-700">
            Title
          </label>
          <input
            id="new-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={TITLE_MAX}
            placeholder="e.g. Best films about ambition, ranked"
            className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 font-serif text-lg font-bold focus:border-slate-900 focus:ring-1 focus:ring-slate-900 focus:outline-none"
          />
        </div>

        <div>
          <span className="text-sm font-medium text-slate-700">
            Entries ({MIN_ENTRIES}–{MAX_ENTRIES})
          </span>
          <ol className="mt-2 space-y-3">
            {rows.map((row, i) => (
              <li
                key={row.uid}
                className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-3"
              >
                <div className="pt-0.5">
                  <RankBadge rank={i + 1} size="sm" />
                </div>
                <textarea
                  value={row.text}
                  onChange={(e) => updateRow(row.uid, e.target.value)}
                  rows={2}
                  maxLength={ENTRY_MAX}
                  placeholder={`Entry #${i + 1}`}
                  className="min-w-0 flex-1 resize-y rounded-lg border border-transparent px-2 py-1 text-sm leading-relaxed focus:border-slate-300 focus:bg-white focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => removeRow(row.uid)}
                  disabled={rows.length <= MIN_ENTRIES}
                  title={
                    rows.length > MIN_ENTRIES
                      ? 'Remove this entry'
                      : `A list needs at least ${MIN_ENTRIES} entries`
                  }
                  className="mt-1 rounded p-1 text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:pointer-events-none disabled:text-slate-200"
                >
                  <TrashIcon />
                </button>
              </li>
            ))}
          </ol>
          <button
            type="button"
            onClick={addRow}
            disabled={rows.length >= MAX_ENTRIES}
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-dashed border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-slate-500 hover:text-slate-900 disabled:pointer-events-none disabled:text-slate-300"
          >
            <PlusIcon className="h-3.5 w-3.5" /> Add entry
          </button>
        </div>

        <div>
          <label htmlFor="new-note" className="text-sm font-medium text-slate-700">
            What changed? <span className="font-normal text-slate-400">(first version note)</span>
          </label>
          <textarea
            id="new-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            maxLength={300}
            placeholder="e.g. finally wrote down the canon after years of arguing about it"
            className="mt-1.5 w-full resize-none rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:border-slate-900 focus:ring-1 focus:ring-slate-900 focus:outline-none"
          />
        </div>

        {submitted && errors.length > 0 && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
            <ul className="list-inside list-disc text-xs text-red-700">
              {errors.map((err) => (
                <li key={err}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex items-center justify-end gap-2 border-t border-slate-200 pt-4">
          <Link
            to="/"
            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
          >
            Cancel
          </Link>
          <button
            type="submit"
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
          >
            Create list
          </button>
        </div>
      </form>
    </div>
  )
}
