import { Diamond, History, Plus, Trash2, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import {
  CORE_VALUES,
  HEALTH,
  JOURNEYS,
  PMS,
  STATUSES,
  TIME_VIEWS,
  bucketForMonth,
  firstMonthOfBucket,
  FIELD_LABELS,
  MONTHS,
  initiativeYear,
  yearOptions,
} from '../data/constants'
import { fetchHistory } from '../lib/api'
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

function buildForm(view, initiative, defaultYear) {
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
      priority: '',
      impact: '',
      tags: '',
      bucket: TIME_VIEWS[view].buckets[0],
      year: defaultYear,
      endMonth: '',
      blockedBy: [],
      statusNote: '',
      milestones: [],
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
    priority: initiative.priority ?? '',
    impact: initiative.impact,
    tags: initiative.tags.join(', '),
    bucket: bucketForMonth(initiative.startMonth, view),
    year: initiativeYear(initiative),
    endMonth: initiative.endMonth ?? '',
    blockedBy: initiative.blockedBy ?? [],
    statusNote: initiative.statusNote ?? '',
    milestones: initiative.milestones ?? [],
    trackerLink: initiative.trackerLink || '',
    confluenceLink: initiative.confluenceLink || '',
  }
}

// Mounted only while open (parent keys it per initiative), so state can
// initialize straight from props with no reset effect needed.
export default function InitiativeModal({
  view,
  defaultYear,
  initiative,
  allInitiatives = [],
  readOnly = false,
  onClose,
  onSave,
  onArchive,
}) {
  const [form, setForm] = useState(() => buildForm(view, initiative, defaultYear))
  const [confirmArchive, setConfirmArchive] = useState(false)

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (readOnly || !form.title.trim()) return
    const startMonth = firstMonthOfBucket(form.bucket, view)
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
      // Blank = unranked. Whole numbers from 1 up; 1 is the top priority.
      priority: form.priority === '' ? null : Math.max(1, Math.round(Number(form.priority))),
      impact: form.impact.trim(),
      tags: form.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      startMonth,
      // Blank = automatic (three months from the start).
      endMonth: form.endMonth === '' ? null : Math.max(startMonth, Number(form.endMonth)),
      blockedBy: form.blockedBy,
      statusNote: form.statusNote.trim(),
      milestones: form.milestones
        .map((m) => ({ name: m.name.trim(), date: m.date }))
        .filter((m) => m.name && m.date)
        .sort((a, b) => a.date.localeCompare(b.date)),
      year: Number(form.year),
      trackerLink: form.trackerLink.trim(),
      confluenceLink: form.confluenceLink.trim(),
    })
  }

  return (
    <>
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 backdrop-blur-sm sm:p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 p-5 shadow-2xl sm:p-6 light:border-slate-200 light:bg-white">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-100 light:text-slate-900">
            {readOnly ? 'Initiative' : initiative ? 'Edit Initiative' : 'New Initiative'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-full p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-100 light:hover:bg-slate-100 light:hover:text-slate-700"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* A disabled fieldset makes every control read-only for viewers. */}
          <fieldset disabled={readOnly} className="space-y-4 disabled:opacity-90">
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
            <Field label="Year">
              <select value={form.year} onChange={(e) => update('year', Number(e.target.value))} className={inputClass}>
                {yearOptions(form.year, defaultYear).map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={`Time Bucket (${TIME_VIEWS[view].label})`}>
              <select value={form.bucket} onChange={(e) => update('bucket', e.target.value)} className={inputClass}>
                {TIME_VIEWS[view].buckets.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="End month (for the timeline)">
            <select value={form.endMonth} onChange={(e) => update('endMonth', e.target.value === '' ? '' : Number(e.target.value))} className={inputClass}>
              <option value="">Auto (3 months from start)</option>
              {MONTHS.map((m, idx) =>
                idx >= firstMonthOfBucket(form.bucket, view) ? (
                  <option key={m} value={idx}>
                    {m} {form.year}
                  </option>
                ) : null
              )}
            </select>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Status">
              <select value={form.status} onChange={(e) => update('status', e.target.value)} className={inputClass}>
                {STATUSES.map((s) => (
                  <option key={s.name} value={s.name}>
                    {s.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Priority (1 = highest)">
              <input
                type="number"
                min={1}
                step={1}
                inputMode="numeric"
                value={form.priority}
                onChange={(e) => update('priority', e.target.value)}
                className={inputClass}
                placeholder="Unranked"
              />
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

          <Field label="Latest update (shown to stakeholders)">
            <textarea
              rows={2}
              value={form.statusNote}
              onChange={(e) => update('statusNote', e.target.value)}
              className={inputClass}
              placeholder="e.g. Vendor contract signed — build starts Jun 3"
            />
          </Field>

          <MilestonesEditor value={form.milestones} onChange={(v) => update('milestones', v)} year={form.year} />

          <BlockedByPicker
            value={form.blockedBy}
            onChange={(v) => update('blockedBy', v)}
            options={allInitiatives.filter((i) => !i.archived && i.id !== initiative?.id)}
          />

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

          </fieldset>

          {initiative && <HistoryList initiativeId={initiative.id} />}

          {!readOnly && (
          <div className="mt-6 flex items-center justify-between pt-2">
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
          )}
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

function BlockedByPicker({ value, onChange, options }) {
  const [filter, setFilter] = useState('')
  const q = filter.trim().toLowerCase()
  const shown = options
    .filter((o) => !q || o.title.toLowerCase().includes(q) || value.includes(o.id))
    .sort((a, b) => Number(value.includes(b.id)) - Number(value.includes(a.id)) || a.title.localeCompare(b.title))

  return (
    <div>
      <span className="mb-1.5 block text-xs font-medium text-slate-400 light:text-slate-500">
        Blocked by {value.length > 0 && `(${value.length})`}
      </span>
      <div className="rounded-xl border border-slate-700 light:border-slate-300">
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Search initiatives this depends on…"
          className="w-full rounded-t-xl border-b border-slate-700 bg-transparent px-3 py-2 text-sm text-slate-200 outline-none light:border-slate-300 light:text-slate-800"
        />
        <div className="max-h-36 overflow-y-auto py-1">
          {shown.length === 0 && <p className="px-3 py-2 text-xs text-slate-500">No matches</p>}
          {shown.map((o) => (
            <label key={o.id} className="flex cursor-pointer items-center gap-2 px-3 py-1.5 text-sm text-slate-300 hover:bg-slate-800/60 light:text-slate-700 light:hover:bg-slate-100">
              <input
                type="checkbox"
                checked={value.includes(o.id)}
                onChange={(e) => onChange(e.target.checked ? [...value, o.id] : value.filter((id) => id !== o.id))}
                className="accent-brand-600"
              />
              <span className="truncate">{o.title}</span>
              <span className="ml-auto shrink-0 text-[11px] text-slate-500">{o.status}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  )
}

function formatValue(field, value) {
  if (value == null || value === '') return '—'
  if (field === 'startMonth' || field === 'endMonth') return MONTHS[value] ?? String(value)
  if (field === 'progress') return `${value}%`
  if (Array.isArray(value)) return value.length ? `${value.length} item${value.length > 1 ? 's' : ''}` : '—'
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  const s = String(value)
  return s.length > 40 ? `${s.slice(0, 40)}…` : s
}

function HistoryList({ initiativeId }) {
  const [entries, setEntries] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    fetchHistory(initiativeId)
      .then((e) => !cancelled && setEntries(e))
      .catch((err) => !cancelled && setError(err.message))
    return () => {
      cancelled = true
    }
  }, [initiativeId])

  return (
    <details className="mt-5 rounded-xl border border-slate-800 light:border-slate-200">
      <summary className="flex cursor-pointer items-center gap-2 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
        <History size={13} /> Change history {entries && `(${entries.length})`}
      </summary>
      <div className="max-h-56 space-y-2.5 overflow-y-auto px-3 pb-3 text-xs">
        {error && <p className="text-amber-500">Couldn&apos;t load history: {error}</p>}
        {!error && !entries && <p className="text-slate-500">Loading…</p>}
        {entries?.length === 0 && <p className="text-slate-500">No recorded changes yet.</p>}
        {entries?.map((e) => (
          <div key={e.id} className="border-l-2 border-slate-700 pl-2.5 light:border-slate-300">
            <div className="text-slate-400 light:text-slate-500">
              {e.at ? e.at.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : 'Just now'} ·{' '}
              {e.by || 'Someone'}
            </div>
            {e.type === 'created' ? (
              <div className="text-slate-300 light:text-slate-700">Created</div>
            ) : (
              e.changes.map((c) => (
                <div key={c.field} className="text-slate-300 light:text-slate-700">
                  <span className="font-medium">{FIELD_LABELS[c.field] ?? c.field}:</span> {formatValue(c.field, c.from)} →{' '}
                  {formatValue(c.field, c.to)}
                </div>
              ))
            )}
          </div>
        ))}
      </div>
    </details>
  )
}

function MilestonesEditor({ value, onChange, year }) {
  const setAt = (idx, patch) => onChange(value.map((m, i) => (i === idx ? { ...m, ...patch } : m)))
  return (
    <div>
      <span className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-slate-400 light:text-slate-500">
        <Diamond size={12} /> Milestones (shown on the timeline)
      </span>
      <div className="space-y-2">
        {value.map((m, idx) => (
          <div key={idx} className="flex gap-2">
            <input
              value={m.name}
              onChange={(e) => setAt(idx, { name: e.target.value })}
              placeholder="e.g. Beta, GA"
              aria-label="Milestone name"
              className={`${inputClass} flex-1`}
            />
            <input
              type="date"
              value={m.date}
              min={`${year}-01-01`}
              max={`${year}-12-31`}
              onChange={(e) => setAt(idx, { date: e.target.value })}
              aria-label="Milestone date"
              className={`${inputClass} w-40 shrink-0`}
            />
            <button
              type="button"
              onClick={() => onChange(value.filter((_, i) => i !== idx))}
              aria-label="Remove milestone"
              className="shrink-0 rounded-full p-2 text-slate-500 hover:bg-slate-800 hover:text-red-400 light:hover:bg-slate-100"
            >
              <X size={15} />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => onChange([...value, { name: '', date: '' }])}
          className="flex items-center gap-1.5 rounded-full border border-dashed border-slate-600 px-3 py-1.5 text-xs text-slate-400 hover:border-brand-500 hover:text-slate-200 light:border-slate-300 light:text-slate-500"
        >
          <Plus size={13} /> Add milestone
        </button>
      </div>
    </div>
  )
}
