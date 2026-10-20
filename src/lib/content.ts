/*
  Every word on the site lives here. Components never hardcode copy.
  House rule: no em dashes anywhere in the copy.
*/

/** Studio credit link in the footer. Fill in before launch. */
export const STUDIO_URL = 'https://slateandcode.com'

export const SITE = {
  name: 'Plainwater',
  url: 'https://plainwater.vercel.app',
  title: 'Plainwater | Pressure washing, done properly',
  description:
    'Patios, driveways, render and roofs cleaned at the pressure the surface can take. Test patch first, written quote in 48 hours.',
  tagline: 'Exterior surface restoration',
  email: 'hello@plainwater.co',
  hours: 'Mon to Sat, 8am to 6pm',
  instagram: 'https://instagram.com/plainwater',
  founded: 2014,
  area: 'Surrey and Hampshire',
}

export type NavLink = { label: string; href: string }

export const NAV = {
  links: [
    { label: 'Services', href: '#services' },
    { label: 'Process', href: '#method' },
    { label: 'Our work', href: '#work' },
    { label: 'Questions', href: '#questions' },
  ] satisfies NavLink[],
  cta: { label: 'Book a survey', href: '#contact' },
  menu: 'Menu',
  close: 'Close',
  skip: 'Skip to content',
  home: 'Plainwater, back to top',
}

export const PRELOADER = {
  wordmark: 'Plainwater',
  line: 'Exterior surface restoration',
}

export const HERO = {
  lines: ['Plainwater', 'Washing'],
  before: { label: 'Before', job: 'Job 0412', alt: 'Sandstone patio before cleaning, green with moss and black spots' },
  after: { label: 'After', job: 'Job 0412', alt: 'The same sandstone patio after cleaning, warm and even in colour' },
  badge: 'Plainwater · Exterior cleaning · Est. 2014 · ',
  primary: { label: 'Get a free quote', href: '#contact' },
  secondary: { label: 'See before and afters', href: '#work' },
  review: {
    quote: '“Our patio looks newer than the day it was laid.”',
    name: 'Sarah K.',
    detail: 'Sandstone patio, restored',
    avatarAlt: 'Sarah K.',
  },
  gunAlt: 'Pressure washer trigger gun and lance',
}

export type AboutToken =
  | { kind: 'text'; text: string; accent?: boolean }
  /** `placeholder` fills the pill until the photo is supplied. */
  | { kind: 'image'; src: string | null; alt: string; shape: 'pill' | 'round'; placeholder?: string }
  | { kind: 'stat'; value: number; label: string }

export const ABOUT = {
  tag: 'About',
  kicker: 'About',
  /** Full heading for screen readers. */
  title: 'About Plainwater',
  link: { label: 'Our method', href: '#method' },
  /** The statement, in reading order. Pills sit in the flow like words. */
  statement: [
    { kind: 'text', text: 'We bring tired' },
    { kind: 'image', src: null, alt: 'A dirty block paved driveway', shape: 'pill', placeholder: '#57534A' },
    { kind: 'text', text: 'driveways, patios and render back to how they were first laid. Over' },
    { kind: 'stat', value: 1800, label: 'surfaces restored' },
    { kind: 'text', text: 'surfaces restored so far, from mossy' },
    { kind: 'image', src: null, alt: 'A mossy town courtyard', shape: 'pill', placeholder: '#5E6A4E' },
    { kind: 'text', text: 'town courtyards to long country drives, every one tested first by a small crew' },
    { kind: 'image', src: '/images/crew-at-work.jpg', alt: 'One of the crew cleaning a sandstone patio', shape: 'round' },
    { kind: 'text', text: 'who set the pressure to the stone, and never the other way round.', accent: true },
  ] satisfies AboutToken[],
  monogram: 'PW',
}

export type Service = {
  num: string
  title: string
  tags: string[]
  theme: 'stone' | 'paper' | 'slate' | 'cobalt' | 'sand'
  description: string
  included: string[]
  image: string | null
  imageAlt: string
}

