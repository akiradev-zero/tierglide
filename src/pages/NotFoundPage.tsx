import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <div className="py-20 text-center">
      <p className="font-serif text-5xl font-bold text-slate-200">404</p>
      <p className="mt-3 font-serif text-lg font-bold text-slate-700">
        This page didn't make the ranking.
      </p>
      <Link
        to="/"
        className="mt-4 inline-block rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
      >
        Back to all lists
      </Link>
    </div>
  )
}
