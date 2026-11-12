import { useState } from 'react'
import { type Photo as PhotoT, unsplash, srcSet } from '../data'

type Props = {
  photo: PhotoT
  widths?: number[]
  sizes?: string
  /** width / height crop requested from the CDN */
  ratio?: number
  eager?: boolean
  className?: string
}

/**
 * Responsive, lazy image with a dark woven placeholder. If the image fails, the placeholder
 * stays and the alt text is shown as a caption so the layout and meaning survive.
 */
export function Photo({ photo, widths = [480, 800, 1200], sizes = '100vw', ratio, eager, className = '' }: Props) {
  const [state, setState] = useState<'loading' | 'loaded' | 'error'>('loading')
  const largest = widths[widths.length - 1]
  return (
    <span className={`photo photo--${state} ${className}`}>
      {state !== 'error' && (
        <img
          src={unsplash(photo.id, largest, ratio ? Math.round(largest / ratio) : undefined)}
          srcSet={srcSet(photo.id, widths, ratio)}
          sizes={sizes}
          alt={photo.alt}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          onLoad={() => setState('loaded')}
          onError={() => setState('error')}
          ref={(img) => { if (img?.complete && img.naturalWidth) setState('loaded') }}
        />
      )}
      {state === 'error' && <span className="photo__fallback" role="img" aria-label={photo.alt}>{photo.alt}</span>}
    </span>
  )
}