export const SERVICES = {
  label: 'Services',
  heading: ['What we', 'bring back'],
  intro:
    'Five surfaces, one rule. We test a patch first, then clean at the pressure the material can take, not the pressure the machine can give.',
  items: [
    {
      num: '01',
      title: 'Driveways',
      tags: ['Block paving', 'Tarmac', 'Resin'],
      theme: 'stone',
      description:
        'Block paving, tarmac and resin brought back to one even colour. Weeds out of the joints, oil and tyre marks lifted, sand brushed back in.',
      included: ['Rotary surface clean', 'Oil and tyre marks treated', 'Joints re-sanded'],
      image: '/images/driveway-clean.jpg',
      imageAlt: 'A herringbone block paved driveway after cleaning',
    },
    {
      num: '02',
      title: 'Patios and stone',
      tags: ['Sandstone', 'Limestone', 'Porcelain'],
      theme: 'paper',
      description:
        'Sandstone, limestone and porcelain cleaned at the pressure the stone can take, then sealed if it needs protecting from the next winter.',
      included: ['Test patch first', 'Black spot lichen treated', 'Optional breathable seal'],
      image: '/images/patio-clean.jpg',
      imageAlt: 'A sandstone patio after cleaning',
    },
    {
      num: '03',
      title: 'Render and walls',
      tags: ['K Rend', 'Monocouche', 'Brick'],
      theme: 'slate',
      description:
        'Soft wash for K Rend, monocouche and painted walls. Algae and green streaks lifted without blasting the finish off the house.',
      included: ['Soft wash, no blasting', 'Biocide against regrowth', 'Windows and sills rinsed'],
      image: '/images/render-clean.jpg',
      imageAlt: 'A rendered wall and window sill after a soft wash',
    },
    {
      num: '04',
      title: 'Roofs and gutters',
      tags: ['Tile', 'Slate', 'Moss removal'],
      theme: 'cobalt',
      description:
        'Moss removed by hand and soft wash, never a jet straight at the tiles. Gutters cleared and downpipes checked while we are up there.',
      included: ['Hand scrape and soft wash', 'Gutters and downpipes cleared', 'Photos from the roof'],
      image: '/images/roof-clean.jpg',
      imageAlt: 'A slate roof and gutter after cleaning',
    },
    {
      num: '05',
      title: 'Decking and fences',
      tags: ['Hardwood', 'Composite', 'Softwood'],
      theme: 'sand',
      description:
        'Hardwood and composite cleaned back to the grain, then oiled or stained so it does not turn green again by spring.',
      included: ['Grain-safe pressure', 'Anti-slip treatment', 'Oil or stain finish'],
      image: '/images/deck-clean.jpg',
      imageAlt: 'A hardwood deck cleaned back to the grain',
    },
  ] satisfies Service[],
}

export type Job = {
  id: string
  name: string
  before: string | null
  after: string | null
  thumb: string | null
  alt: { before: string; after: string }
  meta: { label: string; value: string }[]
  /** Solid fills shown until the photos are supplied (Figma placeholder colours). */
  placeholder: { before: string; after: string }
}

export const WORK = {
  heading: ['Same stone.', 'Four hours apart.'],
  link: { label: 'All projects', href: '#work' },
  intro:
    'Drag the line. Every job on this page is our own, photographed on the day, from the same spot, before we packed the van.',
  before: 'Before',
  after: 'After',
  drag: 'Drag',
  sliderLabel: 'Before and after comparison',
  /** Spoken value of the slider: how much of the before photo is showing. */
  sliderValue: (pos: number) => `${Math.round(pos)}% before, ${100 - Math.round(pos)}% after`,
  showJob: (id: string, name: string) => `Show job ${id}, ${name}`,
  jobLabel: 'Job',
  jobs: [
    {
      id: '0412',
      name: 'Sandstone patio',
      before: '/images/patio-dirty.jpg',
      after: '/images/patio-clean.jpg',
      thumb: '/images/patio-clean.jpg',
      alt: { before: 'Sandstone patio before cleaning', after: 'Sandstone patio after cleaning' },
      placeholder: { before: '#57534A', after: '#CFC1A6' },
      meta: [
        { label: 'Surface', value: 'Indian sandstone, 64 m²' },
        { label: 'Time on site', value: '4 hrs 20 min' },
        { label: 'Method', value: 'Rotary clean, low pressure' },
        { label: 'Finish', value: 'Sealed, matt' },
      ],
    },
    {
      id: '0388',
      name: 'Block paving driveway',
      before: null,
      after: null,
      thumb: null,
      alt: { before: 'Block paving driveway before cleaning', after: 'Block paving driveway after cleaning' },
      placeholder: { before: '#5E6A4E', after: '#BDB6A8' },
      meta: [
        { label: 'Surface', value: 'Block paving, 48 m²' },
        { label: 'Time on site', value: '3 hrs 10 min' },
        { label: 'Method', value: 'Rotary clean, joints re-sanded' },
        { label: 'Finish', value: 'Kiln-dried sand' },
      ],
    },
    {
      id: '0371',
      name: 'Rendered front of house',
      before: null,
      after: null,
      thumb: null,
      alt: { before: 'Rendered house front before a soft wash', after: 'Rendered house front after a soft wash' },
      placeholder: { before: '#6E6558', after: '#D2CBBE' },
      meta: [
        { label: 'Surface', value: 'K Rend, two storeys' },
        { label: 'Time on site', value: '5 hrs' },
        { label: 'Method', value: 'Soft wash, biocide' },
        { label: 'Finish', value: 'Rinsed, no sealant' },
      ],
    },
    {
      id: '0354',
      name: 'Hardwood deck',
      before: null,
      after: null,
      thumb: null,
      alt: { before: 'Hardwood deck before cleaning', after: 'Hardwood deck after cleaning and oiling' },
      placeholder: { before: '#4F5357', after: '#C4B49A' },
      meta: [
        { label: 'Surface', value: 'Hardwood, 22 m²' },
        { label: 'Time on site', value: '2 hrs 40 min' },
        { label: 'Method', value: 'Low pressure, grain-safe' },
        { label: 'Finish', value: 'Oiled' },
      ],
    },
  ] satisfies Job[],
}

