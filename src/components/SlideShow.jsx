import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import Legend from './Legend'

// Full-screen, one-section-per-slide presentation of the stakeholder page.
// Arrow keys / space / click to move, Esc to close.
export default function SlideShow({ slides, year, onClose }) {
  const [index, setIndex] = useState(0)
  const rootRef = useRef(null)
  const last = slides.length - 1
  const go = useCallback((delta) => setIndex((i) => Math.min(last, Math.max(0, i + delta))), [last])

  useEffect(() => {
    const el = rootRef.current
    el?.requestFullscreen?.().catch(() => {})
    function onKey(e) {
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {
        e.preventDefault()
        go(1)
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault()
        go(-1)
      } else if (e.key === 'Escape') onClose()
    }
    // Leaving browser full screen (Esc) also closes the slides.
    function onFullscreenChange() {
      if (!document.fullscreenElement) onClose()
    }
    window.addEventListener('keydown', onKey)
    document.addEventListener('fullscreenchange', onFullscreenChange)
    return () => {
      window.removeEventListener('keydown', onKey)
      document.removeEventListener('fullscreenchange', onFullscreenChange)
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {})
    }
  }, [go, onClose])

  const slide = slides[index]

  return (
    <div ref={rootRef} className="light fixed inset-0 z-[100] flex flex-col bg-white text-slate-900">
      <div className="flex items-center justify-between border-b border-slate-200 px-6 py-3 text-sm text-slate-500">
        <span>Product Roadmap {year}</span>
        <div className="flex items-center gap-3">
          <span className="tabular-nums">
            {index + 1} / {slides.length}
          </span>
          <button type="button" onClick={onClose} aria-label="Close slides" className="rounded-full p-1.5 hover:bg-slate-100">
            <X size={18} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto px-6 py-6 sm:px-12 sm:py-8">
        <div className="mx-auto max-w-[1400px]">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-2">
            <h2 className={`${slide.intro ? 'text-4xl' : 'text-3xl'} font-semibold tracking-tight`}>{slide.title}</h2>
            {!slide.intro && <Legend />}
          </div>
          <div className={slide.intro ? 'text-lg' : ''}>{slide.body}</div>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-slate-200 px-6 py-3">
        <button
          type="button"
          onClick={() => go(-1)}
          disabled={index === 0}
          className="flex items-center gap-1 rounded-full px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 disabled:opacity-30"
        >
          <ChevronLeft size={16} /> Previous
        </button>
        <div className="flex gap-1.5">
          {slides.map((s, i) => (
            <button
              key={s.title}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Go to slide ${i + 1}: ${s.title}`}
              className={`h-2 rounded-full transition-all ${i === index ? 'w-6 bg-brand-600' : 'w-2 bg-slate-300'}`}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={() => go(1)}
          disabled={index === last}
          className="flex items-center gap-1 rounded-full px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 disabled:opacity-30"
        >
          Next <ChevronRight size={16} />
        </button>
      </div>
    </div>
  )
}
