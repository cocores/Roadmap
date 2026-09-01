import { ArchiveRestore, X } from 'lucide-react'
import { COLOR_CLASSES, journeyColor, pmColor } from '../data/constants'

export default function ArchivedPanel({ initiatives, onClose, onRestore }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl light:border-slate-200 light:bg-white">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-100 light:text-slate-900">
            Archived Initiatives
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-100 light:hover:bg-slate-100 light:hover:text-slate-700"
          >
            <X size={18} />
          </button>
        </div>

        {initiatives.length === 0 ? (
          <p className="py-10 text-center text-sm text-slate-500">Nothing archived yet.</p>
        ) : (
          <div className="space-y-2.5">
            {initiatives.map((i) => {
              const pmC = COLOR_CLASSES[pmColor(i.pm)]
              const journeyC = COLOR_CLASSES[journeyColor(i.journey)]
              return (
                <div
                  key={i.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950/40 p-3 light:border-slate-200 light:bg-slate-50"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-100 light:text-slate-900">
                      {i.title}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      <span
                        className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${pmC.badge}`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${pmC.solid}`} />
                        {i.pm}
                      </span>
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${journeyC.badge}`}>
                        {i.journey}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onRestore(i.id)}
                    className="flex shrink-0 items-center gap-1.5 rounded-full border border-brand-600/50 px-3 py-1.5 text-xs font-medium text-brand-500 hover:bg-brand-500/10 light:text-brand-700"
                  >
                    <ArchiveRestore size={13} />
                    Restore
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
