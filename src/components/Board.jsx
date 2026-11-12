import { EyeOff, Inbox } from 'lucide-react'
import { Fragment } from 'react'
import { COLOR_CLASSES, JOURNEYS, TIME_VIEWS, avatarViewUrl, bucketForMonth, journeyColor } from '../data/constants'
import DropZone from './DropZone'
import InitiativeCard from './InitiativeCard'

export default function Board({
  initiatives,
  view,
  groupByJourney,
  journeyFilter = [],
  onHideJourney,
  onCardClick,
  onMove,
  avatarPaths,
}) {
  const buckets = TIME_VIEWS[view].buckets
  // With a Journey filter active, only those journeys get a row; otherwise all.
  const visibleJourneys = journeyFilter.length
    ? JOURNEYS.filter((j) => journeyFilter.includes(j.name))
    : JOURNEYS

  function handleDragStart(e, id) {
    e.dataTransfer.setData('text/initiative-id', id)
    e.dataTransfer.effectAllowed = 'move'
  }

  if (groupByJourney) {
    return (
      <div className="overflow-x-auto pb-4">
        <div
          className="grid min-w-max gap-3"
          style={{ gridTemplateColumns: `160px repeat(${buckets.length}, minmax(220px, 1fr))` }}
        >
          <div />
          {buckets.map((bucket) => (
            <div
              key={bucket}
              className="rounded-lg bg-slate-800/60 px-3 py-2 text-center text-xs font-semibold uppercase tracking-wide text-slate-300 light:bg-slate-200/70 light:text-slate-600"
            >
              {bucket}
            </div>
          ))}

          {visibleJourneys.map((journey) => {
            const jc = COLOR_CLASSES[journeyColor(journey.name)]
            return (
              <Fragment key={journey.name}>
                <div
                  className="group sticky left-0 flex items-center rounded-lg border border-slate-800 bg-slate-900/60 px-2.5 py-2 text-xs font-semibold light:border-slate-200 light:bg-slate-50"
                >
                  <span className={`mr-1.5 h-2 w-2 shrink-0 rounded-full ${jc.solid}`} />
                  <span className="flex-1 text-slate-200 light:text-slate-700">{journey.name}</span>
                  {onHideJourney && visibleJourneys.length > 1 && (
                    <button
                      type="button"
                      onClick={() => onHideJourney(journey.name)}
                      title={`Hide ${journey.name}`}
                      aria-label={`Hide ${journey.name}`}
                      className="ml-1 rounded p-1 text-slate-500 opacity-0 transition hover:bg-slate-800 hover:text-slate-200 focus:opacity-100 group-hover:opacity-100 light:hover:bg-slate-200 light:hover:text-slate-700"
                    >
                      <EyeOff size={13} />
                    </button>
                  )}
                </div>
                {buckets.map((bucket) => {
                  const cards = initiatives.filter(
                    (i) => i.journey === journey.name && bucketForMonth(i.startMonth, view) === bucket
                  )
                  return (
                    <DropZone
                      key={`${journey.name}-${bucket}`}
                      onDrop={(id) => onMove(id, bucket, journey.name)}
                      className="min-h-[92px] space-y-2 rounded-lg border border-dashed border-slate-800/80 p-2 light:border-slate-200"
                    >
                      {cards.map((card) => (
                        <InitiativeCard
                          key={card.id}
                          initiative={card}
                          onClick={onCardClick}
                          onDragStart={handleDragStart}
                          showJourney={false}
                          pmAvatarUrl={avatarViewUrl(avatarPaths[card.pm])}
                        />
                      ))}
                    </DropZone>
                  )
                })}
              </Fragment>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto pb-4">
      <div
        className="grid min-w-max gap-4"
        style={{ gridTemplateColumns: `repeat(${buckets.length}, minmax(260px, 1fr))` }}
      >
        {buckets.map((bucket) => {
          const cards = initiatives.filter((i) => bucketForMonth(i.startMonth, view) === bucket)
          return (
            <div key={bucket} className="flex flex-col">
              <div className="mb-3 flex items-center justify-between rounded-lg bg-slate-800/60 px-3 py-2 light:bg-slate-200/70">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-300 light:text-slate-600">
                  {bucket}
                </span>
                <span className="rounded-full bg-slate-700/80 px-1.5 py-0.5 text-[10px] font-semibold text-slate-300 light:bg-slate-300 light:text-slate-600">
                  {cards.length}
                </span>
              </div>
              <DropZone
                onDrop={(id) => onMove(id, bucket)}
                className="flex min-h-[300px] flex-1 flex-col gap-2.5 rounded-xl border border-dashed border-slate-800/80 p-2.5 light:border-slate-200"
              >
                {cards.length === 0 && (
                  <div className="flex flex-1 flex-col items-center justify-center gap-1.5 py-10 text-slate-600 light:text-slate-400">
                    <Inbox size={20} />
                    <span className="text-xs">No initiatives</span>
                  </div>
                )}
                {cards.map((card) => (
                  <InitiativeCard
                    key={card.id}
                    initiative={card}
                    onClick={onCardClick}
                    onDragStart={handleDragStart}
                    pmAvatarUrl={avatarViewUrl(avatarPaths[card.pm])}
                  />
                ))}
              </DropZone>
            </div>
          )
        })}
      </div>
    </div>
  )
}
