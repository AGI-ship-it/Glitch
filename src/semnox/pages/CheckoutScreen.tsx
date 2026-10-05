import { useId, useState, type FormEvent, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { aed, cartTotals, COUPONS, HOLD_SECONDS, slotLabel, SX_COURTS, SX_PRODUCT } from '../../mocks/semnox'
import { formatDate } from '../components'
import { Field, SignIn } from '../light'
import { formatTimer, useSemnox } from '../store'

/*
 * Semnox's checkout, re-skinned: a page with three full-width accordion
 * bars, a grey-headed summary table and the totals stacked on the right.
 */

type Section = 1 | 2 | 3

const courtName = (id: string) => SX_COURTS.find((c) => c.id === id)!.name

function Bar({
  index,
  title,
  subtitle,
  open,
  disabled,
  onToggle,
  children,
}: {
  index: number
  title: string
  subtitle?: string
  open: boolean
  disabled?: boolean
  onToggle: () => void
  children: ReactNode
}) {
  const id = useId()
  return (
    <section
      className={`overflow-hidden rounded-sx-field border bg-sx-surface transition ${open ? 'border-sx-cta-dark' : 'border-sx-border'}`}
    >
      <h3>
        <button
          type="button"
          id={`${id}-h`}
          aria-expanded={open}
          aria-controls={`${id}-p`}
          disabled={disabled}
          onClick={onToggle}
          className={`flex min-h-[56px] w-full items-center gap-sx-md border-l-4 px-sx-md text-left transition disabled:cursor-not-allowed md:px-sx-lg ${
            open ? 'border-sx-cta-dark bg-sx-raised text-sx-cta-dark' : 'border-transparent bg-sx-raised text-sx-text hover:brightness-125'
          } ${disabled ? 'text-sx-muted' : ''}`}
        >
          <span className="min-w-0 flex-1 py-sx-sm">
            <span className="block text-sx-body-lg font-bold uppercase tracking-[0.06em]">
              {index}. {title}
            </span>
            {subtitle && !open && <span className="block text-sx-body-sm text-sx-muted">{subtitle}</span>}
          </span>
          <svg width="16" height="16" viewBox="0 0 12 12" aria-hidden="true" className={`transition ${open ? 'rotate-180' : ''}`}>
            <path d="M2 4.5 6 8l4-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>
      </h3>
      {open && (
        <div id={`${id}-p`} role="region" aria-labelledby={`${id}-h`} className="border-t border-sx-border">
          {children}
        </div>
      )}
    </section>
  )
}

function SummaryTable() {
  const { cart, removeLine } = useSemnox()
  return (
    <table className="w-full text-left text-sx-body-sm">
      <thead className="hidden bg-sx-raised md:table-header-group">
        <tr>
          <th scope="col" className="w-10 py-sx-md pl-sx-lg">
            <span className="sr-only">Line</span>
          </th>
          <th scope="col" className="py-sx-md font-bold">Bookings</th>
          <th scope="col" className="py-sx-md text-right font-bold">Price</th>
          <th scope="col" className="py-sx-md text-center font-bold">Quantity</th>
          <th scope="col" className="py-sx-md text-right font-bold">Amount</th>
          <th scope="col" className="w-16 py-sx-md pr-sx-lg">
            <span className="sr-only">Remove</span>
          </th>
        </tr>
      </thead>
      <tbody>
        {cart.map((l, i) => (
          <tr
            key={l.id}
            className="grid grid-cols-[1fr_auto] items-center gap-x-sx-md border-b border-sx-border px-sx-md py-sx-sm md:table-row md:px-0 md:py-0"
          >
            <td className="hidden pl-sx-lg text-sx-muted md:table-cell">{i + 1}.</td>
            <td className="md:py-sx-md">
              <span className="block uppercase text-sx-text">
                {SX_PRODUCT.name} · {courtName(l.courtId)}
              </span>
              <span className="block font-bold">
                {formatDate(l.dateKey)} | {slotLabel(l.hour)}
              </span>
            </td>
            <td className="hidden text-right tabular-nums text-sx-muted md:table-cell">{aed(l.price)}</td>
            <td className="hidden text-center md:table-cell">
              <span className="inline-grid h-10 w-24 place-items-center rounded-sx-pill border border-sx-border-strong tabular-nums">1</span>
            </td>
            <td className="row-span-2 text-right font-bold tabular-nums md:table-cell">{aed(l.price)}</td>
            <td className="text-right md:pr-sx-lg">
              <button
                type="button"
                aria-label={`Remove ${courtName(l.courtId)}, ${slotLabel(l.hour)}`}
                onClick={() => removeLine(l.id)}
                className="inline-grid h-sx-touch w-sx-touch place-items-center rounded-sx-pill text-sx-text transition hover:bg-sx-raised hover:text-sx-cta-dark"
              >
                <svg width="24" height="24" viewBox="0 0 20 20" aria-hidden="true">
                  <circle cx="10" cy="10" r="8.5" fill="none" stroke="currentColor" strokeWidth="2" />
                  <path d="M7 7l6 6M13 7l-6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
                </svg>
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

/** Cart hold, drawn as a ring that empties — on the dark page. */
function HoldRing({ seconds }: { seconds: number }) {
  const r = 26
  const c = 2 * Math.PI * r
  return (
    <div role="timer" aria-label={`Cart held for ${formatTimer(seconds)}`} className="relative h-16 w-16 shrink-0">
      <svg viewBox="0 0 64 64" className="h-full w-full -rotate-90" aria-hidden="true">
        <circle cx="32" cy="32" r={r} fill="none" stroke="var(--sx-color-glass-border)" strokeWidth="5" />
        <circle
          cx="32"
          cy="32"
          r={r}
          fill="none"
          stroke="var(--sx-color-cta-on-dark)"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - seconds / HOLD_SECONDS)}
          className="transition-[stroke-dashoffset] duration-1000 ease-linear"
        />
      </svg>
      <span aria-hidden="true" className="absolute inset-0 grid place-items-center text-sx-caption font-extrabold tabular-nums">
        {formatTimer(seconds)}
      </span>
    </div>
  )
}

function CheckoutBody() {
  const { cart, account, waiverSigned, secondsLeft } = useSemnox()
  const navigate = useNavigate()
  const [section, setSection] = useState<Section>(() => (account && waiverSigned ? 3 : 1))
  const [coupon, setCoupon] = useState('')
  const [applied, setApplied] = useState<string | null>(null)
  const [couponError, setCouponError] = useState('')

  if (!cart.length) {
    return (
      <div className="flex flex-col items-center py-sx-xl text-center">
        <p className="text-sx-body-md text-sx-muted">Your cart is empty. Slots are released if the timer runs out.</p>
        <Link to="/semnox" className="sx-btn sx-btn-primary mt-sx-lg">
          Book a court
        </Link>
      </div>
    )
  }

  const totals = cartTotals(
    cart.map((l) => l.price),
    applied ? COUPONS[applied] : 0,
  )
  const dates = [...new Set(cart.map((l) => l.dateKey))].sort()
  const signedIn = Boolean(account)

  const applyCoupon = (e: FormEvent) => {
    e.preventDefault()
    const code = coupon.trim().toUpperCase()
    if (COUPONS[code] !== undefined) {
      setApplied(code)
      setCouponError('')
    } else {
      setApplied(null)
      setCouponError("That code isn't valid.")
    }
  }

  return (
    <>
      <div className="flex items-center justify-between gap-sx-md">
        <p className="text-sx-body-md font-bold">Visit Date: {dates.map(formatDate).join(', ')}</p>
        <HoldRing seconds={secondsLeft} />
      </div>

      <div className="mt-sx-md flex flex-col gap-sx-sm">
        <Bar index={1} title="Summary" open={section === 1} onToggle={() => setSection(1)}>
          <SummaryTable />

          <div className="grid gap-sx-lg px-sx-md py-sx-lg md:grid-cols-2 md:px-sx-lg">
            <form onSubmit={applyCoupon} className="flex items-start gap-sx-sm" noValidate>
              <Field
                label="Apply Coupon"
                className="flex-1"
                placeholder="Enter coupon code"
                value={coupon}
                onChange={(e) => setCoupon(e.target.value)}
                error={couponError || undefined}
                hint={applied ? `${applied} applied.` : 'Try GLITCH10 in this prototype.'}
              />
              <button type="submit" className="sx-btn sx-btn-primary mt-[26px] h-12">
                Apply
              </button>
            </form>

            <dl className="flex flex-col items-end gap-sx-xs text-sx-body-md text-sx-muted">
              <div>
                <dt className="inline">Total Amount: </dt>
                <dd className="inline tabular-nums">{aed(totals.net)}</dd>
              </div>
              <div>
                <dt className="inline">Tax: </dt>
                <dd className="inline tabular-nums">{aed(totals.vat)}</dd>
              </div>
              <div>
                <dt className="inline">Discount: </dt>
                <dd className="inline tabular-nums">{aed(totals.discount)}</dd>
              </div>
              <div className="mt-sx-sm text-sx-h3 font-extrabold text-sx-cta-dark">
                <dt className="inline">Grand Total: </dt>
                <dd className="inline tabular-nums">{aed(totals.grand)}</dd>
              </div>
            </dl>
          </div>

          <div className="flex justify-end border-t border-sx-border px-sx-md py-sx-md md:px-sx-lg">
            <button type="button" onClick={() => setSection(signedIn && waiverSigned ? 3 : 2)} className="sx-btn sx-btn-primary min-w-[180px]">
              Continue
            </button>
          </div>
        </Bar>

        <Bar
          index={2}
          title="Sign in"
          subtitle={account ? `Signed in as ${account.contact} · ${waiverSigned ? 'waiver signed' : 'waiver to sign'}` : 'Please sign in'}
          open={section === 2}
          onToggle={() => setSection(2)}
        >
          <div className="px-sx-md py-sx-lg md:px-sx-lg">
            {account ? (
              <div className="flex flex-wrap items-center justify-between gap-sx-md">
                <div>
                  <p className="text-sx-body-md">
                    Signed in as <strong>{account.contact}</strong>
                  </p>
                  <p className="text-sx-body-sm text-sx-muted">
                    {waiverSigned ? 'Waiver signed ✓' : 'Next, everyone playing signs the waiver on our waiver site.'}
                  </p>
                </div>
                {waiverSigned ? (
                  <button type="button" onClick={() => setSection(3)} className="sx-btn sx-btn-primary">
                    Continue
                  </button>
                ) : (
                  <button type="button" onClick={() => navigate('/semnox/waiver')} className="sx-btn sx-btn-primary">
                    Sign the waiver →
                  </button>
                )}
              </div>
            ) : (
              <SignIn
                intro="Your slots stay held while you sign in. An account keeps your bookings, your waiver and your receipts together."
                onDone={() => (waiverSigned ? setSection(3) : navigate('/semnox/waiver'))}
              />
            )}
          </div>
        </Bar>

        <Bar
          index={3}
          title="Payment"
          subtitle={!signedIn ? 'Sign in first' : waiverSigned ? undefined : 'Sign the waiver first'}
          open={section === 3}
          disabled={!signedIn || !waiverSigned}
          onToggle={() => setSection(3)}
        >
          <div className="flex flex-col items-center gap-sx-md px-sx-md py-sx-lg text-center md:px-sx-lg">
            <p className="max-w-[46ch] text-sx-body-md text-sx-muted">
              You'll go to our secure payment page to pay.
            </p>
            <button
              type="button"
              onClick={() => navigate('/semnox/payment', { state: { total: totals.grand } })}
              className="sx-btn sx-btn-primary sx-btn-lg"
            >
              Pay {aed(totals.grand)}
            </button>
            <p className="text-sx-caption text-sx-muted">Visa · Mastercard · Apple Pay</p>
          </div>
        </Bar>
      </div>
    </>
  )
}

/** Semnox's checkout page: visit date and hold timer, then the three accordions. */
export default function CheckoutScreen() {
  return (
    <section className="mx-auto w-full max-w-[1000px] px-sx-md py-sx-lg md:px-sx-xl">
      <div className="flex flex-col items-center text-center">
        <h1 className="sx-display text-sx-display-lg">Checkout</h1>
        <span className="sx-stripe mt-sx-sm" aria-hidden="true" />
      </div>
      <div className="mt-sx-md">
        <CheckoutBody />
      </div>
    </section>
  )
}
