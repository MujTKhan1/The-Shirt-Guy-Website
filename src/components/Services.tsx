import { useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react'
import { services, supporting } from '../data'
import { gsap, MOTION_QUERY } from '../motion'
import { Photo } from './Photo'

export function Services() {
  const [active, setActive] = useState(0)
  const prev = useRef(0)
  const tabs = useRef<(HTMLButtonElement | null)[]>([])
  const media = useRef<HTMLDivElement>(null)
  const copy = useRef<HTMLDivElement>(null)
  const section = useRef<HTMLElement>(null)
  const hoverTimer = useRef<number | undefined>(undefined)

  // crossfade between service states: ink-style wipe on the incoming image, text slides up
  useLayoutEffect(() => {
    const frames = media.current?.querySelectorAll<HTMLElement>('.svc-media__frame')
    if (!frames) return
    const from = prev.current
    prev.current = active
    const reduce = !window.matchMedia(MOTION_QUERY).matches
    frames.forEach((f, i) => {
      gsap.killTweensOf(f)
      f.style.zIndex = i === active ? '3' : i === from ? '2' : '1'
    })
    const incoming = frames[active]
    if (reduce || from === active) {
      gsap.set(frames, { clipPath: 'inset(0% 0% 0% 100%)' })
      gsap.set(incoming, { clipPath: 'inset(0% 0% 0% 0%)' })
      return
    }
    const dir = active > from ? 1 : -1
    gsap.fromTo(
      incoming,
      { clipPath: dir > 0 ? 'inset(100% 0% 0% 0%)' : 'inset(0% 0% 100% 0%)' },
      { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.85, ease: 'expo.inOut', onComplete: () => {
        frames.forEach((f, i) => { if (i !== active) gsap.set(f, { clipPath: 'inset(0% 0% 0% 100%)' }) })
      } },
    )
    gsap.fromTo(incoming.querySelector('img'), { scale: 1.14 }, { scale: 1, duration: 1.3, ease: 'expo.out' })
    if (copy.current) gsap.fromTo(copy.current.children, { y: 18, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.6, stagger: 0.05, ease: 'power3.out' })
  }, [active])

  // entrance reveal for the index
  useLayoutEffect(() => {
    const mm = gsap.matchMedia()
    mm.add(MOTION_QUERY, () => {
      const el = section.current!
      gsap.from(el.querySelectorAll('.svc-tab'), {
        yPercent: 60, autoAlpha: 0, duration: 0.8, stagger: 0.06, ease: 'expo.out',
        scrollTrigger: { trigger: el.querySelector('.svc-list'), start: 'top 80%', once: true },
      })
    })
    return () => mm.revert()
  }, [])

  const onKey = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    const last = services.length - 1
    let next = -1
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') next = i === last ? 0 : i + 1
    if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') next = i === 0 ? last : i - 1
    if (e.key === 'Home') next = 0
    if (e.key === 'End') next = last
    if (next >= 0) {
      e.preventDefault()
      setActive(next)
      tabs.current[next]?.focus()
    }
  }

  const s = services[active]

  return (
    <section ref={section} id="services" className="services section--dark" aria-labelledby="services-title">
      <div className="services__head">
        <p className="kicker">Capabilities</p>
        <h2 id="services-title" className="display services__title">Pick your<br />process.</h2>
        <p className="services__intro">Choose a process to see how it works. Every one runs through the same production team.</p>
      </div>

      <div className="services__body">
        <div className="svc-list" role="tablist" aria-orientation="vertical" aria-label="Production services">
          {services.map((sv, i) => (
            <button
              key={sv.num}
              ref={(b) => { tabs.current[i] = b }}
              role="tab"
              id={`svc-tab-${i}`}
              aria-selected={i === active}
              aria-controls="svc-panel"
              tabIndex={i === active ? 0 : -1}
              className="svc-tab"
              onClick={() => setActive(i)}
              onKeyDown={(e) => onKey(e, i)}
              onPointerEnter={(e) => {
                if (e.pointerType !== 'mouse') return
                window.clearTimeout(hoverTimer.current)
                hoverTimer.current = window.setTimeout(() => setActive(i), 140)
              }}
              onPointerLeave={() => window.clearTimeout(hoverTimer.current)}
            >
              <span className="svc-tab__num">{sv.num}</span>
              <span className="svc-tab__name">{sv.name}</span>
              <span className="svc-tab__mark" aria-hidden="true" />
            </button>
          ))}
        </div>

        <div className="svc-panel" id="svc-panel" role="tabpanel" aria-labelledby={`svc-tab-${active}`}>
          <div className="svc-media" ref={media}>
            {services.map((sv, i) => (
              <div key={sv.num} className="svc-media__frame" aria-hidden={i !== active} style={{ clipPath: i === 0 ? 'inset(0% 0% 0% 0%)' : 'inset(0% 0% 0% 100%)' }}>
                <Photo photo={sv.photo} widths={[600, 900, 1300]} sizes="(min-width: 1024px) 44vw, 100vw" ratio={5 / 4} />
              </div>
            ))}
            <span className="svc-media__num" aria-hidden="true">{s.num}</span>
          </div>
          <div className="svc-copy" ref={copy} aria-live="polite">
            <h3 className="svc-copy__title">{s.name}</h3>
            <p>{s.body}</p>
          </div>
        </div>
      </div>

      <div className="services__support">
        <p className="kicker">Also in the studio</p>
        <ul>
          {supporting.map((x) => <li key={x}>{x}</li>)}
        </ul>
        <p className="services__support-note">From first sketch to print-ready artwork, with direction on garments, colour and finish.</p>
      </div>
    </section>
  )
}
