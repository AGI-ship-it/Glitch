import { fromKey, toKey } from '../lib/booking'

export const VAT_RATE = 0.05
export const HOLD_SECONDS = 10 * 60
export const BOOKING_WINDOW_DAYS = 60

export type SxCourt = { id: string; name: string }

export const SX_COURTS: SxCourt[] = [
  { id: 'court-1', name: 'Court 1' },
  { id: 'court-2', name: 'Court 2' },
  { id: 'court-3', name: 'Court 3' },
  { id: 'court-4', name: 'Court 4' },
]

export const SX_PRODUCT = {
  id: 'court-booking',
  name: 'Court booking',
  detail: 'Priced per hour · same rate on every court',
}

export const SX_VENUE = {
  name: 'Glitch Sports',
  address: 'Al Ghurair Centre, Deira, Level 3',
  parentSite: 'https://glitcharabia.com',
  waiverSite: 'https://waivers.semnox.com',
}

const WEEKEND = new Set([0, 5, 6])
export const isWeekendKey = (key: string) => WEEKEND.has(fromKey(key).getDay())

const OPEN = 10
/** Doors close 23:00 Mon–Thu and midnight Fri–Sun; the last slot starts an hour before. */
export const closingHour = (key: string) => (isWeekendKey(key) ? 24 : 23)

export function priceFor(key: string, hour: number) {
  const base = hour >= 17 ? 160 : 120
  return isWeekendKey(key) ? base + 20 : base
}

/** Cheapest slot that day — what the product card can show before a slot is picked. */
export const fromPrice = (key: string) => priceFor(key, OPEN)

export type SxSlot = {
  hour: number
  price: number
  available: number
  past: boolean
}

/** Stable pseudo-random, so the same court and hour is sold out on every render. */
function soldOut(key: string, courtId: string, hour: number) {
  let h = 0
  for (const c of `${key}|${courtId}|${hour}`) h = (h * 31 + c.charCodeAt(0)) >>> 0
  return h % 5 === 0
}

export function slotsFor(key: string, courtId: string, now = new Date()): SxSlot[] {
  const today = toKey(now)
  const slots: SxSlot[] = []
  for (let hour = OPEN; hour < closingHour(key); hour++) {
    slots.push({
      hour,
      price: priceFor(key, hour),
      available: soldOut(key, courtId, hour) ? 0 : 1,
      past: key < today || (key === today && hour <= now.getHours()),
    })
  }
  return slots
}

export const hourLabel = (hour: number) => `${String(hour % 24).padStart(2, '0')}:00`
export const slotLabel = (hour: number) => `${hourLabel(hour)} – ${hourLabel(hour + 1)}`
export const aed = (n: number) =>
  `AED ${n.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

export const COUPONS: Record<string, number> = { GLITCH10: 0.1 }

/** Semnox prices include VAT; it splits the tax back out of the grand total. */
export function cartTotals(prices: number[], discountRate = 0) {
  const gross = prices.reduce((a, b) => a + b, 0)
  const discount = gross * discountRate
  const grand = gross - discount
  const net = grand / (1 + VAT_RATE)
  return { net, vat: grand - net, discount, grand }
}
