import { useEffect, useMemo, useState } from 'react'
import ArchivedPanel from './components/ArchivedPanel'
import Board from './components/Board'
import Controls from './components/Controls'
import Header from './components/Header'
import InitiativeModal from './components/InitiativeModal'
import PmAvatarsPanel from './components/PmAvatarsPanel'
import { firstMonthOfBucket } from './data/constants'
import {
  createInitiative,
  fetchInitiatives,
  fetchPmAvatars,
  savePmAvatar,
  updateInitiative,
} from './lib/api'
import { initialInitiatives } from './data/mockInitiatives'

export default function App() {
  // Seeded with the mock data so the board isn't empty while /api/initiatives
  // is loading, or if it's unreachable (e.g. plain `vite dev` with no
  // database connected — see dbConnected below).
  const [initiatives, setInitiatives] = useState(initialInitiatives)
  const [avatarPaths, setAvatarPaths] = useState({})
  // null = still checking, true = persisting to the database, false = local-only
  const [dbConnected, setDbConnected] = useState(null)
  const [view, setView] = useState('Quarter')
  const [pmFilter, setPmFilter] = useState([])
  const [journeyFilter, setJourneyFilter] = useState([])
  const [coreValueFilter, setCoreValueFilter] = useState([])
  const [healthFilter, setHealthFilter] = useState([])
  const [search, setSearch] = useState('')
  const [groupByJourney, setGroupByJourney] = useState(true)
  const [theme, setTheme] = useState('dark')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingInitiative, setEditingInitiative] = useState(null)
  const [archivedPanelOpen, setArchivedPanelOpen] = useState(false)
  const [avatarsPanelOpen, setAvatarsPanelOpen] = useState(false)

  useEffect(() => {
    document.documentElement.classList.toggle('light', theme === 'light')
  }, [theme])

  useEffect(() => {
    let cancelled = false
    Promise.all([fetchInitiatives(), fetchPmAvatars()])
      .then(([loadedInitiatives, loadedAvatars]) => {
        if (cancelled) return
        setInitiatives(loadedInitiatives)
        setAvatarPaths(loadedAvatars)
        setDbConnected(true)
      })
      .catch((err) => {
        if (cancelled) return
        console.error('Could not reach the database — using local demo data.', err)
        setDbConnected(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const archivedInitiatives = useMemo(() => initiatives.filter((i) => i.archived), [initiatives])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return initiatives.filter((i) => {
      if (i.archived) return false
      if (pmFilter.length && !pmFilter.includes(i.pm)) return false
      if (journeyFilter.length && !journeyFilter.includes(i.journey)) return false
      if (coreValueFilter.length && !coreValueFilter.includes(i.coreValue)) return false
      if (healthFilter.length && !healthFilter.includes(i.health)) return false
      if (q && !i.title.toLowerCase().includes(q) && !i.tags.some((t) => t.toLowerCase().includes(q))) {
        return false
      }
      return true
    })
  }, [initiatives, pmFilter, journeyFilter, coreValueFilter, healthFilter, search])

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

  // Every mutation below updates local state immediately (so the board never
  // blocks on the network), then persists in the background. Failures are
  // logged and flip the `dbConnected` indicator, but never roll back the
  // local change or interrupt the user — same graceful-degradation approach
  // as the PM avatar uploads.
  function persist(promise) {
    promise
      .then(() => setDbConnected(true))
      .catch((err) => {
        console.error('Failed to save to the database:', err)
        setDbConnected(false)
      })
  }

  function handleSave(data) {
    if (data.id) {
      setInitiatives((prev) => prev.map((i) => (i.id === data.id ? { ...i, ...data } : i)))
      persist(updateInitiative(data.id, data))
    } else {
      const newInitiative = { ...data, id: crypto.randomUUID(), archived: false }
      setInitiatives((prev) => [...prev, newInitiative])
      persist(createInitiative(newInitiative))
    }
    closeModal()
  }

  function handleArchive(id) {
    setInitiatives((prev) => prev.map((i) => (i.id === id ? { ...i, archived: true } : i)))
    persist(updateInitiative(id, { archived: true }))
    closeModal()
  }

  function handleRestore(id) {
    setInitiatives((prev) => prev.map((i) => (i.id === id ? { ...i, archived: false } : i)))
    persist(updateInitiative(id, { archived: false }))
  }

  function handleAvatarChange(pmName, pathname) {
    setAvatarPaths((prev) => ({ ...prev, [pmName]: pathname }))
    persist(savePmAvatar(pmName, pathname))
  }

  function handleMove(id, bucket, journey) {
    const startMonth = firstMonthOfBucket(bucket, view)
    const patch = { startMonth, ...(journey ? { journey } : {}) }
    setInitiatives((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)))
    persist(updateInitiative(id, patch))
  }

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-100 light:bg-paper light:text-slate-900">
      <Header
        theme={theme}
        onToggleTheme={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
        onNewInitiative={openNewModal}
        archivedCount={archivedInitiatives.length}
        onOpenArchive={() => setArchivedPanelOpen(true)}
        onOpenAvatars={() => setAvatarsPanelOpen(true)}
        dbConnected={dbConnected}
      />

      <Controls
        view={view}
        onViewChange={setView}
        pmFilter={pmFilter}
        onPmFilterChange={setPmFilter}
        journeyFilter={journeyFilter}
        onJourneyFilterChange={setJourneyFilter}
        coreValueFilter={coreValueFilter}
        onCoreValueFilterChange={setCoreValueFilter}
        healthFilter={healthFilter}
        onHealthFilterChange={setHealthFilter}
        avatarPaths={avatarPaths}
        search={search}
        onSearchChange={setSearch}
        groupByJourney={groupByJourney}
        onToggleGroup={() => setGroupByJourney((g) => !g)}
        visibleCount={filtered.length}
        totalCount={initiatives.length - archivedInitiatives.length}
      />

      <main className="mx-auto max-w-[1600px] px-6 py-5">
        <Board
          initiatives={filtered}
          view={view}
          groupByJourney={groupByJourney}
          onCardClick={openEditModal}
          onMove={handleMove}
          avatarPaths={avatarPaths}
        />
      </main>

      {modalOpen && (
        <InitiativeModal
          key={editingInitiative ? editingInitiative.id : 'new'}
          view={view}
          initiative={editingInitiative}
          onClose={closeModal}
          onSave={handleSave}
          onArchive={handleArchive}
        />
      )}

      {archivedPanelOpen && (
        <ArchivedPanel
          initiatives={archivedInitiatives}
          onClose={() => setArchivedPanelOpen(false)}
          onRestore={handleRestore}
        />
      )}

      {avatarsPanelOpen && (
        <PmAvatarsPanel
          avatarPaths={avatarPaths}
          onAvatarChange={handleAvatarChange}
          onClose={() => setAvatarsPanelOpen(false)}
        />
      )}
    </div>
  )
}
