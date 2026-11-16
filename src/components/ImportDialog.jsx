import { Upload, X } from 'lucide-react'
import { useState } from 'react'
import { csvToInitiatives } from '../lib/csv'

export default function ImportDialog({ existing, onClose, onImport }) {
  const [result, setResult] = useState(null)
  const [fileName, setFileName] = useState('')

  async function handleFile(file) {
    if (!file) return
    setFileName(file.name)
    setResult(csvToInitiatives(await file.text(), existing))
  }

  const updates = result?.rows.filter((r) => !r.isNew).length ?? 0
  const creates = result?.rows.filter((r) => r.isNew).length ?? 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 backdrop-blur-sm sm:p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 p-5 shadow-2xl sm:p-6 light:border-slate-200 light:bg-white">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-100 light:text-slate-900">Import from CSV</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-full p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-100 light:hover:bg-slate-100 light:hover:text-slate-700">
            <X size={18} />
          </button>
        </div>

        <p className="text-sm text-slate-400 light:text-slate-500">
          Use the same columns as <span className="font-medium text-slate-300 light:text-slate-700">Export CSV</span>. Rows
          with an <code>id</code> that already exists update that initiative; rows without one are added as new. Only{' '}
          <code>title</code> is required. Months can be names (Jan) or numbers (1–12); separate tags with semicolons.
        </p>

        <label className="mt-4 flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-slate-600 px-4 py-6 text-sm text-slate-300 hover:border-brand-500 hover:text-slate-100 light:border-slate-300 light:text-slate-600">
          <Upload size={16} />
          {fileName || 'Choose a .csv file'}
          <input type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />
        </label>

        {result && (
          <div className="mt-4 space-y-3 text-sm">
            <p className="text-slate-300 light:text-slate-700">
              Ready: <strong>{creates}</strong> new, <strong>{updates}</strong> updated.
            </p>
            {result.errors.length > 0 && (
              <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-amber-300 light:text-amber-800">
                <p className="font-medium">{result.errors.length} row(s) will be skipped:</p>
                <ul className="mt-1 max-h-32 list-disc overflow-y-auto pl-5 text-xs">
                  {result.errors.map((e) => (
                    <li key={e}>{e}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-full border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 light:border-slate-300 light:text-slate-600 light:hover:bg-slate-100">
            Cancel
          </button>
          <button
            type="button"
            disabled={!result?.rows.length}
            onClick={() => {
              onImport(result.rows)
              onClose()
            }}
            className="rounded-full bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-brand-600/25 hover:bg-brand-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Import {result?.rows.length ? result.rows.length : ''}
          </button>
        </div>
      </div>
    </div>
  )
}
