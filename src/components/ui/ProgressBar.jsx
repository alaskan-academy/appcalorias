export default function ProgressBar({ value, max, color = 'bg-violet-500', className = '', showLabel = false }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0
  const over = max > 0 && value > max

  return (
    <div className={`w-full ${className}`}>
      <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${over ? 'bg-red-500' : color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel && (
        <div className="flex justify-between mt-1 text-xs text-zinc-500">
          <span>{Math.round(value)}</span>
          <span>{Math.round(max)}</span>
        </div>
      )}
    </div>
  )
}
