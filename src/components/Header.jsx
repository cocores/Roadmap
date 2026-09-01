import { Map, Moon, Plus, Sun } from 'lucide-react'

export default function Header({ theme, onToggleTheme, onNewInitiative }) {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/80 backdrop-blur light:border-slate-200 light:bg-white/80">
      <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/20">
            <Map size={18} />
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-slate-100 light:text-slate-900">
              PM Roadmap
            </h1>
            <p className="text-xs text-slate-500 light:text-slate-500">
              Collaborative product initiative planning
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleTheme}
            aria-label="Toggle theme"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700 bg-slate-800/60 text-slate-300 hover:border-slate-600 hover:text-slate-100 light:border-slate-300 light:bg-white light:text-slate-600 light:hover:border-slate-400"
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <button
            type="button"
            onClick={onNewInitiative}
            className="flex items-center gap-1.5 rounded-lg bg-indigo-500 px-3.5 py-2 text-sm font-medium text-white shadow-lg shadow-indigo-500/25 transition hover:bg-indigo-400 active:bg-indigo-600"
          >
            <Plus size={16} />
            New Initiative
          </button>
        </div>
      </div>
    </header>
  )
}
