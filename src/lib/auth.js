import { GoogleAuthProvider, getAuth, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth'
import { doc, onSnapshot } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { db } from './api'
import { app } from './firebase'

// ─── Access control ────────────────────────────────────────────────────────
// Set this to your company's email domain (e.g. 'example.com') to require
// Google sign-in. Leave it empty to keep the app open to anyone with the link.
//
// When it's set:
//   • only Google accounts at this domain can sign in and view the roadmap;
//   • only emails listed in the Firestore document settings/access, field
//     `editors` (an array of emails), can make changes — everyone else is
//     read-only;
//   • publish firestore.auth.rules (with the same domain) in the Firebase
//     console, and enable Google under Authentication → Sign-in method.
export const ALLOWED_DOMAIN = 'bhphoto.com'

export const authEnabled = ALLOWED_DOMAIN !== ''

const auth = getAuth(app)

function emailAllowed(email) {
  return !!email && email.toLowerCase().endsWith(`@${ALLOWED_DOMAIN.toLowerCase()}`)
}

export async function signIn() {
  const provider = new GoogleAuthProvider()
  // Pre-selects accounts on the company domain in Google's account picker.
  provider.setCustomParameters({ hd: ALLOWED_DOMAIN, prompt: 'select_account' })
  const result = await signInWithPopup(auth, provider)
  if (!emailAllowed(result.user.email)) {
    await signOut(auth)
    throw new Error(`Please sign in with your @${ALLOWED_DOMAIN} account.`)
  }
}

export function signOutUser() {
  return signOut(auth)
}

// Returns { status, user, canEdit }:
//   status: 'open' (auth disabled) | 'loading' | 'signedOut' | 'signedIn'
export function useAccess() {
  const [user, setUser] = useState(undefined)
  const [editors, setEditors] = useState([])

  useEffect(() => {
    if (!authEnabled) return undefined
    return onAuthStateChanged(auth, (u) => setUser(u && emailAllowed(u.email) ? u : null))
  }, [])

  useEffect(() => {
    if (!authEnabled || !user) return undefined
    return onSnapshot(
      doc(db, 'settings', 'access'),
      (snap) => setEditors((snap.data()?.editors ?? []).map((e) => String(e).toLowerCase())),
      () => setEditors([])
    )
  }, [user])

  if (!authEnabled) return { status: 'open', user: null, canEdit: true }
  if (user === undefined) return { status: 'loading', user: null, canEdit: false }
  if (!user) return { status: 'signedOut', user: null, canEdit: false }
  return {
    status: 'signedIn',
    user: { email: user.email, name: user.displayName, photo: user.photoURL },
    canEdit: editors.includes(user.email.toLowerCase()),
  }
}
