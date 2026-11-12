import { useLayoutEffect, useRef } from 'react'
import { gsap, ScrollTrigger, PINNED_QUERY, MOTION_QUERY, FLOW_MOTION_QUERY } from '../motion'
import { Garment, GARMENT_W, GARMENT_H } from './Garment'
import { Arrow } from './Arrow'
import { Photo } from './Photo'
import { clients, processPhotos } from '../data'
import { bakeGarment } from '../bakeGarment'
import { createCloth, type Cloth } from '../cloth'

const stages = [
  {
    key: 'a',
    l1: 'It starts',
    l2: 'with a blank.',
    num: '01',
    name: 'Blank',
    meta: 'Every run begins as a plain garment, ready to be dyed, printed or stitched.',
  },
  {
    key: 'b',
    l1: 'Make',
    l2: 'your mark.',
    num: '02',
    name: 'Print',
    meta: 'Artwork goes down by screen, DTF or DTG, depending on the design and the quantity.',
  },
  {
    key: 'c',
    l1: 'Every detail.',
    l2: 'Considered.',
    num: '03',
    name: 'Finish',
    meta: 'Embroidery, labels and packing finish the job before anything leaves the building.',
  },
] as const

/** Neck label position inside the garment artwork (garment pixels). */
const LABEL = { x: 442, y: 80 }

function BrushStroke() {
  return (
    <svg className="brush" viewBox="0 0 600 150" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <filter id="brush-hero" x="-5%" y="-30%" width="110%" height="160%">
          <feTurbulence type="fractalNoise" baseFrequency="0.6 0.04" numOctaves="3" seed="11" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="26" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>
      <g filter="url(#brush-hero)" fill="var(--lime)">
        <path d="M12 58 C 120 40, 300 30, 590 34 L 586 104 C 380 118, 180 124, 20 118 Z" />
        <path d="M0 80 C 60 70, 110 66, 160 70 L 150 92 C 100 96, 40 98, 4 100 Z" opacity=".9" />
        <path d="M430 30 C 500 24, 560 26, 598 30 L 596 52 C 540 50, 480 50, 436 52 Z" opacity=".8" />
      </g>
    </svg>
  )
}

