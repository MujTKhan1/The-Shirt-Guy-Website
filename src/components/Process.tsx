import { useLayoutEffect, useRef } from 'react'
import { clients, processPhotos } from '../data'
import { gsap, MOTION_QUERY } from '../motion'
import { Photo } from './Photo'

const steps = [
  { n: '01', t: 'Artwork', d: 'Graphic design and creative direction to get your idea print-ready.' },
  { n: '02', t: 'Print', d: 'Screen, DTF or DTG, matched to the artwork and the quantity.' },
  { n: '03', t: 'Finish', d: 'Embroidery, garment dyeing and labelling.' },
  { n: '04', t: 'Pack', d: 'Packing and fulfilment for orders of all sizes.' },
]

export function Process() {
  const root = useRef<HTMLElement>(null)

  useLayoutEffect(() => {
    const el = root.current!
    const mm = gsap.matchMedia()
    mm.add(MOTION_QUERY, () => {
      gsap.from(el.querySelectorAll('.process__title .st-in'), {
        yPercent: 110, y: 0, duration: 0.9, stagger: 0.08, ease: 'expo.out',
        scrollTrigger: { trigger: el, start: 'top 70%', once: true },
      })
      gsap.from(el.querySelectorAll('.step'), {
        autoAlpha: 0, y: 24, duration: 0.7, stagger: 0.1, ease: 'power3.out',
        scrollTrigger: { trigger: el.querySelector('.steps'), start: 'top 80%', once: true },
      })
      gsap.from(el.querySelectorAll('.steps__rule'), {
        scaleX: 0, transformOrigin: '0 50%', duration: 1.4, ease: 'expo.inOut',
        scrollTrigger: { trigger: el.querySelector('.steps'), start: 'top 80%', once: true },
      })
      gsap.from(el.querySelectorAll('.fact'), {
        autoAlpha: 0, y: 30, duration: 0.8, stagger: 0.1, ease: 'expo.out',
        scrollTrigger: { trigger: el.querySelector('.facts'), start: 'top 85%', once: true },
      })
      el.querySelectorAll<HTMLElement>('.process__img').forEach((f) => {
        gsap.fromTo(f, { clipPath: 'inset(0% 100% 0% 0%)' }, {
          clipPath: 'inset(0% 0% 0% 0%)', duration: 1.2, ease: 'expo.inOut',
          scrollTrigger: { trigger: f, start: 'top 85%', once: true },
        })
        gsap.fromTo(f.querySelector('.photo'), { yPercent: -5 }, {
          yPercent: 5, ease: 'none', scrollTrigger: { trigger: f, start: 'top bottom', end: 'bottom top', scrub: true },
        })
      })
    })
    return () => mm.revert()
  }, [])

  return (
    <section ref={root} id="process" className="process section--dark" aria-labelledby="process-title">
      <div className="process__intro">
        <p className="kicker">About / Under one roof</p>
        <h2 id="process-title" className="display process__title">
          <span className="st"><span className="st-in">Artwork to</span></span>{' '}
          <span className="st"><span className="st-in">packed box.</span></span>
        </h2>
        <p className="process__lede">
          Design, printing, finishing and packing are handled by one team, so your brief isn't
          passed between suppliers on its way from artwork to delivery.
        </p>
      </div>

      <div className="process__media">
        <figure className="process__img process__img--a">
          <Photo photo={processPhotos.floor} widths={[700, 1100, 1600]} sizes="(min-width: 1024px) 58vw, 100vw" ratio={16 / 11} />
        </figure>
        <figure className="process__img process__img--b">
          <Photo photo={processPhotos.embroidery} widths={[500, 800]} sizes="(min-width: 1024px) 28vw, 60vw" ratio={4 / 5} />
        </figure>
      </div>

      <ol className="steps">
        <span className="steps__rule" aria-hidden="true" />
        {steps.map((s) => (
          <li key={s.n} className="step">
            <span className="step__n">{s.n}</span>
            <h3 className="step__t">{s.t}</h3>
            <p>{s.d}</p>
          </li>
        ))}
      </ol>

      <dl className="facts">
        <div className="fact">
          <dt>Garments produced a year</dt>
          <dd><span className="fact__v">1.25</span><span className="fact__u">million</span></dd>
        </div>
        <div className="fact">
          <dt>Experience in printing and manufacturing</dt>
          <dd><span className="fact__v">15</span><span className="fact__u">years</span></dd>
        </div>
        <div className="fact">
          <dt>Turnaround</dt>
          <dd><span className="fact__u fact__u--pre">from</span><span className="fact__v">7</span><span className="fact__u">days*</span></dd>
        </div>
      </dl>
      <p className="facts__note">
        *Turnaround starts from seven days. Lead times depend on quantity, process and garment
        availability, and we'll confirm yours when we quote.
      </p>

      <div className="clients-row">
        <p className="kicker">Clients listed on our current site</p>
        <ul>{clients.map((c) => <li key={c}>{c}</li>)}</ul>
      </div>
    </section>
  )
}
