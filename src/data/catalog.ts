export type SportId = 'basketball' | 'volleyball'

export type Sport = {
  id: SportId
  name: string
}

export type Court = {
  id: string
  name: string
  /** The floor calls them by colour — Court 01 The Gold, and so on. */
  number: string
  sport: SportId
  indoor: boolean
  level: string
  capacity: number
  amenities: string
  /** Off-peak weekday rate per hour, in AED. */
  offPeak: number
  /** Peak weekday rate per hour (from 17:00), in AED. */
  peak: number
  blurb: string
  /** Brand photography. Absent where the shoot has not covered the court yet. */
  image?: string
}

export const SPORTS: Sport[] = [
  { id: 'basketball', name: 'Basketball' },
  { id: 'volleyball', name: 'Volleyball' },
]

export const sportName = (id: SportId) => SPORTS.find((s) => s.id === id)!.name

/** Four courts, one floor — two for each sport. */
export const COURTS: Court[] = [
  {
    id: 'basketball-1',
    number: '01',
    name: 'Basketball court 1',
    sport: 'basketball',
    indoor: true,
    level: 'Level 3',
    capacity: 10,
    amenities: 'Balls and bibs · Spectator seating',
    offPeak: 90,
    peak: 140,
    blurb: 'Full-size indoor court with sprung flooring and a scoreboard.',
    image: '/brand/ball-yellow.jpg',
  },
  {
    id: 'basketball-2',
    number: '02',
    name: 'Basketball court 2',
    sport: 'basketball',
    indoor: true,
    level: 'Level 3',
    capacity: 10,
    amenities: 'Balls and bibs · Spectator seating',
    offPeak: 90,
    peak: 140,
    blurb: 'Same surface as court 1, quieter end of the floor.',
    image: '/brand/hero-action.jpg',
  },
  {
    id: 'volleyball-1',
    number: '03',
    name: 'Volleyball court 1',
    sport: 'volleyball',
    indoor: true,
    level: 'Level 3',
    capacity: 12,
    amenities: 'Balls and bibs · Net set to your level',
    offPeak: 100,
    peak: 150,
    blurb: 'Match-marked court, net rigged before you arrive.',
  },
  {
    id: 'volleyball-2',
    number: '04',
    name: 'Volleyball court 2',
    sport: 'volleyball',
    indoor: true,
    level: 'Level 3',
    capacity: 12,
    amenities: 'Balls and bibs · Changing rooms',
    offPeak: 100,
    peak: 150,
    blurb: 'Same floor as court 1, next to the changing rooms.',
  },
]

export const courtById = (id: string) => COURTS.find((c) => c.id === id)
export const courtsBySport = (sport: SportId) => COURTS.filter((c) => c.sport === sport)

/**
 * The hero runs as a slider — one full-bleed slide at a time, the line set live in
 * the site's own type over the artwork rather than baked into a JPEG.
 *
 * No slide carries a rate any more: the offers are gone, so these are the venue's
 * own statements and every one of them lands on the same booking CTA.
 */
export type HeroSlide = {
  id: string
  eyebrow: string
  headline: string
  note: string
  /** Tints the wash the artwork sits in. */
  accent: string
  media: {
    webp: string
    jpeg: string
    fallback: string
    /** object-position — where the crop lands when the fold is taller than the file. */
    focal: string
    /**
     * `contain` for a composition that was framed to be seen whole. `cover` for
     * photography, which has no composition to protect. `cutout` is a figure on
     * transparency, stood on the brand's own striped ground with the line set live
     * beside it — the banner rebuilt rather than flattened.
     */
    fit: 'cover' | 'contain' | 'cutout'
    /** Overrides the slot width when one shot needs more room. */
    slot?: string
    /** Where the artwork sits across the fold. Right unless a slide says otherwise. */
    align?: 'right' | 'center'
    /**
     * Runs the artwork the full height of the fold and pins it to the bottom edge,
     * rather than floating it clear of the ticker. For a cutout whose own base is
     * the thing that should meet the ground — a hoop on its post.
     */
    grounded?: boolean
  }
}

