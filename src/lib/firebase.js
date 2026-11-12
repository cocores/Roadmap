import { initializeApp } from 'firebase/app'
import { getAnalytics, isSupported } from 'firebase/analytics'

// Firebase web config. These values are public identifiers (they ship in the
// client bundle regardless), not secrets — access is governed by Firebase
// security rules and API key restrictions in the Google Cloud console.
const firebaseConfig = {
  apiKey: 'AIzaSyBnWMYOhlN_TueQGo50az88m7VSKpd-AMo',
  authDomain: 'roadmap-919ae.firebaseapp.com',
  projectId: 'roadmap-919ae',
  storageBucket: 'roadmap-919ae.firebasestorage.app',
  messagingSenderId: '964745126167',
  appId: '1:964745126167:web:34bc060f29cbdce6159752',
  measurementId: 'G-2LJDEP6EM4',
}

export const app = initializeApp(firebaseConfig)

// Analytics only works in real browsers (not SSR, some privacy modes, etc.),
// so initialize it only where it's supported.
export const analyticsPromise = isSupported()
  .then((ok) => (ok ? getAnalytics(app) : null))
  .catch(() => null)
