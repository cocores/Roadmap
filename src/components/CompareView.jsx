import { Camera, GitCompareArrows } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { MONTHS, initiativeYear } from '../data/constants'
import { listSnapshots, saveSnapshot } from '../lib/api'

function when(i) {
  return `${MONTHS[i.startMonth]} ${initiativeYear(i)}`
}

// Groups the differences between a saved snapshot and today's roadmap.
function compare(snapshot, current) {
  const then = Object.fromEntries(snapshot.initiatives.filter((i) => !i.archived).map((i) => [i.id, i]))
  const nowList = current.filter((i) => !i.archived)
  const now = Object.fromEntries(nowList.map((i) => [i.id, i]))

  const added = nowList.filter((i) => !then[i.id])
  const removed = Object.values(then).filter((i) => !now[i.id])
  const slipped = []
  const pulledIn = []
  const healthChanged = []
  const shipped = []
  for (const i of nowList) {
    const old = then[i.id]
    if (!old) continue
    const oldIdx = initiativeYear(old) * 12 + old.startMonth
    const newIdx = initiativeYear(i) * 12 + i.startMonth
    if (newIdx > oldIdx) slipped.push({ i, detail: `${when(old)} → ${when(i)}` })
    if (newIdx < oldIdx) pulledIn.push({ i, detail: `${when(old)} → ${when(i)}` })
    if (old.health !== i.health) healthChanged.push({ i, detail: `${old.health ?? '—'} → ${i.health ?? '—'}` })
    if (old.status !== 'Live' && i.status === 'Live') shipped.push({ i, detail: `${old.status} → Live` })
  }
  return [
    { key: 'shipped', title: 'Shipped', tone: 'text-green-500', items: shipped },
    { key: 'added', title: 'Added', tone: 'text-sky-400', items: added.map((i) => ({ i, detail: when(i) })) },
    { key: 'slipped', title: 'Slipped (moved later)', tone: 'text-amber-500', items: slipped },
    { key: 'pulled', title: 'Pulled in (moved earlier)', tone: 'text-brand-400', items: pulledIn },
    { key: 'health', title: 'Health changed', tone: 'text-yellow-400', items: healthChanged },
    { key: 'removed', title: 'Removed or archived', tone: 'text-red-400', items: removed.map((i) => ({ i, detail: when(i) })) },
  ]
}

export default function CompareView({ initiatives, canEdit, user, onCardClick }) {
  const [snapshots, setSnapshots] = useState(null)
  const [selectedId, setSelectedId] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState(() => defaultName())

  function defaultName() {
    const d = new Date()
    return `Q${Math.floor(d.getMonth() / 3) + 1} ${d.getFullYear()} snapshot`
  }

  function load(selectId) {
    listSnapshots()
      .then((list) => {
        setSnapshots(list)
        setSelectedId((cur) => selectId ?? (cur || list[0]?.id || ''))
      })
      .catch((err) => setError(err.message))
  }

  useEffect(() => {
    load()
  }, [])

  async function handleSave() {
    if (!name.trim()) return
    setSaving(true)
    setError('')
    try {
      const id = await saveSnapshot(name.trim(), initiatives.filter((i) => !i.archived), user)
      setName(defaultName())
      load(id)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const selected = snapshots?.find((s) => s.id === selectedId)
  const groups = useMemo(() => (selected ? compare(selected, initiatives) : []), [selected, initiatives])
  const totalChanges = groups.reduce((n, g) => n + g.items.length, 0)

  return (
    <main className="mx-auto max-w-[1100px] space-y-5 px-4 py-5 sm:px-6">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 light:border-slate-200 light:bg-white">
        <h2 className="flex items-center gap-2 text-base font-semibold">
          <GitCompareArrows size={18} /> Compare to a snapshot
        </h2>
        <p className="mt-1 text-sm text-slate-400 light:text-slate-500">
          Save a snapshot at the start of each quarter (or before a planning review). Later, pick it here to see what
          shipped, slipped, was added, or changed health since then.
        </p>

        <div className="mt-4 flex flex-wrap items-end gap-3">
          <label className="block min-w-[220px] flex-1">
            <span className="mb-1.5 block text-xs font-medium text-slate-400 light:text-slate-500">Compare against</span>
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm light:border-slate-300 light:bg-white"
            >
              {!snapshots && <option>Loading…</option>}
              {snapshots?.length === 0 && <option value="">No snapshots yet</option>}
              {snapshots?.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                  {s.createdAt ? ` — ${s.createdAt.toLocaleDateString(undefined, { dateStyle: 'medium' })}` : ''}
                </option>
              ))}
            </select>
          </label>

          {canEdit && (
            <div className="flex min-w-[220px] flex-1 items-end gap-2">
              <label className="block flex-1">
                <span className="mb-1.5 block text-xs font-medium text-slate-400 light:text-slate-500">New snapshot name</span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm light:border-slate-300 light:bg-white"
                />
              </label>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="flex shrink-0 items-center gap-1.5 rounded-full bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-500 disabled:opacity-50"
              >
                <Camera size={15} /> {saving ? 'Saving…' : 'Save snapshot'}
              </button>
            </div>
          )}
        </div>
        {error && (
          <p className="mt-3 text-sm text-amber-500">
            {error}
            {/permission/i.test(error) && ' — the Firestore rules need updating to allow snapshots (see firestore.rules).'}
          </p>
        )}
      </div>

      {selected && (
        <>
          <p className="text-sm text-slate-400 light:text-slate-500">
            {totalChanges === 0
              ? `Nothing has changed since “${selected.name}”.`
              : `${totalChanges} change${totalChanges > 1 ? 's' : ''} since “${selected.name}”${selected.by ? ` (saved by ${selected.by})` : ''}.`}
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            {groups
              .filter((g) => g.items.length)
              .map((g) => (
                <section key={g.key} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 light:border-slate-200 light:bg-white">
                  <h3 className={`text-sm font-semibold ${g.tone}`}>
                    {g.title} <span className="font-normal text-slate-500">{g.items.length}</span>
                  </h3>
                  <ul className="mt-2 space-y-1.5 text-sm">
                    {g.items.map(({ i, detail }) => (
                      <li key={i.id}>
                        <button
                          type="button"
                          onClick={() => g.key !== 'removed' && onCardClick(i)}
                          className="flex w-full items-baseline gap-2 text-left hover:text-brand-400"
                        >
                          <span className="truncate">{i.title}</span>
                          <span className="ml-auto shrink-0 text-xs text-slate-500">{detail}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
          </div>
        </>
      )}
    </main>
  )
}
