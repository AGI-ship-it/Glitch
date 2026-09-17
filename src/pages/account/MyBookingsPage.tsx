import { Link, Navigate } from 'react-router-dom'
import { courtById } from '../../data/catalog'
import { VAT_RATE, aed, formatLongDate, rangeLabel, receiptDataUri, todayKey } from '../../lib/booking'
import { Badge } from '../../components/ui'
import AccountShell from './AccountShell'
import { useStore } from '../../store/StoreProvider'
import type { Booking } from '../../store/types'

export const isUpcoming = (b: Booking) => b.status === 'confirmed' && b.dateKey >= todayKey()

/** Free changes and cancellation until 24 hours before the slot. */
export function changesAllowed(b: Booking) {
  const start = new Date(b.dateKey)
  start.setHours(Math.min(...b.hours), 0, 0, 0)
  return start.getTime() - Date.now() > 24 * 3600 * 1000
}

const PERKS = [
  {
    n: 1,
    title: 'See every booking in one place',
    sub: 'Reference number and QR code, ready to show at reception.',
  },
  { n: 2, title: 'Rebook in one tap', sub: 'Play the same slot every week without starting from scratch.' },
  {
    n: 3,
    title: 'Change plans without calling',
    sub: 'Move or cancel a booking yourself, up to 24 hours before.',
  },
]

export default function MyBookingsPage({ tab }: { tab: 'upcoming' | 'past' }) {
  const { state } = useStore()
  if (!state.account) return <Navigate to="/login?next=/account/bookings" replace />

  const upcoming = state.bookings.filter(isUpcoming)
  const past = state.bookings.filter((b) => !isUpcoming(b))
  const list = tab === 'upcoming' ? upcoming : past

  const isPastTab = tab === 'past'

  return (
    <AccountShell
      crumb={isPastTab ? 'Past bookings' : 'My bookings'}
      title={isPastTab ? 'Past bookings' : 'My bookings'}
      intro={
        isPastTab
          ? 'Everything you have already played, with its receipt.'
          : 'Your confirmed slots, with the QR code reception scans to check you in.'
      }
    >
      {list.length === 0 ? (
        <EmptyState tab={tab} />
      ) : (
        <div className="space-y-4">
          {list.map((b) => (
            <BookingRow key={b.reference} booking={b} />
          ))}
        </div>
      )}
    </AccountShell>
  )
}

function BookingRow({ booking }: { booking: Booking }) {
  const court = courtById(booking.courtId)!
  const upcoming = isUpcoming(booking)
  const canChange = changesAllowed(booking)

  // `paid` is VAT-inclusive, so the receipt reverses the rate out rather than adding it.
  const subtotal = Math.round(booking.paid / (1 + VAT_RATE))
  const receipt = receiptDataUri(
    [
      {
        reference: booking.reference,
        court: `Court ${Number(court.number)}`,
        date: formatLongDate(booking.dateKey),
        time: rangeLabel(Math.min(...booking.hours), booking.hours.length),
        amount: aed(booking.paid),
      },
    ],
    { subtotal: aed(subtotal), vat: aed(booking.paid - subtotal), total: aed(booking.paid) },
  )

  return (
    <article className="card relative p-6 sm:p-8">
      <Badge tone={upcoming ? 'dark' : 'light'}>
        {booking.status === 'cancelled' ? 'Cancelled' : upcoming ? 'Confirmed' : 'Completed'}
      </Badge>

      <a
        href={receipt}
        download={`glitch-sports-${booking.reference}.html`}
        aria-label={`Download receipt for ${booking.reference}`}
        title="Download receipt"
        className="absolute right-5 top-5 grid h-11 w-11 place-items-center rounded-full border border-line-strong text-muted transition hover:border-ink hover:bg-ink hover:text-white sm:right-7 sm:top-7"
      >
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M12 3.5v11m0 0 4-4m-4 4-4-4M4.5 17v1.5A2 2 0 0 0 6.5 20.5h11a2 2 0 0 0 2-2V17"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </a>

      <h2 className="mt-4 text-[22px] font-bold">{court.name}</h2>
      <p className="mt-2 text-[16px] text-muted">
        {formatLongDate(booking.dateKey)} · {rangeLabel(Math.min(...booking.hours), booking.hours.length)} ·{' '}
        {booking.hours.length} hour{booking.hours.length > 1 ? 's' : ''}
      </p>
      <p className="mt-1 text-[14px] text-muted">
        {booking.reference} ·{' '}
        {booking.status === 'cancelled' ? `${aed(booking.refunded ?? booking.paid)} refunded` : `${aed(booking.paid)} paid`}
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        {upcoming ? (
          <>
            <Link to={`/account/bookings/${booking.reference}`} className="btn btn-md btn-outline w-[150px]">
              View QR
            </Link>
            <Link
              to={`/account/bookings/${booking.reference}/reschedule`}
              className={`btn btn-md btn-quiet w-[170px] ${canChange ? '' : 'pointer-events-none opacity-40'}`}
            >
              Reschedule
            </Link>
            <Link
              to={`/account/bookings/${booking.reference}/cancel`}
              className={`btn btn-md btn-quiet w-[150px] ${canChange ? '' : 'pointer-events-none opacity-40'}`}
            >
              Cancel
            </Link>
            <p className="text-[14px] text-muted">
              {canChange ? 'Free changes until 24 hours before' : 'Inside 24 hours — this booking is fixed'}
            </p>
          </>
        ) : (
          <>
            <Link to={`/book/${booking.courtId}`} className="btn btn-md btn-outline w-[170px]">
              Book again
            </Link>
            <Link to={`/account/bookings/${booking.reference}`} className="text-[15px] underline">
              View receipt
            </Link>
          </>
        )}
      </div>
    </article>
  )
}

function EmptyState({ tab }: { tab: 'upcoming' | 'past' }) {
  if (tab === 'past') {
    return (
      <div className="card p-12 text-center">
        <p className="text-[22px] font-bold">No past bookings yet</p>
        <p className="mx-auto mt-2 max-w-[52ch] text-[16px] text-muted">
          Once you have played, your completed and cancelled bookings appear here with their receipts.
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="card px-6 py-14 text-center">
        <div className="mx-auto h-[120px] w-[200px] rounded-lg bg-wash-strong" aria-hidden="true" />
        <p className="mt-8 text-[26px] font-extrabold">Your bookings will appear here</p>
        <p className="mx-auto mt-3 max-w-[60ch] text-[16px] text-muted">
          Nothing booked yet. Find a court, pick a time, and it will show up on this page.
        </p>
        <Link to="/courts" className="btn btn-lg btn-primary mt-8 w-[260px]">
          Find a court
        </Link>
      </div>

      <h2 className="mt-14 text-[24px] font-bold">What your account gives you</h2>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {PERKS.map((p) => (
          <div key={p.n} className="card p-6">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-ink text-[13px] font-semibold text-white">
              {p.n}
            </span>
            <p className="mt-6 text-[17px] font-semibold">{p.title}</p>
            <p className="mt-2 text-[15px] leading-relaxed text-muted">{p.sub}</p>
          </div>
        ))}
      </div>
    </>
  )
}
