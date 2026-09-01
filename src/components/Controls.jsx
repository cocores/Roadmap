import { LayoutGrid, Rows3, Search } from 'lucide-react'
import { CORE_VALUES, JOURNEYS, PMS, TIME_VIEWS } from '../data/constants'
import MultiSelect from './MultiSelect'

export default function Controls({
  view,
  onViewChange,
  pmFilter,
  onPmFilterChange,
  journeyFilter,
  onJourneyFilterChange,
  coreValueFilter,
  onCoreValueFilterChange,
  search,
  onSearchChange,
  groupByJourney,
  onToggleGroup,
  visibleCount,
  totalCount,
}) {
  const singlePm = pmFilter.length === 1 ? pmFilter[0] : null

  return (
    <div className="mx-auto max-w-[1600px] px-6 pt-5">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex rounded-full border border-slate-700 bg-slate-800/60 p-1 light:border-slate-300 light:bg-white">
          {Object.keys(TIME_VIEWS).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => onViewChange(key)}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                view === key
                  ? 'bg-brand-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-100 light:text-slate-500 light:hover:text-slate-800'
              }`}
            >
              {TIME_VIEWS[key].label}
            </button>
          ))}
        </div>

        <MultiSelect label="PM" options={PMS} selected={pmFilter} onChange={onPmFilterChange} />
        <MultiSelect
          label="Journey"
          options={JOURNEYS}
          selected={journeyFilter}
          onChange={onJourneyFilterChange}
        />
        <MultiSelect
          label="Core Value"
          options={CORE_VALUES}
          selected={coreValueFilter}
          onChange={onCoreValueFilterChange}
        />

        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by title or tag..."
            className="w-full rounded-full border border-slate-700 bg-slate-800/60 py-2 pl-9 pr-3 text-sm text-slate-200 placeholder:text-slate-500 outline-none focus:border-brand-500 light:border-slate-300 light:bg-white light:text-slate-800"
          />
        </div>

        <button
          type="button"
          onClick={onToggleGroup}
          className="flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm text-slate-300 hover:border-slate-600 hover:text-slate-100 light:border-slate-300 light:bg-white light:text-slate-600 light:hover:border-slate-400 light:hover:text-slate-800"
        >
          {groupByJourney ? <Rows3 size={15} /> : <LayoutGrid size={15} />}
          {groupByJourney ? 'Grouped by Journey' : 'Flat Kanban'}
        </button>
      </div>

      <p className="mt-3 text-xs text-slate-500 light:text-slate-500">
        Showing <span className="font-semibold text-slate-300 light:text-slate-700">{visibleCount}</span> of{' '}
        {totalCount} initiatives
        {singlePm ? (
          <>
            {' '}
            for <span className="font-semibold text-slate-300 light:text-slate-700">{singlePm}</span>
          </>
        ) : pmFilter.length > 1 ? (
          <> for {pmFilter.length} selected PMs</>
        ) : null}
        {journeyFilter.length > 0 && <> in {journeyFilter.length} selected journey{journeyFilter.length > 1 ? 's' : ''}</>}
        {coreValueFilter.length > 0 && (
          <> tagged with {coreValueFilter.length} selected core value{coreValueFilter.length > 1 ? 's' : ''}</>
        )}
        {search && <> matching “{search}”</>}
      </p>
    </div>
  )
}