export type Step = {
  num: string
  side: 'left' | 'right'
  pill: string
  title: [string, string]
  icon: 'clipboard' | 'droplet' | 'lance' | 'shield'
  description: string
}

export const METHOD = {
  heading: ['Four steps,', 'no shortcuts.'],
  link: { label: 'Book a survey', href: '#contact' },
  ring: 'Plainwater · Exterior cleaning · Pressure set to the stone · ',
  cta: { label: 'Book a survey', href: '#contact' },
  steps: [
    {
      num: '01',
      side: 'left',
      pill: 'Free, about 30 minutes',
      title: ['The', 'survey'],
      icon: 'clipboard',
      description:
        'We walk the job with you, identify the stone and check anything nearby that water could hurt. Written quote within 48 hours.',
    },
    {
      num: '02',
      side: 'right',
      pill: 'Before we touch the rest',
      title: ['The', 'test patch'],
      icon: 'droplet',
      description:
        'A small hidden corner first, at low pressure. We see how the surface reacts and get your sign-off before going any further.',
    },
    {
      num: '03',
      side: 'left',
      pill: 'Usually done in a day',
      title: ['The', 'clean'],
      icon: 'lance',
      description:
        'Rotary cleaner for flat stone, soft wash for render and roofs. Pressure set to the material, never to what the machine can do.',
    },
    {
      num: '04',
      side: 'right',
      pill: '12-month check-in',
      title: ['The', 'seal'],
      icon: 'shield',
      description:
        'Joints re-sanded, sealed if the surface needs it, and we come back after a year to check it is holding up.',
    },
  ] satisfies Step[],
}

export const QUESTIONS = {
  heading: ['Before', 'you book.'],
  intro: 'The six things people ask us before a first job. If yours is not here, send us a photo and ask.',
  cta: { label: 'Send us a photo', href: '#contact' },
  link: { label: 'Ask us anything', href: '#contact' },
  items: [
    {
      q: 'Will pressure washing damage my patio?',
      a: 'Not the way we do it. We identify the stone, run a test patch at low pressure and only go as high as the surface allows. Sandstone and render get a soft wash, never a blast.',
      tag: 'Low pressure first · Soft wash for soft stone',
    },
    {
      q: 'Do you need my water and electricity?',
      a: 'Usually not. The van carries its own water and a petrol machine, so all we need is access. On longer jobs we might ask to top up from an outside tap.',
      tag: 'Self-sufficient van · No extension leads',
    },
    {
      q: 'How long will it stay clean?',
      a: 'Most patios and drives stay clean for two to three years. A biocide treatment slows regrowth, and sealing porous stone buys more time again.',
      tag: 'Biocide included · Sealing on request',
    },
    {
      q: 'What happens to the run-off and my plants?',
      a: 'We cover beds and lawn edges, rinse plants before and after, and keep dirty water away from drains wherever the council asks us to.',
      tag: 'Plants protected · Run-off controlled',
    },
    {
      q: 'Do I need to be home?',
      a: 'Only for the survey and to sign off the test patch. After that we just need side access and somewhere to park the van.',
      tag: 'Access is enough',
    },
    {
      q: 'Are you insured?',
      a: 'Yes. We are fully insured for public liability, and the certificate comes with every written quote.',
      tag: 'Certificate with every quote',
    },
  ],
}

export type QuoteOption = { value: string; label: string; hint?: string }

