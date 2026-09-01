import { BookOpen, Link2, Target } from 'lucide-react'
import { COLOR_CLASSES, coreValueColor, journeyColor, pmColor, statusColor } from '../data/constants'

const HEALTH_BORDER = {
  Green: 'border-l-green-500',
  Yellow: 'border-l-yellow-500',
  Red: 'border-l-red-500',
}

export default function InitiativeCard({ initiative, onClick, onDragStart, showJourney = true }) {
  const pmC = COLOR_CLASSES[pmColor(initiative.pm)]
  const journeyC = COLOR_CLASSES[journeyColor(initiative.journey)]
  const statusC = COLOR_CLASSES[statusColor(initiative.status)]
  const coreValueC = initiative.coreValue ? COLOR_CLASSES[coreValueColor(initiative.coreValue)] : null
  const healthBorder = HEALTH_BORDER[initiative.health] ?? 'border-l-slate-700 light:border-l-slate-300'
  const hasLinks = initiative.trackerLink || initiative.confluenceLink

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, initiative.id)}
      onClick={() => onClick(initiative)}
      title={initiative.health ? `Health: ${initiative.health}` : undefined}
      className={`group cursor-grab rounded-2xl border border-l-4 border-slate-800 bg-slate-900/70 p-3.5 shadow-sm transition hover:-translate-y-0.5 hover:border-brand-500/50 hover:shadow-lg hover:shadow-brand-600/10 active:cursor-grabbing light:border-slate-200 light:bg-white light:hover:border-brand-500/60 ${healthBorder}`}
    >
      <div className="flex items-start justify-between gap-2">
        <h4 className="text-sm font-semibold leading-snug text-slate-100 light:text-slate-900">
          {initiative.title}
        </h4>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${statusC.badge}`}
        >
          {initiative.status}
        </span>
      </div>

      <p className="mt-1.5 line-clamp-2 text-xs text-slate-400 light:text-slate-500">
        {initiative.description}
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <span
          className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${pmC.badge}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${pmC.solid}`} />
          {initiative.pm}
        </span>
        {showJourney && (
          <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${journeyC.badge}`}>
            {initiative.journey}
          </span>
        )}
        {coreValueC && (
          <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${coreValueC.badge}`}>
            {initiative.coreValue}
          </span>
        )}
      </div>

      <div className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-400 light:text-slate-500">
        <Target size={12} className="text-slate-500" />
        {initiative.impact}
      </div>

      <div className="mt-2.5">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800 light:bg-slate-200">
          <div
            className={`h-full rounded-full ${statusC.solid} transition-all`}
            style={{ width: `${initiative.progress}%` }}
          />
        </div>
        <div className="mt-1 text-right text-[10px] text-slate-500">{initiative.progress}%</div>
      </div>

      {hasLinks && (
        <div className="mt-2.5 flex flex-wrap items-center gap-3 border-t border-slate-800 pt-2.5 light:border-slate-200">
          {initiative.trackerLink && (
            <a
              href={initiative.trackerLink}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1 text-[11px] font-medium text-slate-400 hover:text-brand-400 light:text-slate-500 light:hover:text-brand-700"
            >
              <Link2 size={12} />
              Ticket
            </a>
          )}
          {initiative.confluenceLink && (
            <a
              href={initiative.confluenceLink}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1 text-[11px] font-medium text-slate-400 hover:text-brand-400 light:text-slate-500 light:hover:text-brand-700"
            >
              <BookOpen size={12} />
              Docs
            </a>
          )}
        </div>
      )}
    </div>
  )
}
