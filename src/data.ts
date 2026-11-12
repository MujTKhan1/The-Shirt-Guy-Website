/**
 * Site content.
 *
 * Facts below were checked against https://www.thetshirtguy.co.uk/ on 12 Nov 2026:
 * services, additional services, the three headline figures, client names
 * (from the logo strip alt text), address, phone and policy links.
 *
 * Photography is TEMPORARY: free-licence Unsplash images (https://unsplash.com/license),
 * served from images.unsplash.com. Replace with The T-Shirt Guy's own production
 * photography before launch. See README.md → "Assets".
 */

const U = 'https://images.unsplash.com/'

export type Photo = { id: string; alt: string; credit: string }

/** Builds an Unsplash CDN url at a given width (format negotiated automatically). */
export const unsplash = (id: string, w: number, h?: number) =>
  `${U}${id}?auto=format&fit=crop&q=72&w=${w}${h ? `&h=${h}` : ''}`

export const srcSet = (id: string, widths: number[], ratio?: number) =>
  widths.map((w) => `${unsplash(id, w, ratio ? Math.round(w / ratio) : undefined)} ${w}w`).join(', ')

export type Service = {
  num: string
  name: string
  short: string
  body: string
  photo: Photo
}

export const services: Service[] = [
  {
    num: '01',
    name: 'Screen printing',
    short: 'Screen',
    body: 'Ink pulled through a mesh screen, with a stencil blocking everything outside the design. Bold spot colour for runs, tour merch and repeat drops.',
    photo: {
      id: 'photo-1773525912476-213bff96b8a4',
      alt: 'Yellow ink spread across a screen on a screen printing press',
      credit: 'Unsplash (temporary)',
    },
  },
  {
    num: '02',
    name: 'DTF printing',
    short: 'DTF',
    body: 'Artwork printed onto film, then heat-pressed onto the garment. Full colour and fine detail across a wide range of fabrics.',
    photo: {
      id: 'photo-1785829414436-2f5ce9b1f658',
      alt: 'A printer lining up a black T-shirt on a heat press',
      credit: 'Unsplash (temporary)',
    },
  },
  {
    num: '03',
    name: 'DTG printing',
    short: 'DTG',
    body: 'Designs printed straight onto the fabric with specialist inkjet technology. Suited to photographic artwork and smaller runs with lots of detail.',
    photo: {
      id: 'photo-1773525912489-9e04df48f639',
      alt: 'Close-up of a print bed under red working light',
      credit: 'Unsplash (temporary)',
    },
  },
  {
    num: '04',
    name: 'Embroidery',
    short: 'Embroidery',
    body: 'Thread stitched into the garment for chest marks, logos and texture you can feel. Raised detail that lasts as long as the garment.',
    photo: {
      id: 'photo-1770453676391-90fb980543e5',
      alt: 'An operator setting up a multi-head embroidery machine',
      credit: 'Unsplash (temporary)',
    },
  },
  {
    num: '05',
    name: 'Garment dyeing',
    short: 'Dyeing',
    body: 'Dye applied to finished garments to change their colour, giving a collection its own shade rather than an off-the-shelf one.',
    photo: {
      id: 'photo-1523381294911-8d3cead13475',
      alt: 'A row of sage green T-shirts hanging on wooden hangers',
      credit: 'Unsplash (temporary)',
    },
  },
  {
    num: '06',
    name: 'Packing and labelling',
    short: 'Packing',
    body: 'Packing and fulfilment for orders of all sizes, so finished garments leave ready for the shelf, the shop or the tour.',
    photo: {
      id: 'photo-1562157873-818bc0726f68',
      alt: 'Folded T-shirts in different colours laid out on a wooden surface',
      credit: 'Unsplash (temporary)',
    },
  },
]

export const supporting = ['Graphic design', 'Creative direction']

export type Study = { code: string; title: string; note: string; photo: Photo; size: 'xl' | 'l' | 'm' | 's' }

/** Finish studies: process and capability imagery, NOT client work. */
export const studies: Study[] = [
  {
    code: 'FS-01',
    title: 'The pull',
    note: 'Screen printing, one ink, one pass at a time',
    size: 'xl',
    photo: { id: 'photo-1663433567177-9f94be0bff4c', alt: 'Hands pulling a squeegee across a screen on a print press', credit: 'Unsplash (temporary)' },
  },
  {
    code: 'FS-02',
    title: 'The blank',
    note: 'Heavy black jersey before print',
    size: 'm',
    photo: { id: 'photo-1618022325802-7e5e732d97a1', alt: 'Close-up of creased black cotton fabric', credit: 'Unsplash (temporary)' },
  },
  {
    code: 'FS-03',
    title: 'Stitch',
    note: 'Embroidery hooped and running',
    size: 'l',
    photo: { id: 'photo-1772351720165-d9218e428cf0', alt: 'Black and white close-up of an embroidery machine stitching a design in a hoop', credit: 'Unsplash (temporary)' },
  },
  {
    code: 'FS-04',
    title: 'Thread',
    note: 'Colour-matched spools for embroidery',
    size: 's',
    photo: { id: 'photo-1782232189456-587863eb1bfc', alt: 'Rows of thread spools on a dark background', credit: 'Unsplash (temporary)' },
  },
  {
    code: 'FS-05',
    title: 'The run',
    note: 'Finished garments, ready for checking',
    size: 'l',
    photo: { id: 'photo-1562135291-7728cc647783', alt: 'Two black crew-neck T-shirts hanging against a white wall', credit: 'Unsplash (temporary)' },
  },
  {
    code: 'FS-06',
    title: 'Labels',
    note: 'Labelling before packing',
    size: 'm',
    photo: { id: 'photo-1773525912464-d2640e7aff9c', alt: 'A worker feeding garment labels into a machine', credit: 'Unsplash (temporary)' },
  },
]

export const processPhotos = {
  floor: { id: 'photo-1773525912431-ee1eff5e1ab9', alt: 'An industrial screen printing machine on a workshop floor', credit: 'Unsplash (temporary)' },
  embroidery: { id: 'photo-1772351721253-1008627c8c50', alt: 'An industrial embroidery machine loaded with thread spools', credit: 'Unsplash (temporary)' },
  detail: { id: 'photo-1772351720165-d9218e428cf0', alt: 'Embroidery machine stitching a design into fabric', credit: 'Unsplash (temporary)' },
}

/** Client names as listed in the "Clients" logo strip on the current website. Shown as plain text, not logos. */
export const clients = ['Urban Outfitters', 'ASOS', 'River Island', 'Next', 'Warner', 'Bravado', 'Collusion', 'Matalan', 'Quiz', 'Yours']

/** Figures quoted on the current website. Keep the qualifiers. */
export const facts = [
  { value: '1.25M', label: 'Garments produced a year' },
  { value: '15', label: 'Years in printing and manufacturing' },
  { value: '7', prefix: 'From', label: 'Day turnaround, from', note: true },
]

export const contact = {
  address: ['124 Ross Walk', 'Leicester', 'LE4 5HA'],
  phone: '0116 246 4222',
  phoneHref: 'tel:+441162464222',
  policies: [
    { label: 'Ethical Labour Standards Policy', href: 'https://www.thetshirtguy.co.uk/_files/ugd/0c0314_6bfb7a6967f449dea87122876437aee3.pdf' },
    { label: 'Working in the UK: Your Rights', href: 'https://www.thetshirtguy.co.uk/about-1' },
    { label: 'Staff Handbook (English, PDF)', href: 'https://www.thetshirtguy.co.uk/_files/ugd/0c0314_8579cb2d51ae48d98b2a7e25273faa90.pdf' },
  ],
}
