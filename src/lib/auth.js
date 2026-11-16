import { OAuthProvider, getAuth, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth'
import { doc, onSnapshot } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { db } from './api'
import { app } from './firebase'

// ─── Access control ────────────────────────────────────────────────────────
// Sign-in uses Microsoft (Outlook / Microsoft 365 work accounts). Set this to
// the company email domain to require sign-in; leave it empty to keep the
// app open to anyone with the link.
//
// When it's set:
//   • only Microsoft work accounts with an email at this domain can sign in
//     and view the roadmap;
//   • only emails listed in the Firestore document settings/access, field
//     `editors` (an array of emails), can make changes — everyone else is
//     read-only;
//   • enable Microsoft under Firebase Authentication → Sign-in method (it
//     needs an app registration in Microsoft Entra ID — see README), and
//     publish firestore.auth.rules in the Firebase console.
// Sign-in is OFF until the Microsoft setup in the README is done; then set
// this to 'bhphoto.com' to turn it on.
export const ALLOWED_DOMAIN = ''

export const authEnabled = ALLOWED_DOMAIN !== ''

const auth = getAuth(app)

// Microsoft accounts don't always fill in user.email; fall back to the
// address on the Microsoft profile.
function userEmail(u) {
  return u?.email || u?.providerData?.find((p) => p.email)?.email || null
}

function emailAllowed(email) {
  return !!email && email.toLowerCase().endsWith(`@${ALLOWED_DOMAIN.toLowerCase()}`)
}

export async function signIn() {
  const provider = new OAuthProvider('microsoft.com')
  // Send people to the company's Microsoft sign-in page (the domain name
  // identifies the Microsoft 365 tenant) and always show the account picker.
  provider.setCustomParameters({ tenant: ALLOWED_DOMAIN, prompt: 'select_account' })
  provider.addScope('email')
  const result = await signInWithPopup(auth, provider)
  if (!emailAllowed(userEmail(result.user))) {
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
    return onAuthStateChanged(auth, (u) => setUser(u && emailAllowed(userEmail(u)) ? u : null))
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
    user: { email: userEmail(user), name: user.displayName, photo: user.photoURL },
    canEdit: editors.includes(userEmail(user).toLowerCase()),
  }
}
