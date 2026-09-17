import { Link, Navigate, useParams } from 'react-router-dom'
import { courtById } from '../../data/catalog'
import { aed, formatShortDate, hourLabel, rangeLabel } from '../../lib/booking'
import { useStore } from '../../store/StoreProvider'

export default function CancelledPage() {
  const { reference = '' } = useParams()
  const { state } = useStore()

  const booking = state.bookings.find((b) => b.reference === reference)
  if (!booking) return <Navigate to="/account/bookings" replace />

  const court = courtById(booking.courtId)!
  const startHour = Math.min(...booking.hours)

  return (
    <div className="shell pb-16">
      <div className="mt-10 rounded-xl border-2 border-ink p-6">
        <p className="text-[22px] font-bold">
          Booking cancelled. A confirmation is on its way to your email.
        </p>
      </div>

      <div className="card mt-8 max-w-[760px] p-6 sm:p-8">
        <p className="text-[20px] font-semibold">
          {court.name} · {formatShortDate(booking.dateKey)},{' '}
          {rangeLabel(startHour, booking.hours.length)}
        </p>

        <p className="mt-6 text-[26px] font-bold">{aed(booking.refunded ?? booking.paid)} refunded</p>
        <p className="mt-2 text-[15px] text-muted">
          Back to the card on file, in 5 to 7 working days.
        </p>
        <p className="mt-2 text-[15px] text-muted">
          The {hourLabel(startHour)} slot is available for other players again.
        </p>

        <div className="mt-8 flex flex-wrap gap-4">
          <Link to="/account/bookings" className="btn btn-md btn-outline w-[260px]">
            Back to my bookings
          </Link>
          <Link to="/courts" className="btn btn-md btn-quiet w-[260px]">
            Book another court
          </Link>
        </div>
      </div>
    </div>
  )
}
