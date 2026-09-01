export const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

export const TIME_VIEWS = {
  Month: { label: 'Month', buckets: MONTHS },
  Quarter: { label: 'Quarter', buckets: ['Q1', 'Q2', 'Q3', 'Q4'] },
  Half: { label: 'H1/H2', buckets: ['H1', 'H2'] },
}

export const PMS = [
  { name: 'Steven', color: 'sky' },
  { name: 'Jerel', color: 'violet' },
  { name: 'Sijia', color: 'amber' },
  { name: 'Timothy', color: 'emerald' },
  { name: 'Kiva', color: 'rose' },
]

export const JOURNEYS = [
  { name: 'Learn & Decide', color: 'indigo' },
  { name: 'Buy', color: 'emerald' },
  { name: 'Post Purchase', color: 'cyan' },
  { name: 'Discovery', color: 'fuchsia' },
  { name: 'B2B', color: 'orange' },
  { name: 'Used', color: 'lime' },
  { name: 'Marketing', color: 'pink' },
  { name: 'Site Support', color: 'blue' },
]

export const STATUSES = [
  { name: 'Planned', color: 'slate' },
  { name: 'In Progress', color: 'blue' },
  { name: 'Blocked', color: 'red' },
  { name: 'Live', color: 'green' },
]

// Tailwind can't see dynamically-built class strings, so every color used
// above must have its class combinations spelled out here to survive the
// production build's class-scan.
export const COLOR_CLASSES = {
  sky: { badge: 'bg-sky-500/15 text-sky-300 ring-1 ring-inset ring-sky-500/30', solid: 'bg-sky-500', ring: 'ring-sky-400', text: 'text-sky-400' },
  violet: { badge: 'bg-violet-500/15 text-violet-300 ring-1 ring-inset ring-violet-500/30', solid: 'bg-violet-500', ring: 'ring-violet-400', text: 'text-violet-400' },
  amber: { badge: 'bg-amber-500/15 text-amber-300 ring-1 ring-inset ring-amber-500/30', solid: 'bg-amber-500', ring: 'ring-amber-400', text: 'text-amber-400' },
  emerald: { badge: 'bg-emerald-500/15 text-emerald-300 ring-1 ring-inset ring-emerald-500/30', solid: 'bg-emerald-500', ring: 'ring-emerald-400', text: 'text-emerald-400' },
  rose: { badge: 'bg-rose-500/15 text-rose-300 ring-1 ring-inset ring-rose-500/30', solid: 'bg-rose-500', ring: 'ring-rose-400', text: 'text-rose-400' },
  indigo: { badge: 'bg-indigo-500/15 text-indigo-300 ring-1 ring-inset ring-indigo-500/30', solid: 'bg-indigo-500', ring: 'ring-indigo-400', text: 'text-indigo-400' },
  cyan: { badge: 'bg-cyan-500/15 text-cyan-300 ring-1 ring-inset ring-cyan-500/30', solid: 'bg-cyan-500', ring: 'ring-cyan-400', text: 'text-cyan-400' },
  fuchsia: { badge: 'bg-fuchsia-500/15 text-fuchsia-300 ring-1 ring-inset ring-fuchsia-500/30', solid: 'bg-fuchsia-500', ring: 'ring-fuchsia-400', text: 'text-fuchsia-400' },
  orange: { badge: 'bg-orange-500/15 text-orange-300 ring-1 ring-inset ring-orange-500/30', solid: 'bg-orange-500', ring: 'ring-orange-400', text: 'text-orange-400' },
  lime: { badge: 'bg-lime-500/15 text-lime-300 ring-1 ring-inset ring-lime-500/30', solid: 'bg-lime-500', ring: 'ring-lime-400', text: 'text-lime-400' },
  pink: { badge: 'bg-pink-500/15 text-pink-300 ring-1 ring-inset ring-pink-500/30', solid: 'bg-pink-500', ring: 'ring-pink-400', text: 'text-pink-400' },
  blue: { badge: 'bg-blue-500/15 text-blue-300 ring-1 ring-inset ring-blue-500/30', solid: 'bg-blue-500', ring: 'ring-blue-400', text: 'text-blue-400' },
  slate: { badge: 'bg-slate-500/15 text-slate-300 ring-1 ring-inset ring-slate-500/30', solid: 'bg-slate-500', ring: 'ring-slate-400', text: 'text-slate-400' },
  red: { badge: 'bg-red-500/15 text-red-300 ring-1 ring-inset ring-red-500/30', solid: 'bg-red-500', ring: 'ring-red-400', text: 'text-red-400' },
  green: { badge: 'bg-green-500/15 text-green-300 ring-1 ring-inset ring-green-500/30', solid: 'bg-green-500', ring: 'ring-green-400', text: 'text-green-400' },
}

export function pmColor(pmName) {
  return PMS.find((p) => p.name === pmName)?.color ?? 'slate'
}

export function journeyColor(journeyName) {
  return JOURNEYS.find((j) => j.name === journeyName)?.color ?? 'slate'
}

export function statusColor(statusName) {
  return STATUSES.find((s) => s.name === statusName)?.color ?? 'slate'
}

export function bucketForMonth(startMonth, view) {
  if (view === 'Month') return MONTHS[startMonth]
  if (view === 'Quarter') return `Q${Math.floor(startMonth / 3) + 1}`
  return startMonth < 6 ? 'H1' : 'H2'
}

export function firstMonthOfBucket(bucket, view) {
  if (view === 'Month') return MONTHS.indexOf(bucket)
  if (view === 'Quarter') return (Number(bucket[1]) - 1) * 3
  return bucket === 'H1' ? 0 : 6
}
