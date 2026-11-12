import { useLayoutEffect, useRef, useState } from 'react'
import { studies, unsplash } from '../data'
import { gsap, PINNED_QUERY } from '../motion'
import { createReel } from '../reel'

/**
 * Desktop-only scroll reel for the finish studies (pinned, WebGL).
 * While it is running the section gets `.studies--reel`, which hides the static grid.
 * If WebGL is unavailable, or on phones / reduced motion, the grid is used instead.
 */
export function StudiesReel() {
  const root = useRef<HTMLDivElement>(null)
  const slot = useRef<HTMLDivElement>(null)
  const [front, setFront] = useState(0)

  useLayoutEffect(() => {
    const mm = gsap.matchMedia()
    mm.add(PINNED_QUERY, () => {
      const el = root.current
      // the parent section's ref isn't attached yet when this child effect runs, so look it up
      const sec = el?.closest('section') as HTMLElement | null
      if (!el || !sec || !slot.current) return
      // fresh canvas per run: a disposed WebGL context can't be reused (e.g. StrictMode remount)
      const cv = document.createElement('canvas')
      cv.className = 'reel__canvas'
      cv.setAttribute('role', 'img')
      cv.setAttribute('aria-label', 'Finish study photographs shown in sequence; the caption names the one in front.')
      slot.current.appendChild(cv)
      const reel = createReel({ canvas: cv, urls: studies.map((s) => unsplash(s.photo.id, 720, 850)) })
      if (!reel) { cv.remove(); return }
      sec.classList.add('studies--reel')

      const q = gsap.utils.selector(el)
      const n = studies.length
      const state = { p: 0 }
      let shown = -1
      const draw = () => {
        reel.render(state.p)
        const i = Math.round(state.p * (n - 1))
        if (i !== shown) { shown = i; setFront(i) }
        // glint travelling round the ring, tied to the reel's turn
        gsap.set(q('.reel-ring__glint'), { strokeDashoffset: -state.p * 2.2 })
      }
      const headerH = () => (document.querySelector('.site-header') as HTMLElement | null)?.offsetHeight ?? 0

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: el,
          start: () => 'top top+=' + headerH(),
          end: () => '+=' + Math.round(window.innerHeight * 1.7),
          pin: true,
          scrub: 0.7,
          invalidateOnRefresh: true,
          onRefresh: () => draw(),
        },
      })
      tl.to(state, { p: 1, ease: 'none', duration: 1, onUpdate: draw }, 0)
        .fromTo(q('.reel__word--a'), { xPercent: 0 }, { xPercent: -6, ease: 'none', duration: 1 }, 0)
        .fromTo(q('.reel__word--b'), { xPercent: 0 }, { xPercent: 6, ease: 'none', duration: 1 }, 0)

      // entrance: the reel and type rise in once as the section arrives
      const intro = gsap.timeline({ scrollTrigger: { trigger: el, start: 'top 75%', once: true } })
      intro.fromTo(q('.reel__word .st-in'), { yPercent: 110, y: 0 }, { yPercent: 0, y: 0, duration: 1, stagger: 0.1, ease: 'expo.out' })
        .fromTo(cv, { autoAlpha: 0, y: 60 }, { autoAlpha: 1, y: 0, duration: 1.2, ease: 'expo.out' }, 0.1)
        .fromTo(q('.reel-ring'), { autoAlpha: 0 }, { autoAlpha: 1, duration: 1 }, 0.4)

      const ro = new ResizeObserver(() => reel.resize())
      ro.observe(cv)
      draw()

      return () => {
        ro.disconnect()
        intro.scrollTrigger?.kill(); intro.kill()
        tl.scrollTrigger?.kill(); tl.kill()
        reel.dispose()
        cv.remove()
        sec.classList.remove('studies--reel')
      }
    })
    return () => mm.revert()
  }, [])

  const s = studies[front]
  const ring = (
    <svg viewBox="-100 -40 200 80" preserveAspectRatio="none">
      <ellipse cx="0" cy="0" rx="96" ry="30" pathLength={1} className="reel-ring__line" />
      <ellipse cx="0" cy="0" rx="96" ry="30" pathLength={1} className="reel-ring__glint" />
    </svg>
  )

  return (
    <div className="reel" ref={root} aria-label="Finish studies reel">
      <p className="kicker reel__kicker">Selected work / Finish studies</p>
      <h2 className="reel__title display" aria-hidden="true">
        <span className="reel__word reel__word--a"><span className="st"><span className="st-in">Finish</span></span></span>
        <span className="reel__word reel__word--b"><span className="st"><span className="st-in">studies.</span></span></span>
      </h2>
      {/* back half of the ring sits behind the cards, front half passes over them */}
      <div className="reel-ring reel-ring--back" aria-hidden="true">{ring}</div>
      <div className="reel__slot" ref={slot} />
      <div className="reel-ring reel-ring--front" aria-hidden="true">{ring}</div>

      <div className="reel__caption" aria-live="polite">
        <span className="reel__count">{String(front + 1).padStart(2, '0')} / {String(studies.length).padStart(2, '0')}</span>
        <span className="study__code">{s.code}</span>
        <span className="reel__name">{s.title}</span>
        <span className="reel__note">{s.note}</span>
      </div>
      <p className="reel__disclaimer">
        Process studies, not client projects. Temporary photography, to be replaced with work shot in the studio.
      </p>
    </div>
  )
}
