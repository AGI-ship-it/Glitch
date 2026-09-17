import { COURTS, type Court, type SportId } from '../data/catalog'

export const VAT_RATE = 0.05

/** Weekend rates apply Friday to Sunday, matching the venue hours. */
const WEEKEND_DAYS = new Set([0, 5, 6])
const WEEKEND_SURCHARGE = 20
const PEAK_FROM_HOUR = 17
const OPEN_HOUR = 10
/** Last bookable start hour: 22:00–23:00 on weekdays, 23:00–00:00 at the weekend. */
const LAST_START_WEEKDAY = 22
const LAST_START_WEEKEND = 23

export type Slot = {
  hour: number
  label: string
  price: number
  peak: boolean
  available: boolean
  past: boolean
}

/* ---------- dates ---------- */

export const todayKey = () => toKey(new Date())

export function toKey(d: Date) {
  const y = d.getFullYear()
  const m = `${d.getMonth() + 1}`.padStart(2, '0')
  const day = `${d.getDate()}`.padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function fromKey(key: string) {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function addDays(key: string, days: number) {
  const d = fromKey(key)
  d.setDate(d.getDate() + days)
  return toKey(d)
}

export const isWeekend = (key: string) => WEEKEND_DAYS.has(fromKey(key).getDay())

export function formatLongDate(key: string) {
  return fromKey(key)
    .toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    .replace(',', '')
}

export function formatShortDate(key: string) {
  return fromKey(key)
    .toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
    .replace(',', '')
}

export function formatMonth(key: string) {
  return fromKey(key).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
}

export const weekdayShort = (key: string) =>
  fromKey(key).toLocaleDateString('en-GB', { weekday: 'short' })

export const dayNumber = (key: string) => fromKey(key).getDate()

export const hourLabel = (h: number) => `${`${h}`.padStart(2, '0')}:00`

export const rangeLabel = (start: number, hours: number) =>
  `${hourLabel(start)} – ${hourLabel((start + hours) % 24)}`

/* ---------- money ---------- */

export const aed = (n: number) => `AED ${Math.round(n).toLocaleString('en-GB')}`

export function totals(subtotal: number) {
  const vat = Math.round(subtotal * VAT_RATE)
  return { subtotal, vat, total: subtotal + vat }
}

/* ---------- availability ---------- */

/**
 * Availability is generated from a stable hash so a court shows the same free
 * hours on every render and across reloads, without a backend.
 */
function hash(input: string) {
  let h = 2166136261
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return (h >>> 0) / 4294967295
}

export function priceFor(court: Court, dateKey: string, hour: number) {
  const base = hour >= PEAK_FROM_HOUR ? court.peak : court.offPeak
  return isWeekend(dateKey) ? base + WEEKEND_SURCHARGE : base
}

export function startHours(dateKey: string) {
  const last = isWeekend(dateKey) ? LAST_START_WEEKEND : LAST_START_WEEKDAY
  const hours: number[] = []
  for (let h = OPEN_HOUR; h <= last; h++) hours.push(h)
  return hours
}

export function slotsFor(court: Court, dateKey: string): Slot[] {
  const now = new Date()
  const isToday = dateKey === toKey(now)
  return startHours(dateKey).map((hour) => {
    const past = isToday && hour <= now.getHours()
    const booked = hash(`${court.id}|${dateKey}|${hour}`) < 0.28
    return {
      hour,
      label: rangeLabel(hour, 1),
      price: priceFor(court, dateKey, hour),
      peak: hour >= PEAK_FROM_HOUR,
      available: !past && !booked,
      past,
    }
  })
}

export const freeCount = (court: Court, dateKey: string) =>
  slotsFor(court, dateKey).filter((s) => s.available).length

export function nextFreeSlot(court: Court, dateKey: string) {
  return slotsFor(court, dateKey).find((s) => s.available)
}

/** The next few dates that still have free hours — powers the empty state. */
export function nextAvailableDates(court: Court, fromDateKey: string, count = 4) {
  const out: { dateKey: string; free: number }[] = []
  let cursor = fromDateKey
  for (let i = 0; i < 21 && out.length < count; i++) {
    cursor = addDays(cursor, 1)
    const free = freeCount(court, cursor)
    if (free > 0) out.push({ dateKey: cursor, free })
  }
  return out
}

/** Contiguous run of selected hours; the BRD only allows adjacent hours in a block. */
export function isAdjacent(selected: number[], hour: number) {
  if (selected.length === 0) return true
  return selected.some((h) => Math.abs(h - hour) === 1)
}

export function blockIsContiguous(selected: number[]) {
  if (selected.length < 2) return true
  const sorted = [...selected].sort((a, b) => a - b)
  return sorted.every((h, i) => i === 0 || h === sorted[i - 1] + 1)
}

export function suggest(
  kind: 'next' | 'cheapest2' | 'longest',
  courts: Court[],
  dateKey: string,
): { courtId: string; hours: number[] } | null {
  const runs = courts.flatMap((court) => {
    const slots = slotsFor(court, dateKey)
    const groups: Slot[][] = []
    let current: Slot[] = []
    for (const slot of slots) {
      if (slot.available) current.push(slot)
      else if (current.length) {
        groups.push(current)
        current = []
      }
    }
    if (current.length) groups.push(current)
    return groups.map((g) => ({ courtId: court.id, slots: g }))
  })
  if (!runs.length) return null

  if (kind === 'next') {
    const best = runs.reduce((a, b) => (a.slots[0].hour <= b.slots[0].hour ? a : b))
    return { courtId: best.courtId, hours: [best.slots[0].hour] }
  }
  if (kind === 'longest') {
    const best = runs.reduce((a, b) => (a.slots.length >= b.slots.length ? a : b))
    return { courtId: best.courtId, hours: best.slots.map((s) => s.hour) }
  }
  const pairs = runs
    .filter((r) => r.slots.length >= 2)
    .flatMap((r) =>
      r.slots.slice(0, -1).map((s, i) => ({
        courtId: r.courtId,
        hours: [s.hour, r.slots[i + 1].hour],
        price: s.price + r.slots[i + 1].price,
      })),
    )
  if (!pairs.length) return null
  const best = pairs.reduce((a, b) => (a.price <= b.price ? a : b))
  return { courtId: best.courtId, hours: best.hours }
}

export function searchCourts(sport: SportId | 'all') {
  return sport === 'all' ? COURTS : COURTS.filter((c) => c.sport === sport)
}

let refCounter = 4816

/**
 * References must never collide with bookings that already exist — the counter
 * restarts on every page load, so it first jumps past the highest stored one.
 */
export function makeReference(existing: string[] = []) {
  const highest = existing.reduce((max, ref) => {
    const n = Number(ref.split('-')[2])
    return Number.isFinite(n) ? Math.max(max, n) : max
  }, refCounter)
  refCounter = highest + 1
  return `GS-${new Date().getFullYear()}-0${refCounter}`
}

/**
 * The receipt as a document the customer keeps, built here rather than fetched:
 * there is no backend to ask for a PDF, and a data URI is the one thing a static
 * prototype can hand over. Kept to plain markup so it prints to PDF cleanly.
 *
 * Note that a sandboxed preview may refuse a page-initiated download; on the
 * deployed site the anchor saves the file as normal.
 */
export function receiptDataUri(
  rows: { reference: string; date: string; time: string; court: string; amount: string }[],
  totals: { subtotal: string; vat: string; total: string },
) {
  const cells = rows
    .map(
      (r) =>
        `<tr><td>${r.reference}</td><td>${r.court}</td><td>${r.date}</td><td>${r.time}</td><td class="r">${r.amount}</td></tr>`,
    )
    .join('')
  const html = `<!doctype html><meta charset="utf-8"><title>Glitch Sports receipt</title>
<style>
body{font:14px/1.5 -apple-system,Segoe UI,sans-serif;color:#0d0d10;margin:40px;max-width:640px}
h1{font-size:20px;margin:0 0 4px}p{margin:0 0 24px;color:#6e6c76}
table{width:100%;border-collapse:collapse}th,td{text-align:left;padding:8px 0;border-bottom:1px solid #e8e6ec}
th{font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#6e6c76}
.r{text-align:right}.tot td{border:0;padding-top:6px}.tot:last-child td{font-weight:700;font-size:16px}
</style>
<h1>Glitch Sports — receipt</h1>
<p>Al Ghurair Centre, Deira · Level 3</p>
<table><thead><tr><th>Reference</th><th>Court</th><th>Date</th><th>Time</th><th class="r">Paid</th></tr></thead>
<tbody>${cells}</tbody>
<tfoot>
<tr class="tot"><td colspan="4">Subtotal</td><td class="r">${totals.subtotal}</td></tr>
<tr class="tot"><td colspan="4">VAT 5%</td><td class="r">${totals.vat}</td></tr>
<tr class="tot"><td colspan="4">Total paid</td><td class="r">${totals.total}</td></tr>
</tfoot></table>`
  return `data:text/html;charset=utf-8,${encodeURIComponent(html)}`
}
