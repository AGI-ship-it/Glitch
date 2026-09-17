import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { VENUE, courtById, sportName } from '../data/catalog'
import { aed, formatLongDate, rangeLabel } from '../lib/booking'
import Confetti from '../components/Confetti'
import { QrCode } from '../components/ui'
import { useStore } from '../store/StoreProvider'

export default function ConfirmationPage() {
  const { state } = useStore()
  // Snapshot on first render so the page survives the checkout stage being reset.
  const [refs] = useState(() => state.checkout.lastReferences)
  // Snapshotted for the same reason: the waiver's player list is cleared with the
  // checkout stage, and this page outlives it.
  const [players] = useState(() => state.checkout.participants)
  const bookings = state.bookings.filter((b) => refs.includes(b.reference))

  if (!refs.length) return <Navigate to="/" replace />

  const many = bookings.length > 1

  return (
    /**
     * The confirmation is the end of the journey and the thing people photograph,
     * so a single booking is sized to sit inside one screen — no scrolling between
     * the reference and the QR code. Several bookings simply grow past it.
     */
    <div className="shell flex min-h-[calc(100svh-80px)] flex-col justify-center py-8">
      <Confetti />
      <div className="mx-auto w-full max-w-[860px]">
        <div className="rounded-[20px] border-2 border-ink px-6 py-5">
          <h1 className="text-[22px] font-extrabold">
            {many ? `${bookings.length} bookings confirmed` : 'Booking confirmed'}
          </h1>
          <p className="mt-1 text-[15px] text-muted">
            {many ? 'References and QR codes are' : 'Your reference and QR code are'} on the way by
            email.
          </p>
        </div>

        <div className="mt-5 space-y-5">
          {bookings.map((b) => {
            const court = courtById(b.courtId)!
            return (
              <article key={b.reference} className="card p-6">
                <div className="flex flex-col gap-6 sm:flex-row sm:justify-between">
                  <div className="flex-1">
                    <h2 className="text-[20px] font-bold">
                      {court.name} · {sportName(court.sport)}
                    </h2>

                    <p className="label mt-4">Booking reference</p>
                    <p className="text-[24px] font-bold tracking-tight">{b.reference}</p>

                    <div className="mt-4 grid gap-x-6 gap-y-4 sm:grid-cols-2">
                      <div>
                        <p className="label">Date</p>
                        <p className="text-[16px] font-medium">{formatLongDate(b.dateKey)}</p>
                      </div>
                      <div>
                        <p className="label">Time</p>
                        <p className="text-[16px] font-medium">
                          {rangeLabel(Math.min(...b.hours), b.hours.length)} · {b.hours.length} hour
                          {b.hours.length > 1 ? 's' : ''}
                        </p>
                      </div>
                      <div>
                        <p className="label">Paid</p>
                        <p className="text-[16px] font-medium">{aed(b.paid)}</p>
                      </div>
                      <div>
                        <p className="label">Where</p>
                        <p className="text-[16px] font-medium">{VENUE.address}</p>
                      </div>
                      {players.length > 0 && (
                        <div className="sm:col-span-2">
                          <p className="label">Players · {players.length} on the waiver</p>
                          <p className="text-[16px] font-medium">
                            {players.map((p) => p.name).filter(Boolean).join(' · ')}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0 text-center">
                    <QrCode value={b.reference} size={150} />
                    <p className="mt-2 text-[14px] text-muted">Show this at reception</p>
                  </div>
                </div>
              </article>
            )
          })}
        </div>

        <p className="mt-4 text-center text-[14px] text-muted">
          Reception will scan it to check you in · {VENUE.addressLines[1]}. Free changes until 24
          hours before your slot.
        </p>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Link to="/account/bookings" className="btn btn-lg btn-outline h-14">
            View my bookings
          </Link>
          <Link to="/" className="btn btn-lg btn-primary h-14">
            Back to home
          </Link>
        </div>
      </div>
    </div>
  )
}
