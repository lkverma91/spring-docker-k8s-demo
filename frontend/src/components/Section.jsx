/**
 * Card wrapper for each API operation panel.
 */
export default function Section({ method, endpoint, title, description, children, badge }) {
  const methodColors = {
    GET:    'bg-blue-100 text-blue-700 border-blue-200',
    POST:   'bg-emerald-100 text-emerald-700 border-emerald-200',
    PUT:    'bg-amber-100 text-amber-700 border-amber-200',
    PATCH:  'bg-purple-100 text-purple-700 border-purple-200',
    DELETE: 'bg-red-100 text-red-700 border-red-200',
  }
  const color = methodColors[method] ?? 'bg-slate-100 text-slate-600 border-slate-200'

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex flex-wrap items-start gap-3 border-b border-slate-100 bg-slate-50 px-5 py-4">
        <div className="flex items-center gap-2">
          <span className={`rounded-md border px-2.5 py-0.5 text-xs font-bold tracking-wide ${color}`}>
            {method}
          </span>
          {badge && (
            <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs text-slate-600">{badge}</span>
          )}
        </div>
        <code className="font-mono text-sm text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
          {endpoint}
        </code>
      </div>

      {/* Body */}
      <div className="px-5 py-5">
        <h3 className="mb-1 text-base font-semibold text-slate-800">{title}</h3>
        {description && <p className="mb-4 text-sm text-slate-500">{description}</p>}
        {children}
      </div>
    </div>
  )
}
