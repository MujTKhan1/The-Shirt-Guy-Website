import { useId, useState, type CSSProperties } from 'react'

/**
 * Layered photographic garment.
 *
 * Base: a real photographed black tee (cut out, print removed) → /assets/shirt-blank.webp
 * Print: original vector artwork, warped to the fabric folds with a displacement map and
 * multiplied by a shading map derived from the same photo, so it reads as ink on cloth.
 * Ink mask: three rough brush strokes that the scroll timeline (or a one-off tween) draws in.
 *
 * Coordinate system = the photo's pixel grid (820 × 660).
 */

export const GARMENT_W = 820
export const GARMENT_H = 660

type Annotation = {
  id: string
  title: string
  body: string
  /** label anchor, in garment pixels */
  x: number
  y: number
  align?: 'left' | 'right'
  /** leader polyline, garment pixels; last point is the dot */
  line: [number, number][]
}

export const annotations: Annotation[] = [
  { id: 'a1', title: '01 / Garment', body: 'Garment dyeing to your colour', x: -16, y: 60, line: [[104, 88], [130, 88], [184, 129]] },
  { id: 'a2', title: '02 / Finish', body: 'Packing and labelling, ready to go', x: 672, y: 40, line: [[490, 92], [560, 56], [664, 56]] },
  { id: 'a3', title: '03 / Print', body: 'Screen, DTF and DTG printing', x: -66, y: 384, line: [[58, 406], [120, 406], [236, 374]] },
  { id: 'a4', title: '04 / Build', body: 'Embroidery and creative direction', x: 708, y: 452, line: [[640, 392], [684, 470], [704, 470]] },
]

const pct = (v: number, of: number) => `${(v / of) * 100}%`

type Props = {
  /** show the print fully (static) – used when there is no ink animation */
  printed?: boolean
  withAnnotations?: boolean
  className?: string
  /** kept for API stability; the hero garment is preloaded in index.html */
  priority?: boolean
  label?: string
}

