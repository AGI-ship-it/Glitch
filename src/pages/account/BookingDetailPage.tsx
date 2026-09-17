import { Link, Navigate, useParams } from 'react-router-dom'
import { VENUE, courtById } from '../../data/catalog'
import { aed, formatLongDate, rangeLabel } from '../../lib/booking'
import { Chevron, QrCode } from '../../components/ui'
import { useStore } from '../../store/StoreProvider'
import { changesAllowed, isUpcoming } from './MyBookingsPage'

export default function BookingDetailPage() {
  const { reference = '' } = useParams()
  const { state } = useStore()

  if (!state.account) return <Navigate to="/login?next=/account/bookings" replace />
  const booking = state.bookings.find((b) => b.reference === reference)
  if (!booking) return <Navigate to="/account/bookings" replace />

  const court = courtById(booking.courtId)!
  const upcoming = isUpcoming(booking)
  const canChange = changesAllowed(booking)

  return (
    <div className="shell pb-16">
      <nav className="pt-8 text-[15px]">
        <Link to="/account/bookings" className="text-muted hover:underline">
          <Chevron dir="left" className="h-3.5 w-3.5" />
          My bookings
        </Link>
      </nav>

      <h1 className="mt-4 text-[32px] font-extrabold">{court.name}</h1>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_400px]">
        <section className="card p-6 sm:p-8">
          <p className="label">Reference</p>
          <p className="text-[22px] font-bold">{booking.reference}</p>

          <div className="mt-8 grid gap-8 sm:grid-cols-2">
            <div>
              <p className="label">Date</p>
              <p className="text-[17px] font-medium">{formatLongDate(booking.dateKey)}</p>
            </div>
            <div>
              <p className="label">Time</p>
              <p className="text-[17px] font-medium">
                {rangeLabel(Math.min(...booking.hours), booking.hours.length)} · {booking.hours.length}{' '}
                hour{booking.hours.length > 1 ? 's' : ''}
              </p>
            </div>
            <div>
              <p className="label">{booking.status === 'cancelled' ? 'Refunded' : 'Paid'}</p>
              <p className="text-[17px] font-medium">
                {aed(booking.status === 'cancelled' ? (booking.refunded ?? booking.paid) : booking.paid)}
              </p>
            </div>
            <div>
              <p className="label">Where</p>
              <p className="text-[17px] font-medium">
                {VENUE.address}, {court.level}
              </p>
            </div>
          </div>

          {upcoming && (
            <div className="mt-8">
              <QrCode value={booking.reference} size={140} />
              <p className="mt-2 text-[14px] text-muted">Show this at reception</p>
            </div>
          )}
        </section>

        <aside className="card h-fit p-6 sm:p-8">
          <h2 className="text-[20px] font-bold">
            {upcoming ? 'Manage this booking' : 'This booking has finished'}
          </h2>

          {upcoming ? (
            <div className="mt-6 space-y-3">
              <Link
                to={`/account/bookings/${booking.reference}/reschedule`}
                className={`btn btn-md btn-outline w-full ${canChange ? '' : 'pointer-events-none opacity-40'}`}
              >
                Reschedule
              </Link>
              <Link
                to={`/account/bookings/${booking.reference}/cancel`}
                className={`btn btn-md btn-quiet w-full ${canChange ? '' : 'pointer-events-none opacity-40'}`}
              >
                Cancel booking
              </Link>
            </div>
          ) : (
            <Link to={`/book/${booking.courtId}`} className="btn btn-md btn-outline mt-6 w-full">
              Book again
            </Link>
          )}

          <div className="mt-8 rounded-lg bg-wash p-5">
            <p className="text-[15px] font-semibold">Change policy</p>
            <p className="mt-2 text-[14px] leading-relaxed text-muted">
              Free changes and cancellation until 24 hours before your slot. After that the booking is
              fixed. Refunds return to the original card in 5 to 7 working days.
            </p>
          </div>
        </aside>
      </div>
    </div>
  )
}
