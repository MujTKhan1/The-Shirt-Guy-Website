import antonUrl from '@fontsource/anton/files/anton-latin-400-normal.woff2?url'
import interUrl from '@fontsource-variable/inter-tight/files/inter-tight-latin-wght-normal.woff2?url'

/**
 * Renders the live garment SVG (photo + filtered print, fully inked) ONCE into a bitmap.
 *
 * Why: the print uses displacement, lighting and grain filters plus a rough ink mask. Scaling
 * that live SVG during the stage-3 push-in forces the browser to re-run every filter at a larger
 * size on every frame. A plain bitmap on its own compositor layer is scaled by the GPU instead.
 *
 * The same browser engine renders the same markup, so the swap is visually seamless. External
 * references are inlined as data URIs because an SVG drawn as an image can't load them.
 */

const toDataUrl = async (url: string) => {
  const blob = await (await fetch(url)).blob()
  return new Promise<string>((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(r.result as string)
    r.onerror = reject
    r.readAsDataURL(blob)
  })
}

const cache = new Map<string, Promise<string>>()
const dataUrl = (url: string) => {
  if (!cache.has(url)) cache.set(url, toDataUrl(url))
  return cache.get(url)!
}

export async function bakeGarment(svg: SVGSVGElement, scale = 2.6): Promise<string | null> {
  try {
    const vb = svg.viewBox.baseVal
    const W = Math.round(vb.width * scale)
    const H = Math.round(vb.height * scale)

    const clone = svg.cloneNode(true) as SVGSVGElement

    // carry computed text styling across (classes and CSS variables don't exist inside the image)
    const srcTexts = svg.querySelectorAll('text')
    clone.querySelectorAll('text').forEach((t, i) => {
      const cs = getComputedStyle(srcTexts[i])
      t.setAttribute('font-family', cs.fontFamily)
      t.setAttribute('font-size', cs.fontSize)
      t.setAttribute('font-weight', cs.fontWeight)
      t.setAttribute('letter-spacing', cs.letterSpacing === 'normal' ? '0' : cs.letterSpacing)
      t.setAttribute('fill', cs.fill)
      t.removeAttribute('class')
    })

    // fully printed, no scene furniture
    clone.querySelectorAll('.ink-stroke').forEach((p) => {
      ;(p as SVGPathElement).style.strokeDashoffset = '0'
    })
    clone.querySelectorAll('.annot-lines, .squeegee').forEach((n) => n.remove())

    // inline every referenced image
    const imgs = clone.querySelectorAll('image, feImage')
    await Promise.all(
      [...imgs].map(async (n) => {
        const href = n.getAttribute('href')
        if (href && !href.startsWith('data:')) n.setAttribute('href', await dataUrl(href))
      }),
    )

    const [anton, inter] = await Promise.all([dataUrl(antonUrl), dataUrl(interUrl)])
    const style = document.createElementNS('http://www.w3.org/2000/svg', 'style')
    style.textContent =
      `@font-face{font-family:'Anton';src:url(${anton}) format('woff2');}` +
      `@font-face{font-family:'Inter Tight Variable';font-weight:100 900;src:url(${inter}) format('woff2');}`
    clone.insertBefore(style, clone.firstChild)

    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
    clone.setAttribute('width', String(W))
    clone.setAttribute('height', String(H))
    clone.removeAttribute('overflow')
    clone.removeAttribute('role')
    clone.removeAttribute('aria-label')

    const markup = new XMLSerializer().serializeToString(clone).replaceAll('var(--lime)', '#D5FF00')
    const svgUrl = URL.createObjectURL(new Blob([markup], { type: 'image/svg+xml' }))
    try {
      const img = new Image()
      img.decoding = 'async'
      img.src = svgUrl
      await img.decode()
      // give the embedded fonts a beat to apply inside the SVG document before drawing
      await new Promise((r) => setTimeout(r, 60))
      const canvas = document.createElement('canvas')
      canvas.width = W
      canvas.height = H
      const ctx = canvas.getContext('2d')
      if (!ctx) return null
      ctx.drawImage(img, 0, 0, W, H)
      const out = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/webp', 0.92))
      return out ? URL.createObjectURL(out) : null
    } finally {
      URL.revokeObjectURL(svgUrl)
    }
  } catch {
    return null // keep the live SVG
  }
}
