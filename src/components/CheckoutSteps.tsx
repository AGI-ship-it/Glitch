import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { courtById, sportName } from '../data/catalog'
import { aed, formatLongDate, formatShortDate, rangeLabel } from '../lib/booking'
import StepSection from './StepSection'
import Stepper from './Stepper'
import { QrCode, SummaryRow } from './ui'
import { useStore } from '../store/StoreProvider'
import SignaturePad from './SignaturePad'

export type StepId = 1 | 2 | 3 | 4

/**
 * Three ways to run the same four steps on one page: an accordion with one open at
 * a time, every step laid out at once, or a horizontal stepper over a single
 * panel. Chosen at build time so they can be put in front of people side by side.
 */
const LAYOUT: 'accordion' | 'open' | 'stepper' =
  import.meta.env.VITE_FLOW === 'open'
    ? 'open'
    : import.meta.env.VITE_FLOW === 'stepper'
      ? 'stepper'
      : 'accordion'

/**
 * The three decisions between a held slot and the hand-off: what you are buying,
 * who you are, and go. Shared so the header panel and the checkout page run the
 * same flow rather than two that drift apart.
 */
export default function CheckoutSteps({
  step,
  setStep,
  /** The header panel is narrow, so it drops the two-column form and the padding. */
  compact = false,
  onLeave,
  stepOne,
}: {
  step: StepId
  setStep: (s: StepId) => void
  compact?: boolean
  onLeave?: () => void
  /**
   * What step one asks for. The home page opens with the picker, since the slot
   * has not been chosen yet; everywhere else the slot is already in hand and step
   * one is the summary of it.
   */
  stepOne?: { title: string; summary?: ReactNode; body: ReactNode }
}) {
  const navigate = useNavigate()
  const { state, cartTotals, setDetails, removeFromCart, logIn, signWaiver, resetCheckout } =
    useStore()
  const { cart, account } = state

  const [email, setEmail] = useState('omar@example.com')
  const [password, setPassword] = useState('glitch1234')
  const [form, setForm] = useState({
    firstName: account?.firstName ?? '',
    lastName: account?.lastName ?? '',
    email: account?.email ?? '',
    phone: account?.phone ?? '',
  })
  const [detailsDone, setDetailsDone] = useState(false)
  const [players, setPlayers] = useState('')
  const [signed, setSigned] = useState(false)

  // Signing in mid-flow fills the form that step two was about to ask for.
  useEffect(() => {
    if (!account) return
    setForm((f) => ({
      firstName: f.firstName || account.firstName,
      lastName: f.lastName || account.lastName,
      email: f.email || account.email,
      phone: f.phone || account.phone,
    }))
  }, [account])

  const many = cart.length > 1
  const refs = state.checkout.lastReferences
  const booked = state.bookings.filter((b) => refs.includes(b.reference))

  const confirmRef = useRef<HTMLDivElement>(null)
  const landed = useRef(false)

  /**
   * The gateway is a full page load, so the browser drops the customer at the top
   * of whatever it returns to. Once the reference is in hand, run down to it —
   * after a tick, so the router's own jump to the top lands first.
   */
  useEffect(() => {
    if (!refs.length) {
      landed.current = false
      return
    }
    if (landed.current) return
    landed.current = true
    const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const id = window.setTimeout(() => {
      confirmRef.current?.scrollIntoView({ behavior: calm ? 'auto' : 'smooth', block: 'center' })
    }, 80)
    return () => window.clearTimeout(id)
  }, [refs.length])

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }))

  const submitDetails = (e: FormEvent) => {
    e.preventDefault()
    setDetails(form)
    setDetailsDone(true)
    setStep(3)
  }

  const named = players
    .split(/[,\n]/)
    .map((n) => n.trim())
    .filter(Boolean)

  const submitWaiver = () => {
    if (!signed) return
    signWaiver(
      (named.length ? named : [`${form.firstName} ${form.lastName}`.trim()]).map((name, i) => ({
        id: `p${i}`,
        name,
        // Prefilled so a walkthrough is never held up by a date picker.
        dob: '1994-03-12',
        phone: form.phone,
      })),
    )
    setStep(4)
  }

  const go = (to: string) => {
    onLeave?.()
    navigate(to)
  }

  /**
   * CCAvenue is a full-page redirect, so the page that was running the flow has to
   * be written down before leaving or the return leg has nowhere to land.
   */
  const payNow = () => {
    try {
      sessionStorage.setItem('gs:return-to', window.location.hash.slice(1) || '/')
    } catch {
      // A blocked sessionStorage only costs the return leg its origin; /payment
      // falls back to the confirmation page on its own.
    }
    go('/payment')
  }

  const slotLine = (item: (typeof cart)[number]) => {
    const court = courtById(item.courtId)!
    return `${sportName(court.sport)} · ${court.name} · ${formatShortDate(item.dateKey)} · ${rangeLabel(
      Math.min(...item.hours),
      item.hours.length,
    )}`
  }


  // The return leg from CCAvenue lands here, so the reference is shown in the
  // panel the booking was made in rather than on a screen of its own.
  /**
   * Clearing the finished checkout is what puts the accordion back to step one, so
   * dismissing the reference and being ready to book again are the same action.
   */
  const dismiss = () => {
    setStep(1)
    setPlayers('')
    setSigned(false)
    setDetailsDone(false)
    resetCheckout()
    onLeave?.()
  }

  if (refs.length) {
    return (
      <div ref={confirmRef} className="card relative scroll-mt-[120px] p-5 text-center">
        <button
          type="button"
          onClick={dismiss}
          aria-label="Close"
          className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full border border-line-strong text-muted transition hover:border-ink hover:bg-ink hover:text-white"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
            <path d="M1.5 1.5l9 9M10.5 1.5l-9 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>
        <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-muted">
          Payment received
        </p>
        <h3 className="mt-2 text-[24px] font-extrabold">
          {booked.length > 1 ? `${booked.length} bookings confirmed` : 'Booking confirmed'}
        </h3>
        <div className="mt-5 space-y-5">
          {booked.map((b) => (
            <div key={b.reference}>
              <p className="text-[22px] font-bold tracking-tight">{b.reference}</p>
              <p className="mt-1 text-[15px] text-muted">
                {formatLongDate(b.dateKey)} ·{' '}
                {rangeLabel(Math.min(...b.hours), b.hours.length)} · {aed(b.paid)}
              </p>
              <div className="mt-4 flex justify-center">
                <QrCode value={b.reference} size={compact ? 120 : 150} />
              </div>
            </div>
          ))}
        </div>
        <p className="mt-4 text-[14px] text-muted">
          Show this at reception on Level 3. A copy is on its way by email.
        </p>
        <div className={`mt-5 grid gap-3 ${compact ? '' : 'sm:grid-cols-2'}`}>
          <button type="button" onClick={dismiss} className="btn btn-md btn-outline w-full">
            Book another court
          </button>
          <button
            type="button"
            onClick={() => go('/account/bookings')}
            className="btn btn-md btn-primary w-full"
          >
            View my bookings
          </button>
        </div>
      </div>
    )
  }

  /**
   * The four steps as data, so the same bodies can be laid out three ways: one
   * open at a time, all at once, or a horizontal stepper with a single panel.
   */
  const STEPS = [
    {
      n: 1 as const,
      title: stepOne ? stepOne.title : 'Summary',
      done: step > 1,
      summary: stepOne
        ? stepOne.summary
        : `${cart.length} booking${many ? 's' : ''} · ${aed(cartTotals.total)}`,
      body: stepOne ? (
        stepOne.body
      ) : (
        <>
          <ul className="divide-y divide-line">
            {cart.map((item) => {
              const court = courtById(item.courtId)!
              return (
                <li key={item.id} className="flex items-start gap-4 py-3.5 first:pt-0">
                  <div className="min-w-0 flex-1">
                    <p className="text-[16px] font-semibold">
                      {sportName(court.sport)} · {court.name}
                    </p>
                    <p className="mt-1 text-[15px] text-muted">
                      {formatShortDate(item.dateKey)} ·{' '}
                      {rangeLabel(Math.min(...item.hours), item.hours.length)} ·{' '}
                      {item.hours.length} hour{item.hours.length > 1 ? 's' : ''}
                    </p>
                  </div>
                  <p className="shrink-0 text-[16px] font-semibold">{aed(item.subtotal)}</p>
                  <button
                    type="button"
                    onClick={() => removeFromCart(item.id)}
                    aria-label={`Remove ${court.name}`}
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-line-strong text-muted transition hover:border-ink hover:bg-ink hover:text-white"
                  >
                    <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
                      <path
                        d="M1.5 1.5l9 9M10.5 1.5l-9 9"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                      />
                    </svg>
                  </button>
                </li>
              )
            })}
          </ul>

          <div className="mt-4 space-y-3 border-t border-line pt-4">
            <SummaryRow label="Subtotal" value={aed(cartTotals.subtotal)} />
            <SummaryRow label="VAT 5%" value={aed(cartTotals.vat)} />
            <SummaryRow label="Total" value={aed(cartTotals.total)} strong />
          </div>

          <button
            type="button"
            onClick={() => setStep(2)}
            className="btn btn-lg btn-primary mt-5 w-full"
          >
            Continue
          </button>
        </>
      ),
    },
    {
      n: 2 as const,
      title: account ? 'Your details' : 'Sign in',
      done: detailsDone,
      summary: form.email ? `${form.firstName} ${form.lastName} · ${form.email}` : undefined,
      body: (
        <>
          {!account ? (
            <div className={compact ? '' : 'mx-auto max-w-[420px]'}>
              <p className="text-[15px] text-muted">
                Your slots stay held while you sign in. An account keeps your bookings, your
                waiver and your receipts together.
              </p>
              <div className="mt-5 space-y-3">
                <div>
                  <label className="label" htmlFor="co-signin-email">
                    Email address
                  </label>
                  <input
                    id="co-signin-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="field"
                    autoComplete="email"
                  />
                </div>
                <div>
                  <label className="label" htmlFor="co-signin-password">
                    Password
                  </label>
                  <input
                    id="co-signin-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="field"
                    autoComplete="current-password"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={() => logIn(email)}
                className="btn btn-lg btn-cta mt-5 w-full"
              >
                Log in
              </button>
              <p className="mt-4 text-center text-[14px] text-muted">
                New here?{' '}
                <button
                  type="button"
                  onClick={() => go('/signup?next=/checkout')}
                  className="font-semibold underline underline-offset-4"
                >
                  Create an account
                </button>
              </p>
            </div>
          ) : (
            <form onSubmit={submitDetails}>
              <div className={`grid gap-5 ${compact ? '' : 'sm:grid-cols-2'}`}>
                <div>
                  <label className="label" htmlFor="co-first">
                    First name
                  </label>
                  <input id="co-first" required value={form.firstName} onChange={set('firstName')} className="field" autoComplete="given-name" />
                </div>
                <div>
                  <label className="label" htmlFor="co-last">
                    Last name
                  </label>
                  <input id="co-last" required value={form.lastName} onChange={set('lastName')} className="field" autoComplete="family-name" />
                </div>
                <div>
                  <label className="label" htmlFor="co-email">
                    Email address
                  </label>
                  <input id="co-email" type="email" required value={form.email} onChange={set('email')} className="field" autoComplete="email" />
                </div>
                <div>
                  <label className="label" htmlFor="co-phone">
                    Phone number
                  </label>
                  <input id="co-phone" type="tel" required value={form.phone} onChange={set('phone')} className="field" autoComplete="tel" />
                </div>
              </div>
              <button type="submit" className="btn btn-lg btn-primary mt-5 w-full">
                Continue
              </button>
            </form>
          )}
        </>
      ),
    },
    {
      n: 3 as const,
      title: 'Sign the waiver',
      done: state.checkout.waiverSigned,
      summary: state.checkout.waiverSigned
        ? `Signed for ${state.checkout.participants.length} player${
            state.checkout.participants.length > 1 ? 's' : ''
          }`
        : undefined,
      body: (
        <>
          <p className="text-[15px] leading-relaxed text-muted">
            Everyone playing has to be covered. Anyone under 18 needs a parent or guardian to sign
            for them.
          </p>

          <div className="mt-5">
            <label className="label" htmlFor="wv-players">
              Who is playing
            </label>
            <textarea
              id="wv-players"
              rows={compact ? 2 : 3}
              value={players}
              onChange={(e) => setPlayers(e.target.value)}
              placeholder={`${form.firstName || 'First'} ${form.lastName || 'Last'}, one name per line`}
              className="field h-auto py-3"
            />
            <p className="mt-1.5 text-[13px] text-muted">
              {named.length
                ? `${named.length} player${named.length > 1 ? 's' : ''} on the waiver`
                : 'Leave blank and the waiver covers you alone.'}
            </p>
          </div>

          <ol className="mt-5 space-y-2 text-[14px] leading-relaxed text-muted">
            {[
              'Every player listed is medically fit to take part.',
              'Sport carries an inherent risk of injury, accepted on their behalf.',
              'Venue rules, staff instructions and posted safety notices will be followed.',
              'Non-marking indoor footwear will be worn on court.',
            ].map((clause, i) => (
              <li key={clause} className="flex gap-2.5">
                <span className="font-semibold text-ink">{i + 1}.</span>
                <span>{clause}</span>
              </li>
            ))}
          </ol>

          <div className="mt-5">
            <p className="label mb-2">Consent signature</p>
            <SignaturePad onSign={setSigned} />
          </div>

          <button
            type="button"
            onClick={submitWaiver}
            disabled={!signed}
            className="btn btn-lg btn-primary mt-5 w-full"
          >
            {signed ? 'Sign and continue' : 'Sign above to continue'}
          </button>
        </>
      ),
    },
    {
      n: 4 as const,
      title: 'Pay',
      done: false,
      summary: undefined,
      body: (
        <>
          <div className="space-y-3">
            {cart.map((item) => (
              <div key={item.id} className="flex items-baseline justify-between gap-6">
                <p className="text-[15px] text-muted">{slotLine(item)}</p>
                <p className="shrink-0 text-[15px] font-semibold">{aed(item.subtotal)}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 border-t border-line pt-4">
            <SummaryRow label="Total to pay" value={aed(cartTotals.total)} strong />
          </div>

          <p className="mt-5 text-[15px] leading-relaxed text-muted">
            Card payment is taken by CCAvenue, so this is the one step that leaves the site. You
            come straight back here for your reference.
          </p>

          <button
            type="button"
            onClick={payNow}
            className="btn btn-lg btn-cta mt-5 w-full"
          >
            Pay {aed(cartTotals.total)}
          </button>
          <p className="mt-4 text-[14px] text-muted">
            Free changes and cancellation until 24 hours before your slot.
          </p>
        </>
      ),
    },
  ]

  if (LAYOUT === 'stepper') {
    return (
      <div className="card overflow-hidden p-0">
        <Stepper steps={STEPS} current={step} onSelect={setStep} compact={compact} />
        <div className={compact ? 'p-4' : 'p-6'}>{STEPS[step - 1].body}</div>
      </div>
    )
  }

  return (
    <div className={compact ? 'space-y-3' : 'space-y-3'}>
      {STEPS.map((s) => (
        <StepSection
          key={s.n}
          alwaysOpen={LAYOUT === 'open'}
          n={s.n}
          title={s.title}
          open={step === s.n}
          done={s.done}
          onEdit={() => setStep(s.n)}
          summary={s.summary}
        >
          {s.body}
        </StepSection>
      ))}
    </div>
  )
}
