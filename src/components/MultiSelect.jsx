import { Check, ChevronDown, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

export default function MultiSelect({ label, options, selected, onChange }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function onClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  function toggle(value) {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value))
    } else {
      onChange([...selected, value])
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-full border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm text-slate-200 hover:border-slate-600 hover:bg-slate-800 light:border-slate-300 light:bg-white light:text-slate-700 light:hover:border-slate-400 light:hover:bg-slate-50"
      >
        <span>{label}</span>
        {selected.length > 0 && (
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-600 px-1 text-xs font-semibold text-white">
            {selected.length}
          </span>
        )}
        <ChevronDown size={14} className="text-slate-400" />
      </button>

      {open && (
        <div className="absolute left-0 z-30 mt-2 w-56 overflow-hidden rounded-xl border border-slate-700 bg-slate-800 py-1 shadow-xl shadow-black/40 light:border-slate-200 light:bg-white">
          {selected.length > 0 && (
            <button
              type="button"
              onClick={() => onChange([])}
              className="flex w-full items-center gap-1.5 border-b border-slate-700 px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 light:border-slate-200 light:hover:text-slate-700"
            >
              <X size={12} /> Clear selection
            </button>
          )}
          <div className="max-h-64 overflow-y-auto">
            {options.map((opt) => {
              const value = typeof opt === 'string' ? opt : opt.name
              const isSelected = selected.includes(value)
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => toggle(value)}
                  className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm text-slate-200 hover:bg-slate-700/60 light:text-slate-700 light:hover:bg-slate-100"
                >
                  <span>{value}</span>
                  {isSelected && <Check size={14} className="text-brand-500" />}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
