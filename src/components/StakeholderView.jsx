import { toPng } from 'html-to-image'
import {
  AlertTriangle,
  Bookmark,
  Check,
  Download,
  FileText,
  Link2,
  Pencil,
  Presentation,
  Rocket,
  Target,
  Trash2,
} from 'lucide-react'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import {
  COLOR_CLASSES,
  MONTHS,
  STATUSES,
  initiativeEndMonth,
  initiativeYear,
  journeyColor,
  sortByPriority,
} from '../data/constants'
import { deletePreset, listPresets, savePreset, saveSummary, subscribeSummary } from '../lib/api'
import { settingsToQuery, shareUrl } from '../lib/urlState'
import Legend from './Legend'
import StakeholderSlides from './StakeholderSlides'
import { HEALTH_BAR, HEALTH_DOT, TIMELINE_GROUPS } from '../data/stakeholder'

const toolButton =
  'flex items-center gap-1.5 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-600 hover:border-slate-400 hover:text-slate-900'

function quarterOf(month) {
  return Math.floor(month / 3)
}

export default function StakeholderView({
  initiatives,
  initiativesAllYears,
  byId,
  year,
  settings,
  onSettingsChange,
  onApplyQuery,
  canEdit,
  user,
  onCardClick,
}) {
  const exportRef = useRef(null)
  const [copied, setCopied] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [slidesOpen, setSlidesOpen] = useState(false)
  const [summary, setSummary] = useState(undefined)
  const layout = settings.layout
  const groupBy = TIMELINE_GROUPS[settings.tl] ? settings.tl : 'journey'

  useEffect(() => subscribeSummary(year, setSummary), [year])

  async function copyLink() {
    const url = shareUrl({ ...settings, page: 'stakeholder' })
    try {
      await navigator.clipboard.writeText(url)
    } catch {
      window.prompt('Copy this link:', url)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function downloadPng() {
    if (!exportRef.current) return
    setExporting(true)
    try {
      const dataUrl = await toPng(exportRef.current, { pixelRatio: 2, backgroundColor: '#ffffff', cacheBust: true })
      const a = document.createElement('a')
      a.href = dataUrl
      a.download = `roadmap-${year}-${layout}.png`
      a.click()
    } finally {
      setExporting(false)
    }
  }

  const sections = {
    summary: <ExecSummary year={year} summary={summary} canEdit={canEdit} user={user} />,
    stats: <Summary initiatives={layout === 'timeline' ? initiatives : initiativesAllYears} />,
    timeline: <Timeline initiatives={initiatives} byId={byId} year={year} groupBy={groupBy} onCardClick={onCardClick} />,
    nnl: <NowNextLater initiatives={initiativesAllYears} onCardClick={onCardClick} />,
    delivered: <Delivered initiatives={initiatives} year={year} onCardClick={onCardClick} />,
    impact: <ImpactRollup initiatives={initiatives} groupBy={groupBy} onCardClick={onCardClick} />,
  }

  return (
    // Always rendered in the light theme: it's meant for slides, print and
    // screens in meeting rooms.
    <div className="light min-h-[calc(100vh-4rem)] bg-paper print:min-h-0 print:bg-white">
      <div className="mx-auto max-w-[1600px] px-4 py-4 sm:px-6 sm:py-5">
        <div className="mb-3 flex flex-wrap items-center gap-2 print:hidden">
          <div className="flex rounded-full border border-slate-300 bg-white p-1">
            {[
              ['timeline', 'Timeline'],
              ['nnl', 'Now / Next / Later'],
            ].map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => onSettingsChange('layout', key)}
                className={`rounded-full px-3 py-1.5 text-sm font-medium ${
                  layout === key ? 'bg-brand-600 text-white shadow' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          {layout === 'timeline' && (
            <label className="flex items-center gap-1.5 rounded-full border border-slate-300 bg-white py-1 pl-3 pr-1 text-sm text-slate-500">
              Group by
              <select
                value={groupBy}
                onChange={(e) => onSettingsChange('tl', e.target.value)}
                className="rounded-full bg-slate-100 px-2 py-1 text-sm font-medium text-slate-800 outline-none"
              >
                {Object.entries(TIMELINE_GROUPS).map(([key, g]) => (
                  <option key={key} value={key}>
                    {g.label}
                  </option>
                ))}
              </select>
            </label>
          )}
          <div className="ml-auto flex flex-wrap gap-2">
            <PresetMenu settings={settings} canEdit={canEdit} user={user} onApply={onApplyQuery} />
            <button type="button" onClick={copyLink} className={toolButton}>
              {copied ? <Check size={15} /> : <Link2 size={15} />}
              {copied ? 'Link copied' : 'Copy link'}
            </button>
            <button type="button" onClick={() => setSlidesOpen(true)} className={toolButton}>
              <Presentation size={15} /> Slides
            </button>
            <button type="button" onClick={() => window.print()} className={toolButton}>
              <FileText size={15} /> PDF
            </button>
            <button type="button" onClick={downloadPng} disabled={exporting} className={`${toolButton} disabled:opacity-50`}>
              <Download size={15} /> {exporting ? 'Saving…' : 'PNG'}
            </button>
          </div>
        </div>

        <div
          ref={exportRef}
          className="min-w-0 space-y-5 rounded-2xl border border-slate-200 bg-white p-4 text-slate-900 shadow-sm sm:p-6 print:border-0 print:p-0 print:shadow-none"
        >
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 className="text-xl font-semibold tracking-tight">
                Product Roadmap {layout === 'timeline' ? year : ''}
              </h2>
              <p className="text-sm text-slate-500">
                {layout === 'timeline'
                  ? `Timeline by ${TIMELINE_GROUPS[groupBy].label}`
                  : 'What we are doing now, next, and later'}{' '}
                · as of {new Date().toLocaleDateString(undefined, { dateStyle: 'medium' })}
              </p>
            </div>
            <Legend />
          </div>

          {sections.summary}
          {sections.stats}
          {layout === 'timeline' ? sections.timeline : sections.nnl}
          <div className="grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-2">
            {sections.delivered}
            {sections.impact}
          </div>
        </div>
      </div>

      {slidesOpen && (
        <StakeholderSlides
          initiatives={initiatives}
          byId={byId}
          year={year}
          summary={summary}
          // Bars aren't clickable during a presentation (the editor would open
          // behind the full-screen slides).
          timeline={<Timeline initiatives={initiatives} byId={byId} year={year} groupBy={groupBy} onCardClick={() => {}} />}
          nowNextLater={<NowNextLater initiatives={initiativesAllYears} onCardClick={() => {}} />}
          onClose={() => setSlidesOpen(false)}
        />
      )}
    </div>
  )
}

function ExecSummary({ year, summary, canEdit, user }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function save() {
    setSaving(true)
    setError('')
    try {
      await saveSummary(year, draft.trim(), user)
      setEditing(false)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const text = summary?.text ?? ''
  if (!editing && !text && !canEdit) return null

  return (
    <section className="rounded-xl border border-brand-200 bg-brand-50/60 p-4">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-brand-800">Executive summary</h3>
        {canEdit && !editing && (
          <button
            type="button"
            onClick={() => {
              setDraft(text)
              setEditing(true)
            }}
            className="flex items-center gap-1 rounded-full px-2 py-1 text-xs text-brand-800 hover:bg-brand-100 print:hidden"
          >
            <Pencil size={12} /> {text ? 'Edit' : 'Write summary'}
          </button>
        )}
      </div>
      {editing ? (
        <div className="space-y-2">
          <textarea
            autoFocus
            rows={4}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={`What should stakeholders know about ${year}? Focus areas, key risks, decisions needed…`}
            className="w-full rounded-lg border border-slate-300 bg-white p-3 text-sm text-slate-800 outline-none focus:border-brand-500"
          />
          {error && (
            <p className="text-xs text-amber-700">
              {error}
              {/permission/i.test(error) && ' — publish the updated Firestore rules (firestore.rules).'}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setEditing(false)} className="rounded-full border border-slate-300 px-3 py-1.5 text-sm text-slate-600">
              Cancel
            </button>
            <button type="button" onClick={save} disabled={saving} className="rounded-full bg-brand-600 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50">
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      ) : text ? (
        <>
          <p className="whitespace-pre-line text-[15px] leading-relaxed text-slate-800">{text}</p>
          {summary?.at && (
            <p className="mt-2 text-xs text-slate-500">
              Updated {summary.at.toLocaleDateString(undefined, { dateStyle: 'medium' })}
              {summary.by ? ` by ${summary.by}` : ''}
            </p>
          )}
        </>
      ) : (
        <p className="text-sm text-slate-500">
          {summary === null ? 'Summary unavailable.' : `No summary for ${year} yet.`}
        </p>
      )}
    </section>
  )
}

function Stat({ label, value, tone = 'text-slate-900' }) {
  return (
    <div className="min-w-[96px] flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
      <div className={`text-2xl font-semibold tabular-nums ${tone}`}>{value}</div>
      <div className="text-xs text-slate-500">{label}</div>
    </div>
  )
}

function Summary({ initiatives }) {
  const count = (pred) => initiatives.filter(pred).length
  const atRisk = sortByPriority(initiatives.filter((i) => i.health === 'Red' || i.health === 'Yellow')).sort(
    (a, b) => (a.health === 'Red' ? 0 : 1) - (b.health === 'Red' ? 0 : 1)
  )

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(300px,440px)]">
      <div className="flex flex-wrap content-start gap-2">
        <Stat label="Initiatives" value={initiatives.length} />
        {STATUSES.map((s) => (
          <Stat key={s.name} label={s.name} value={count((i) => i.status === s.name)} />
        ))}
        <Stat label="On track" value={count((i) => i.health === 'Green')} tone="text-green-600" />
        <Stat label="At risk" value={count((i) => i.health === 'Yellow')} tone="text-yellow-600" />
        <Stat label="Off track" value={count((i) => i.health === 'Red')} tone="text-red-600" />
      </div>
      <div className="rounded-xl border border-slate-200 p-3">
        <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
          <AlertTriangle size={13} /> Needs attention
        </div>
        {atRisk.length === 0 ? (
          <p className="text-sm text-slate-500">Everything is on track.</p>
        ) : (
          <ul className="max-h-56 space-y-2 overflow-y-auto text-sm">
            {atRisk.map((i) => (
              <li key={i.id}>
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 shrink-0 rounded-full ${HEALTH_DOT[i.health]}`} />
                  <span className="min-w-0 truncate font-medium">{i.title}</span>
                  <span className="ml-auto shrink-0 text-xs text-slate-500">{i.pm}</span>
                </div>
                {i.statusNote && <p className="ml-4 text-xs text-slate-600">{i.statusNote}</p>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

// Fraction of the year (0..1) for an ISO date, or null if it's another year.
function datePosition(iso, year) {
  const d = new Date(`${iso}T00:00:00`)
  if (Number.isNaN(d.getTime()) || d.getFullYear() !== year) return null
  const start = new Date(year, 0, 1).getTime()
  const end = new Date(year + 1, 0, 1).getTime()
  return (d.getTime() - start) / (end - start)
}

function Timeline({ initiatives, byId, year, groupBy, onCardClick }) {
  const containerRef = useRef(null)
  const [arrows, setArrows] = useState([])
  const now = new Date()
  const showToday = now.getFullYear() === year
  const todayPct = datePosition(now.toISOString().slice(0, 10), year) * 100
  const group = TIMELINE_GROUPS[groupBy]
  const groups = [...new Set([...group.order, ...initiatives.map(group.key)])].filter((g) =>
    initiatives.some((i) => group.key(i) === g)
  )

  // Dependency arrows: measured from the rendered bars, so they follow any
  // layout (resizing, grouping, wrapping).
  const depKey = initiatives.map((i) => `${i.id}:${(i.blockedBy ?? []).join(',')}:${i.startMonth}:${i.endMonth}`).join('|')
  useLayoutEffect(() => {
    const el = containerRef.current
    if (!el) return undefined
    function measure() {
      const box = el.getBoundingClientRect()
      const rectOf = (id) => el.querySelector(`[data-bar-id="${id}"]`)?.getBoundingClientRect()
      const next = []
      for (const i of initiatives) {
        for (const blockerId of i.blockedBy ?? []) {
          const from = rectOf(blockerId)
          const to = rectOf(i.id)
          if (!from || !to) continue
          next.push({
            key: `${blockerId}->${i.id}`,
            x1: from.right - box.left,
            y1: from.top + from.height / 2 - box.top,
            x2: to.left - box.left,
            y2: to.top + to.height / 2 - box.top,
            title: `${byId[blockerId]?.title ?? 'Blocker'} → ${i.title}`,
          })
        }
      }
      setArrows(next)
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
    // depKey summarises everything the arrows depend on.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [depKey, groupBy])

  if (initiatives.length === 0) {
    return <p className="py-10 text-center text-sm text-slate-500">No initiatives match these filters in {year}.</p>
  }

  return (
    <div>
    <p className="mb-2 text-xs text-slate-400 md:hidden print:hidden">Swipe sideways to see the whole year →</p>
    <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
    <div ref={containerRef} className="relative min-w-[720px]">
      <div className="grid grid-cols-[120px_1fr] border-b border-slate-200 pb-1 text-xs font-semibold text-slate-500 sm:grid-cols-[180px_1fr]">
        <div />
        <div className="grid grid-cols-4">
          {['Q1', 'Q2', 'Q3', 'Q4'].map((q, idx) => (
            <div key={q} className="border-l border-slate-200 pl-2">
              {q}
              <span className="ml-1.5 font-normal text-slate-400">
                {MONTHS[idx * 3]}–{MONTHS[idx * 3 + 2]}
              </span>
            </div>
          ))}
        </div>
      </div>

      {groups.map((name) => {
        const gc = COLOR_CLASSES[group.color(name)]
        const rows = sortByPriority(initiatives.filter((i) => group.key(i) === name)).sort(
          (a, b) => a.startMonth - b.startMonth
        )
        return (
          <div key={name} className="grid grid-cols-[120px_1fr] border-b border-slate-100 py-2 break-inside-avoid sm:grid-cols-[180px_1fr]">
            <div className="sticky left-0 z-20 flex items-start gap-2 bg-white pr-2 pt-1 text-sm font-semibold sm:pr-3">
              <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${gc.solid}`} />
              {name}
            </div>
            <div className="relative space-y-1.5">
              <div className="pointer-events-none absolute inset-0 grid grid-cols-12">
                {MONTHS.map((m, idx) => (
                  <div key={m} className={`border-l ${idx % 3 === 0 ? 'border-slate-200' : 'border-slate-100'}`} />
                ))}
              </div>
              {showToday && (
                <div className="pointer-events-none absolute -bottom-2 -top-2 z-10 w-px bg-red-400" style={{ left: `${todayPct}%` }} />
              )}
              {rows.map((i) => {
                const end = initiativeEndMonth(i)
                const left = (i.startMonth / 12) * 100
                const width = ((end - i.startMonth + 1) / 12) * 100
                const milestones = (i.milestones ?? [])
                  .map((m) => ({ ...m, pos: datePosition(m.date, year) }))
                  .filter((m) => m.pos != null)
                return (
                  <div key={i.id} className="group relative h-8">
                    <button
                      type="button"
                      data-bar-id={i.id}
                      onClick={() => onCardClick(i)}
                      className="absolute inset-y-0 block text-left"
                      style={{ left: `${left}%`, width: `${width}%` }}
                    >
                      <span
                        className={`flex h-full items-center gap-1.5 overflow-hidden rounded-md px-2 text-xs font-medium shadow-sm ${
                          HEALTH_BAR[i.health] ?? 'bg-slate-400'
                        } ${i.health === 'Yellow' ? 'text-slate-900' : 'text-white'}`}
                      >
                        {i.priority != null && (
                          <span className="rounded bg-black/20 px-1 text-[10px] font-bold tabular-nums">{i.priority}</span>
                        )}
                        <span className="truncate">{i.title}</span>
                        {groupBy !== 'pm' && <span className="ml-auto hidden shrink-0 opacity-80 sm:inline">{i.pm}</span>}
                      </span>
                    </button>
                    {milestones.map((m) => (
                      <span
                        key={`${m.name}-${m.date}`}
                        title={`${m.name} — ${new Date(`${m.date}T00:00:00`).toLocaleDateString(undefined, { dateStyle: 'medium' })}`}
                        className="absolute top-1/2 z-20 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rotate-45 border-2 border-white bg-slate-800 shadow"
                        style={{ left: `${m.pos * 100}%` }}
                      />
                    ))}
                    {/* Hover card with the latest update and milestones. */}
                    <div
                      className="pointer-events-none absolute top-full z-30 mt-1 hidden w-72 rounded-lg border border-slate-200 bg-white p-2.5 text-xs text-slate-700 shadow-lg group-hover:block print:hidden"
                      style={{ left: `min(${left}%, calc(100% - 18rem))` }}
                    >
                      <div className="font-semibold text-slate-900">{i.title}</div>
                      <div className="text-slate-500">
                        {i.pm} · {i.status} · {MONTHS[i.startMonth]}–{MONTHS[end]}
                      </div>
                      {i.statusNote && <p className="mt-1.5">{i.statusNote}</p>}
                      {milestones.length > 0 && (
                        <ul className="mt-1.5 space-y-0.5">
                          {milestones.map((m) => (
                            <li key={`${m.name}-${m.date}`}>◆ {m.name} — {m.date}</li>
                          ))}
                        </ul>
                      )}
                      {(i.blockedBy ?? []).length > 0 && (
                        <p className="mt-1.5 text-red-600">
                          Blocked by: {i.blockedBy.map((id) => byId[id]?.title).filter(Boolean).join(', ')}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}

      {arrows.length > 0 && (
        <svg className="pointer-events-none absolute inset-0 z-20 h-full w-full overflow-visible" aria-hidden="true">
          <defs>
            <marker id="dep-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto">
              <path d="M0,0 L8,4 L0,8 z" fill="#475569" />
            </marker>
          </defs>
          {arrows.map((a) => {
            const dx = Math.max(24, Math.abs(a.x2 - a.x1) / 2)
            return (
              <path
                key={a.key}
                d={`M${a.x1},${a.y1} C${a.x1 + dx},${a.y1} ${a.x2 - dx},${a.y2} ${a.x2},${a.y2}`}
                fill="none"
                stroke="#475569"
                strokeWidth="1.5"
                strokeDasharray="4 3"
                markerEnd="url(#dep-arrow)"
              >
                <title>{a.title}</title>
              </path>
            )
          })}
        </svg>
      )}

      <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
        {showToday && (
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-3 w-px bg-red-400" /> Today
          </span>
        )}
        {arrows.length > 0 && (
          <span className="flex items-center gap-1.5">
            <svg width="22" height="6" aria-hidden="true">
              <line x1="0" y1="3" x2="22" y2="3" stroke="#475569" strokeWidth="1.5" strokeDasharray="4 3" />
            </svg>
            Depends on
          </span>
        )}
      </p>
    </div>
    </div>
    </div>
  )
}

function NowNextLater({ initiatives, onCardClick }) {
  const now = new Date()
  const nowIdx = now.getFullYear() * 4 + quarterOf(now.getMonth())
  const columns = [
    { key: 'now', title: 'Now', hint: `This quarter (Q${quarterOf(now.getMonth()) + 1} ${now.getFullYear()})`, items: [] },
    { key: 'next', title: 'Next', hint: 'Next quarter', items: [] },
    { key: 'later', title: 'Later', hint: 'Beyond next quarter', items: [] },
  ]
  for (const i of initiatives) {
    const startIdx = initiativeYear(i) * 4 + quarterOf(i.startMonth)
    const endIdx = initiativeYear(i) * 4 + quarterOf(initiativeEndMonth(i))
    if (endIdx < nowIdx) continue // already finished
    if (startIdx <= nowIdx) columns[0].items.push(i)
    else if (startIdx === nowIdx + 1) columns[1].items.push(i)
    else columns[2].items.push(i)
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {columns.map((col) => (
        <div key={col.key} className="rounded-xl border border-slate-200 bg-slate-50 p-3 break-inside-avoid">
          <div className="mb-2 flex items-baseline justify-between">
            <h3 className="text-base font-semibold">{col.title}</h3>
            <span className="text-xs text-slate-500">{col.hint}</span>
          </div>
          <div className="space-y-2">
            {col.items.length === 0 && <p className="text-sm text-slate-400">Nothing here</p>}
            {sortByPriority(col.items).map((i) => {
              const jc = COLOR_CLASSES[journeyColor(i.journey)]
              return (
                <button
                  key={i.id}
                  type="button"
                  onClick={() => onCardClick(i)}
                  className="block w-full rounded-lg border border-slate-200 bg-white p-2.5 text-left shadow-sm hover:border-brand-500"
                >
                  <div className="flex items-start gap-2">
                    <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${HEALTH_DOT[i.health] ?? 'bg-slate-400'}`} />
                    <span className="text-sm font-medium">{i.title}</span>
                  </div>
                  {i.statusNote && <p className="mt-1 pl-4 text-xs text-slate-600">{i.statusNote}</p>}
                  <div className="mt-1.5 flex flex-wrap gap-1.5 pl-4 text-[11px]">
                    <span className={`rounded-full px-2 py-0.5 ${jc.badge}`}>{i.journey}</span>
                    <span className="text-slate-500">
                      {i.pm} · {i.status}
                    </span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

function Delivered({ initiatives, year, onCardClick }) {
  const live = initiatives
    .filter((i) => i.status === 'Live')
    .sort((a, b) => initiativeEndMonth(b) - initiativeEndMonth(a))
  return (
    <section className="rounded-xl border border-slate-200 p-4 break-inside-avoid">
      <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-green-700">
        <Rocket size={13} /> Delivered in {year} <span className="font-normal text-slate-400">{live.length}</span>
      </h3>
      {live.length === 0 ? (
        <p className="text-sm text-slate-500">Nothing marked Live yet.</p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {live.map((i) => (
            <li key={i.id}>
              <button type="button" onClick={() => onCardClick(i)} className="flex w-full flex-wrap items-start gap-x-3 gap-y-1 py-2 text-left hover:text-brand-700">
                <span className="mt-0.5 w-14 shrink-0 text-xs font-medium text-slate-400">
                  Q{quarterOf(initiativeEndMonth(i)) + 1} · {MONTHS[initiativeEndMonth(i)]}
                </span>
                <span className="min-w-[10rem] flex-1">
                  <span className="block text-sm font-medium">{i.title}</span>
                  <span className="block text-xs text-slate-500">
                    {i.journey} · {i.pm}
                  </span>
                </span>
                {i.impact && <span className="ml-[4.25rem] shrink-0 rounded-full bg-green-50 sm:ml-0 px-2 py-0.5 text-xs font-medium text-green-700">{i.impact}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function ImpactRollup({ initiatives, groupBy, onCardClick }) {
  const group = TIMELINE_GROUPS[groupBy]
  const withImpact = initiatives.filter((i) => i.impact?.trim())
  const groups = [...new Set([...group.order, ...withImpact.map(group.key)])].filter((g) =>
    withImpact.some((i) => group.key(i) === g)
  )
  return (
    <section className="rounded-xl border border-slate-200 p-4 break-inside-avoid">
      <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
        <Target size={13} /> Expected impact by {group.label}
      </h3>
      {groups.length === 0 ? (
        <p className="text-sm text-slate-500">No target impact recorded.</p>
      ) : (
        <div className="space-y-3">
          {groups.map((g) => {
            const gc = COLOR_CLASSES[group.color(g)]
            return (
              <div key={g}>
                <div className="mb-1 flex items-center gap-1.5 text-sm font-semibold">
                  <span className={`h-2 w-2 rounded-full ${gc.solid}`} /> {g}
                </div>
                <ul className="space-y-1 pl-3.5">
                  {sortByPriority(withImpact.filter((i) => group.key(i) === g)).map((i) => (
                    <li key={i.id}>
                      <button type="button" onClick={() => onCardClick(i)} className="flex w-full flex-wrap items-baseline gap-x-2 text-left text-sm hover:text-brand-700">
                        <span className="w-full truncate sm:w-auto sm:min-w-0 sm:flex-1">{i.title}</span>
                        <span className="shrink-0 font-semibold tabular-nums text-slate-800 sm:ml-auto">{i.impact}</span>
                        <span className={`shrink-0 text-[11px] ${i.status === 'Live' ? 'text-green-700' : 'text-slate-400'}`}>{i.status}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}

function PresetMenu({ settings, canEdit, user, onApply }) {
  const [open, setOpen] = useState(false)
  const [presets, setPresets] = useState(null)
  const [error, setError] = useState('')
  const [name, setName] = useState('')
  const [copiedId, setCopiedId] = useState(null)
  const ref = useRef(null)

  useEffect(() => {
    function onClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  function load() {
    setError('')
    listPresets()
      .then(setPresets)
      .catch((err) => setError(err.message))
  }

  async function handleSave() {
    if (!name.trim()) return
    try {
      await savePreset(name.trim(), settingsToQuery({ ...settings, page: 'stakeholder' }), user)
      setName('')
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  async function copyPresetLink(id) {
    const url = `${window.location.origin}${window.location.pathname}?preset=${id}`
    try {
      await navigator.clipboard.writeText(url)
    } catch {
      window.prompt('Copy this link:', url)
    }
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => {
          if (!open) load()
          setOpen((o) => !o)
        }}
        className={toolButton}
      >
        <Bookmark size={15} /> Views
      </button>
      {open && (
        <div className="absolute left-0 z-40 mt-2 w-[min(20rem,calc(100vw-2rem))] rounded-xl border border-slate-200 bg-white p-2 text-sm text-slate-700 shadow-xl sm:left-auto sm:right-0">
          <p className="px-2 pb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Saved views</p>
          {!presets && !error && <p className="px-2 py-1.5 text-slate-400">Loading…</p>}
          {presets?.length === 0 && <p className="px-2 py-1.5 text-slate-400">No saved views yet.</p>}
          {presets?.map((p) => (
            <div key={p.id} className="flex items-center gap-1 rounded-lg px-2 py-1 hover:bg-slate-50">
              <button
                type="button"
                onClick={() => {
                  onApply(p.query)
                  setOpen(false)
                }}
                className="min-w-0 flex-1 truncate py-1 text-left font-medium"
              >
                {p.name}
              </button>
              <button type="button" onClick={() => copyPresetLink(p.id)} title="Copy short link" className="rounded p-1.5 text-slate-400 hover:text-slate-700">
                {copiedId === p.id ? <Check size={14} /> : <Link2 size={14} />}
              </button>
              {canEdit && (
                <button
                  type="button"
                  onClick={() => deletePreset(p.id).then(load).catch((err) => setError(err.message))}
                  title="Delete view"
                  className="rounded p-1.5 text-slate-400 hover:text-red-600"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}
          {error && (
            <p className="px-2 py-1.5 text-xs text-amber-700">
              {error}
              {/permission/i.test(error) && ' — publish the updated Firestore rules (firestore.rules).'}
            </p>
          )}
          {canEdit && (
            <div className="mt-2 border-t border-slate-100 px-2 pt-2">
              <p className="mb-1 text-xs text-slate-500">Save the current filters and layout as a view:</p>
              <div className="flex gap-1.5">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                  placeholder="e.g. Exec review"
                  className="min-w-0 flex-1 rounded-lg border border-slate-300 px-2 py-1.5 text-sm outline-none focus:border-brand-500"
                />
                <button type="button" onClick={handleSave} className="rounded-lg bg-brand-600 px-3 text-sm font-medium text-white">
                  Save
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
