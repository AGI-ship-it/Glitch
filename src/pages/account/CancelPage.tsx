import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { courtById } from '../../data/catalog'
import { aed, formatLongDate, fromKey, rangeLabel } from '../../lib/booking'
import { useStore } from '../../store/StoreProvider'

export default function CancelPage() {
  const { reference = '' } = useParams()
  const navigate = useNavigate()
  const { state, cancelBooking } = useStore()

  if (!state.account) return <Navigate to="/login?next=/account/bookings" replace />
  const booking = state.bookings.find((b) => b.reference === reference)
  if (!booking) return <Navigate to="/account/bookings" replace />

  const court = courtById(booking.courtId)!
  const daysAhead = Math.max(
    0,
    Math.round((fromKey(booking.dateKey).getTime() - Date.now()) / 864e5),
  )

  const confirm = () => {
    cancelBooking(booking.reference)
    navigate(`/account/bookings/${booking.reference}/cancelled`, { replace: true })
  }

  return (
    <div className="shell flex justify-center py-16">
      <div className="card w-full max-w-[500px] p-8 sm:p-10">
        <h1 className="text-[28px] font-extrabold">Cancel this booking?</h1>

        <p className="mt-6 text-[18px] font-semibold">{court.name}</p>
        <p className="mt-1 text-[15px] text-muted">
          {formatLongDate(booking.dateKey)} ·{' '}
          {rangeLabel(Math.min(...booking.hours), booking.hours.length)}
        </p>

        <div className="mt-6 rounded-lg bg-wash p-5">
          <p className="text-[15px] font-medium">
            You are cancelling {daysAhead} day{daysAhead === 1 ? '' : 's'} ahead, so this is free.
          </p>
          <p className="mt-2 text-[14px] leading-relaxed text-muted">
            {aed(booking.paid)} goes back to your card in 5 to 7 working days. The slot returns to
            availability straight away.
          </p>
        </div>

        <button type="button" onClick={confirm} className="btn btn-md btn-primary mt-8 w-full">
          Yes, cancel booking
        </button>
        <Link to={`/account/bookings/${booking.reference}`} className="btn btn-md btn-quiet mt-3 w-full">
          Keep my booking
        </Link>
      </div>
    </div>
  )
}
