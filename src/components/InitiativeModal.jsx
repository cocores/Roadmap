import { Trash2, X } from 'lucide-react'
import { useState } from 'react'
import {
  CORE_VALUES,
  HEALTH,
  JOURNEYS,
  PMS,
  STATUSES,
  TIME_VIEWS,
  bucketForMonth,
  firstMonthOfBucket,
} from '../data/constants'
import ConfirmDialog from './ConfirmDialog'

const NO_CORE_VALUE = 'None'

// Real traffic lights run red-top to green-bottom, and stay lit/unlit in
// their own hue regardless of app theme, so this is hand-styled rather
// than driven by the shared COLOR_CLASSES badge palette.
const LAMPS = [
  { name: 'Red', lit: 'bg-red-500 shadow-[0_0_10px_2px] shadow-red-500/70', off: 'bg-red-950 ring-1 ring-inset ring-red-900/60' },
  { name: 'Yellow', lit: 'bg-yellow-400 shadow-[0_0_10px_2px] shadow-yellow-400/70', off: 'bg-yellow-950 ring-1 ring-inset ring-yellow-900/60' },
  { name: 'Green', lit: 'bg-green-500 shadow-[0_0_10px_2px] shadow-green-500/70', off: 'bg-green-950 ring-1 ring-inset ring-green-900/60' },
]

function buildForm(view, initiative) {
  if (!initiative) {
    return {
      title: '',
      description: '',
      pm: PMS[0].name,
      journey: JOURNEYS[0].name,
      coreValue: NO_CORE_VALUE,
      status: STATUSES[0].name,
      health: HEALTH[0].name,
      progress: 0,
      impact: '',
      tags: '',
      bucket: TIME_VIEWS[view].buckets[0],
      trackerLink: '',
      confluenceLink: '',
    }
  }
  return {
    title: initiative.title,
    description: initiative.description,
    pm: initiative.pm,
    journey: initiative.journey,
    coreValue: initiative.coreValue || NO_CORE_VALUE,
    status: initiative.status,
    health: initiative.health || HEALTH[0].name,
    progress: initiative.progress,
    impact: initiative.impact,
    tags: initiative.tags.join(', '),
    bucket: bucketForMonth(initiative.startMonth, view),
    trackerLink: initiative.trackerLink || '',
    confluenceLink: initiative.confluenceLink || '',
  }
}

