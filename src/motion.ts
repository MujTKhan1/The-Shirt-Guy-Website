import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

/**
 * QA switch: `?motion=off` behaves exactly like `prefers-reduced-motion: reduce`
 * (no entrance, no pinned scene, no reveals), so the static composition can be checked
 * in browsers or tools that cannot emulate the media feature.
 */
const forcedStatic = typeof location !== 'undefined' && new URLSearchParams(location.search).get('motion') === 'off'
if (forcedStatic) document.documentElement.classList.add('motion-off')

const NEVER = '(max-width: 0px) and (min-width: 1px)'

/** Capable desktop: room for the pinned scene and motion allowed. Mirrors the CSS in styles.css. */
export const PINNED_QUERY = forcedStatic
  ? NEVER
  : '(min-width: 1024px) and (min-height: 600px) and (prefers-reduced-motion: no-preference)'
export const MOTION_QUERY = forcedStatic ? NEVER : '(prefers-reduced-motion: no-preference)'
/** Motion allowed but no pinned scene (phones, tablets, short windows). */
export const FLOW_MOTION_QUERY = forcedStatic
  ? NEVER
  : '(prefers-reduced-motion: no-preference) and (max-width: 1023.98px), (prefers-reduced-motion: no-preference) and (max-height: 599.98px)'

// Re-measure once webfonts have swapped in: line breaks and pinned geometry depend on them.
if (typeof document !== 'undefined' && 'fonts' in document) {
  document.fonts.ready.then(() => ScrollTrigger.refresh())
}

export { gsap, ScrollTrigger }
