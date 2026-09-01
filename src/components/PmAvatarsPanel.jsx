import { Loader2, Upload, X } from 'lucide-react'
import { useRef, useState } from 'react'
import { COLOR_CLASSES, PMS, avatarViewUrl, pmColor } from '../data/constants'

export default function PmAvatarsPanel({ avatarPaths, onAvatarChange, onClose }) {
  const [uploadingPm, setUploadingPm] = useState(null)
  const [error, setError] = useState('')
  const inputRefs = useRef({})

  async function handleFileChange(pmName, file) {
    if (!file) return
    setError('')
    setUploadingPm(pmName)
    try {
      const filename = `pm-avatars/${pmName.toLowerCase()}-${file.name}`
      const response = await fetch(`/api/avatar/upload?filename=${encodeURIComponent(filename)}`, {
        method: 'POST',
        body: file,
      })
      if (!response.ok) {
        const body = await response.json().catch(() => null)
        throw new Error(body?.error || `Upload failed (${response.status})`)
      }
      const blob = await response.json()
      onAvatarChange(pmName, blob.pathname)
    } catch (err) {
      setError(`Couldn't upload a photo for ${pmName}: ${err.message}`)
    } finally {
      setUploadingPm(null)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl light:border-slate-200 light:bg-white">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-100 light:text-slate-900">PM Avatars</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-100 light:hover:bg-slate-100 light:hover:text-slate-700"
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <p className="mb-3 rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-400">{error}</p>
        )}

        <div className="space-y-2.5">
          {PMS.map((pm) => {
            const pathname = avatarPaths[pm.name]
            const pmC = COLOR_CLASSES[pmColor(pm.name)]
            const isUploading = uploadingPm === pm.name
            return (
              <div
                key={pm.name}
                className="flex items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950/40 p-3 light:border-slate-200 light:bg-slate-50"
              >
                <div className="flex items-center gap-3">
                  {pathname ? (
                    <img
                      src={avatarViewUrl(pathname)}
                      alt={pm.name}
                      className="h-9 w-9 rounded-full object-cover"
                    />
                  ) : (
                    <span
                      className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold ${pmC.badge}`}
                    >
                      {pm.name.slice(0, 2).toUpperCase()}
                    </span>
                  )}
                  <span className="text-sm font-medium text-slate-100 light:text-slate-900">{pm.name}</span>
                </div>
                <button
                  type="button"
                  disabled={isUploading}
                  onClick={() => inputRefs.current[pm.name]?.click()}
                  className="flex shrink-0 items-center gap-1.5 rounded-full border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800 disabled:opacity-60 light:border-slate-300 light:text-slate-600 light:hover:bg-slate-100"
                >
                  {isUploading ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
                  {isUploading ? 'Uploading' : pathname ? 'Replace' : 'Upload'}
                </button>
                <input
                  ref={(el) => (inputRefs.current[pm.name] = el)}
                  type="file"
                  accept="image/jpeg, image/png, image/webp"
                  className="hidden"
                  onChange={(e) => handleFileChange(pm.name, e.target.files?.[0])}
                />
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