export function Story() {
  const root = useRef<HTMLElement>(null)

  useLayoutEffect(() => {
    const el = root.current
    if (!el) return
    const q = gsap.utils.selector(el)
    const mm = gsap.matchMedia()
    const html = document.documentElement

    // ---------- Hero entrance (any device with motion allowed) ----------
    mm.add(MOTION_QUERY, () => {
      const tl = gsap.timeline({ defaults: { ease: 'expo.out' } })
      tl.fromTo(q('.hero__title .line__in'), { yPercent: 108, y: 0 }, { yPercent: 0, y: 0, duration: 1, stagger: 0.08 })
        .from(q('.hero .brush'), { scaleX: 0, transformOrigin: '0% 50%', duration: 0.8, ease: 'power3.inOut' }, 0.35)
        .from(q('.hero__sub, .hero__cta'), { y: 16, autoAlpha: 0, duration: 0.7, stagger: 0.06 }, 0.3)
        .from(q('.garment-enter'), { y: 60, rotation: -6, autoAlpha: 0, scale: 0.94, duration: 1.3 }, 0.15)
        .from(q('.annot-line polyline'), { strokeDashoffset: 1, duration: 0.7, stagger: 0.08, ease: 'power2.inOut' }, 0.95)
        .from(q('.annot-line circle'), { scale: 0, transformOrigin: '50% 50%', duration: 0.4, stagger: 0.08 }, 1.05)
        .from(q('.annot'), { autoAlpha: 0, y: 8, duration: 0.6, stagger: 0.08 }, 1.15)
        .from(q('.clients li, .clients__label'), { autoAlpha: 0, y: 10, duration: 0.6, stagger: 0.03 }, 0.9)
      return () => tl.kill()
    })

    // ---------- Pointer drift on the hero garment (desktop pointer) ----------
    mm.add('(pointer: fine) and (prefers-reduced-motion: no-preference) and (min-width: 1024px)', () => {
      const tilt = q('.garment-tilt')[0] as HTMLElement
      if (!tilt) return
      gsap.set(tilt, { transformPerspective: 1200 })
      const rx = gsap.quickTo(tilt, 'rotationX', { duration: 1.1, ease: 'power3.out' })
      const ry = gsap.quickTo(tilt, 'rotationY', { duration: 1.1, ease: 'power3.out' })
      const tx = gsap.quickTo(tilt, 'x', { duration: 1.4, ease: 'power3.out' })
      const ty = gsap.quickTo(tilt, 'y', { duration: 1.4, ease: 'power3.out' })
      let active = true
      const onMove = (e: PointerEvent) => {
        if (e.pointerType !== 'mouse') return
        const k = active ? 1 : 0
        const nx = e.clientX / window.innerWidth - 0.5
        const ny = e.clientY / window.innerHeight - 0.5
        ry(nx * 9 * k)
        rx(-ny * 6 * k)
        tx(nx * 14 * k)
        ty(ny * 10 * k)
      }
      const st = ScrollTrigger.create({
        trigger: el,
        start: 'top top',
        end: '+=120',
        onUpdate: (self) => {
          const was = active
          active = self.progress < 0.99
          if (was && !active) { rx(0); ry(0); tx(0); ty(0) }
        },
      })
      window.addEventListener('pointermove', onMove, { passive: true })
      return () => {
        window.removeEventListener('pointermove', onMove)
        st.kill()
        gsap.set(tilt, { clearProps: 'transform' })
      }
    })

    // ---------- Signature pinned sequence (capable desktop only) ----------
    mm.add(PINNED_QUERY, () => {
      html.classList.add('is-pinned')
      const pin = q('.story__pin')[0] as HTMLElement
      const slot = q('.garment-slot')[0] as HTMLElement
      const move = q('.garment-move')[0] as HTMLElement

      // positions are recomputed on every ScrollTrigger refresh (resize, font load)
      const geo = () => {
        const W = pin.offsetWidth
        const H = pin.offsetHeight
        const cx = slot.offsetLeft + slot.offsetWidth / 2
        const cy = slot.offsetTop + slot.offsetHeight / 2
        return { W, H, cx, cy, w: slot.offsetWidth, h: slot.offsetHeight }
      }
      const STAGE_SCALE = () => Math.min(0.8, (window.innerHeight * 0.56) / geo().h)
      const ZOOM = 2.1
      const zoomX = () => {
        const g = geo()
        const lx = (LABEL.x / GARMENT_W) * g.w - g.w / 2
        return g.W * 0.36 - (g.cx + ZOOM * lx)
      }
      const zoomY = () => {
        const g = geo()
        const ly = (LABEL.y / GARMENT_H) * g.h - g.h / 2
        return g.H * 0.5 - (g.cy + ZOOM * ly)
      }

      const headerH = () => (document.querySelector('.site-header') as HTMLElement | null)?.offsetHeight ?? 0
      const strokes = q('.story .ink-stroke')
      // resting state for everything the timeline brings in later
      gsap.set(q('.stage-type .st-in'), { yPercent: 135, y: 0 })
      gsap.set(move, { x: 0, y: 0, scale: 1, rotation: 0 })
      gsap.set(q('.stage-meta, .stage-callout, .stage-progress, .stage-fade, .reg'), { autoAlpha: 0 })
      gsap.set(q('.stage-detail__cover'), { yPercent: 0 })
      gsap.set(q('.stage-detail'), { autoAlpha: 0 })
      // Scroll budget: the three stages take ~1.75 viewports; then the scene holds while the
      // Capabilities section (pulled up by a negative margin in CSS) slides over it for one
      // more frame-height. Nothing heavy animates during that overlap, only a dimming layer.
      const STAGES = 6.2 // timeline time at which stage C is complete
      const stagePx = () => window.innerHeight * 1.75
      const overlapPx = () => pin.offsetHeight
      const OVERLAP = STAGES * (overlapPx() / stagePx())
      const tl = gsap.timeline({
        defaults: { ease: 'power2.inOut', duration: 1 },
        scrollTrigger: {
          trigger: el,
          start: () => 'top top+=' + headerH(),
          end: () => '+=' + Math.round(stagePx() + overlapPx()),
          pin: pin,
          scrub: 0.8,
          invalidateOnRefresh: true,
          anticipatePin: 1,
        },
      })

      // Stage A: hero exits, garment travels to the centre, print strips back to the blank
      tl.addLabel('a', 0)
        .to(q('.hero__title .line'), { yPercent: -60, autoAlpha: 0, stagger: 0.06, duration: 0.7, ease: 'power2.in' }, 'a')
        .to(q('.hero__meta'), { y: -30, autoAlpha: 0, duration: 0.5, ease: 'power2.in' }, 'a')
        .to(q('.annots, .annot-lines'), { autoAlpha: 0, duration: 0.35 }, 'a')
        .to(q('.clients'), { autoAlpha: 0, y: 20, duration: 0.5 }, 'a')
        .to(move, {
          x: () => geo().W * 0.5 - geo().cx,
          y: () => geo().H * 0.53 - geo().cy,
          scale: STAGE_SCALE,
          rotation: 3,
          duration: 1.2,
        }, 'a')
        .to(strokes, { strokeDashoffset: -1, duration: 0.6, stagger: 0.08, ease: 'power1.in' }, 'a+=0.2')
        .fromTo(q('.reg'), { autoAlpha: 0, scale: 0.6 }, { autoAlpha: 1, scale: 1, duration: 0.5, stagger: 0.05 }, 'a+=0.6')
        .fromTo(q('.stage-type--a .st-in'), { yPercent: 135, y: 0 }, { yPercent: 0, y: 0, duration: 0.7, stagger: 0.12, ease: 'power3.out' }, 'a+=0.7')
        .fromTo(q('.stage-meta--a'), { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.5 }, 'a+=0.9')
        .fromTo(q('.stage-progress'), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4 }, 'a+=0.7')

      // Stage B: ink goes down across the fabric, squeegee pass
      tl.addLabel('b', 'a+=2')
        .to(q('.stage-type--a .st-in'), { yPercent: -135, duration: 0.5, stagger: 0.06, ease: 'power2.in' }, 'b')
        .to(q('.stage-meta--a'), { autoAlpha: 0, y: -12, duration: 0.4 }, 'b')
        .fromTo(q('.story .squeegee'), { autoAlpha: 0, y: 130 }, { autoAlpha: 1, y: 140, duration: 0.15, ease: 'none', immediateRender: false }, 'b+=0.2')
        .to(q('.story .squeegee'), { y: 500, duration: 1.1, ease: 'power1.inOut' }, 'b+=0.3')
        .to(q('.story .squeegee'), { autoAlpha: 0, duration: 0.15 }, 'b+=1.35')
        .fromTo(strokes, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.55, stagger: 0.28, ease: 'power1.inOut', immediateRender: false }, 'b+=0.3')
        .to(move, { rotation: -1, scale: () => STAGE_SCALE() * 1.06, duration: 1.4 }, 'b')
        .fromTo(q('.stage-type--b .st-in'), { yPercent: 135, y: 0 }, { yPercent: 0, y: 0, duration: 0.7, stagger: 0.12, ease: 'power3.out', immediateRender: false }, 'b+=0.35')
        .fromTo(q('.stage-meta--b'), { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.5, immediateRender: false }, 'b+=0.5')

      // Stage C: push in to the neck label, finish detail
      tl.addLabel('c', 'b+=2')
        .to(q('.stage-type--b .st-in'), { yPercent: -135, duration: 0.5, stagger: 0.06, ease: 'power2.in' }, 'c')
        .to(q('.stage-meta--b'), { autoAlpha: 0, y: -12, duration: 0.4 }, 'c')
        .to(move, { x: zoomX, y: zoomY, scale: ZOOM, rotation: 0, duration: 1.4, ease: 'power3.inOut' }, 'c')
        .to(q('.reg'), { autoAlpha: 0, duration: 0.4 }, 'c')
        .fromTo(q('.stage-type--c .st-in'), { yPercent: 135, y: 0 }, { yPercent: 0, y: 0, duration: 0.7, stagger: 0.12, ease: 'power3.out', immediateRender: false }, 'c+=0.5')
        .fromTo(q('.stage-meta--c'), { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.5, immediateRender: false }, 'c+=0.7')
        .fromTo(q('.stage-callout'), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4, immediateRender: false }, 'c+=1.1')
        .fromTo(q('.stage-callout line'), { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.5, immediateRender: false }, 'c+=1.1')
        .fromTo(q('.stage-detail'), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.01, immediateRender: false }, 'c+=0.59')
        .fromTo(q('.stage-detail__cover'), { yPercent: 0 }, { yPercent: -101, duration: 0.9, ease: 'power3.inOut', immediateRender: false }, 'c+=0.6')
        .fromTo(q('.stage-detail img'), { scale: 1.25 }, { scale: 1, duration: 1.3, ease: 'power2.out', immediateRender: false }, 'c+=0.6')

      // Hand-off: hold the finished scene and let the next section move over it
      tl.addLabel('out', STAGES)
        .fromTo(q('.stage-fade'), { autoAlpha: 0 }, { autoAlpha: 0.55, duration: OVERLAP, ease: 'none', immediateRender: false }, 'out')

      if (import.meta.env.DEV) (window as unknown as { __storyTl?: gsap.core.Timeline }).__storyTl = tl

      // progress + chapter ticks
      tl.fromTo(q('.stage-progress__bar'), { scaleX: 0 }, { scaleX: 1, ease: 'none', duration: STAGES, immediateRender: false }, 0)
      // Stage 3 runs on a pre-rendered bitmap of the finished shirt (see bakeGarment.ts)
      const tilt = q('.garment-tilt')[0] as HTMLElement
      const bakedImg = q('.garment-baked')[0] as HTMLImageElement
      const liveSvg = q('.garment-tilt .garment__svg')[0] as unknown as SVGSVGElement
      let bakedReady = false
      let bakedUrl: string | null = null
      let disposed = false
      // Hero cloth (WebGL) uses the same bitmap; it only runs while the hero is untouched by scroll
      let cloth: Cloth | null = null
      const syncBaked = () => {
        const t = tl.time()
        const on = bakedReady && t >= tl.labels.c - 0.02
        if (tilt.hasAttribute('data-baked') !== on) tilt.toggleAttribute('data-baked', on)
        cloth?.setActive(t < 0.02)
      }
      document.fonts.ready.then(async () => {
        if (disposed || !liveSvg || !bakedImg) return
        const url = await bakeGarment(liveSvg)
        if (!url || disposed) { if (url) URL.revokeObjectURL(url); return }
        bakedUrl = url
        bakedImg.src = url
        try { await bakedImg.decode() } catch { return }
        if (disposed) return
        bakedReady = true
        cloth = createCloth({
          host: tilt,
          box: liveSvg,
          image: bakedImg,
          interactive: window.matchMedia('(pointer: fine)').matches,
        })
        syncBaked()
      })

      const ticks = q('.stage-progress li')
      const bounds = [tl.labels.b, tl.labels.c]
      let current = -1
      tl.eventCallback('onUpdate', () => {
        syncBaked()
        const t = tl.time()
        const i = t < bounds[0] ? 0 : t < bounds[1] ? 1 : 2
        if (i !== current) {
          current = i
          ticks.forEach((li, j) => li.classList.toggle('is-on', j === i))
        }
      })

      return () => {
        disposed = true
        cloth?.dispose()
        cloth = null
        tilt.removeAttribute('data-baked')
        bakedImg.removeAttribute('src')
        if (bakedUrl) URL.revokeObjectURL(bakedUrl)
        html.classList.remove('is-pinned')
        tl.scrollTrigger?.kill()
        tl.kill()
      }
    })

    // ---------- Flow scenes (mobile, tablet, reduced motion stays static) ----------
    mm.add(FLOW_MOTION_QUERY, () => {
      const scenes = q('.flow-scene')
      const tweens: gsap.core.Animation[] = []
      scenes.forEach((scene) => {
        const s = gsap.utils.selector(scene)
        const tl = gsap.timeline({ scrollTrigger: { trigger: scene, start: 'top 78%', once: true } })
        tl.fromTo(s('.st-in'), { yPercent: 110, y: 0 }, { yPercent: 0, y: 0, duration: 0.8, stagger: 0.1, ease: 'expo.out' })
          .from(s('.flow-scene__meta'), { autoAlpha: 0, y: 14, duration: 0.6, ease: 'power2.out' }, 0.2)
        const ink = s('.ink-stroke')
        if (scene.dataset.scene === 'b' && ink.length) {
          tl.fromTo(ink, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.7, stagger: 0.22, ease: 'power1.inOut' }, 0.15)
        }
        const det = s('.flow-detail')
        if (det.length) tl.from(det, { clipPath: 'inset(100% 0% 0% 0%)', duration: 0.9, ease: 'power3.inOut' }, 0.2)
        tweens.push(tl)
      })
      return () => tweens.forEach((t) => { t.scrollTrigger?.kill(); t.kill() })
    })

    return () => mm.revert()
  }, [])

  return (
    <section ref={root} className="story" id="top" aria-labelledby="hero-title">
      <div className="story__pin">
        <div className="story__bg" aria-hidden="true" />

        <div className="hero">
          <h1 id="hero-title" className="hero__title">
            <span className="line"><span className="line__in">Your next</span></span>
            <span className="line"><span className="line__in">drop. Made</span></span>
            <span className="line line--brush">
              <span className="line__in"><BrushStroke />here.</span>
            </span>
          </h1>
          <div className="hero__meta">
            <p className="hero__sub">Garment printing, embroidery and finishing.</p>
            <a className="btn btn--lime btn--lg hero__cta" href="#enquiry">
              Start a project <Arrow />
            </a>
          </div>
        </div>

        <div className="garment-slot">
          <div className="garment-move">
            <div className="garment-enter">
              <div className="garment-tilt">
                <Garment withAnnotations priority printed />
                <img className="garment-baked" alt="" aria-hidden="true" decoding="async" />
              </div>
            </div>
          </div>
        </div>

        <div className="clients">
          <p className="clients__label">Clients listed on our current site</p>
          <ul>
            {clients.slice(0, 6).map((c) => <li key={c}>{c}</li>)}
          </ul>
        </div>

        {/* Pinned stage layers. Present in the DOM always; shown only in pinned mode. */}
        <div className="stage-ui" aria-hidden="true">
          <span className="reg reg--tl" /><span className="reg reg--tr" /><span className="reg reg--bl" /><span className="reg reg--br" />
        </div>
        <div className="stage-type-layer">
          <h2 className="sr-only">From blank to brand</h2>
          {stages.map((s) => (
            <p key={s.key} className={`stage-type stage-type--${s.key}`}>
              <span className="st st--1"><span className="st-in">{s.l1}</span></span>{' '}
              <span className="st st--2"><span className="st-in">{s.l2}</span></span>
            </p>
          ))}
        </div>
        <div className="stage-ui">
          {stages.map((s) => (
            <div key={s.key} className={`stage-meta stage-meta--${s.key}`}>
              <p className="stage-meta__tag"><span>{s.num}</span> / {s.name}</p>
              <p>{s.meta}</p>
              {s.key === 'b' && (
                <ul className="swatches" aria-label="Demo artwork inks">
                  <li><i style={{ background: '#EEE7D8' }} />Cream</li>
                  <li><i style={{ background: 'var(--lime)' }} />Acid lime</li>
                </ul>
              )}
            </div>
          ))}
          <div className="stage-callout" aria-hidden="true">
            <svg viewBox="0 0 120 60" preserveAspectRatio="none"><line x1="0" y1="60" x2="120" y2="0" pathLength={1} /></svg>
            <span>Woven neck label</span>
          </div>
          <figure className="stage-detail">
            <span className="stage-detail__cover" aria-hidden="true" />
            <Photo photo={processPhotos.detail} widths={[480, 800]} sizes="26vw" ratio={4 / 5} />
            <figcaption>Embroidery, stitched to finish</figcaption>
          </figure>
          <div className="stage-progress">
            <ol>
              {stages.map((s) => <li key={s.key}><span>{s.num}</span> {s.name}</li>)}
            </ol>
            <div className="stage-progress__track"><div className="stage-progress__bar" /></div>
          </div>
          <div className="stage-fade" />
        </div>
      </div>

      {/* Flowing version: mobile, tablet, reduced motion and no-pin fallback */}
      <div className="flow" aria-labelledby="flow-title">
        <h2 id="flow-title" className="kicker flow__kicker">From blank to brand</h2>
        {stages.map((s) => (
          <article key={s.key} className={`flow-scene flow-scene--${s.key}`} data-scene={s.key}>
            <div className="flow-scene__media">
              {s.key === 'a' && <Garment printed={false} label="A plain black heavyweight T-shirt before printing" />}
              {s.key === 'b' && <Garment printed label="The same T-shirt with a cream and lime print applied" />}
              {s.key === 'c' && (
                <>
                  <div className="flow-zoom"><Garment printed label="Close-up of the woven neck label inside the T-shirt" /></div>
                  <figure className="flow-detail">
                    <Photo photo={processPhotos.detail} widths={[400, 700]} sizes="45vw" ratio={4 / 5} />
                  </figure>
                </>
              )}
            </div>
            <p className="flow-scene__type">
              <span className="st"><span className="st-in">{s.l1}</span></span>{' '}
              <span className="st"><span className="st-in">{s.l2}</span></span>
            </p>
            <div className="flow-scene__meta">
              <p className="stage-meta__tag"><span>{s.num}</span> / {s.name}</p>
              <p>{s.meta}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
