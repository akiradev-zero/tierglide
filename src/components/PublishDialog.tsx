import { useEffect, useRef, useState } from 'react'

interface PublishDialogProps {
  busy: boolean
  onCancel(): void
  onConfirm(message: string): void
}

export function PublishDialog({ busy, onCancel, onConfirm }: PublishDialogProps) {
  const [message, setMessage] = useState('Publish list updates')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.select()
  }, [])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Publish to GitHub"
      onKeyDown={(e) => {
        if (e.key === 'Escape' && !busy) onCancel()
      }}
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
        <h2 className="font-serif text-lg font-bold text-slate-900">Publish to GitHub</h2>
        <p className="mt-1 text-sm text-slate-500">
          Commits the current state of all lists (including every version note) to the
          repository. The live site updates once deployment finishes — usually about a minute.
        </p>
        <label htmlFor="publish-message" className="mt-3 block text-xs font-medium text-slate-600">
          Commit message
        </label>
        <input
          id="publish-message"
          ref={inputRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          maxLength={200}
          disabled={busy}
          className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:ring-1 focus:ring-slate-900 focus:outline-none"
        />
        {busy && (
          <p className="mt-2 flex items-center gap-2 text-xs text-slate-500">
            <span className="h-3 w-3 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700" />
            Pushing to GitHub…
          </p>
        )}
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 disabled:pointer-events-none disabled:text-slate-300"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm(message)}
            disabled={busy}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:bg-slate-300"
          >
            Publish now
          </button>
        </div>
      </div>
    </div>
  )
}
