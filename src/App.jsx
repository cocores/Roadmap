import { useEffect, useMemo, useState } from 'react'
import Board from './components/Board'
import Controls from './components/Controls'
import Header from './components/Header'
import InitiativeModal from './components/InitiativeModal'
import { firstMonthOfBucket } from './data/constants'
import { initialInitiatives } from './data/mockInitiatives'

let nextId = initialInitiatives.length + 1

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

  useEffect(() => {
    document.documentElement.classList.toggle('light', theme === 'light')
  }, [theme])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return initiatives.filter((i) => {
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

  function handleDelete(id) {
    setInitiatives((prev) => prev.filter((i) => i.id !== id))
    closeModal()
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
        search={search}
        onSearchChange={setSearch}
        groupByJourney={groupByJourney}
        onToggleGroup={() => setGroupByJourney((g) => !g)}
        visibleCount={filtered.length}
        totalCount={initiatives.length}
      />

      <main className="mx-auto max-w-[1600px] px-6 py-5">
        <Board
          initiatives={filtered}
          view={view}
          groupByJourney={groupByJourney}
          onCardClick={openEditModal}
          onMove={handleMove}
        />
      </main>

      {modalOpen && (
        <InitiativeModal
          key={editingInitiative ? editingInitiative.id : 'new'}
          view={view}
          initiative={editingInitiative}
          onClose={closeModal}
          onSave={handleSave}
          onDelete={handleDelete}
        />
      )}
    </div>
  )
}
