import { AlertTriangle, CheckCircle2, CircleAlert, Diamond, Lock, OctagonAlert, Rocket, Target } from 'lucide-react'
import {
  COLOR_CLASSES,
  JOURNEYS,
  MONTHS,
  PMS,
  STATUSES,
  initiativeEndMonth,
  journeyColor,
  sortByPriority,
  statusColor,
} from '../data/constants'
import { HEALTH_DOT } from '../data/stakeholder'
import SlideShow from './SlideShow'

// Health is a status, so it always ships with an icon + word, never color alone.
const HEALTH_META = {
  Green: { label: 'On track', icon: CheckCircle2, text: 'text-green-700', bg: 'bg-green-50', ring: 'ring-green-200' },
  Yellow: { label: 'At risk', icon: CircleAlert, text: 'text-yellow-800', bg: 'bg-yellow-50', ring: 'ring-yellow-200' },
  Red: { label: 'Off track', icon: OctagonAlert, text: 'text-red-700', bg: 'bg-red-50', ring: 'ring-red-200' },
}

function pct(n, total) {
  return total ? Math.round((n / total) * 100) : 0
}

function formatDate(iso) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function Kpi({ value, label, sub, tone = 'text-slate-900' }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
      <div className={`text-4xl font-semibold tabular-nums tracking-tight sm:text-5xl ${tone}`}>{value}</div>
      <div className="mt-1 text-sm font-medium text-slate-700">{label}</div>
      {sub && <div className="mt-0.5 text-xs text-slate-500">{sub}</div>}
    </div>
  )
}