export function Garment({ printed = true, withAnnotations = false, className = '', label }: Props) {
  const uid = useId().replace(/:/g, '')
  const [failed, setFailed] = useState(false)
  const ink = `ink-${uid}`
  const rough = `rough-${uid}`
  const fabric = `fabric-${uid}`
  const brush = `brush-${uid}`
  const dash: CSSProperties = { strokeDasharray: 1, strokeDashoffset: printed ? 0 : 1 }

  return (
    <figure className={`garment ${className}`} data-printed={printed} data-failed={failed || undefined}>
      <svg
        className="garment__svg"
        viewBox={`0 0 ${GARMENT_W} ${GARMENT_H}`}
        role="img"
        aria-label={label ?? 'Black heavyweight T-shirt with a cream and lime printed graphic reading The T-Shirt Guy'}
        overflow="visible"
      >
        <defs>
          <filter id={fabric} filterUnits="userSpaceOnUse" x="0" y="0" width={GARMENT_W} height={GARMENT_H} colorInterpolationFilters="sRGB">
            <feImage href="/assets/shirt-disp.jpg" x="0" y="0" width={GARMENT_W} height={GARMENT_H} preserveAspectRatio="none" result="disp" />
            <feDisplacementMap in="SourceGraphic" in2="disp" scale="16" xChannelSelector="R" yChannelSelector="G" result="warped" />
            <feImage href="/assets/shirt-shade.jpg" x="0" y="0" width={GARMENT_W} height={GARMENT_H} preserveAspectRatio="none" result="shade" />
            <feBlend in="warped" in2="shade" mode="multiply" result="lit" />
            <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" seed="4" result="grain" />
            <feColorMatrix in="grain" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.6 1.62" result="grainA" />
            <feComposite in="lit" in2="grainA" operator="in" result="worn" />
            <feComposite in="worn" in2="warped" operator="in" />
          </filter>
          <filter id={rough} x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="3" seed="9" result="n" />
            <feDisplacementMap in="SourceGraphic" in2="n" scale="46" xChannelSelector="R" yChannelSelector="G" />
          </filter>
          <filter id={brush} x="-10%" y="-30%" width="120%" height="160%">
            <feTurbulence type="fractalNoise" baseFrequency="0.9 0.05" numOctaves="2" seed="2" result="n" />
            <feDisplacementMap in="SourceGraphic" in2="n" scale="7" xChannelSelector="R" yChannelSelector="G" />
          </filter>
          <mask id={ink} maskUnits="userSpaceOnUse" x="-100" y="-100" width={GARMENT_W + 200} height={GARMENT_H + 200}>
            <g filter={`url(#${rough})`} fill="none" stroke="#fff" strokeLinecap="butt">
              <path className="ink-stroke" pathLength={1} style={dash} strokeWidth="150" d="M150 150 C 300 120, 470 150, 640 170" />
              <path className="ink-stroke" pathLength={1} style={dash} strokeWidth="150" d="M120 290 C 290 260, 470 290, 650 300" />
              <path className="ink-stroke" pathLength={1} style={dash} strokeWidth="170" d="M110 420 C 280 400, 460 420, 640 440" />
            </g>
          </mask>
        </defs>

        <image
          className="garment__photo"
          href="/assets/shirt-blank.webp"
          width={GARMENT_W}
          height={GARMENT_H}
          preserveAspectRatio="xMidYMid meet"
          onError={() => setFailed(true)}
        />

        {/* Woven neck label, set crisp so it holds up in the close-up */}
        <g className="garment__label" transform="translate(442 80) rotate(-2)" aria-hidden="true">
          <text x="0" y="-6" textAnchor="middle" className="neck-label__mark">TSG</text>
          <text x="0" y="9" textAnchor="middle" className="neck-label__small">LEICESTER</text>
          <text x="0" y="20" textAnchor="middle" className="neck-label__small">L</text>
        </g>

        {/* Print */}
        <g mask={`url(#${ink})`}>
          <g filter={`url(#${fabric})`}>
            <g transform="translate(262 150) rotate(-5) skewX(-9)" className="print">
              <text className="print__type" x="46" y="74" textLength="146" lengthAdjust="spacingAndGlyphs">THE</text>
              <text className="print__type" x="10" y="168" textLength="300" lengthAdjust="spacingAndGlyphs">T-SHIRT</text>
              <text className="print__type" x="-14" y="262" textLength="176" lengthAdjust="spacingAndGlyphs">GUY</text>
              <text className="print__small" x="206" y="40">PRINT · FINISH</text>
              <text className="print__small" x="206" y="60">LEICESTER, UK</text>
              <g filter={`url(#${brush})`} fill="none" stroke="var(--lime)" strokeLinecap="round">
                <path strokeWidth="11" d="M-8 286 C 40 318, 210 312, 296 262 C 340 236, 300 204, 210 214 C 120 224, 20 252, -2 286" />
                <path strokeWidth="5" opacity=".85" d="M10 300 C 90 322, 230 300, 304 252" />
              </g>
            </g>
          </g>
        </g>

        {/* squeegee pass, only visible during the print stage */}
        <g className="squeegee" aria-hidden="true">
          <rect x="140" y="-4" width="540" height="8" rx="2" transform="rotate(-4 410 0)" />
        </g>

        {withAnnotations && (
          <g className="annot-lines" aria-hidden="true">
            {annotations.map((a) => (
              <g key={a.id} className="annot-line" data-annot={a.id}>
                <polyline points={a.line.map((p) => p.join(',')).join(' ')} pathLength={1} />
                <circle cx={a.line[a.line.length - 1][0]} cy={a.line[a.line.length - 1][1]} r="5.5" />
              </g>
            ))}
          </g>
        )}
      </svg>

      {failed && <p className="garment__fallback">Garment photography could not be loaded.</p>}

      {withAnnotations && (
        <ul className="annots">
          {annotations.map((a) => (
            <li
              key={a.id}
              className="annot"
              data-annot={a.id}
              style={{ left: pct(a.x, GARMENT_W), top: pct(a.y, GARMENT_H) }}
            >
              <strong>{a.title}</strong>
              <span>{a.body}</span>
            </li>
          ))}
        </ul>
      )}
    </figure>
  )
}
