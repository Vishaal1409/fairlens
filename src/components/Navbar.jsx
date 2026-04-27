import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

const links = [
  { label: 'Method',   href: '#how' },
  { label: 'Audit',    href: '#audit' },
  { label: 'Mitigate', href: '#mitigate' },
  { label: 'About',    href: '#about' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={[
        'fixed top-0 left-0 right-0 z-[9998] transition-all duration-500',
      ].join(' ')}
    >
      <div
        className={[
          'relative mx-auto flex items-center justify-between gap-6 px-5 transition-all duration-500',
          scrolled ? 'mt-3 max-w-[1180px]' : 'mt-0 max-w-none',
        ].join(' ')}
      >
        <nav
          className={[
            'relative flex w-full items-center justify-between transition-all duration-500',
            scrolled
              ? 'glass h-[52px] rounded-full px-5 shadow-glass-bloom'
              : 'h-16 border-b border-white/[0.04] bg-obs-void/60 px-1 backdrop-blur-md',
          ].join(' ')}
        >
          {/* Mark */}
          <a
            href="/"
            className="flex items-center gap-3"
            aria-label="FAIRLENS — return to home"
          >
            <span className="relative inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-obs-void/70">
              <span className="absolute inset-[5px] rounded-full border border-obs-cerulean/50" />
              <span className="h-1.5 w-1.5 rounded-full bg-obs-cerulean shadow-[0_0_10px_#5BC0EB]" />
            </span>
            <span className="font-display text-[20px] leading-none text-obs-text">
              Fair<span className="italic text-obs-lumen">Lens</span>
            </span>
            <span className="hidden items-center gap-1.5 rounded-full border border-white/10 px-2.5 py-1 font-mono text-[9px] tracking-[0.3em] uppercase text-obs-dim md:inline-flex">
              <span className="block h-1 w-1 rounded-full bg-obs-aurora" style={{ animation: 'blink 1.8s infinite' }} />
              Live
            </span>
          </a>

          {/* Links */}
          <div className="hidden items-center gap-1 md:flex">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={(e) => {
                  e.preventDefault()
                  const target = l.href.replace('#', '')
                  const el = document.getElementById(target)
                  if (el) {
                    el.scrollIntoView({ behavior: 'smooth' })
                  } else {
                    window.location.href = '/' + l.href
                  }
                }}
                className="group relative px-3 py-2 text-[13px] text-obs-dim transition hover:text-obs-text"
              >
                <span className="relative">
                  {l.label}
                  <span className="absolute -bottom-1 left-0 h-px w-0 bg-obs-cerulean transition-all duration-300 group-hover:w-full" />
                </span>
              </a>
            ))}
            <Link
              to="/compare"
              className="group relative px-3 py-2 text-[13px] text-obs-dim transition hover:text-obs-cerulean"
            >
              <span className="relative">
                Compare
                <span className="absolute -bottom-1 left-0 h-px w-0 bg-obs-cerulean transition-all duration-300 group-hover:w-full" />
              </span>
            </Link>
          </div>

          {/* CTA */}
          <a
            href="#audit"
            onClick={(e) => {
              e.preventDefault()
              const el = document.getElementById('audit')
              if (el) {
                el.scrollIntoView({ behavior: 'smooth' })
              } else {
                window.location.href = '/#audit'
              }
            }}
             className="group inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-4 py-2 text-[12px] text-obs-text backdrop-blur-md transition hover:border-obs-cerulean/50 hover:bg-obs-cerulean/10"
          >
            <span className="font-mono tracking-[0.2em] uppercase">Start audit</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="transition-transform group-hover:translate-x-0.5">
              <path d="M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
        </nav>
      </div>
    </header>
  )
}
