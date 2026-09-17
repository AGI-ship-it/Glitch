import { useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { courtById } from '../../data/catalog'
import {
  aed,
  addDays,
  dayNumber,
  formatShortDate,
  freeCount,
  isWeekend,
  priceFor,
  rangeLabel,
  slotsFor,
  todayKey,
  weekdayShort,
} from '../../lib/booking'
import { useStore } from '../../store/StoreProvider'
import { Chevron } from '../../components/ui'

export default function ReschedulePage() {
  const { reference = '' } = useParams()
  const navigate = useNavigate()
  const { state, reschedule } = useStore()
  const today = todayKey()

  const booking = state.bookings.find((b) => b.reference === reference)
  const [dateKey, setDateKey] = useState(() => addDays(today, 1))
  const [hours, setHours] = useState<number[]>([])

  if (!state.account) return <Navigate to="/login?next=/account/bookings" replace />
  if (!booking) return <Navigate to="/account/bookings" replace />

  const court = courtById(booking.courtId)!
  const dates = Array.from({ length: 7 }, (_, i) => addDays(today, i + 1))
  const slots = slotsFor(court, dateKey)
  const newPrice = hours.reduce((sum, h) => sum + priceFor(court, dateKey, h), 0)
  const difference = newPrice - booking.paid

  const toggle = (hour: number) =>
    setHours((prev) => {
      if (prev.includes(hour)) return prev.filter((h) => h !== hour)
      if (prev.length >= booking.hours.length) return [hour]
      if (prev.length && !prev.some((h) => Math.abs(h - hour) === 1)) return [hour]
      return [...prev, hour].sort((a, b) => a - b)
    })

  const confirm = () => {
    if (hours.length !== booking.hours.length) return
    reschedule(booking.reference, dateKey, hours)
    navigate(`/account/bookings/${booking.reference}`)
  }

  return (
    <div className="shell pb-16">
      <nav className="pt-8 text-[15px]">
        <Link to={`/account/bookings/${booking.reference}`} className="text-muted hover:underline">
          <Chevron dir="left" className="h-3.5 w-3.5" />
          Booking details
        </Link>
      </nav>

      <h1 className="mt-4 text-[32px] font-extrabold">Move your booking</h1>

      <div className="card mt-6 p-6">
        <p className="text-[16px]">
          Currently · {court.name} · {formatShortDate(booking.dateKey)},{' '}
          {rangeLabel(Math.min(...booking.hours), booking.hours.length)} · {aed(booking.paid)} paid
        </p>
      </div>

      <h2 className="mt-10 text-[16px] font-semibold">Choose a new date</h2>
      {/* Same capsule pills as the booking page, so both date pickers read alike. */}
      <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-7">
        {dates.map((d) => {
          const free = freeCount(court, d)
          const active = d === dateKey
          const full = free === 0
          return (
            <button
              key={d}
              type="button"
              disabled={full}
              onClick={() => {
                setDateKey(d)
                setHours([])
              }}
              aria-pressed={active}
              aria-label={`${formatShortDate(d)}${full ? ', fully booked' : `, ${free} slots free`}`}
              className={`mx-auto flex w-full max-w-[78px] flex-col items-center gap-2.5 rounded-full px-1 py-5 transition ${
                active
                  ? 'bg-ink shadow-card'
                  : full
                    ? 'cursor-not-allowed border border-line opacity-40'
                    : 'border border-line hover:border-ink hover:shadow-card'
              }`}
            >
              <span className={`text-[13px] font-medium ${active ? 'text-white/70' : 'text-muted'}`}>
                {weekdayShort(d)}
              </span>
              <span
                className={`grid h-10 w-10 place-items-center rounded-full text-[16px] font-bold ${
                  active ? 'bg-brand-magenta text-white' : 'bg-wash text-ink'
                }`}
              >
                {dayNumber(d)}
              </span>
            </button>
          )
        })}
      </div>

      <h2 className="mt-10 text-[16px] font-semibold">
        Choose a new time · {formatShortDate(dateKey)}
        {isWeekend(dateKey) ? ' · weekend rate' : ''}
      </h2>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {slots
          .filter((s) => !s.past)
          .map((slot) => {
            const selected = hours.includes(slot.hour)
            return (
              <button
                key={slot.hour}
                type="button"
                disabled={!slot.available}
                onClick={() => toggle(slot.hour)}
                className={`h-[72px] rounded-2xl px-4 text-left transition ${
                  selected
                    ? 'bg-ink text-white shadow-card'
                    : slot.available
                      ? 'border border-line-strong hover:-translate-y-0.5 hover:border-ink hover:shadow-card'
                      : 'cursor-not-allowed border border-line bg-wash text-muted'
                }`}
              >
                <span className="block text-[15px] font-semibold">{slot.label}</span>
                <span className={`block text-[13px] ${selected ? 'text-white/70' : 'text-muted'}`}>
                  {slot.available ? aed(slot.price) : 'Booked'}
                </span>
              </button>
            )
          })}
      </div>

      <div className="card mt-8 p-6">
        {hours.length === booking.hours.length ? (
          <>
            <p className="text-[16px] font-medium">
              New slot costs {aed(newPrice)}
              {isWeekend(dateKey) ? ' — weekend rate' : ''}.{' '}
              {difference > 0
                ? `You will pay the ${aed(difference)} difference.`
                : difference < 0
                  ? `${aed(-difference)} will be returned to your card.`
                  : 'The price is unchanged.'}
            </p>
            <p className="mt-2 text-[15px] text-muted">
              Your original {rangeLabel(Math.min(...booking.hours), booking.hours.length).split(' ')[0]}{' '}
              slot on {formatShortDate(booking.dateKey)} goes back on sale immediately.
            </p>
          </>
        ) : (
          <p className="text-[16px] text-muted">
            Pick {booking.hours.length} hour{booking.hours.length > 1 ? 's' : ''} to match your
            original booking.
          </p>
        )}
      </div>

      <div className="mt-6 flex flex-wrap gap-4">
        <button
          type="button"
          onClick={confirm}
          disabled={hours.length !== booking.hours.length}
          className="btn btn-md btn-primary w-[300px]"
        >
          Confirm new time
        </button>
        <Link to={`/account/bookings/${booking.reference}`} className="btn btn-md btn-quiet w-[260px]">
          Keep original booking
        </Link>
      </div>
    </div>
  )
}
