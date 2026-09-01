import { useEffect, useMemo, useState } from 'react'
import ArchivedPanel from './components/ArchivedPanel'
import Board from './components/Board'
import Controls from './components/Controls'
import Header from './components/Header'
import InitiativeModal from './components/InitiativeModal'
import PmAvatarsPanel from './components/PmAvatarsPanel'
import { firstMonthOfBucket } from './data/constants'
import { initialInitiatives } from './data/mockInitiatives'

let nextId = initialInitiatives.length + 1

const AVATARS_STORAGE_KEY = 'pm-roadmap:pm-avatars'

function loadStoredAvatars() {
  try {
    return JSON.parse(localStorage.getItem(AVATARS_STORAGE_KEY) || '{}')
  } catch {
    return {}
  }
}

export default function App() {
  const [initiatives, setInitiatives] = useState(initialInitiatives)
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
  const [avatarPaths, setAvatarPaths] = useState(loadStoredAvatars)

  useEffect(() => {
    document.documentElement.classList.toggle('light', theme === 'light')
  }, [theme])

  useEffect(() => {
    try {
      localStorage.setItem(AVATARS_STORAGE_KEY, JSON.stringify(avatarPaths))
    } catch {
      // localStorage unavailable (e.g. private browsing) — avatars just won't persist
    }
  }, [avatarPaths])

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

  function handleSave(data) {
    if (data.id) {
      setInitiatives((prev) => prev.map((i) => (i.id === data.id ? { ...i, ...data } : i)))
    } else {
      setInitiatives((prev) => [...prev, { ...data, id: `init-${nextId++}` }])
    }
    closeModal()
  }

  function handleArchive(id) {
    setInitiatives((prev) => prev.map((i) => (i.id === id ? { ...i, archived: true } : i)))
    closeModal()
  }

  function handleRestore(id) {
    setInitiatives((prev) => prev.map((i) => (i.id === id ? { ...i, archived: false } : i)))
  }

  function handleAvatarChange(pmName, pathname) {
    setAvatarPaths((prev) => ({ ...prev, [pmName]: pathname }))
  }

  function handleMove(id, bucket, journey) {
    const startMonth = firstMonthOfBucket(bucket, view)
    setInitiatives((prev) =>
      prev.map((i) => (i.id === id ? { ...i, startMonth, ...(journey ? { journey } : {}) } : i))
    )
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
