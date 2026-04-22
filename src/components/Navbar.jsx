import { useEffect, useState } from 'react'

const links = [
  { label: 'How it Works', href: '#how' },
  { label: 'Analyze', href: '#audit' },
  { label: 'About', href: '#about' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > window.innerHeight * 0.6)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={[
        'fixed top-0 left-0 right-0 z-[9998]',
        'bg-jscolors-void/80 backdrop-blur-[20px]',
        scrolled ? 'border-none' : 'border-none',
      ].join(' ')}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <a href="#top" className="flex items-center gap-2">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-jscolors-rim bg-jscolors-surface text-jscolors-accent-violet font-mono text-sm">
            FL
          </span>
          <span className="text-[18px] font-bold tracking-[0.02em] text-jscolors-accent-violet">
            FAIRLENS
          </span>
        </a>

        <nav className="hidden items-center gap-6 md:flex">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-[14px] text-jscolors-text-secondary transition duration-200 hover:text-jscolors-text-primary"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <a
          href="#audit"
          className="btn border border-jscolors-accent-violet bg-transparent text-jscolors-text-primary hover:bg-jscolors-accent-violet/15"
        >
          Start Audit
        </a>
      </div>
    </header>
  )
}

