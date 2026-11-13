import { Archive, Map, Moon, Plus, Sun } from 'lucide-react'

export default function Header({
  theme,
  onToggleTheme,
  onNewInitiative,
  archivedCount,
  onOpenArchive,
  dbConnected,
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/80 backdrop-blur light:border-slate-200 light:bg-white/80">
      <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-3 px-4 py-3 sm:gap-4 sm:px-6 sm:py-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-lg shadow-brand-600/20">
            <Map size={18} />
          </div>
          <div>
            <h1 className="whitespace-nowrap text-lg font-semibold tracking-tight text-slate-100 light:text-slate-900">
              PM Roadmap
            </h1>
            <p className="hidden text-xs text-slate-500 sm:block light:text-slate-500">
              Collaborative product initiative planning
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {dbConnected !== null && (
            <span
              title={
                dbConnected
                  ? 'Connected to the database — changes are saved'
                  : "Not connected to a database — changes won't be saved"
              }
              className={`hidden items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-xs font-medium sm:flex ${
                dbConnected
                  ? 'border-brand-600/30 text-brand-500 light:border-brand-600/30 light:text-brand-700'
                  : 'border-amber-500/40 text-amber-500'
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${dbConnected ? 'bg-brand-500' : 'bg-amber-500'}`} />
              {dbConnected ? 'Saved' : 'Local only'}
            </span>
          )}
          <button
            type="button"
            onClick={onOpenArchive}
            aria-label="Archived"
            className="flex h-9 items-center gap-1.5 rounded-full border border-slate-700 bg-slate-800/60 px-2.5 py-2 sm:px-3 text-sm text-slate-300 hover:border-slate-600 hover:text-slate-100 light:border-slate-300 light:bg-white light:text-slate-600 light:hover:border-slate-400 light:hover:text-slate-800"
          >
            <Archive size={15} />
            <span className="hidden sm:inline">Archived</span>
            {archivedCount > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-slate-700 px-1 text-xs font-semibold text-slate-200 light:bg-slate-200 light:text-slate-700">
                {archivedCount}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={onToggleTheme}
            aria-label="Toggle theme"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-700 bg-slate-800/60 text-slate-300 hover:border-slate-600 hover:text-slate-100 light:border-slate-300 light:bg-white light:text-slate-600 light:hover:border-slate-400 light:hover:text-slate-800"
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <button
            type="button"
            onClick={onNewInitiative}
            aria-label="New Initiative"
            className="flex h-9 items-center gap-1.5 rounded-full bg-brand-600 px-2.5 py-2 sm:px-3.5 text-sm font-medium text-white shadow-lg shadow-brand-600/25 transition hover:bg-brand-500 active:bg-brand-700"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">New Initiative</span>
            <span className="sm:hidden">New</span>
          </button>
        </div>
      </div>
    </header>
  )
}
