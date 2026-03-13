/**
 * Reusable labeled form field (input or textarea).
 */
export default function Field({ label, hint, textarea = false, ...props }) {
  const base =
    'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder-slate-400 ' +
    'focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-colors font-mono'

  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
        {props.required && <span className="ml-1 text-red-400">*</span>}
      </label>
      {textarea ? (
        <textarea rows={3} className={base} {...props} />
      ) : (
        <input className={base} {...props} />
      )}
      {hint && <p className="text-xs text-slate-400">{hint}</p>}
    </div>
  )
}
