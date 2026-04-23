/*
 * Scientific-instrument corner markers + live coordinate ticker.
 * Fixed to the viewport; purely decorative.
 *
 * The top-row markers fade away once the page has scrolled past the hero,
 * because the floating glass navbar lives in the same region.
 */
import { useEffect, useState } from 'react'

function Corner({ pos }) {
  const common = 'absolute h-[14px] w-[14px] border-white/25'
  const map = {
    tl: 'top-3 left-3 border-t border-l',
    tr: 'top-3 right-3 border-t border-r',
    bl: 'bottom-3 left-3 border-b border-l',
    br: 'bottom-3 right-3 border-b border-r',
  }
  return <div aria-hidden="true" className={`${common} ${map[pos]}`} />
}

export default function FrameMarks() {
  const [clock, setClock] = useState('')
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const tick = () => {
      const d = new Date()
      const hh = String(d.getUTCHours()).padStart(2, '0')
      const mm = String(d.getUTCMinutes()).padStart(2, '0')
      const ss = String(d.getUTCSeconds()).padStart(2, '0')
      setClock(`${hh}:${mm}:${ss} UTC`)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[50]">
      {/* Corner ticks — always on */}
      <Corner pos="tl" />
      <Corner pos="tr" />
      <Corner pos="bl" />
      <Corner pos="br" />

      {/* Top-row texts fade once the glass navbar pill appears, to avoid overlap */}
      <div
        className="absolute top-5 left-[200px] font-mono text-[10px] tracking-[0.3em] text-white/35 transition-opacity duration-500 hidden md:block"
        style={{ opacity: scrolled ? 0 : 1 }}
      >
        N 00°00′ · W 00°00′
      </div>
      <div
        className="absolute top-5 right-[160px] font-mono text-[10px] tracking-[0.3em] text-white/35 tabular transition-opacity duration-500 hidden md:block"
        style={{ opacity: scrolled ? 0 : 1 }}
      >
        {clock}
      </div>

      {/* Bottom-row texts — pinned in safe margins */}
      <div className="absolute bottom-5 left-6 font-mono text-[9px] md:text-[10px] tracking-[0.28em] text-white/30 md:left-10">
        FLX-Δ-024 · REV 04
      </div>
      <div className="absolute bottom-5 right-6 flex items-center gap-2 font-mono text-[9px] md:text-[10px] tracking-[0.28em] text-white/35 md:right-10">
        <span
          className="inline-block h-[6px] w-[6px] rounded-full"
          style={{ background: '#6EE7C4', boxShadow: '0 0 8px #6EE7C4' }}
        />
        <span className="hidden sm:inline">INSTRUMENT · ONLINE</span>
        <span className="sm:hidden">ONLINE</span>
      </div>
    </div>
  )
}
