import { useEffect, useMemo, useState } from 'react'
import ArchivedPanel from './components/ArchivedPanel'
import Board from './components/Board'
import CompareView from './components/CompareView'
import Controls from './components/Controls'
import Header from './components/Header'
import ImportDialog from './components/ImportDialog'
import InitiativeModal from './components/InitiativeModal'
import SignInScreen from './components/SignInScreen'
import StakeholderView from './components/StakeholderView'
import {
  JOURNEYS,
  bucketForMonth,
  firstMonthOfBucket,
  initiativeYear,
  sortByPriority,
} from './data/constants'
import { initialInitiatives } from './data/mockInitiatives'
import { batchWrite, createInitiative, normalizeInitiative, subscribeInitiatives, updateInitiative } from './lib/api'
import { useAccess } from './lib/auth'
import { downloadCsv, initiativesToCsv } from './lib/csv'
import { readInitialSettings, useSyncedSettings } from './lib/urlState'

const DEFAULT_SETTINGS = {
  page: 'board',
  year: new Date().getFullYear(),
  view: 'Quarter',
  layout: 'timeline',
  pm: [],
  journey: [],
  cv: [],
  health: [],
  q: '',
  group: true,
}

export default function App() {
  const access = useAccess()
  const user = access.user?.email ?? null
  const canEdit = access.canEdit

  // Seeded with the mock data so the board isn't empty while Firestore is
  // loading, or if it's unreachable (rules deny access, network down).
  const [initiatives, setInitiatives] = useState(() =>
    initialInitiatives.map((i) => normalizeInitiative(i.id, i))
  )
  // null = still checking, true = live-synced with the database, false = local-only
  const [dbConnected, setDbConnected] = useState(null)
  const [settings, setSettings] = useState(() => readInitialSettings(DEFAULT_SETTINGS))
  const [theme, setTheme] = useState('dark')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingInitiative, setEditingInitiative] = useState(null)
  const [archivedPanelOpen, setArchivedPanelOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)

  useSyncedSettings(settings)
  const set = (key) => (value) =>
    setSettings((s) => ({ ...s, [key]: typeof value === 'function' ? value(s[key]) : value }))

  useEffect(() => {
    document.documentElement.classList.toggle('light', theme === 'light')
  }, [theme])

  const canRead = access.status === 'open' || access.status === 'signedIn'
  useEffect(() => {
    if (!canRead) return undefined
    return subscribeInitiatives(
      (loaded) => {
        setInitiatives(loaded)
        setDbConnected(true)
      },
      (err) => {
        console.error('Could not reach the database — using local demo data.', err)
        setDbConnected(false)
      }
    )
  }, [canRead])

  const byId = useMemo(() => Object.fromEntries(initiatives.map((i) => [i.id, i])), [initiatives])

  const archivedInitiatives = useMemo(() => initiatives.filter((i) => i.archived), [initiatives])

  // Everything except the year filter (Now/Next/Later spans years).
  const matchesFilters = useMemo(() => {
    const q = settings.q.trim().toLowerCase()
    return (i) => {
      if (i.archived) return false
      if (settings.pm.length && !settings.pm.includes(i.pm)) return false
      if (settings.journey.length && !settings.journey.includes(i.journey)) return false
      if (settings.cv.length && !settings.cv.includes(i.coreValue)) return false
      if (settings.health.length && !settings.health.includes(i.health)) return false
      if (q && !i.title.toLowerCase().includes(q) && !i.tags.some((t) => t.toLowerCase().includes(q))) return false
      return true
    }
  }, [settings.pm, settings.journey, settings.cv, settings.health, settings.q])

  const filteredAllYears = useMemo(() => initiatives.filter(matchesFilters), [initiatives, matchesFilters])
  const filtered = useMemo(
    () => filteredAllYears.filter((i) => initiativeYear(i) === settings.year),
    [filteredAllYears, settings.year]
  )
  const yearTotal = useMemo(
    () => initiatives.filter((i) => !i.archived && initiativeYear(i) === settings.year).length,
    [initiatives, settings.year]
  )

  function openNewModal() {
    setEditingInitiative(null)
    setModalOpen(true)
  }

  function openEditModal(initiative) {
    setEditingInitiative(initiative)
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setEditingInitiative(null)
  }

  // Every mutation updates local state immediately (so the board never waits
  // on the network); the live subscription then confirms it. Failures flip the
  // "Saved" indicator but never roll back or interrupt the user.
  function persist(promise) {
    promise
      .then(() => setDbConnected(true))
      .catch((err) => {
        console.error('Failed to save to the database:', err)
        setDbConnected(false)
      })
  }

  function applyLocal(patches) {
    setInitiatives((prev) => {
      const next = prev.map((i) => (patches[i.id] ? { ...i, ...patches[i.id] } : i))
      for (const [id, patch] of Object.entries(patches)) {
        if (!prev.some((i) => i.id === id)) next.push({ ...patch, id })
      }
      return next
    })
  }

  function handleSave(data) {
    if (!canEdit) return
    if (data.id) {
      const before = byId[data.id]
      applyLocal({ [data.id]: data })
      persist(updateInitiative(data.id, data, before, user))
    } else {
      const newInitiative = normalizeInitiative(crypto.randomUUID(), { ...data, archived: false })
      applyLocal({ [newInitiative.id]: newInitiative })
      persist(createInitiative(newInitiative, user))
    }
    closeModal()
  }

  function patchOne(id, patch) {
    if (!canEdit) return
    const before = byId[id]
    applyLocal({ [id]: patch })
    persist(updateInitiative(id, patch, before, user))
  }

  function handleArchive(id) {
    patchOne(id, { archived: true })
    closeModal()
  }

  function handleRestore(id) {
    patchOne(id, { archived: false })
  }

  // Hiding a journey row = deselecting it in the Journey filter.
  function handleHideJourney(name) {
    set('journey')((prev) => {
      const current = prev.length ? prev : JOURNEYS.map((j) => j.name)
      return current.filter((j) => j !== name)
    })
  }

  // Keep a card's end month the same distance after its start when it moves.
  function movePatch(initiative, startMonth, journey) {
    const patch = { startMonth, ...(journey ? { journey } : {}) }
    if (initiative.endMonth != null) {
      patch.endMonth = Math.min(11, startMonth + (initiative.endMonth - initiative.startMonth))
    }
    return patch
  }

  function handleMove(id, bucket, journey) {
    const initiative = byId[id]
    if (!initiative) return
    const startMonth = firstMonthOfBucket(bucket, settings.view)
    if (bucketForMonth(initiative.startMonth, settings.view) === bucket && (!journey || journey === initiative.journey)) return
    patchOne(id, movePatch(initiative, startMonth, journey))
  }

  // Drop `draggedId` just above `targetId`: it joins the target's bucket (and
  // journey row, when grouped), and every card in that cell is renumbered
  // 1..n in its new order.
  function handleReorder(draggedId, targetId) {
    if (!canEdit || draggedId === targetId) return
    const dragged = byId[draggedId]
    const target = byId[targetId]
    if (!dragged || !target) return
    const bucket = bucketForMonth(target.startMonth, settings.view)
    const sameCell = (i) =>
      bucketForMonth(i.startMonth, settings.view) === bucket && (!settings.group || i.journey === target.journey)

    const cell = sortByPriority(filtered.filter((i) => sameCell(i) && i.id !== draggedId))
    const insertAt = cell.findIndex((i) => i.id === targetId)
    cell.splice(insertAt, 0, dragged)

    const items = []
    const patches = {}
    cell.forEach((i, idx) => {
      const patch = { priority: idx + 1 }
      if (i.id === draggedId && !sameCell(dragged)) {
        Object.assign(patch, movePatch(dragged, target.startMonth, settings.group ? target.journey : null))
      }
      const before = byId[i.id]
      if (Object.entries(patch).some(([k, v]) => before[k] !== v)) {
        patches[i.id] = patch
        // Only the card you dragged gets a history entry; the renumbering of
        // its neighbours would just be noise.
        items.push({ id: i.id, patch, before, log: i.id === draggedId })
      }
    })
    if (!items.length) return
    applyLocal(patches)
    persist(batchWrite(items, user))
  }

  function handleImport(rows) {
    if (!canEdit || !rows.length) return
    const patches = {}
    const items = rows.map(({ id, data, isNew }) => {
      patches[id] = isNew ? normalizeInitiative(id, data) : data
      return { id, patch: patches[id], before: byId[id], isNew }
    })
    applyLocal(patches)
    persist(batchWrite(items, user))
  }

  function handleExport() {
    const year = new Date().toISOString().slice(0, 10)
    downloadCsv(`roadmap-${year}.csv`, initiativesToCsv(initiatives.filter((i) => !i.archived)))
  }

  if (access.status === 'loading' || access.status === 'signedOut') {
    return <SignInScreen loading={access.status === 'loading'} />
  }

  const controls = (
    <Controls
      page={settings.page}
      view={settings.view}
      onViewChange={set('view')}
      year={settings.year}
      onYearChange={set('year')}
      pmFilter={settings.pm}
      onPmFilterChange={set('pm')}
      journeyFilter={settings.journey}
      onJourneyFilterChange={set('journey')}
      coreValueFilter={settings.cv}
      onCoreValueFilterChange={set('cv')}
      healthFilter={settings.health}
      onHealthFilterChange={set('health')}
      search={settings.q}
      onSearchChange={set('q')}
      groupByJourney={settings.group}
      onToggleGroup={() => set('group')((g) => !g)}
      visibleCount={filtered.length}
      totalCount={yearTotal}
    />
  )

  return (
    <div className="min-h-screen bg-slate-950 font-sans print:bg-white text-slate-100 light:bg-paper light:text-slate-900">
      <Header
        page={settings.page}
        onPageChange={set('page')}
        theme={theme}
        onToggleTheme={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
        onNewInitiative={canEdit ? openNewModal : null}
        archivedCount={archivedInitiatives.length}
        onOpenArchive={() => setArchivedPanelOpen(true)}
        onExportCsv={handleExport}
        onImportCsv={canEdit ? () => setImportOpen(true) : null}
        dbConnected={dbConnected}
        access={access}
      />

      {settings.page === 'board' && (
        <>
          {controls}
          <main className="mx-auto max-w-[1600px] px-4 py-4 sm:px-6 sm:py-5">
            <Board
              initiatives={filtered}
              byId={byId}
              view={settings.view}
              groupByJourney={settings.group}
              journeyFilter={settings.journey}
              onHideJourney={handleHideJourney}
              onCardClick={openEditModal}
              onMove={canEdit ? handleMove : null}
              onReorder={canEdit ? handleReorder : null}
            />
          </main>
        </>
      )}

      {settings.page === 'stakeholder' && (
        <>
          {controls}
          <StakeholderView
            initiatives={filtered}
            initiativesAllYears={filteredAllYears}
            byId={byId}
            year={settings.year}
            layout={settings.layout}
            onLayoutChange={set('layout')}
            settings={settings}
            onCardClick={openEditModal}
          />
        </>
      )}

      {settings.page === 'compare' && (
        <CompareView initiatives={initiatives} canEdit={canEdit} user={user} onCardClick={openEditModal} />
      )}

      {modalOpen && (
        <InitiativeModal
          key={editingInitiative ? editingInitiative.id : 'new'}
          view={settings.view}
          defaultYear={settings.year}
          initiative={editingInitiative ? byId[editingInitiative.id] ?? editingInitiative : null}
          allInitiatives={initiatives}
          readOnly={!canEdit}
          onClose={closeModal}
          onSave={handleSave}
          onArchive={handleArchive}
        />
      )}

      {archivedPanelOpen && (
        <ArchivedPanel
          initiatives={archivedInitiatives}
          onClose={() => setArchivedPanelOpen(false)}
          onRestore={canEdit ? handleRestore : null}
        />
      )}

      {importOpen && (
        <ImportDialog existing={initiatives} onClose={() => setImportOpen(false)} onImport={handleImport} />
      )}
    </div>
  )
}
