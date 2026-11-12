import { useLayoutEffect, useRef } from 'react'
import { studies } from '../data'
import { gsap, MOTION_QUERY } from '../motion'
import { Photo } from './Photo'

export function Studies() {
  const root = useRef<HTMLElement>(null)

  useLayoutEffect(() => {
    const el = root.current!
    const mm = gsap.matchMedia()
    mm.add(MOTION_QUERY, () => {
      el.querySelectorAll<HTMLElement>('.study').forEach((fig, i) => {
        const frame = fig.querySelector('.study__frame')
        const img = fig.querySelector('.photo')
        gsap.fromTo(frame, { clipPath: 'inset(100% 0% 0% 0%)' }, {
          clipPath: 'inset(0% 0% 0% 0%)', duration: 1.1, ease: 'expo.inOut', delay: (i % 2) * 0.08,
          scrollTrigger: { trigger: fig, start: 'top 85%', once: true },
        })
        gsap.from(fig.querySelector('figcaption'), {
          autoAlpha: 0, y: 12, duration: 0.7, ease: 'power3.out',
          scrollTrigger: { trigger: fig, start: 'top 80%', once: true },
        })
        // restrained parallax inside the frame
        gsap.fromTo(img, { yPercent: -6 }, {
          yPercent: 6, ease: 'none',
          scrollTrigger: { trigger: fig, start: 'top bottom', end: 'bottom top', scrub: true },
        })
      })
      gsap.from(el.querySelectorAll('.studies__title .st-in'), {
        yPercent: 110, y: 0, duration: 0.9, stagger: 0.08, ease: 'expo.out',
        scrollTrigger: { trigger: el, start: 'top 75%', once: true },
      })
    })
    return () => mm.revert()
  }, [])

  return (
    <section ref={root} id="studies" className="studies" aria-labelledby="studies-title">
      <header className="studies__head">
        <p className="kicker">Selected work / Finish studies</p>
        <h2 id="studies-title" className="display studies__title">
          <span className="st"><span className="st-in">Finish</span></span>{' '}
          <span className="st"><span className="st-in">studies.</span></span>
        </h2>
        <p className="studies__note">
          Production capabilities, close up. These are process studies, not client projects.
          Photography is temporary and will be replaced with work shot in the studio.
        </p>
      </header>
      <div className="studies__grid">
        {studies.map((s) => (
          <figure key={s.code} className={`study study--${s.size}`}>
            <div className="study__frame">
              <Photo
                photo={s.photo}
                widths={s.size === 'xl' ? [700, 1100, 1600] : [500, 800, 1100]}
                sizes={s.size === 'xl' ? '(min-width: 1024px) 62vw, 100vw' : '(min-width: 1024px) 34vw, 100vw'}
              />
            </div>
            <figcaption>
              <span className="study__code">{s.code}</span>
              <span className="study__title">{s.title}</span>
              <span className="study__note">{s.note}</span>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  )
}