// Mounted only while open (parent keys it per initiative), so state can
// initialize straight from props with no reset effect needed.
export default function InitiativeModal({ view, initiative, onClose, onSave, onArchive }) {
  const [form, setForm] = useState(() => buildForm(view, initiative))
  const [confirmArchive, setConfirmArchive] = useState(false)

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!form.title.trim()) return
    onSave({
      id: initiative?.id,
      title: form.title.trim(),
      description: form.description.trim(),
      pm: form.pm,
      journey: form.journey,
      coreValue: form.coreValue === NO_CORE_VALUE ? null : form.coreValue,
      status: form.status,
      health: form.health,
      progress: Number(form.progress),
      impact: form.impact.trim(),
      tags: form.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      startMonth: firstMonthOfBucket(form.bucket, view),
      trackerLink: form.trackerLink.trim(),
      confluenceLink: form.confluenceLink.trim(),
    })
  }

  return (
    <>
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl light:border-slate-200 light:bg-white">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-100 light:text-slate-900">
            {initiative ? 'Edit Initiative' : 'New Initiative'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-100 light:hover:bg-slate-100 light:hover:text-slate-700"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Title">
            <input
              required
              value={form.title}
              onChange={(e) => update('title', e.target.value)}
              className={inputClass}
              placeholder="e.g. 1-Click Checkout Optimization"
            />
          </Field>

          <Field label="Description">
            <textarea
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
              rows={2}
              className={inputClass}
              placeholder="Short summary of the initiative"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="PM">
              <select value={form.pm} onChange={(e) => update('pm', e.target.value)} className={inputClass}>
                {PMS.map((pm) => (
                  <option key={pm.name} value={pm.name}>
                    {pm.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Journey">
              <select
                value={form.journey}
                onChange={(e) => update('journey', e.target.value)}
                className={inputClass}
              >
                {JOURNEYS.map((j) => (
                  <option key={j.name} value={j.name}>
                    {j.name}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Core Value (optional)">
            <select value={form.coreValue} onChange={(e) => update('coreValue', e.target.value)} className={inputClass}>
              <option value={NO_CORE_VALUE}>None</option>
              {CORE_VALUES.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label={`Time Bucket (${TIME_VIEWS[view].label})`}>
              <select value={form.bucket} onChange={(e) => update('bucket', e.target.value)} className={inputClass}>
                {TIME_VIEWS[view].buckets.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Status">
              <select value={form.status} onChange={(e) => update('status', e.target.value)} className={inputClass}>
                {STATUSES.map((s) => (
                  <option key={s.name} value={s.name}>
                    {s.name}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          {/* Plain div, not Field/<label>: a <label> forwards clicks anywhere in
              its box to the first labelable descendant, which with three
              buttons here would silently reselect "Red" on a stray click. */}
          <div className="block">
            <span className="mb-1.5 block text-xs font-medium text-slate-400 light:text-slate-500">Health</span>
            <div className="flex items-center gap-3">
              <div className="flex flex-col items-center gap-2 rounded-2xl border border-slate-950/80 bg-slate-950 p-2 shadow-inner">
                {LAMPS.map((lamp) => {
                  const isSelected = form.health === lamp.name
                  return (
                    <button
                      key={lamp.name}
                      type="button"
                      onClick={() => update('health', lamp.name)}
                      title={lamp.name}
                      aria-label={lamp.name}
                      aria-pressed={isSelected}
                      className={`h-6 w-6 rounded-full transition ${
                        isSelected ? lamp.lit : `${lamp.off} opacity-80 hover:opacity-100`
                      }`}
                    />
                  )
                })}
              </div>
              <span className="text-sm font-medium text-slate-300 light:text-slate-700">{form.health}</span>
            </div>
          </div>

          <div className="space-y-3 border-t border-slate-800 pt-4 light:border-slate-200">
            <span className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Links</span>
            <Field label="Epic / PMO / Jira Ticket Link">
              <input
                type="url"
                value={form.trackerLink}
                onChange={(e) => update('trackerLink', e.target.value)}
                className={inputClass}
                placeholder="https://jira.example.com/browse/BH-1234"
              />
            </Field>
            <Field label="Confluence Link">
              <input
                type="url"
                value={form.confluenceLink}
                onChange={(e) => update('confluenceLink', e.target.value)}
                className={inputClass}
                placeholder="https://confluence.example.com/display/..."
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label={`Progress (${form.progress}%)`}>
              <input
                type="range"
                min={0}
                max={100}
                value={form.progress}
                onChange={(e) => update('progress', e.target.value)}
                className="w-full accent-brand-600"
              />
            </Field>
            <Field label="Target Impact">
              <input
                value={form.impact}
                onChange={(e) => update('impact', e.target.value)}
                className={inputClass}
                placeholder="e.g. +3.2% conversion"
              />
            </Field>
          </div>

          <Field label="Tags (comma separated)">
            <input
              value={form.tags}
              onChange={(e) => update('tags', e.target.value)}
              className={inputClass}
              placeholder="checkout, conversion"
            />
          </Field>

          <div className="mt-2 flex items-center justify-between pt-2">
            {initiative ? (
              <button
                type="button"
                onClick={() => setConfirmArchive(true)}
                className="flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium text-red-400 hover:bg-red-500/10"
              >
                <Trash2 size={15} />
                Delete
              </button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 light:border-slate-300 light:text-slate-600 light:hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-full bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-brand-600/25 hover:bg-brand-500"
              >
                {initiative ? 'Save Changes' : 'Create Initiative'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
    {confirmArchive && (
      <ConfirmDialog
        title="Delete this initiative?"
        message={`"${initiative.title}" will be moved to Archived. You can restore it from there anytime.`}
        confirmLabel="Delete"
        onCancel={() => setConfirmArchive(false)}
        onConfirm={() => onArchive(initiative.id)}
      />
    )}
    </>
  )
}

const inputClass =
  'w-full rounded-xl border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm text-slate-200 outline-none focus:border-brand-500 light:border-slate-300 light:bg-white light:text-slate-800'

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-slate-400 light:text-slate-500">{label}</span>
      {children}
    </label>
  )
}
