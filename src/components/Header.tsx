import { useEffect, useRef, useState } from 'react'
import { Arrow } from './Arrow'

const links = [
  { href: '#studies', label: 'Work' },
  { href: '#services', label: 'Services' },
  { href: '#process', label: 'About' },
]

export function Header() {
  const [open, setOpen] = useState(false)
  const btn = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setOpen(false); btn.current?.focus() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <header className="site-header">
      <a className="skip" href="#main">Skip to content</a>
      <div className="site-header__inner">
        <a className="wordmark" href="#top" aria-label="The T-Shirt Guy, back to top">The T-Shirt Guy</a>
        <nav className="site-nav" aria-label="Primary">
          <button
            ref={btn}
            className="site-nav__toggle"
            aria-expanded={open}
            aria-controls="site-nav-list"
            onClick={() => setOpen((o) => !o)}
          >
            {open ? 'Close' : 'Menu'}
          </button>
          <ul id="site-nav-list" className={`site-nav__list ${open ? 'is-open' : ''}`}>
            {links.map((l) => (
              <li key={l.href}><a href={l.href} onClick={() => setOpen(false)}>{l.label}</a></li>
            ))}
          </ul>
        </nav>
        <a className="btn btn--lime site-header__cta" href="#enquiry">
          <span>Start a project</span> <Arrow />
        </a>
      </div>
    </header>
  )
}
