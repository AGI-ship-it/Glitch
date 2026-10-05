import { useState, type FormEvent, type ReactNode } from 'react'
import { Link, NavLink, Outlet, useNavigate, useParams } from 'react-router-dom'
import { QrCode } from '../../components/ui'
import { todayKey } from '../../lib/booking'
import { aed, slotLabel, SX_COURTS, SX_VENUE } from '../../mocks/semnox'
import { formatDate } from '../components'
import { Field, SignIn } from '../light'
import { useSemnox, type Order } from '../store'

const courtName = (id: string) => SX_COURTS.find((c) => c.id === id)!.name

const isUpcoming = (o: Order) => {
  const first = o.lines[0]
  const today = todayKey()
  return first.dateKey > today || (first.dateKey === today && first.hour >= new Date().getHours())
}

function Panel({ children }: { children: ReactNode }) {
  return <div className="rounded-sx-card bg-sx-surface p-sx-md text-sx-text md:p-sx-lg">{children}</div>
}

const tabClass = ({ isActive }: { isActive: boolean }) =>
  `flex min-h-sx-touch items-center whitespace-nowrap border-b-2 px-sx-sm text-sx-body-sm font-bold transition md:rounded-sx-field md:border-b-0 md:px-sx-md ${
    isActive ? 'border-sx-cta text-sx-cta-dark md:bg-sx-raised' : 'border-transparent text-sx-muted hover:text-sx-text'
  }`

/** Semnox's My account frame: menu on the left, the page on the right. */
export function AccountShell() {
  const { account, signOut } = useSemnox()
  const navigate = useNavigate()

  return (
    <section className="mx-auto w-full max-w-[960px] px-sx-md py-sx-lg md:px-sx-xl">
      <h1 className="sx-display text-center text-sx-display-lg">My account</h1>

      <div className="mt-sx-md">
        {!account ? (
          <div className="mx-auto max-w-[520px]">
          <Panel>
            <SignIn intro="Log in to see your bookings and receipts." onDone={() => navigate('/semnox/account')} />
          </Panel>
          </div>
        ) : (
          <div className="grid items-start gap-sx-md md:grid-cols-[200px_1fr]">
            <Panel>
              <p className="hidden px-sx-md pb-sx-sm text-sx-body-sm md:block">
                Hi <strong>{account.firstName}</strong>
              </p>
              <nav aria-label="My account" className="flex gap-sx-xs overflow-x-auto md:flex-col">
                <NavLink to="/semnox/account" end className={tabClass}>
                  My bookings
                </NavLink>
                <NavLink to="/semnox/account/profile" className={tabClass}>
                  Personal info
                </NavLink>
                <button
                  type="button"
                  onClick={() => {
                    signOut()
                    navigate('/semnox')
                  }}
                  className="flex min-h-sx-touch items-center whitespace-nowrap px-sx-sm text-sx-body-sm font-bold text-sx-muted transition hover:text-sx-cta md:px-sx-md"
                >
                  Log out
                </button>
              </nav>
            </Panel>
            <Panel>
              <Outlet />
            </Panel>
          </div>
        )}
      </div>
    </section>
  )
}

function BookingRow({ order }: { order: Order }) {
  const first = order.lines[0]
  const upcoming = isUpcoming(order)
  return (
    <li className="grid grid-cols-[1fr_auto] items-center gap-x-sx-md gap-y-0.5 py-sx-sm">
      <div className="min-w-0">
        <p className="text-sx-body-sm font-bold">
          {formatDate(first.dateKey)} · {slotLabel(first.hour)}
        </p>
        <p className="text-sx-caption text-sx-muted">
          {order.lines.map((l) => courtName(l.courtId)).join(', ')} · {order.reference}
        </p>
      </div>
      <Link
        to={`/semnox/account/bookings/${order.reference}`}
        className="row-span-2 inline-flex min-h-sx-touch items-center rounded-sx-pill border-2 border-sx-border-strong px-sx-md text-sx-body-sm font-bold transition hover:bg-sx-raised"
      >
        Details
      </Link>
      <p className="text-sx-caption">
        <span className={`font-bold ${upcoming ? 'text-sx-cta-dark' : 'text-sx-muted'}`}>{upcoming ? 'Confirmed' : 'Completed'}</span>
        <span className="text-sx-muted"> · {aed(order.total)}</span>
      </p>
    </li>
  )
}

export function MyBookings() {
  const { orders } = useSemnox()
  const upcoming = orders.filter(isUpcoming)
  const past = orders.filter((o) => !isUpcoming(o))

  const group = (title: string, list: Order[], empty: ReactNode) => (
    <div className="mt-sx-lg first:mt-0">
      <h2 className="text-sx-caption font-bold uppercase tracking-[0.12em] text-sx-muted">{title}</h2>
      {list.length ? (
        <ul className="mt-sx-xs divide-y divide-[var(--sx-color-border)]">
          {list.map((o) => (
            <BookingRow key={o.reference} order={o} />
          ))}
        </ul>
      ) : (
        <div className="mt-sx-xs">{empty}</div>
      )}
    </div>
  )

  return (
    <>
      {group(
        'Upcoming',
        upcoming,
        <p className="flex flex-wrap items-center gap-sx-md py-sx-sm text-sx-body-sm text-sx-muted">
          No upcoming bookings.
          <Link to="/semnox" className="sx-btn sx-btn-primary sx-btn-sm">
            Book a court
          </Link>
        </p>,
      )}
      {group('Past', past, <p className="py-sx-sm text-sx-body-sm text-sx-muted">Nothing here yet.</p>)}
    </>
  )
}

