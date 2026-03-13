/**
 * Displays the HTTP response from an API call in a structured, readable format.
 * Shows method badge, URL, status code, duration, and formatted JSON body.
 */
export default function ResponseViewer({ result, loading }) {
  if (loading) {
    return (
      <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-5">
        <div className="flex items-center gap-3 text-slate-500">
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-slate-400 border-t-transparent" />
          <span className="text-sm font-medium">Sending request…</span>
        </div>
      </div>
    )
  }

  if (!result) return null

  const isSuccess = result.status >= 200 && result.status < 300
  const isEmpty = result.status === 204

  const statusColor = isSuccess
    ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
    : 'bg-red-100 text-red-700 border-red-200'

  const methodColors = {
    GET: 'bg-blue-100 text-blue-700',
    POST: 'bg-emerald-100 text-emerald-700',
    PUT: 'bg-amber-100 text-amber-700',
    PATCH: 'bg-purple-100 text-purple-700',
    DELETE: 'bg-red-100 text-red-700',
  }

  const methodColor = methodColors[result.method] ?? 'bg-slate-100 text-slate-700'

  const prettyJson = isEmpty
    ? '(No content — 204)'
    : JSON.stringify(result.data, null, 2)

  return (
    <div className={`mt-4 rounded-xl border ${isSuccess ? 'border-emerald-200' : 'border-red-200'} overflow-hidden`}>
      {/* ── Meta bar ── */}
      <div className={`flex flex-wrap items-center gap-3 px-4 py-2.5 ${isSuccess ? 'bg-emerald-50' : 'bg-red-50'}`}>
        <span className={`rounded-md px-2 py-0.5 text-xs font-bold tracking-wide ${methodColor}`}>
          {result.method}
        </span>
        <span className="font-mono text-xs text-slate-500 truncate">{result.url}</span>
        <div className="ml-auto flex items-center gap-2">
          <span className={`rounded-md border px-2 py-0.5 text-xs font-bold ${statusColor}`}>
            {result.status} {result.statusText}
          </span>
          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
            {result.durationMs} ms
          </span>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="relative bg-slate-900">
        <button
          onClick={() => navigator.clipboard.writeText(prettyJson)}
          className="absolute right-3 top-3 rounded-md bg-slate-700 px-2 py-1 text-xs text-slate-300 hover:bg-slate-600 transition-colors"
          title="Copy to clipboard"
        >
          Copy
        </button>
        <pre className="overflow-x-auto p-4 pt-10 font-mono text-xs leading-relaxed text-slate-100 max-h-[420px] overflow-y-auto">
          {prettyJson}
        </pre>
      </div>
    </div>
  )
}
