import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { COURTS, SPORTS, courtById, courtsBySport, type Court, type SportId } from '../data/catalog'
import {
  aed,
  addDays,
  dayNumber,
  formatMonth,
  formatShortDate,
  freeCount,
  isAdjacent,
  priceFor,
  rangeLabel,
  slotsFor,
  todayKey,
  weekdayShort,
} from '../lib/booking'
import { Chevron, SelectMenu } from './ui'
import { useStore } from '../store/StoreProvider'

/** The sport is already chosen on this page, so courts read as "Court 1". */
export const shortCourtName = (name: string) =>
  name.replace('Basketball court', 'Court').replace('Volleyball court', 'Court')

/** A ball per sport, so the choice is a picture rather than a line in a menu. */
const SPORT_ART: Record<string, React.ReactNode> = {
  basketball: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3v18M5.6 5.6c3.5 3.5 3.5 9.3 0 12.8M18.4 5.6c-3.5 3.5-3.5 9.3 0 12.8" />
    </>
  ),
  volleyball: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3c-2.4 3.6-2.4 13.4 0 18M20.6 9.2c-4.2-.7-11.9 3-14.9 7.6M3.4 9.2c4.2-.7 11.9 3 14.9 7.6" />
    </>
  ),
}

/**
 * One court, chosen. Numbered from the catalog rather than from its name: the names
 * count from one within each sport, so volleyball's courts would both have read as
 * "Court 1" and "Court 2" alongside basketball's.
 */
function CourtChip({ court, active, onPick }: { court: Court; active: boolean; onPick: () => void }) {
  return (
    <button
      type="button"
      onClick={onPick}
      aria-pressed={active}
      className={`h-10 rounded-full border px-6 text-[14px] font-semibold transition ${
        active ? 'border-ink bg-ink text-white' : 'border-line-strong hover:border-ink'
      }`}
    >
      Court {Number(court.number)}
    </button>
  )
}

export type PickerRequest = {
  courtId?: string
  sport?: SportId
  dateKey?: string
  hour?: number
  /**
   * Bumped by the caller to re-apply a request the picker may already be showing —
   * the home hero's search bar firing a second time with the same slot.
   */
  nonce?: number
}

/**
 * The whole slot picker — sport, court, week, hours, price and the hand-off to the
 * cart. Lives here rather than on the booking page because the home page runs the
 * same picker inline, under its hero: the CTA scrolls down to it instead of leaving
 * for another screen, and both entry points must behave identically.
 */