export const QUOTE = {
  title: 'Get a written quote',
  reply: 'Reply within 48 hrs',
  stepOf: (n: number, total: number) => `Step ${n} of ${total}`,
  reviewStep: 'Check and send',
  /** Read out when the step changes. */
  announce: (n: number, total: number, question: string) => `Step ${n} of ${total}. ${question}`,
  back: 'Back',
  continue: 'Continue',
  optional: 'Optional',
  honeypot: 'Leave this field empty',
  summary: {
    surfaces: 'Surfaces',
    size: 'Size',
    condition: 'Condition',
    extras: 'Extras',
    timing: 'Timing',
    contact: 'Contact',
    photos: 'Photos',
    none: 'Not given',
    noPhotos: 'No photos',
    photoCount: (n: number) => (n === 1 ? '1 photo' : `${n} photos`),
  },
  steps: {
    surfaces: {
      question: 'What needs cleaning?',
      hint: 'Pick as many as you like.',
      options: [
        { value: 'driveway', label: 'Driveway' },
        { value: 'patio', label: 'Patio' },
        { value: 'render', label: 'Render and walls' },
        { value: 'roof', label: 'Roof and gutters' },
        { value: 'decking', label: 'Decking and fences' },
        { value: 'other', label: 'Something else' },
      ] satisfies QuoteOption[],
    },
    size: {
      question: 'Roughly how big is it?',
      options: [
        { value: 'small', label: 'Small', hint: 'Up to 20 m², a path or small patio' },
        { value: 'medium', label: 'Medium', hint: '20 to 60 m², a typical patio or single drive' },
        { value: 'large', label: 'Large', hint: 'Over 60 m², a double drive or big garden' },
        { value: 'unsure', label: 'Not sure', hint: 'You tell me at the survey' },
      ] satisfies QuoteOption[],
    },
    condition: {
      question: "What's it like right now?",
      options: [
        { value: 'grubby', label: 'Just grubby' },
        { value: 'mossy', label: 'Green and mossy' },
        { value: 'lichen', label: 'Black spots and lichen' },
        { value: 'stains', label: 'Oil, rust or tyre marks' },
        { value: 'unsure', label: 'Not sure' },
      ] satisfies QuoteOption[],
    },
    extras: {
      question: 'Anything extra?',
      hint: 'Optional.',
      options: [
        { value: 'sealing', label: 'Sealing' },
        { value: 'resanding', label: 'Re-sanding the joints' },
        { value: 'gutters', label: 'Gutter clear' },
        { value: 'windows', label: 'Windows and sills rinsed' },
        { value: 'none', label: 'Nothing extra' },
      ] satisfies QuoteOption[],
    },
    timing: {
      question: 'When are you thinking?',
      options: [
        { value: 'asap', label: 'As soon as possible' },
        { value: 'month', label: 'Within the next month' },
        { value: 'prices', label: 'Just getting prices for now' },
      ] satisfies QuoteOption[],
    },
    contact: {
      question: 'Where should we send it?',
      firstName: 'First name',
      postcode: 'Postcode',
      via: { phone: 'Phone', email: 'Email' },
      phone: 'Phone number',
      email: 'Email address',
      dropzone: 'Add a photo of the area',
      dropzoneHint: 'It speeds up the quote',
      remove: 'Remove photo',
    },
    review: {
      question: 'Check your answers',
      edit: 'Edit',
      submit: 'Send for a quote',
      sending: 'Sending',
    },
  },
  errors: {
    surfaces: 'Pick at least one surface.',
    firstName: 'Tell us your first name.',
    postcode: 'That does not look like a UK postcode.',
    phone: 'That does not look like a phone number.',
    email: 'That does not look like an email address.',
    photoType: 'Photos only, please (JPG, PNG, HEIC or WebP).',
    photoSize: 'Each photo needs to be under 10 MB.',
    photoCount: 'Up to 3 photos.',
    send: 'Something went wrong sending that. Nothing you entered is lost, so try again.',
    rate: 'That is a lot of quotes in a short time. Give it a few minutes and try again.',
    retry: 'Try again',
  },
  success: {
    title: (name: string) => `Thanks, ${name}.`,
    body: "We'll send a written quote within 48 hours.",
    again: 'Start a new quote',
  },
}

export const CONTACT = {
  tag: 'Contact',
  link: { label: 'Instagram', href: SITE.instagram },
  heading: ['Got a surface', "that's seen", 'better days?'],
  details: [
    { label: 'Email', value: SITE.email, href: `mailto:${SITE.email}` },
    { label: 'Hours', value: SITE.hours },
  ],
}

export const FOOTER = {
  wordmark: 'Plainwater',
  items: [`© 2026 Plainwater`, 'Fully insured', 'Privacy'],
  credit: { label: 'Site by Slate & Code', href: STUDIO_URL },
  top: 'Back to top',
}
