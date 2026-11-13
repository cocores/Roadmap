import {
  collection,
  doc,
  getDocs,
  initializeFirestore,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore'
import { DEFAULT_YEAR } from '../data/constants'
import { initialInitiatives } from '../data/mockInitiatives'
import { app } from './firebase'

// Firestore rejects `undefined` field values by default; the modal can produce
// them for optional fields, so drop them instead of failing the write.
export const db = initializeFirestore(app, { ignoreUndefinedProperties: true })

const initiativesCol = collection(db, 'initiatives')

// If Firestore isn't reachable (database not created yet, rules deny access,
// offline), the SDK can wait a long time before failing. Give up after a few
// seconds so the app falls back to "Local only" mode promptly.
function withTimeout(promise, ms = 8000) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`Firestore did not respond within ${ms / 1000}s`)), ms)
    ),
  ])
}

function docToInitiative(snapshot) {
  const d = snapshot.data()
  return {
    id: snapshot.id,
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
    startMonth: d.startMonth,
    year: d.year ?? DEFAULT_YEAR,
    trackerLink: d.trackerLink ?? null,
    confluenceLink: d.confluenceLink ?? null,
    archived: d.archived ?? false,
  }
}

function initiativeFields({ id: _id, ...rest }) {
  return rest
}

// Writes the mock initiatives the first time the app talks to an empty
// Firestore database, so the board starts with the same demo content.
async function seedInitiatives() {
  const batch = writeBatch(db)
  for (const initiative of initialInitiatives) {
    batch.set(doc(initiativesCol, initiative.id), {
      ...initiativeFields(initiative),
      archived: initiative.archived ?? false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  }
  await batch.commit()
  return initialInitiatives.map((i) => ({ ...i, archived: i.archived ?? false }))
}

export async function fetchInitiatives() {
  const snapshot = await withTimeout(getDocs(initiativesCol))
  if (snapshot.empty) return seedInitiatives()
  return snapshot.docs
    .map(docToInitiative)
    .sort((a, b) => a.year - b.year || a.startMonth - b.startMonth || a.title.localeCompare(b.title))
}

export async function createInitiative(initiative) {
  await setDoc(doc(initiativesCol, initiative.id), {
    ...initiativeFields(initiative),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return initiative
}

export async function updateInitiative(id, patch) {
  await updateDoc(doc(initiativesCol, id), {
    ...initiativeFields(patch),
    updatedAt: serverTimestamp(),
  })
  return { id, ...patch }
}