export const HERO_SLIDES: HeroSlide[] = [
  {
    // Cut-out figures on the brand's own ground, every word of it live text.
    id: 'game-on',
    eyebrow: 'Al Ghurair Centre, Deira',
    headline: 'Game on',
    note: 'Basketball and volleyball, by the hour',
    accent: '#e5199b',
    media: {
      webp: '/offers/cutout-players-700.webp 700w, /offers/cutout-players-1100.webp 1100w',
      jpeg: '/offers/cutout-players-700.png 700w, /offers/cutout-players-1100.png 1100w',
      fallback: '/offers/cutout-players-1100.png',
      focal: 'center bottom',
      fit: 'cutout',
    },
  },
  {
    // The figure cut off its own ground. That file shipped the brand's blue-magenta
    // ramp baked in, which put a second, differently-angled pattern on top of the
    // hero's own — so the player is lifted out and stands on the section's pattern
    // instead. Held narrow: the trailing leg reaches right across the frame, so
    // capping the width is what keeps the figure at a sensible size.
    id: 'love-of-the-game',
    eyebrow: 'Open daily',
    headline: 'For the love of the game',
    note: 'Four indoor courts on Level 3',
    accent: '#2036d8',
    media: {
      webp: '/offers/lotg-cutout-560.webp 560w, /offers/lotg-cutout-960.webp 960w',
      jpeg: '/offers/lotg-cutout-560.png 560w, /offers/lotg-cutout-960.png 960w',
      fallback: '/offers/lotg-cutout-960.png',
      focal: 'center bottom',
      fit: 'cutout',
      slot: 'max-w-[46%]',
      grounded: true,
    },
  },
  {
    // Supplied cut out, so this slide joins the other two as a figure on the brand's
    // own ground rather than a framed photograph. The net is open, so the ground
    // reads straight through the hoop.
    id: 'hustle',
    eyebrow: 'Open 10:00 till late',
    headline: 'Unlimited hustle',
    note: 'One hour, or a block of them',
    accent: '#e5199b',
    media: {
      webp: '/offers/hustle-cutout-560.webp 560w, /offers/hustle-cutout-960.webp 960w',
      jpeg: '/offers/hustle-cutout-560.png 560w, /offers/hustle-cutout-960.png 960w',
      fallback: '/offers/hustle-cutout-960.png',
      focal: 'center bottom',
      fit: 'cutout',
      slot: 'w-[62%] max-w-[860px]',
      grounded: true,
    },
  },
]

/**
 * Opening hours, defined once.
 *
 * `close` is the hour the doors shut, not the last bookable start — those differ by
 * an hour, and conflating them is what had the contact page printing a 22:00 close
 * while the booking engine and the home page counters both said
 * 23:00. LAST_START_* in lib/booking.ts is `close - 1`.
 */
export const OPENING_HOURS = [
  { days: 'Monday to Thursday', open: 10, close: 23, publicHolidays: false },
  { days: 'Friday to Sunday', open: 10, close: 24, publicHolidays: true },
]

/** 24-hour, the way the contact page lists them. Midnight reads as 00:00. */
const clock24 = (hour: number) => `${String(hour % 24).padStart(2, '0')}:00`

/** 12-hour, the way the hours ticker sets them. */
export const clock12 = (hour: number) => {
  const h = hour % 24
  const suffix = h >= 12 ? 'PM' : 'AM'
  return `${h % 12 === 0 ? 12 : h % 12}:00 ${suffix}`
}

export const VENUE = {
  brand: 'Glitch Sports',
  legalName: 'Glitch Entertainment LLC',
  address: 'Al Ghurair Centre, Deira',
  addressLines: ['Al Ghurair Centre, Deira', 'Level 3, near the residence entrance', 'Parking in the mall car park'],
  postalAddress: ['Glitch Entertainment LLC', 'Al Ghurair Centre, Level 2', 'Deira, Dubai, UAE'],
  phone: '971 600 545484',
  whatsapp: 'https://wa.me/971600545484',
  contactHours: 'Open 10:00 – 21:00 daily',
  email: 'glitcharabia.reception@al-ghurair.com',
  eventsEmail: 'Glitcharabia.Events@al-ghurair.com',
  venueHours: OPENING_HOURS.map(
    (h) => `${h.days}${h.publicHolidays ? ' and public holidays' : ''} ${clock24(h.open)} – ${clock24(h.close)}`,
  ),
  parentSite: 'https://glitcharabia.com',
  courtCount: COURTS.length,
}

/** One venue today; the picker is here so a second site slots in without a redesign. */
export const VENUES = [{ id: 'deira', name: 'Al Ghurair Centre, Deira' }]

export const ENQUIRY_TOPICS = [
  'Court booking',
  'Group or team booking',
  'Corporate and events',
  'Prices and rates',
  'Something else',
]

export const SOCIALS = [
  { id: 'instagram', short: 'IG', label: 'Instagram' },
  { id: 'tiktok', short: 'TT', label: 'TikTok' },
  { id: 'facebook', short: 'FB', label: 'Facebook' },
  { id: 'youtube', short: 'YT', label: 'YouTube' },
  { id: 'whatsapp', short: 'WA', label: 'WhatsApp' },
]
