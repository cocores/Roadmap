import { toPng } from 'html-to-image'
import { AlertTriangle, Check, Download, FileText, Link2, Maximize2, Minimize2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import {
  COLOR_CLASSES,
  JOURNEYS,
  MONTHS,
  STATUSES,
  initiativeEndMonth,
  initiativeYear,
  journeyColor,
  sortByPriority,
} from '../data/constants'
import { shareUrl } from '../lib/urlState'

const HEALTH_BAR = {
  Green: 'bg-green-500',
  Yellow: 'bg-yellow-400',
  Red: 'bg-red-500',
}
const HEALTH_DOT = { Green: 'bg-green-500', Yellow: 'bg-yellow-400', Red: 'bg-red-500' }

const toolButton =
  'flex items-center gap-1.5 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-600 hover:border-slate-400 hover:text-slate-900'

function quarterOf(month) {
  return Math.floor(month / 3)
}

export default function StakeholderView({
  initiatives,
  initiativesAllYears,
  year,
  layout,
  onLayoutChange,
  settings,
  onCardClick,
}) {
  const exportRef = useRef(null)
  const [copied, setCopied] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    const onChange = () => setFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

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

  function toggleFullscreen() {
    if (document.fullscreenElement) document.exitFullscreen()
    else exportRef.current?.requestFullscreen?.()
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
                onClick={() => onLayoutChange(key)}
                className={`rounded-full px-3 py-1.5 text-sm font-medium ${
                  layout === key ? 'bg-brand-600 text-white shadow' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="ml-auto flex flex-wrap gap-2">
            <button type="button" onClick={copyLink} className={toolButton}>
              {copied ? <Check size={15} /> : <Link2 size={15} />}
              {copied ? 'Link copied' : 'Copy link'}
            </button>
            <button type="button" onClick={toggleFullscreen} className={toolButton}>
              {fullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
              Present
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
          className="space-y-5 overflow-auto rounded-2xl border border-slate-200 bg-white p-4 text-slate-900 shadow-sm sm:p-6 print:border-0 print:p-0 print:shadow-none"
        >
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 className="text-xl font-semibold tracking-tight">
                Product Roadmap {layout === 'timeline' ? year : ''}
              </h2>
              <p className="text-sm text-slate-500">
                {layout === 'timeline' ? 'Timeline by customer journey' : 'What we are doing now, next, and later'} · as of{' '}
                {new Date().toLocaleDateString(undefined, { dateStyle: 'medium' })}
              </p>
            </div>
            <Legend />
          </div>

          <Summary initiatives={layout === 'timeline' ? initiatives : initiativesAllYears} />

          {layout === 'timeline' ? (
            <Timeline initiatives={initiatives} year={year} onCardClick={onCardClick} />
          ) : (
            <NowNextLater initiatives={initiativesAllYears} onCardClick={onCardClick} />
          )}
        </div>
      </div>
    </div>
  )
}

function Legend() {
  return (
    <div className="flex items-center gap-3 text-xs text-slate-500">
      {Object.entries(HEALTH_DOT).map(([name, cls]) => (
        <span key={name} className="flex items-center gap-1.5">
          <span className={`h-2.5 w-2.5 rounded-full ${cls}`} />
          {name === 'Green' ? 'On track' : name === 'Yellow' ? 'At risk' : 'Off track'}
        </span>
      ))}
    </div>
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
    <div className="grid gap-4 lg:grid-cols-[1fr_minmax(280px,380px)]">
      <div className="flex flex-wrap gap-2">
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
          <ul className="max-h-36 space-y-1 overflow-y-auto text-sm">
            {atRisk.map((i) => (
              <li key={i.id} className="flex items-center gap-2">
                <span className={`h-2 w-2 shrink-0 rounded-full ${HEALTH_DOT[i.health]}`} />
                <span className="truncate">{i.title}</span>
                <span className="ml-auto shrink-0 text-xs text-slate-500">{i.pm}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

function Timeline({ initiatives, year, onCardClick }) {
  const now = new Date()
  const showToday = now.getFullYear() === year
  // Position of "today" as a fraction of the year, for the vertical marker.
  const todayPct = ((now.getMonth() + (now.getDate() - 1) / 31) / 12) * 100
  const journeys = JOURNEYS.filter((j) => initiatives.some((i) => i.journey === j.name))

  if (initiatives.length === 0) {
    return <p className="py-10 text-center text-sm text-slate-500">No initiatives match these filters in {year}.</p>
  }

  return (
    <div className="min-w-[760px]">
      <div className="grid grid-cols-[180px_1fr] border-b border-slate-200 pb-1 text-xs font-semibold text-slate-500">
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

      {journeys.map((journey) => {
        const jc = COLOR_CLASSES[journeyColor(journey.name)]
        const rows = sortByPriority(initiatives.filter((i) => i.journey === journey.name)).sort(
          (a, b) => a.startMonth - b.startMonth
        )
        return (
          <div key={journey.name} className="grid grid-cols-[180px_1fr] border-b border-slate-100 py-2 break-inside-avoid">
            <div className="flex items-start gap-2 pr-3 pt-1 text-sm font-semibold">
              <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${jc.solid}`} />
              {journey.name}
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
                return (
                  <button
                    key={i.id}
                    type="button"
                    onClick={() => onCardClick(i)}
                    title={`${i.title} — ${i.pm} · ${MONTHS[i.startMonth]}–${MONTHS[end]} · ${i.status}`}
                    className="relative block h-8 text-left"
                    style={{ marginLeft: `${left}%`, width: `${width}%` }}
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
                      <span className="ml-auto hidden shrink-0 opacity-80 sm:inline">{i.pm}</span>
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}
      {showToday && (
        <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
          <span className="inline-block h-3 w-px bg-red-400" /> Today
        </p>
      )}
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
                  <div className="mt-1.5 flex flex-wrap gap-1.5 pl-4 text-[11px]">
                    <span className={`rounded-full px-2 py-0.5 ${jc.badge}`}>{i.journey}</span>
                    <span className="text-slate-500">{i.pm} · {i.status}</span>
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
