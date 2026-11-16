import { HEALTH_DOT } from '../data/stakeholder'

export default function Legend() {
  return (
    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
      {Object.entries(HEALTH_DOT).map(([name, cls]) => (
        <span key={name} className="flex items-center gap-1.5">
          <span className={`h-2.5 w-2.5 rounded-full ${cls}`} />
          {name === 'Green' ? 'On track' : name === 'Yellow' ? 'At risk' : 'Off track'}
        </span>
      ))}
      <span className="flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rotate-45 bg-slate-800" /> Milestone
      </span>
    </div>
  )
}
