import { Archive, Download, GitCompareArrows, LayoutDashboard, LogOut, Map, MoreHorizontal, Moon, Plus, Presentation, Sun, Upload } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { signOutUser } from '../lib/auth'

const PAGES = [
  { key: 'board', label: 'Board', icon: LayoutDashboard },
  { key: 'stakeholder', label: 'Stakeholder', icon: Presentation },
  { key: 'compare', label: 'Compare', icon: GitCompareArrows },
]

const iconButton =
  'flex h-9 items-center gap-1.5 rounded-full border border-slate-700 bg-slate-800/60 px-2.5 py-2 text-sm text-slate-300 hover:border-slate-600 hover:text-slate-100 sm:px-3 light:border-slate-300 light:bg-white light:text-slate-600 light:hover:border-slate-400 light:hover:text-slate-800'

function MoreMenu({ archivedCount, onOpenArchive, onExportCsv, onImportCsv, access }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    function onClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  const item =
    'flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-200 hover:bg-slate-700/60 light:text-slate-700 light:hover:bg-slate-100'
  const run = (fn) => () => {
    setOpen(false)
    fn()
  }

  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => setOpen((o) => !o)} aria-label="More" className={iconButton}>
        <MoreHorizontal size={16} />
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-xl border border-slate-700 bg-slate-800 py-1 shadow-xl shadow-black/40 light:border-slate-200 light:bg-white">
          {access.user && (
            <div className="border-b border-slate-700 px-3 py-2 text-xs text-slate-400 light:border-slate-200">
              {access.user.email}
              <div className="mt-0.5 font-medium text-slate-300 light:text-slate-600">
                {access.canEdit ? 'Editor' : 'Viewer (read-only)'}
              </div>
            </div>
          )}
          <button type="button" className={item} onClick={run(onOpenArchive)}>
            <Archive size={15} /> Archived
            {archivedCount > 0 && <span className="ml-auto text-xs text-slate-400">{archivedCount}</span>}
          </button>
          <button type="button" className={item} onClick={run(onExportCsv)}>
            <Download size={15} /> Export CSV
          </button>
          {onImportCsv && (
            <button type="button" className={item} onClick={run(onImportCsv)}>
              <Upload size={15} /> Import CSV
            </button>
          )}
          {access.user && (
            <button type="button" className={item} onClick={run(signOutUser)}>
              <LogOut size={15} /> Sign out
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default function Header({
  page,
  onPageChange,
  theme,
  onToggleTheme,
  onNewInitiative,
  archivedCount,
  onOpenArchive,
  onExportCsv,
  onImportCsv,
  dbConnected,
  access,
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/80 backdrop-blur print:hidden light:border-slate-200 light:bg-white/80">
      <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-x-3 gap-y-2 px-4 py-3 sm:gap-x-4 sm:px-6 sm:py-3.5">
        <div className="flex min-w-0 flex-1 items-center gap-3 md:flex-none">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-lg shadow-brand-600/20">
            <Map size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-lg font-semibold tracking-tight text-slate-100 light:text-slate-900">
              PM Roadmap
            </h1>
            <p className="hidden text-xs text-slate-500 sm:block light:text-slate-500">
              Collaborative product initiative planning
            </p>
          </div>
        </div>

        <nav className="order-last flex w-full rounded-full border border-slate-700 bg-slate-800/60 p-1 md:order-none md:w-auto light:border-slate-300 light:bg-white">
          {PAGES.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => onPageChange(key)}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-full px-2 py-1.5 sm:px-3 text-sm font-medium transition md:flex-none ${
                page === key
                  ? 'bg-brand-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-100 light:text-slate-500 light:hover:text-slate-800'
              }`}
            >
              <Icon size={15} className="hidden min-[400px]:block" />
              {label}
            </button>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          {dbConnected !== null && (
            <span
              title={dbConnected ? 'Live — changes are saved and synced' : "Not connected — changes won't be saved"}
              className={`hidden items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-xs font-medium lg:flex ${
                dbConnected
                  ? 'border-brand-600/30 text-brand-500 light:border-brand-600/30 light:text-brand-700'
                  : 'border-amber-500/40 text-amber-500'
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${dbConnected ? 'bg-brand-500' : 'bg-amber-500'}`} />
              {dbConnected ? 'Live' : 'Local only'}
            </span>
          )}
          {access.status === 'signedIn' && !access.canEdit && (
            <span className="hidden rounded-full border border-slate-700 px-2.5 py-1.5 text-xs text-slate-400 sm:inline light:border-slate-300">
              View only
            </span>
          )}
          <button
            type="button"
            onClick={onToggleTheme}
            aria-label="Toggle theme"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-700 bg-slate-800/60 text-slate-300 hover:border-slate-600 hover:text-slate-100 light:border-slate-300 light:bg-white light:text-slate-600 light:hover:border-slate-400 light:hover:text-slate-800"
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <MoreMenu
            archivedCount={archivedCount}
            onOpenArchive={onOpenArchive}
            onExportCsv={onExportCsv}
            onImportCsv={onImportCsv}
            access={access}
          />
          {onNewInitiative && (
            <button
              type="button"
              onClick={onNewInitiative}
              aria-label="New Initiative"
              className="flex h-9 items-center gap-1.5 rounded-full bg-brand-600 px-2.5 py-2 text-sm font-medium text-white shadow-lg shadow-brand-600/25 transition hover:bg-brand-500 active:bg-brand-700 sm:px-3.5"
            >
              <Plus size={16} />
              <span className="hidden sm:inline">New Initiative</span>
              <span className="hidden min-[400px]:inline sm:hidden">New</span>
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
