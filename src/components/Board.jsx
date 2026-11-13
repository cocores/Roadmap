import { EyeOff, Inbox } from 'lucide-react'
import { Fragment } from 'react'
import { COLOR_CLASSES, JOURNEYS, TIME_VIEWS, bucketForMonth, journeyColor } from '../data/constants'
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
      <>
        {/* Phones: one stacked section per journey, cards listed under their time bucket. */}
        <div className="space-y-5 md:hidden">
          {visibleJourneys.map((journey) => {
            const jc = COLOR_CLASSES[journeyColor(journey.name)]
            const journeyCards = initiatives.filter((i) => i.journey === journey.name)
            return (
              <section key={journey.name}>
                <div className="mb-2 flex items-center gap-2">
                  <span className={`h-2 w-2 shrink-0 rounded-full ${jc.solid}`} />
                  <h3 className="flex-1 text-sm font-semibold text-slate-200 light:text-slate-700">
                    {journey.name}
                    <span className="ml-1.5 text-xs font-normal text-slate-500">{journeyCards.length}</span>
                  </h3>
                  {onHideJourney && visibleJourneys.length > 1 && (
                    <button
                      type="button"
                      onClick={() => onHideJourney(journey.name)}
                      aria-label={`Hide ${journey.name}`}
                      className="rounded-full p-2 text-slate-500 hover:bg-slate-800 hover:text-slate-200 light:hover:bg-slate-200 light:hover:text-slate-700"
                    >
                      <EyeOff size={15} />
                    </button>
                  )}
                </div>
                {journeyCards.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-slate-800/80 px-3 py-3 text-xs text-slate-500 light:border-slate-200">
                    No initiatives
                  </p>
                ) : (
                  <div className="space-y-3">
                    {buckets.map((bucket) => {
                      const cards = journeyCards.filter((i) => bucketForMonth(i.startMonth, view) === bucket)
                      if (cards.length === 0) return null
                      return (
                        <div key={bucket}>
                          <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                            {bucket}
                          </div>
                          <div className="space-y-2">
                            {cards.map((card) => (
                              <InitiativeCard
                                key={card.id}
                                initiative={card}
                                onClick={onCardClick}
                                onDragStart={handleDragStart}
                                showJourney={false}
                              />
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </section>
            )
          })}
        </div>

      <div className="hidden overflow-x-auto pb-4 md:block">
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
      </>
    )
  }

  return (
    <div className="-mx-4 snap-x snap-mandatory scroll-px-4 overflow-x-auto px-4 pb-4 sm:mx-0 sm:snap-none sm:scroll-px-0 sm:px-0">
      <div
        // Phones: fixed 85vw columns that snap one at a time; wider screens keep
        // the flexible 260px+ columns.
        className="grid min-w-max gap-3 [--col:85vw] sm:gap-4 sm:[--col:minmax(260px,1fr)]"
        style={{ gridTemplateColumns: `repeat(${buckets.length}, var(--col))` }}
      >
        {buckets.map((bucket) => {
          const cards = initiatives.filter((i) => bucketForMonth(i.startMonth, view) === bucket)
          return (
            <div key={bucket} className="flex snap-start flex-col">
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
