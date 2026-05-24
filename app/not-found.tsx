import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 via-white to-slate-100 px-4 py-16">
      <div className="max-w-xl rounded-3xl border border-slate-200 bg-white/95 p-10 shadow-xl shadow-slate-200/50 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">Page not found</p>
        <h1 className="mt-4 text-6xl font-extrabold tracking-tight text-slate-900">404</h1>
        <p className="mt-6 text-base leading-8 text-slate-600">
          The page you’re looking for doesn’t exist or has been moved. Check the URL or return to the dashboard.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row sm:justify-center gap-3">
          <Link
            href="/"
            className="inline-flex justify-center rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
          >
            Go to Home
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex justify-center rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Student Portal
          </Link>
        </div>
      </div>
    </div>
  )
}