export default function BookingPicker({
  request,
  /** The sport row is redundant where the caller already offers one. */
  showSportSelect = true,
  /**
   * Which half to draw. A stepped caller asks for the court and its sport first and
   * the week and its hours second; everything else takes both at once. The choice
   * lives here rather than in two components so one instance keeps the state.
   */
  stage = 'all',
  /**
   * Where the slot goes once it is chosen. A caller that runs the rest of the
   * booking inline handles this itself; without one the picker keeps its own
   * behaviour and hands off to the cart.
   */
  onPicked,
  /**
   * Fires whenever the court, the day or the hours change — before anything is in
   * the cart. A stepped caller draws its own summary of the booking and would
   * otherwise have nothing to draw until the slot was committed.
   */
  onSelectionChange,
}: {
  request?: PickerRequest
  showSportSelect?: boolean
  stage?: 'all' | 'court' | 'time'
  onPicked?: () => void
  onSelectionChange?: (s: {
    courtId: string
    dateKey: string
    hours: number[]
    sport: SportId
  }) => void
}) {
  const navigate = useNavigate()
  const { state, addToCart } = useStore()

  const today = todayKey()
  const initialCourt =
    (request?.courtId && courtById(request.courtId)) ||
    (request?.sport && courtsBySport(request.sport)[0]) ||
    COURTS[0]

  const [sport, setSport] = useState<SportId>(initialCourt.sport)
  const [courtId, setCourtId] = useState(initialCourt.id)
  const [weekStart, setWeekStart] = useState(today)
  const [dateKey, setDateKey] = useState(request?.dateKey ?? today)
  const [hours, setHours] = useState<number[]>(
    request?.hour !== undefined && Number.isFinite(request.hour) ? [request.hour] : [],
  )

  /**
   * Every court plays both sports, so the list does not narrow with the game — the
   * sport is what gets marked and rigged on the floor, not which floors exist.
   */
  const courts = COURTS
  const week = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart],
  )

  /**
   * Switching sport or date invalidates whatever was picked before — but only on a
   * real change. These used to fire on mount, which reset the court to the first of
   * its sport (so /book/basketball-2 opened on Court 1) and wiped any preset hour.
   * Compared by value rather than a "has mounted" flag, because StrictMode mounts
   * twice and a flag is already true on the second pass.
   */
  const lastSport = useRef(sport)
  useEffect(() => {
    if (lastSport.current === sport) return
    lastSport.current = sport
    // The courts survive a change of sport now; only the hours are re-picked.
    setHours([])
  }, [sport])

  const lastDate = useRef(dateKey)
  useEffect(() => {
    if (lastDate.current === dateKey) return
    lastDate.current = dateKey
    setHours([])
  }, [dateKey])

  /**
   * A later request from the caller — the hero bar handing over sport, court, date
   * and hour as the page scrolls here. The two guards below compare by value, so the
   * refs are moved in step or those effects would immediately wipe what arrives.
   */
  const lastNonce = useRef(request?.nonce)
  useEffect(() => {
    if (request?.nonce === undefined || request.nonce === lastNonce.current) return
    lastNonce.current = request.nonce

    const court =
      (request.courtId && courtById(request.courtId)) ||
      (request.sport && courtsBySport(request.sport)[0]) ||
      undefined

    if (court) {
      lastSport.current = court.sport
      setSport(court.sport)
      setCourtId(court.id)
    }
    if (request.dateKey) {
      lastDate.current = request.dateKey
      setDateKey(request.dateKey)
      setWeekStart(request.dateKey < today ? today : request.dateKey)
    }
    setHours(request.hour !== undefined ? [request.hour] : [])
  }, [request, today])

  // Held in a ref so an inline callback from the caller cannot make the effect
  // below re-fire on every render.
  const report = useRef(onSelectionChange)
  report.current = onSelectionChange
  useEffect(() => {
    report.current?.({ courtId, dateKey, hours, sport })
  }, [courtId, hours, dateKey, sport])

  const selectedCourt = courtById(courtId) ?? courts[0]
  const selectionPrice = hours.reduce((sum, h) => sum + priceFor(selectedCourt, dateKey, h), 0)
  const unitPrice = hours.length ? selectionPrice / hours.length : 0

  const toggleHour = (hour: number) =>
    setHours((prev) => {
      if (prev.includes(hour)) {
        // Removing a middle hour would split the block; keep only the contiguous head.
        const sorted = prev.filter((h) => h !== hour).sort((a, b) => a - b)
        return sorted.filter((h, i) => i === 0 || h === sorted[i - 1] + 1)
      }
      if (!isAdjacent(prev, hour)) return [hour]
      return [...prev, hour].sort((a, b) => a - b)
    })

  const continueToBook = () => {
    if (!hours.length) return
    addToCart(courtId, dateKey, hours)
    if (onPicked) return onPicked()
    navigate(state.account ? '/cart' : '/login?next=/cart')
  }

  return (
    <div>
      {stage !== 'time' && (
        <>
        {/* Court tabs. No "all" tab: a booking is one court, and the grid that
            answered "any of them" went with it. */}
        {stage === 'all' ? (
          <div className="flex flex-wrap justify-center gap-2">
            {courts.map((tab) => (
              <CourtChip
                key={tab.id}
                court={tab}
                active={courtId === tab.id}
                onPick={() => {
                  setCourtId(tab.id)
                  setHours([])
                }}
              />
            ))}
          </div>
        ) : (
          <div>
            <p className="label">Court</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {courts.map((tab) => (
                <CourtChip
                  key={tab.id}
                  court={tab}
                  active={courtId === tab.id}
                  onPick={() => {
                    setCourtId(tab.id)
                    setHours([])
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {showSportSelect &&
          (stage === 'all' ? (
            <SelectMenu
              label="Sport"
              value={sport}
              onChange={(v) => setSport(v as SportId)}
              options={SPORTS.map((s) => ({ value: s.id, label: s.name }))}
              className="z-10 mx-auto mt-4 w-[95%]"
            />
          ) : (
            <div className="mt-6">
              <p className="label">Sport</p>
              <div className="mt-3 grid grid-cols-2 gap-3 sm:max-w-[420px]">
                {SPORTS.map((sp) => {
                  const active = sp.id === sport
                  return (
                    <button
                      key={sp.id}
                      type="button"
                      onClick={() => setSport(sp.id)}
                      aria-pressed={active}
                      className={`flex flex-col items-center gap-2 rounded-[16px] border-2 px-4 py-5 transition ${
                        active
                          ? 'border-brand-magenta bg-brand-magenta/5 text-ink'
                          : 'border-line-strong text-muted hover:border-ink hover:text-ink'
                      }`}
                    >
                      <svg
                        width="34"
                        height="34"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        aria-hidden="true"
                        className={active ? 'text-brand-magenta' : ''}
                      >
                        {SPORT_ART[sp.id]}
                      </svg>
                      <span className="text-[15px] font-bold">{sp.name}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}

        </>
      )}

      {stage !== 'court' && (
        <>
        {/* Week navigation — month reads first on the left, arrows sit right. */}
        <div className="mt-4 flex items-center justify-between">
          <span className="text-[15px] font-semibold">{formatMonth(weekStart)}</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setWeekStart(addDays(weekStart, -7))}
              disabled={weekStart === today}
              className="grid h-8 w-8 place-items-center rounded-full border border-line-strong transition hover:border-ink disabled:opacity-30 disabled:hover:border-line-strong"
              aria-label="Previous week"
            >
              <Chevron dir="left" />
            </button>
            <button
              type="button"
              onClick={() => setWeekStart(addDays(weekStart, 7))}
              className="grid h-8 w-8 place-items-center rounded-full border border-line-strong transition hover:border-ink"
              aria-label="Next week"
            >
              <Chevron dir="right" />
            </button>
          </div>
        </div>

        {/* Capsule day pills: weekday above, date in its own circle. The selected day
            inverts to a dark pill with the number in brand magenta. */}
        <div className="mt-1.5 grid grid-cols-7 gap-1.5 sm:gap-2">
          {week.map((d) => {
            const active = d === dateKey
            const isToday = d === today
            // Free where every held court is free — the day has to work for all of them.
            const free = freeCount(selectedCourt, d)
            const full = free === 0
            return (
              <div key={d} className="flex flex-col items-center">
                <span className="mb-1 flex h-4 flex-col items-center text-[11px] font-medium">
                  {isToday && (
                    <>
                      <span className="text-brand-magenta">Today</span>
                      <span aria-hidden="true" className="mt-0.5 h-[2px] w-7 rounded-full bg-brand-magenta" />
                    </>
                  )}
                </span>
                <button
                  type="button"
                  onClick={() => setDateKey(d)}
                  disabled={full}
                  aria-pressed={active}
                  aria-label={`${formatShortDate(d)}${full ? ', fully booked' : `, ${free} slots free`}`}
                  className={`mx-auto flex w-11 flex-col items-center gap-1.5 rounded-full px-0.5 py-2.5 transition ${
                    active
                      ? 'bg-ink shadow-card'
                      : full
                        ? 'cursor-not-allowed border border-line opacity-40'
                        : 'border border-line hover:border-ink hover:shadow-card'
                  }`}
                >
                  <span className={`text-[10px] font-medium ${active ? 'text-white/70' : 'text-muted'}`}>
                    {weekdayShort(d)}
                  </span>
                  <span
                    className={`grid h-7 w-7 place-items-center rounded-full text-[13px] font-bold transition ${
                      active ? 'bg-brand-magenta text-white' : 'bg-wash text-ink'
                    }`}
                  >
                    {dayNumber(d)}
                  </span>
                </button>
              </div>
            )
          })}
        </div>

        <SlotList
          court={selectedCourt}
          dateKey={dateKey}
          hours={hours}
          onToggle={toggleHour}
          onClear={() => setHours([])}
        />

        {/* Price and CTA share one bar so the whole picker fits a single screen.
            A stepped caller draws its own bar at the foot of the window instead. */}
        {stage === 'all' && (
          <div className="card sticky bottom-0 z-10 mt-4 flex flex-col gap-3 px-5 py-3.5 shadow-pop sm:flex-row sm:items-center">
            <div className="min-w-0 flex-1">
              <p className="text-[12px] text-muted">
                {hours.length > 1 ? `Price · ${hours.length} × ${aed(unitPrice)}` : 'Price'}
              </p>
              <p className="text-[22px] font-bold leading-tight">
                {hours.length ? aed(selectionPrice) : '—'}
              </p>
              <p className="truncate text-[12px] text-muted">
                {hours.length
                  ? `Court ${Number(selectedCourt.number)} · ${formatShortDate(dateKey)} · ${rangeLabel(
                      Math.min(...hours),
                      hours.length,
                    )}${
                      hours.length > 1 ? ` · ${hours.length} hours` : ''
                    }`
                  : 'Pick an hour to see the price'}
              </p>
            </div>
            <button
              type="button"
              onClick={continueToBook}
              disabled={!hours.length}
              className="flex h-12 w-full shrink-0 items-center justify-center gap-2.5 rounded-full bg-brand-magenta px-7 text-[14px] font-bold uppercase tracking-[0.08em] text-white transition hover:brightness-110 disabled:bg-wash-strong disabled:text-muted sm:w-[220px]"
            >
              Continue to book
            </button>
          </div>
        )}

        </>
      )}
    </div>
  )
}

function SlotList({
  court,
  dateKey,
  hours: selectedHours,
  onToggle,
  onClear,
}: {
  court: Court
  dateKey: string
  hours: number[]
  onToggle: (hour: number) => void
  onClear: () => void
}) {
  const slots = useMemo(() => slotsFor(court, dateKey).filter((s) => !s.past), [court, dateKey])

  if (!slots.length) {
    return (
      <div className="card mt-8 p-10 text-center">
        <p className="text-[19px] font-semibold">Nothing left on this date</p>
        <p className="mt-2 text-[15px] text-muted">Pick another day from the strip above.</p>
      </div>
    )
  }

  return (
    <section className="mt-5">
      <div className="flex items-baseline justify-between">
        <h3 className="text-[17px] font-semibold">Available times</h3>
        <p className="text-[13px] text-muted">One hour per slot</p>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5">
        {slots.map((slot) => {
          const selected = selectedHours.includes(slot.hour)
          return (
            // Selected is a solid fill: an outline alone was too close to hover.
            <button
              key={slot.hour}
              type="button"
              disabled={!slot.available}
              onClick={() => onToggle(slot.hour)}
              aria-pressed={selected}
              className={`group relative h-12 rounded-lg px-3 text-left transition ${
                selected
                  ? 'bg-ink text-white shadow-card'
                  : slot.available
                    ? 'border border-line-strong hover:-translate-y-0.5 hover:border-ink hover:shadow-card'
                    : 'cursor-not-allowed border border-line bg-wash text-muted'
              }`}
            >
              <span className="block text-[13px] font-semibold leading-tight">{slot.label}</span>
              <span className={`block text-[11px] leading-tight ${selected ? 'text-white/70' : 'text-muted'}`}>
                {slot.available ? aed(slot.price) : 'Booked'}
              </span>
              {slot.peak && slot.available && !selected && (
                <span className="absolute right-2.5 top-2.5 h-1.5 w-1.5 rounded-full bg-brand-magenta" title="Peak rate" />
              )}
            </button>
          )
        })}
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <p className="text-[13px] text-muted">
          {selectedHours.length > 1
            ? `${selectedHours.length} hours selected. Only adjacent hours can be added.`
            : 'Tap adjacent hours to book a longer block.'}
        </p>
        {selectedHours.length > 0 && (
          <button type="button" onClick={onClear} className="text-[14px] font-medium underline">
            Clear selection
          </button>
        )}
      </div>
    </section>
  )
}
