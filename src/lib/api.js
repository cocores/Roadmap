import {
  addDoc,
  collection,
  doc,
  getDocs,
  initializeFirestore,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore'
import { DEFAULT_YEAR } from '../data/constants'
import { initialInitiatives } from '../data/mockInitiatives'
import { app } from './firebase'

// Firestore rejects `undefined` field values by default; the modal can produce
// them for optional fields, so drop them instead of failing the write.
export const db = initializeFirestore(app, { ignoreUndefinedProperties: true })

const initiativesCol = collection(db, 'initiatives')
const changesCol = collection(db, 'changes')
const snapshotsCol = collection(db, 'snapshots')

// Fields tracked in change history (everything a person edits).
const TRACKED_FIELDS = [
  'title', 'description', 'pm', 'journey', 'coreValue', 'status', 'health',
  'progress', 'impact', 'tags', 'startMonth', 'endMonth', 'year', 'priority',
  'blockedBy', 'trackerLink', 'confluenceLink', 'archived',
]

export function normalizeInitiative(id, d) {
  return {
    id,
    title: d.title ?? '',
    description: d.description ?? '',
    pm: d.pm,
    journey: d.journey,
    coreValue: d.coreValue ?? null,
    status: d.status,
    health: d.health ?? null,
    progress: d.progress ?? 0,
    impact: d.impact ?? '',
    tags: d.tags ?? [],
    startMonth: d.startMonth ?? 0,
    endMonth: d.endMonth ?? null,
    year: d.year ?? DEFAULT_YEAR,
    priority: d.priority ?? null,
    blockedBy: d.blockedBy ?? [],
    trackerLink: d.trackerLink ?? null,
    confluenceLink: d.confluenceLink ?? null,
    archived: d.archived ?? false,
  }
}

function initiativeFields({ id: _id, ...rest }) {
  return rest
}

function sameValue(a, b) {
  return JSON.stringify(a ?? null) === JSON.stringify(b ?? null)
}

// Field-level diff between an initiative before and after an edit.
export function diffInitiative(before, after) {
  const changes = []
  for (const field of TRACKED_FIELDS) {
    if (!(field in after)) continue
    if (!sameValue(before?.[field], after[field])) {
      changes.push({ field, from: before?.[field] ?? null, to: after[field] ?? null })
    }
  }
  return changes
}

// History writes are best-effort: a failure (e.g. rules not yet updated to
// allow the `changes` collection) is logged but never blocks the edit itself.
function logChange(entry) {
  addDoc(changesCol, { ...entry, at: serverTimestamp() }).catch((err) =>
    console.warn('Could not record change history:', err.message)
  )
}

// Live subscription: calls onData with every initiative whenever anything
// changes (including edits made by other people). Seeds the demo data the
// first time it sees an empty collection.
export function subscribeInitiatives(onData, onError) {
  let seeded = false
  let heardFromServer = false
  // Offline, the SDK never errors — it just waits. Report it as unreachable
  // after a few seconds (the listener stays open and recovers on its own).
  const timer = setTimeout(() => {
    if (!heardFromServer) onError(new Error('Firestore did not respond within 8s'))
  }, 8000)

  const unsubscribe = onSnapshot(
    initiativesCol,
    { includeMetadataChanges: true },
    (snapshot) => {
      if (!snapshot.metadata.fromCache) heardFromServer = true
      // An empty result from the local cache just means "nothing cached yet",
      // not "the roadmap is empty" — keep showing what we have.
      if (snapshot.empty && snapshot.metadata.fromCache) return
      if (snapshot.empty && !seeded) {
        seeded = true
        seedInitiatives().catch(onError)
        return
      }
      onData(
        snapshot.docs
          .map((d) => normalizeInitiative(d.id, d.data()))
          .sort((a, b) => a.year - b.year || a.startMonth - b.startMonth || a.title.localeCompare(b.title))
      )
    },
    onError
  )
  return () => {
    clearTimeout(timer)
    unsubscribe()
  }
}

async function seedInitiatives() {
  const batch = writeBatch(db)
  for (const initiative of initialInitiatives) {
    batch.set(doc(initiativesCol, initiative.id), {
      ...initiativeFields(normalizeInitiative(initiative.id, initiative)),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  }
  await batch.commit()
}

export async function createInitiative(initiative, user) {
  await setDoc(doc(initiativesCol, initiative.id), {
    ...initiativeFields(initiative),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  logChange({ initiativeId: initiative.id, title: initiative.title, by: user ?? null, type: 'created', changes: [] })
  return initiative
}

// `before` is the initiative as it was, used to record what changed.
export async function updateInitiative(id, patch, before, user) {
  await updateDoc(doc(initiativesCol, id), {
    ...initiativeFields(patch),
    updatedAt: serverTimestamp(),
  })
  const changes = diffInitiative(before, patch)
  if (changes.length) {
    logChange({ initiativeId: id, title: patch.title ?? before?.title ?? '', by: user ?? null, type: 'updated', changes })
  }
  return { id, ...patch }
}

// Several updates in one atomic write (used by drag-to-reorder and CSV import).
// Each item: { id, patch, before, isNew }.
export async function batchWrite(items, user) {
  for (let i = 0; i < items.length; i += 400) {
    const batch = writeBatch(db)
    for (const { id, patch, isNew } of items.slice(i, i + 400)) {
      const ref = doc(initiativesCol, id)
      if (isNew) {
        batch.set(ref, { ...initiativeFields(patch), createdAt: serverTimestamp(), updatedAt: serverTimestamp() })
      } else {
        batch.update(ref, { ...initiativeFields(patch), updatedAt: serverTimestamp() })
      }
    }
    await batch.commit()
  }
  for (const { id, patch, before, isNew, log = true } of items) {
    if (!log) continue
    if (isNew) {
      logChange({ initiativeId: id, title: patch.title, by: user ?? null, type: 'created', changes: [] })
    } else {
      const changes = diffInitiative(before, patch)
      if (changes.length) logChange({ initiativeId: id, title: patch.title ?? before?.title ?? '', by: user ?? null, type: 'updated', changes })
    }
  }
}

export async function fetchHistory(initiativeId) {
  // Single-field filter + client-side sort, so no composite index is needed.
  const snapshot = await getDocs(query(changesCol, where('initiativeId', '==', initiativeId)))
  return snapshot.docs
    .map((d) => ({ id: d.id, ...d.data(), at: d.data().at?.toDate?.() ?? null }))
    .sort((a, b) => (b.at?.getTime() ?? Infinity) - (a.at?.getTime() ?? Infinity))
}

export async function saveSnapshot(name, initiatives, user) {
  const ref = await addDoc(snapshotsCol, {
    name,
    by: user ?? null,
    createdAt: serverTimestamp(),
    initiatives: initiatives.map((i) => ({ ...i })),
  })
  return ref.id
}

export async function listSnapshots() {
  const snapshot = await getDocs(query(snapshotsCol, orderBy('createdAt', 'desc')))
  return snapshot.docs.map((d) => {
    const data = d.data()
    return {
      id: d.id,
      name: data.name,
      by: data.by ?? null,
      createdAt: data.createdAt?.toDate?.() ?? null,
      initiatives: (data.initiatives ?? []).map((i) => normalizeInitiative(i.id, i)),
    }
  })
}