function HealthChip({ health }) {
  const meta = HEALTH_META[health]
  if (!meta) return null
  const Icon = meta.icon
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${meta.bg} ${meta.text} ${meta.ring}`}>
      <Icon size={12} /> {meta.label}
    </span>
  )
}

// One stacked bar: segments separated by a 2px surface gap, each labeled
// below with name + count (identity never relies on color alone).
function StackedBar({ segments, total }) {
  const shown = segments.filter((s) => s.value > 0)
  return (
    <div>
      <div className="flex h-6 w-full gap-[2px] overflow-hidden rounded">
        {shown.map((s) => (
          <div
            key={s.label}
            title={`${s.label}: ${s.value} (${pct(s.value, total)}%)`}
            className={`h-full ${s.color}`}
            style={{ width: `${(s.value / total) * 100}%` }}
          />
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm">
        {segments.map((s) => (
          <span key={s.label} className="flex items-center gap-1.5 text-slate-700">
            <span className={`h-2.5 w-2.5 rounded-sm ${s.color}`} />
            {s.label}
            <span className="font-semibold tabular-nums text-slate-900">{s.value}</span>
            <span className="text-slate-400">{pct(s.value, total)}%</span>
          </span>
        ))}
      </div>
    </div>
  )
}

// Single-series horizontal bars (one hue, no legend; the title names it).
function BarList({ title, rows, max }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
      <h3 className="mb-3 text-sm font-semibold text-slate-700">{title}</h3>
      <div className="space-y-2.5">
        {rows.map((r) => (
          <div key={r.label} className="grid grid-cols-[minmax(0,8rem)_1fr_auto] items-center gap-3 text-sm" title={`${r.label}: ${r.value}`}>
            <span className="flex min-w-0 items-center gap-1.5 text-slate-700">
              {r.dot && <span className={`h-2 w-2 shrink-0 rounded-full ${r.dot}`} />}
              <span className="truncate">{r.label}</span>
            </span>
            <span className="h-3.5 rounded-r bg-slate-100">
              <span className="block h-full rounded-r bg-brand-600" style={{ width: `${max ? (r.value / max) * 100 : 0}%`, minWidth: r.value ? 4 : 0 }} />
            </span>
            <span className="w-6 text-right font-semibold tabular-nums text-slate-900">{r.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function TitleSlide({ year, summary, initiatives }) {
  const total = initiatives.length
  const onTrack = initiatives.filter((i) => i.health === 'Green').length
  const live = initiatives.filter((i) => i.status === 'Live').length
  const attention = initiatives.filter((i) => i.health === 'Red' || i.health === 'Yellow').length
  const avgProgress = total ? Math.round(initiatives.reduce((n, i) => n + (i.progress ?? 0), 0) / total) : 0
  return (
    <div className="space-y-6">
      <p className="text-base text-slate-500">
        As of {new Date().toLocaleDateString(undefined, { dateStyle: 'long' })}
      </p>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Kpi value={total} label="Initiatives" sub={`planned for ${year}`} />
        <Kpi value={`${pct(onTrack, total)}%`} label="On track" sub={`${onTrack} of ${total}`} tone="text-green-700" />
        <Kpi value={attention} label="Need attention" sub="at risk or off track" tone={attention ? 'text-red-600' : 'text-slate-900'} />
        <Kpi value={live} label="Delivered" sub="marked Live" />
        <Kpi value={`${avgProgress}%`} label="Avg. progress" sub="across all initiatives" />
      </div>
      <TopPriorities initiatives={initiatives} />
      {summary?.text ? (
        <div className="rounded-2xl border border-brand-200 bg-brand-50/60 p-5 sm:p-6">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-brand-800">Executive summary</h3>
          <p className="whitespace-pre-line text-lg leading-relaxed text-slate-800 sm:text-xl">{summary.text}</p>
        </div>
      ) : (
        <p className="text-sm text-slate-400">Tip: add an executive summary on the Stakeholder page to show it here.</p>
      )}
    </div>
  )
}

// The highest-ranked initiative starting in each quarter.
function TopPriorities({ initiatives }) {
  const tops = [0, 1, 2, 3].map((q) => ({
    q,
    item: sortByPriority(initiatives.filter((i) => Math.floor(i.startMonth / 3) === q))[0],
  }))
  if (!tops.some((t) => t.item)) return null
  return (
    <div>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Top priority each quarter</h3>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {tops.map(({ q, item }) => (
          <div key={q} className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4">
            <span className="rounded-lg bg-slate-900 px-2 py-1 text-sm font-semibold text-white">Q{q + 1}</span>
            {item ? (
              <div className="min-w-0">
                <div className="font-semibold leading-snug">{item.title}</div>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  {item.journey} · {item.pm}
                  <HealthChip health={item.health} />
                </div>
              </div>
            ) : (
              <span className="text-sm text-slate-400">Nothing planned</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function HealthSlide({ initiatives }) {
  const total = initiatives.length || 1
  const count = (pred) => initiatives.filter(pred).length
  const onTrack = count((i) => i.health === 'Green')
  const progressByStatus = STATUSES.map((s) => {
    const items = initiatives.filter((i) => i.status === s.name)
    return { ...s, items, avg: items.length ? Math.round(items.reduce((n, i) => n + (i.progress ?? 0), 0) / items.length) : 0 }
  })
  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex items-baseline gap-3">
          <span className="text-6xl font-semibold tabular-nums tracking-tight text-green-700">{pct(onTrack, total)}%</span>
          <span className="text-slate-600">of initiatives are on track</span>
        </div>
        <h3 className="mb-3 mt-6 text-sm font-semibold text-slate-700">Health</h3>
        <StackedBar
          total={total}
          segments={[
            { label: 'On track', value: onTrack, color: HEALTH_DOT.Green },
            { label: 'At risk', value: count((i) => i.health === 'Yellow'), color: HEALTH_DOT.Yellow },
            { label: 'Off track', value: count((i) => i.health === 'Red'), color: HEALTH_DOT.Red },
          ]}
        />
        <h3 className="mb-3 mt-7 text-sm font-semibold text-slate-700">Status</h3>
        <StackedBar
          total={total}
          segments={STATUSES.map((s) => ({
            label: s.name,
            value: count((i) => i.status === s.name),
            color: COLOR_CLASSES[statusColor(s.name)].solid,
          }))}
        />
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <h3 className="mb-4 text-sm font-semibold text-slate-700">Average progress by status</h3>
        <div className="space-y-4">
          {progressByStatus.map((s) => (
            <div key={s.name} title={`${s.name}: ${s.avg}% average across ${s.items.length}`}>
              <div className="mb-1.5 flex items-baseline justify-between text-sm">
                <span className="text-slate-700">
                  {s.name} <span className="text-slate-400">· {s.items.length}</span>
                </span>
                <span className="font-semibold tabular-nums text-slate-900">{s.avg}%</span>
              </div>
              <div className="h-3 rounded-r bg-slate-100">
                <div className="h-full rounded-r bg-brand-600" style={{ width: `${s.avg}%`, minWidth: s.avg ? 4 : 0 }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function InvestmentSlide({ initiatives }) {
  const byJourney = JOURNEYS.map((j) => ({
    label: j.name,
    value: initiatives.filter((i) => i.journey === j.name).length,
    dot: COLOR_CLASSES[journeyColor(j.name)].solid,
  })).sort((a, b) => b.value - a.value)
  const byPm = PMS.map((p) => ({ label: p.name, value: initiatives.filter((i) => i.pm === p.name).length })).sort(
    (a, b) => b.value - a.value
  )
  const max = Math.max(1, ...byJourney.map((r) => r.value), ...byPm.map((r) => r.value))
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <BarList title="Initiatives by customer journey" rows={byJourney} max={max} />
      <BarList title="Initiatives by PM" rows={byPm} max={max} />
    </div>
  )
}

function QuarterSlide({ initiatives }) {
  const quarters = [0, 1, 2, 3].map((q) => {
    const items = sortByPriority(initiatives.filter((i) => Math.floor(i.startMonth / 3) === q))
    return { q, items }
  })
  const now = new Date()
  const currentQ = Math.floor(now.getMonth() / 3)
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {quarters.map(({ q, items }) => {
        const counts = { Green: 0, Yellow: 0, Red: 0 }
        for (const i of items) if (counts[i.health] != null) counts[i.health]++
        return (
          <div key={q} className={`rounded-2xl border bg-white p-4 ${q === currentQ ? 'border-brand-500 ring-2 ring-brand-500/20' : 'border-slate-200'}`}>
            <div className="flex items-baseline justify-between">
              <h3 className="text-2xl font-semibold">Q{q + 1}</h3>
              <span className="text-xs text-slate-500">
                {MONTHS[q * 3]}–{MONTHS[q * 3 + 2]}
                {q === currentQ && ' · now'}
              </span>
            </div>
            <div className="mt-1 text-sm text-slate-600">
              <span className="font-semibold tabular-nums text-slate-900">{items.length}</span> starting
            </div>
            {items.length > 0 && (
              <div className="mt-2 flex h-2 gap-[2px] overflow-hidden rounded" title={`On track ${counts.Green} · At risk ${counts.Yellow} · Off track ${counts.Red}`}>
                {['Green', 'Yellow', 'Red'].map((h) =>
                  counts[h] ? <div key={h} className={HEALTH_DOT[h]} style={{ width: `${(counts[h] / items.length) * 100}%` }} /> : null
                )}
              </div>
            )}
            <ol className="mt-3 space-y-2">
              {items.slice(0, 5).map((i) => (
                <li key={i.id} className="flex items-start gap-2 text-sm">
                  <span className="mt-0.5 flex h-5 min-w-5 items-center justify-center rounded bg-slate-100 px-1 text-[11px] font-bold tabular-nums text-slate-600">
                    {i.priority ?? '–'}
                  </span>
                  <span className="min-w-0">
                    <span className="block font-medium leading-snug">{i.title}</span>
                    <span className="flex items-center gap-1.5 text-xs text-slate-500">
                      <span className={`h-1.5 w-1.5 rounded-full ${HEALTH_DOT[i.health] ?? 'bg-slate-400'}`} />
                      {i.journey} · {i.pm}
                    </span>
                  </span>
                </li>
              ))}
              {items.length > 5 && <li className="text-xs text-slate-500">+{items.length - 5} more</li>}
              {items.length === 0 && <li className="text-sm text-slate-400">Nothing starts this quarter</li>}
            </ol>
          </div>
        )
      })}
    </div>
  )
}

function AttentionSlide({ initiatives, byId }) {
  const items = sortByPriority(initiatives.filter((i) => i.health === 'Red' || i.health === 'Yellow')).sort(
    (a, b) => (a.health === 'Red' ? 0 : 1) - (b.health === 'Red' ? 0 : 1)
  )
  if (items.length === 0) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-green-200 bg-green-50 p-6 text-lg text-green-800">
        <CheckCircle2 /> Everything is on track.
      </div>
    )
  }
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {items.map((i) => {
        const blockers = (i.blockedBy ?? []).map((id) => byId[id]).filter(Boolean)
        return (
          <div key={i.id} className={`rounded-2xl border-l-4 bg-white p-4 shadow-sm ring-1 ring-slate-200 ${i.health === 'Red' ? 'border-l-red-500' : 'border-l-yellow-400'}`}>
            <div className="flex flex-wrap items-center gap-2">
              <HealthChip health={i.health} />
              <span className="text-xs text-slate-500">
                {i.status} · {i.pm} · {i.journey}
              </span>
            </div>
            <h3 className="mt-2 text-lg font-semibold leading-snug">{i.title}</h3>
            <p className={`mt-1.5 text-sm ${i.statusNote ? 'text-slate-700' : 'italic text-slate-400'}`}>
              {i.statusNote || 'No update recorded yet.'}
            </p>
            {blockers.length > 0 && (
              <p className="mt-2 flex items-start gap-1.5 text-xs text-red-700">
                <Lock size={12} className="mt-0.5 shrink-0" /> Blocked by {blockers.map((b) => b.title).join(', ')}
              </p>
            )}
            <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
              <div className="h-2 flex-1 rounded-r bg-slate-100">
                <div className="h-full rounded-r bg-slate-500" style={{ width: `${i.progress ?? 0}%` }} />
              </div>
              <span className="tabular-nums">{i.progress ?? 0}%</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function DeliveredSlide({ initiatives, year }) {
  const live = initiatives.filter((i) => i.status === 'Live').sort((a, b) => initiativeEndMonth(b) - initiativeEndMonth(a))
  if (live.length === 0) return <p className="text-lg text-slate-500">Nothing marked Live in {year} yet.</p>
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {live.map((i) => (
        <div key={i.id} className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-2 text-xs font-medium text-green-700">
            <Rocket size={14} /> Live · delivered {MONTHS[initiativeEndMonth(i)]} {year}
          </div>
          <h3 className="mt-2 text-lg font-semibold leading-snug">{i.title}</h3>
          <p className="mt-0.5 text-sm text-slate-500">
            {i.journey} · {i.pm}
          </p>
          {i.impact && (
            <div className="mt-4 border-t border-slate-100 pt-3">
              <div className="text-xs uppercase tracking-wide text-slate-400">Target impact</div>
              <div className="text-2xl font-semibold tabular-nums text-slate-900">{i.impact}</div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function ImpactSlide({ initiatives }) {
  const groups = JOURNEYS.map((j) => ({
    journey: j.name,
    items: sortByPriority(initiatives.filter((i) => i.journey === j.name && i.impact?.trim())),
  })).filter((g) => g.items.length)
  if (groups.length === 0) return <p className="text-lg text-slate-500">No target impact recorded.</p>
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {groups.map((g) => (
        <div key={g.journey} className="rounded-2xl border border-slate-200 bg-white p-4">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
            <span className={`h-2.5 w-2.5 rounded-full ${COLOR_CLASSES[journeyColor(g.journey)].solid}`} /> {g.journey}
          </h3>
          <div className="space-y-3">
            {g.items.map((i) => (
              <div key={i.id}>
                <div className="text-xl font-semibold tabular-nums leading-tight text-slate-900">{i.impact}</div>
                <div className="text-xs text-slate-500">
                  {i.title} · <span className={i.status === 'Live' ? 'text-green-700' : ''}>{i.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function MilestonesSlide({ initiatives, year }) {
  const today = new Date().toISOString().slice(0, 10)
  const all = initiatives
    .flatMap((i) => (i.milestones ?? []).map((m) => ({ ...m, initiative: i })))
    .filter((m) => m.date?.startsWith(String(year)))
    .sort((a, b) => a.date.localeCompare(b.date))
  const upcoming = all.filter((m) => m.date >= today)
  const list = (upcoming.length ? upcoming : all).slice(0, 10)
  if (list.length === 0) return <p className="text-lg text-slate-500">No milestones set for {year}. Add them in each initiative’s editor.</p>
  return (
    <div>
      {!upcoming.length && <p className="mb-3 text-sm text-slate-500">No upcoming milestones — showing this year’s.</p>}
      <ol className="relative space-y-3 border-l-2 border-slate-200 pl-6">
        {list.map((m) => (
          <li key={`${m.initiative.id}-${m.name}-${m.date}`} className="relative">
            <span className="absolute -left-[31px] top-2 h-3 w-3 rotate-45 border-2 border-white bg-slate-800" />
            <div className="flex flex-wrap items-baseline gap-x-3">
              <span className="w-16 shrink-0 text-sm font-semibold tabular-nums text-slate-900">{formatDate(m.date)}</span>
              <span className="text-base font-medium">{m.name}</span>
              <span className="text-sm text-slate-500">
                {m.initiative.title} · {m.initiative.pm}
              </span>
              <HealthChip health={m.initiative.health} />
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}

export default function StakeholderSlides({ initiatives, byId, year, summary, timeline, nowNextLater, onClose }) {
  const hasMilestones = initiatives.some((i) => (i.milestones ?? []).length)
  const slides = [
    { title: `Product Roadmap ${year}`, intro: true, body: <TitleSlide year={year} summary={summary} initiatives={initiatives} /> },
    { title: 'Portfolio health', icon: Target, body: <HealthSlide initiatives={initiatives} /> },
    { title: 'Where we’re investing', body: <InvestmentSlide initiatives={initiatives} /> },
    { title: 'Quarter by quarter', body: <QuarterSlide initiatives={initiatives} /> },
    { title: 'Timeline', legend: true, body: timeline },
    { title: 'Needs attention', icon: AlertTriangle, body: <AttentionSlide initiatives={initiatives} byId={byId} /> },
    ...(hasMilestones ? [{ title: 'Upcoming milestones', icon: Diamond, body: <MilestonesSlide initiatives={initiatives} year={year} /> }] : []),
    { title: 'Now / Next / Later', body: nowNextLater },
    { title: `Delivered in ${year}`, icon: Rocket, body: <DeliveredSlide initiatives={initiatives} year={year} /> },
    { title: 'Expected impact', body: <ImpactSlide initiatives={initiatives} /> },
  ]
  return <SlideShow slides={slides} year={year} onClose={onClose} />
}