export function BookingDetails() {
  const { reference } = useParams()
  const { orders, waiverSigned } = useSemnox()
  const order = orders.find((o) => o.reference === reference)

  if (!order) {
    return (
      <p className="text-sx-body-sm text-sx-muted">
        We couldn't find that booking.{' '}
        <Link to="/semnox/account" className="font-bold text-sx-cta-dark underline underline-offset-4">
          Back to My bookings
        </Link>
      </p>
    )
  }

  const upcoming = isUpcoming(order)

  return (
    <div>
      <Link to="/semnox/account" className="inline-flex min-h-sx-touch items-center text-sx-body-sm font-bold text-sx-muted hover:text-sx-cta">
        ← My bookings
      </Link>
      <div className="mt-sx-xs flex flex-wrap items-baseline justify-between gap-sx-sm">
        <h2 className="text-sx-h3 font-extrabold">Booking {order.reference}</h2>
        <span className={`text-sx-body-sm font-bold ${upcoming ? 'text-sx-cta-dark' : 'text-sx-muted'}`}>
          {upcoming ? 'Confirmed' : 'Completed'}
        </span>
      </div>

      <div className="mt-sx-md grid gap-sx-lg sm:grid-cols-[auto_1fr]">
        {upcoming && (
          <div className="flex flex-col items-center gap-sx-xs">
            <div className="rounded-sx-field bg-white p-sx-sm">
              <QrCode value={order.reference} size={132} />
            </div>
            <p className="max-w-[18ch] text-center text-sx-caption text-sx-muted">Show at reception to check in.</p>
          </div>
        )}
        <div>
          <ul className="divide-y divide-[var(--sx-color-border)]">
            {order.lines.map((l) => (
              <li key={l.id} className="flex flex-wrap justify-between gap-sx-sm py-sx-sm text-sx-body-sm">
                <span className="font-bold">{courtName(l.courtId)}</span>
                <span>
                  {formatDate(l.dateKey)} · {slotLabel(l.hour)}
                </span>
                <span className="w-full text-sx-muted sm:w-auto">{aed(l.price)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-sx-sm grid grid-cols-[auto_1fr] gap-x-sx-lg gap-y-sx-xs border-t border-sx-border pt-sx-sm text-sx-body-sm">
            <dt className="text-sx-muted">Where</dt>
            <dd>{SX_VENUE.address}</dd>
            <dt className="text-sx-muted">Paid</dt>
            <dd className="font-bold">{aed(order.total)} incl. VAT</dd>
          </dl>
        </div>
      </div>

      {upcoming && (
        <div className="mt-sx-md flex flex-wrap items-center justify-between gap-sx-md rounded-sx-field bg-sx-raised p-sx-md">
          <p className="text-sx-body-sm">
            <strong>Waiver:</strong> everyone playing signs it before the game.
          </p>
          {waiverSigned ? (
            <span className="text-sx-body-sm font-bold text-sx-cta-dark">Signed ✓</span>
          ) : (
            <Link to="/semnox/waiver" className="sx-btn sx-btn-primary sx-btn-sm">
              Sign the waiver
            </Link>
          )}
        </div>
      )}
      <p className="mt-sx-md text-sx-caption text-sx-muted">To change or cancel, contact reception.</p>
    </div>
  )
}

export function PersonalInfo() {
  const { account, signIn } = useSemnox()
  const [form, setForm] = useState({
    firstName: account?.firstName ?? '',
    lastName: account?.lastName ?? '',
    contact: account?.contact ?? '',
    phone: account?.phone ?? '',
  })
  const [saved, setSaved] = useState(false)

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [k]: e.target.value }))
    setSaved(false)
  }

  const save = (e: FormEvent) => {
    e.preventDefault()
    signIn({ ...form, firstName: form.firstName.trim() || 'Guest' })
    setSaved(true)
  }

  return (
    <form onSubmit={save} className="grid gap-sx-md sm:grid-cols-2" noValidate>
      <h2 className="text-sx-h3 font-extrabold sm:col-span-2">Personal info</h2>
      <Field label="First name" autoComplete="given-name" value={form.firstName} onChange={set('firstName')} />
      <Field label="Last name" autoComplete="family-name" value={form.lastName} onChange={set('lastName')} />
      <Field label="Email" type="email" autoComplete="email" value={form.contact} onChange={set('contact')} />
      <Field label="Mobile" type="tel" autoComplete="tel" value={form.phone} onChange={set('phone')} />
      <div className="flex items-center justify-end gap-sx-md sm:col-span-2">
        <p aria-live="polite" className="text-sx-body-sm font-bold text-sx-cta-dark">
          {saved ? 'Saved' : ''}
        </p>
        <button type="submit" className="sx-btn sx-btn-primary">
          Save
        </button>
      </div>
    </form>
  )
}
