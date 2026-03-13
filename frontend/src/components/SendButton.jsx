/**
 * Consistent "Send Request" button used across all operation panels.
 */
export default function SendButton({ loading, label = 'Send Request', variant = 'primary', onClick, type = 'submit' }) {
  const variants = {
    primary: 'bg-indigo-600 hover:bg-indigo-700 text-white',
    danger:  'bg-red-600 hover:bg-red-700 text-white',
    success: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    warning: 'bg-amber-500 hover:bg-amber-600 text-white',
    purple:  'bg-purple-600 hover:bg-purple-700 text-white',
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={loading}
      className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all
        ${variants[variant] ?? variants.primary}
        disabled:cursor-not-allowed disabled:opacity-60`}
    >
      {loading && (
        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
      )}
      {label}
    </button>
  )
}
