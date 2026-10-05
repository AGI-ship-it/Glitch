import { Link } from 'react-router-dom'
import { QrCode } from '../../components/ui'
import { aed, slotLabel, SX_COURTS, SX_VENUE } from '../../mocks/semnox'
import { formatDate } from '../components'
import { useSemnox } from '../store'

export default function ConfirmationScreen() {
  const { lastOrder: order, account } = useSemnox()

  if (!order) {
    return (
      <section className="mx-auto w-full flex max-w-[560px] flex-col items-center px-sx-md py-sx-2xl text-center">
        <h1 className="sx-display text-sx-display-lg">No booking yet</h1>
        <p className="mt-sx-md text-sx-body-md text-sx-muted">Book a court and your confirmation shows here.</p>
        <Link to="/semnox" className="sx-btn sx-btn-primary mt-sx-lg">
          Book a court
        </Link>
      </section>
    )
  }

  return (
    <section className="mx-auto w-full flex max-w-[880px] flex-col items-center px-sx-md py-sx-lg text-center md:px-sx-xl">
      <span
        className="grid h-11 w-11 place-items-center rounded-sx-pill text-white shadow-[var(--sx-shadow-glow)]"
        style={{ backgroundImage: 'var(--sx-color-cta-gradient)' }}
        aria-hidden="true"
      >
        <svg width="22" height="22" viewBox="0 0 24 24">
          <path d="m5 12.5 4.5 4.5L19 7.5" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
        </svg>
      </span>
      <p className="sx-eyebrow mt-sx-sm">Payment received</p>
      <h1 className="sx-display mt-sx-sm text-sx-display-lg">You're booked</h1>
      <p className="mt-sx-sm text-sx-body-md text-sx-muted">
        Booking reference <strong className="text-sx-text">{order.reference}</strong>
        {account && <> · sent to {account.contact}</>}
      </p>

      <div className="mt-sx-md grid w-full gap-sx-md text-left md:grid-cols-[auto_1fr]">
        <div className="flex flex-col items-center gap-sx-sm rounded-sx-card border border-sx-border bg-sx-surface p-sx-md">
          <div className="rounded-sx-field bg-white p-sx-sm">
            <QrCode value={order.reference} size={140} />
          </div>
          <p className="max-w-[22ch] text-center text-sx-caption text-sx-muted">Show this at reception to check in.</p>
        </div>

        <div className="rounded-sx-card border border-sx-border bg-sx-surface p-sx-md">
          <h2 className="text-sx-caption font-bold uppercase tracking-[0.14em] text-sx-muted">Booking details</h2>
          <ul className="mt-sx-sm divide-y divide-[var(--sx-color-glass-border)]">
            {order.lines.map((l) => (
              <li key={l.id} className="flex flex-wrap items-baseline justify-between gap-sx-sm py-sx-sm">
                <span className="font-bold">{SX_COURTS.find((c) => c.id === l.courtId)!.name}</span>
                <span className="text-sx-body-sm text-sx-muted">
                  {formatDate(l.dateKey)} · {slotLabel(l.hour)}
                </span>
              </li>
            ))}
          </ul>
          <dl className="mt-sx-sm grid grid-cols-[auto_1fr] gap-x-sx-lg gap-y-sx-xs border-t border-sx-glass-border pt-sx-sm text-sx-body-sm">
            <dt className="text-sx-muted">Where</dt>
            <dd>{SX_VENUE.address}</dd>
            <dt className="text-sx-muted">Paid</dt>
            <dd className="font-extrabold tabular-nums text-sx-cta-dark">{aed(order.total)} incl. VAT</dd>
          </dl>
        </div>
      </div>

      {/* Signed on Semnox Waivers between sign-in and payment. */}
      <p className="mt-sx-md flex w-full items-center justify-center gap-sx-sm rounded-sx-card border border-sx-border bg-sx-surface p-sx-md text-sx-body-sm">
        <svg width="18" height="18" viewBox="0 0 20 20" aria-hidden="true">
          <circle cx="10" cy="10" r="9" fill="var(--sx-color-cta)" />
          <path d="m6 10.2 2.6 2.6L14 7.5" fill="none" stroke="var(--sx-color-white)" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
        Waiver signed — you're all set to play.
      </p>

      <div className="mt-sx-lg flex flex-wrap items-center justify-center gap-sx-md">
        <Link to="/semnox/account" className="sx-btn sx-btn-light sx-btn-sm">
          My bookings
        </Link>
        <a href={SX_VENUE.parentSite} className="text-sx-body-sm underline underline-offset-4 hover:text-sx-cta-dark">
          Back to glitcharabia.com
        </a>
      </div>
    </section>
  )
}
