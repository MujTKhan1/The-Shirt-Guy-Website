# The T-Shirt Guy: landing page redesign

A responsive one-page site for The T-Shirt Guy, built with React, TypeScript, Vite and GSAP (ScrollTrigger). The hero follows the supplied "Vision 1" reference. Straight after it comes a pinned "From blank to brand" scroll sequence, then capabilities, finish studies, process and a project enquiry form.

## Setup

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # type-check + production build to dist/
npm run preview    # serve the production build
npm run lint
```

Requires Node 20+ (built with Node 24).

QA switch: add `?motion=off` to any URL to get exactly the reduced-motion experience (static composition, no pin, no reveals). Use it where `prefers-reduced-motion` can't be emulated.

## Structure

| Path | What it does |
| --- | --- |
| `src/data.ts` | All content: services, finish studies, client names, figures, contact details. Each fact is annotated with its source. |
| `src/motion.ts` | GSAP setup, the media queries that decide pinned / flow / static, and a ScrollTrigger refresh after webfonts load. |
| `src/components/Story.tsx` | Hero, entrance choreography, pointer drift, and the pinned signature timeline. Also the flowing mobile version. |
| `src/components/Garment.tsx` | The layered garment: photo base, original print artwork warped to the folds, ink-mask strokes, neck label, annotations. |
| `src/components/Services.tsx` | Numbered service index (ARIA tabs: click, arrow keys, Home/End, touch, optional hover) with image wipe transitions. |
| `src/components/Studies.tsx` | Editorial "Finish studies" grid with mask reveals and restrained parallax. |
| `src/components/Process.tsx` | "Under one roof" process, figures, client list. |
| `src/components/Enquiry.tsx` | Brief form with validation. **Demo only**: nothing is submitted (see below). |
| `tools/garment-layers.py` | Rebuilds the garment layers from the reference image. |

## How the motion works

- **Hero entrance** (about 1.6 s): the headline lines rise out of masks, the lime brush wipes in, the CTA shows within 0.3 s, the garment settles, then the leader lines draw and the annotations fade up.
- **Pointer drift** (desktop, fine pointer only): restrained rotateX/rotateY of up to 9° plus a small translate, using `gsap.quickTo`. It switches off once the scene starts scrolling.
- **Signature sequence** (≥1024 × 600, motion allowed): a single scrubbed timeline pinned for about 1.75 viewport heights of stages, plus one frame-height of overlap.
  - A: the hero type exits, the same garment travels to centre, and the print wipes back to the blank. Registration marks appear and "It starts with a blank." comes in.
  - B: three rough brush strokes draw the ink mask while a lime squeegee bar passes over the chest. "Make your mark." plus a process card with ink swatches.
  - C: the camera pushes in to the woven neck label, a callout draws, and an embroidery detail reveals with a mask. "Every detail. Considered."
  - Hand-off: the finished stage C frame holds while the dark Capabilities section slides up over it (pulled up one frame-height with a negative margin in pinned mode). Only an opacity dimming layer animates during the overlap, so it stays cheap.
- **Performance of the push-in**: the print's live SVG filters are expensive to re-run while scaling, so after fonts load the finished shirt is rendered once to a 2132×1716 bitmap (`src/bakeGarment.ts`). From stage C onward that bitmap is shown on its own GPU layer and the zoom is a pure transform; scrolling back before C restores the live SVG. If baking fails, the live SVG is simply kept. The embroidery photo reveal is a sliding cover (transform only) rather than an animated clip-path.
- **Mobile / tablet / short windows**: no pin. There are three short flowing scenes; the print reveal plays once on enter, and the neck-label close-up is a cropped frame.
- **Reduced motion**: no entrance, pin or reveals. Prints show finished and every element is visible.
- Every animation lives inside `gsap.matchMedia()` and is reverted on unmount or breakpoint change. Geometry is function-based with `invalidateOnRefresh`, so resizing recalculates it.
- Native scrolling and anchors only. No smooth-scroll library: one wasn't needed, and leaving it out keeps anchors, keyboard scrolling and `scroll-padding-top` reliable.
- No Three.js: there is no garment model available, and a primitive mesh would have looked worse than the photographic layered approach.

## Assets: sources and status

| Asset | Source | Status |
| --- | --- | --- |
| `public/assets/shirt-blank.webp` | Cut out of the **supplied reference image** (Vision 1). Its graphic, ™ marks, neck-label text and annotation marks were removed and the area rebuilt. | **Temporary.** It is AI-generated reference art at 820 px wide, so it softens on large retina screens and in the close-up. Replace it with a studio photograph of a real blank (2400 px+, transparent background), then regenerate the shade and displacement maps with `tools/garment-layers.py`. |
| `shirt-shade.jpg`, `shirt-disp.jpg` | Derived from the above. | Regenerate along with the garment. |
| Print artwork, brush strokes, neck label | Original SVG made for this build. | Can stay, or swap in real brand artwork. |
| All other photography | Free-licence images from Unsplash ([licence](https://unsplash.com/license)), served from `images.unsplash.com`. IDs are in `src/data.ts`. | **Temporary.** These are generic process images, not The T-Shirt Guy's factory. The DTG slot in particular uses a close-up of a print bed, not a DTG printer. Replace them all with the company's own photography. |
| Fonts | Anton and Inter Tight via Fontsource, both SIL Open Font License, self-hosted. | Final, unless the brand has its own licensed typeface. |

No reference-brand imagery (Lusion, Urban Outfitters, Carhartt WIP) is used or hotlinked.

## Content: what's verified

Checked against https://www.thetshirtguy.co.uk/ on 12 Nov 2026:

- Services: screen, DTF and DTG printing, embroidery, garment dyeing, packing; plus graphic design and creative direction.
- Figures: 1.25 million garments a year, 15 years' experience, "from 7 day turnaround". The "from" is kept, with a note that lead times vary.
- Contact: 124 Ross Walk, Leicester LE4 5HA; 0116 246 4222. Policy links point to the live PDFs and pages.
- Clients: shown as plain text, not logos, taken from the alt text of the current site's logo strip: Urban Outfitters, ASOS, River Island, Next, Warner, Bravado, Collusion, Matalan, Quiz, Yours. **Confirm these before launch.** "Warner" and "Matalan" were read from image alt text ("Warner", "Mataln"). Three more logos ("Frans", "Reclaimed", "Tally") were left out because their full names couldn't be confirmed.

Deliberately **not** carried over from the reference image: the illustrative client logos, garment specs (GSM etc.), "custom neck labels / relabels" claims and ™ marks. The finish studies are clearly labelled as process studies, not client projects. There are no testimonials or case studies.

## Still to connect or replace

1. **Form submission.** `FORM_ENDPOINT` in `src/components/Enquiry.tsx` is `null`. The form validates fully, then states that the brief **has not been sent** and gives the phone number. To make it live, post `Fields` to a service (Formspree, a serverless function, CRM webhook), handle success and failure states, and remove the demo notice. The site doesn't list a public email address, so none is shown.
2. **Photography.** Replace the garment and every Unsplash image (see table above).
3. **Privacy policy.** No privacy policy was found on the current site. The form needs one linked before it goes live.
4. **Analytics and cookie consent**, if required.
5. A no-JS fallback is limited to a `<noscript>` contact block. For full no-JS content, pre-render the page (for example with `vite-plugin-ssr` or a static export).
