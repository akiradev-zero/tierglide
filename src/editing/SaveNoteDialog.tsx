import { useRef, useState } from 'react'

interface SaveNoteDialogProps {
  onCancel(): void
  onConfirm(note: string): void
}

export function SaveNoteDialog({ onCancel, onConfirm }: SaveNoteDialogProps) {
  const [note, setNote] = useState('')
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const valid = note.trim().length > 0

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Describe this change"
      onKeyDown={(e) => {
        if (e.key === 'Escape') onCancel()
      }}
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
        <h2 className="font-serif text-lg font-bold text-slate-900">What changed?</h2>
        <p className="mt-1 text-sm text-slate-500">
          This note is saved with the new version, capturing the reasoning behind the change.
        </p>
        <textarea
          ref={inputRef}
          autoFocus
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          maxLength={300}
          placeholder="e.g. moved the runner-up up after rewatching; trimmed the bottom of the list"
          className="mt-3 w-full resize-none rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:ring-1 focus:ring-slate-900 focus:outline-none"
        />
        {!valid && (
          <p className="mt-1 text-xs text-slate-400">A short reason is required to save.</p>
        )}
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
          >
            Keep editing
          </button>
          <button
            type="button"
            disabled={!valid}
            onClick={() => onConfirm(note.trim())}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            Save version
          </button>
        </div>
      </div>
    </div>
  )
}
