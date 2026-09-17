import { useEffect, useMemo, useRef, useState } from 'react'
import { COURTS, VENUE, courtById, sportName, type SportId } from '../data/catalog'
import { useNavigate } from 'react-router-dom'
import {
  VAT_RATE,
  aed,
  formatLongDate,
  formatShortDate,
  priceFor,
  rangeLabel,
  receiptDataUri,
  todayKey,
  totals,
} from '../lib/booking'
import { QrCode, SummaryRow } from './ui'
import { useStore } from '../store/StoreProvider'
import SignaturePad from './SignaturePad'
import BookingPicker from './BookingPicker'

/** The photograph behind the summary rail, one per court. */
const COURT_ART: Record<string, string> = {
  'basketball-1': '/brand/courts/court-1-880.jpg',
  'basketball-2': '/brand/courts/court-2-880.jpg',
  'volleyball-1': '/brand/courts/court-3-880.jpg',
  'volleyball-2': '/brand/courts/court-4-880.jpg',
}

/**
 * The journey as named stops rather than numbers, because one of them only exists
 * some of the time: a customer who is already signed in is never asked to sign in,
 * and never asked for details their own account already holds.
 */
type Step = 'court' | 'slot' | 'signin' | 'waiver' | 'pay'
const LABEL: Record<Step, string> = {
  court: 'Select court and sport',
  slot: 'Slot',
  signin: 'Sign in',
  waiver: 'Waiver',
  pay: 'Pay',
}

/** Matches the exit duration on the backdrop and the panel below. */
const EXIT_MS = 220

const Icon = ({ d }: { d: string }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="shrink-0">
    <path d={d} stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)
const CALENDAR = 'M7 3v3M17 3v3M3.5 9h17M5 5.5h14a1.5 1.5 0 0 1 1.5 1.5v12A1.5 1.5 0 0 1 19 20.5H5A1.5 1.5 0 0 1 3.5 19V7A1.5 1.5 0 0 1 5 5.5Z'
const CLOCK = 'M12 7v5.3l3.2 1.9M20.5 12a8.5 8.5 0 1 1-17 0 8.5 8.5 0 0 1 17 0Z'
const PIN = 'M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11ZM12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z'

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string
  required?: boolean
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <p className="label">
        {label} {required && <span className="text-brand-magenta">*</span>}
      </p>
      <div className="mt-1.5">{children}</div>
      {hint && <p className="mt-1.5 text-[13px] text-muted">{hint}</p>}
    </div>
  )
}

const field =
  'w-full rounded-[14px] border border-line-strong bg-white px-4 text-[15px] outline-none transition focus:border-brand-magenta'
const input = `h-[52px] ${field}`
const textarea = `${field} py-3`

export default function BookingModal({
  open,
  onClose,
  initialCourtId,
  /**
   * Raise the window inside its host section rather than over the whole page. The
   * host owns the size, so the panel fills it instead of centring a fixed card.
   */
  within = false,
}: {
  open: boolean
  onClose: () => void
  initialCourtId?: string
  within?: boolean
}) {
  const { state, cartTotals, addToCart, setDetails, signWaiver, logIn, signUp, resetCheckout } =
    useStore()
  const { account } = state
  const navigate = useNavigate()
  const today = todayKey()

  const [step, setStep] = useState<Step>('court')
  const [pickNonce, setPickNonce] = useState(0)
  /** What the picker is showing before any of it reaches the cart. */
  const [picking, setPicking] = useState<{
    courtId: string
    dateKey: string
    hours: number[]
    sport: SportId
  } | null>(null)

  const [signInEmail, setSignInEmail] = useState('omar@example.com')
  const [password, setPassword] = useState('glitch1234')
  /** Signing in, joining and resetting all happen in this step, never on a page. */
  const [mode, setMode] = useState<'signin' | 'join' | 'reset' | 'sent' | 'registered'>('signin')
  /**
   * Held from the register form until the confirmation is dismissed, so the account
   * is created with the name and phone that were entered rather than a placeholder.
   */
  const [registered, setRegistered] = useState<{
    fullName: string
    email: string
    phone: string
  } | null>(null)
  const [join, setJoin] = useState({
    fullName: '',
    dob: '',
    phone: '',
    email: '',
    password: '',
    confirm: '',
    agreed: false,
  })
  const [form, setForm] = useState({
    firstName: account?.firstName ?? '',
    lastName: account?.lastName ?? '',
    email: account?.email ?? '',
    phone: account?.phone ?? '',
  })

  const [editingContact, setEditingContact] = useState(false)
  const [players, setPlayers] = useState('')
  const [signed, setSigned] = useState(false)

  const [mounted, setMounted] = useState(false)
  const [entered, setEntered] = useState(false)
  const bodyRef = useRef<HTMLDivElement>(null)

  const { cart, checkout } = state
  const refs = checkout.lastReferences
  const booked = state.bookings.filter((b) => refs.includes(b.reference))
  /**
   * What was actually charged, for the receipt's footer. A booking's `paid` already
   * includes VAT, so this reverses the rate out of it rather than adding it twice.
   */
  const paidTotal = booked.reduce((sum, b) => sum + b.paid, 0)
  const paidSubtotal = Math.round(paidTotal / (1 + VAT_RATE))
  const paidTotals = { subtotal: paidSubtotal, vat: paidTotal - paidSubtotal, total: paidTotal }

  /**
   * The rail follows the cart once there is one, and the live picker before that —
   * so choosing a court on step one and hours on step two both show up on the left
   * as they happen, rather than the rail sitting blank until the slot is committed.
   */
  /** Sign in is a stop only while there is nobody signed in. */
  const steps: Step[] = account
    ? ['court', 'slot', 'waiver', 'pay']
    : ['court', 'slot', 'signin', 'waiver', 'pay']
  const at = Math.max(0, steps.indexOf(step))

  const many = cart.length > 1
  const held = cart[cart.length - 1]
  const live = cart.length ? null : picking
  const court = courtById(held?.courtId ?? live?.courtId ?? initialCourtId ?? COURTS[0].id) ?? COURTS[0]
  const dateKey = held?.dateKey ?? live?.dateKey ?? today
  const hours = held?.hours ?? live?.hours ?? []
  const money = cart.length
    ? cartTotals
    : totals(hours.reduce((sum, h) => sum + priceFor(court, dateKey, h), 0))

  /** Opening on a named court hands it to the picker, which owns the choice. */
  const request = useMemo(
    () => ({ courtId: initialCourtId, nonce: pickNonce }),
    [initialCourtId, pickNonce],
  )

  const slotLine = (item: (typeof cart)[number]) => {
    const c = courtById(item.courtId)!
    return `${sportName(c.sport)} · ${c.name} · ${formatShortDate(item.dateKey)} · ${rangeLabel(
      Math.min(...item.hours),
      item.hours.length,
    )}`
  }

  const named = players
    .split(/[,\n]/)
    .map((n) => n.trim())
    .filter(Boolean)

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

  // Opening hands the picker a fresh request, so raising the modal on a named
  // court jumps to it even when the picker is already showing another.
  useEffect(() => {
    if (open) setPickNonce((n) => n + 1)
  }, [open, initialCourtId])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    // Only a full-page window owns the page's scroll; one inside a section leaves it.
    const prev = document.body.style.overflow
    if (!within) document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      if (!within) document.body.style.overflow = prev
    }
  }, [open, onClose, within])

  // Closing has to outlive `open` or the panel would vanish before it could fade,
  // so the modal stays mounted for the length of the exit.
  useEffect(() => {
    if (open) {
      setMounted(true)
      const id = requestAnimationFrame(() => setEntered(true))
      return () => cancelAnimationFrame(id)
    }
    setEntered(false)
    const id = window.setTimeout(() => setMounted(false), EXIT_MS)
    return () => window.clearTimeout(id)
  }, [open])

  // Signing in removes this stop from the journey, so carry on rather than leaving
  // the window pointing at a step that no longer exists.
  useEffect(() => {
    if (account && step === 'signin') setStep('waiver')
  }, [account, step])

  // A new step starts at its own top, not halfway down the one before it.
  useEffect(() => {
    bodyRef.current?.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
  }, [step, refs.length])

  if (!mounted) return null

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }))

  const setJoinField = (key: keyof typeof join) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setJoin((j) => ({ ...j, [key]: e.target.value }))

  const joinReady = Boolean(
    join.fullName.trim() &&
      join.dob &&
      join.phone.trim() &&
      join.email.trim() &&
      join.password &&
      join.password === join.confirm &&
      join.agreed,
  )

  const gate: Record<Step, boolean> = {
    court: true,
    slot: hours.length > 0,
    signin: Boolean(account),
    waiver: signed,
    pay: cart.length > 0 && Boolean(form.email.trim() && form.phone.trim()),
  }
  const HINT: Record<Step, string> = {
    court: 'Every court plays both sports — pick one to carry on.',
    slot: 'Pick at least one hour to carry on.',
    signin: 'Sign in to carry on — your slot stays held.',
    waiver: signed ? 'Looks good — carry on.' : 'Sign in the box to continue.',
    pay: 'CCAvenue takes the card. You come straight back here.',
  }

  /**
   * CCAvenue is a full-page redirect, so the modal has to write down where it was
   * and get out of the way — the return leg reopens it on the reference.
   */
  const payNow = () => {
    try {
      sessionStorage.setItem('gs:return-to', window.location.hash.slice(1) || '/')
    } catch {
      // A blocked sessionStorage only costs the return leg its origin; /payment
      // falls back to the confirmation page on its own.
    }
    onClose()
    navigate('/payment')
  }

  const leaveFor = (to: string) => {
    onClose()
    navigate(to)
  }

  const goNext = () => setStep(steps[Math.min(steps.length - 1, at + 1)])

  const advance = () => {
    if (!gate[step]) return
    if (step === 'slot') {
      // The picker reports its slot; committing it belongs to the window's own bar.
      addToCart(court.id, dateKey, hours)
      goNext()
      return
    }
    if (step === 'waiver') {
      signWaiver(
        (named.length ? named : [`${form.firstName} ${form.lastName}`.trim()]).map((name, i) => ({
          id: `p${i}`,
          name,
          // Prefilled so a walkthrough is never held up by a date picker.
          dob: '1994-03-12',
          phone: form.phone,
        })),
      )
      setDetails(form)
      goNext()
      return
    }
    if (step === 'pay') {
      payNow()
      return
    }
    goNext()
  }

  /** Dismissing the reference and being ready to book again are one action. */
  const dismiss = () => {
    setStep('court')
    setPicking(null)
    setPlayers('')
    setSigned(false)
    resetCheckout()
    onClose()
  }

  const done = (i: number) => i < at || refs.length > 0

  return (
    <div
      className={`${
        // In a section the panel is the screen, not something raised over one — so
        // no scrim, no blur and nothing to dismiss it back to.
        within ? 'absolute inset-0 z-30' : 'fixed inset-0 z-[100] bg-ink/70 p-3 backdrop-blur-sm sm:p-6'
      } flex items-center justify-center transition-opacity duration-200 ease-out motion-reduce:transition-none ${
        entered ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div
        role="dialog"
        aria-modal={within ? undefined : 'true'}
        aria-label="Book a court"
        className={`flex h-full w-full origin-center overflow-hidden rounded-[24px] bg-white shadow-pop transition-all duration-[220ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
          within ? '' : 'max-h-[900px] max-w-[1180px]'
        } ${entered ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-3 scale-[0.97] opacity-0'}`}
      >
        {/* ---------- summary rail ---------- */}
        <aside className="relative hidden w-[340px] shrink-0 flex-col overflow-hidden bg-ink text-white lg:flex">
          <img
            src={COURT_ART[court.id]}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover opacity-40"
          />
          <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-b from-ink/85 via-ink/70 to-ink" />

          <div className={`relative flex h-full flex-col ${within ? 'p-6' : 'p-7'}`}>
            <p className="text-[12px] font-bold uppercase tracking-[0.18em] text-brand-yellow">Your booking</p>
            <h2 className="mt-3 text-[30px] font-extrabold uppercase italic leading-[0.95] tracking-tight">
              {many ? `${cart.length} bookings` : `Court ${court.number}`}
            </h2>
            {!many && (
              <p className="mt-1.5 text-[15px] text-white/65">{sportName(live?.sport ?? court.sport)}</p>
            )}

            {/* Several slots can be held at once, so the rail lists them rather than
                describing only the last one while the total below counts them all. */}
            <div className="mt-6 space-y-5 border-t border-white/15 pt-6">
              {many ? (
                <>
                  <div className="flex gap-3">
                    <span className="mt-0.5 text-brand-magenta-bright">
                      <Icon d={CALENDAR} />
                    </span>
                    <div className="min-w-0 space-y-2.5">
                      {cart.map((row) => {
                        const c = courtById(row.courtId)!
                        return (
                          <div key={row.id}>
                            <p className="text-[15px] font-semibold">
                              Court {Number(c.number)} · {formatShortDate(row.dateKey)}
                            </p>
                            <p className="text-[14px] text-white/60">
                              {row.hours.length
                                ? `${rangeLabel(Math.min(...row.hours), row.hours.length)} · ${
                                    row.hours.length
                                  } hour${row.hours.length > 1 ? 's' : ''}`
                                : 'Not picked yet'}
                            </p>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <span className="mt-0.5 text-brand-magenta-bright">
                      <Icon d={PIN} />
                    </span>
                    <div>
                      <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-white/55">Where</p>
                      <p className="mt-0.5 text-[15px] font-semibold">
                        {VENUE.address}, {court.level}
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                [
                  { icon: CALENDAR, term: 'Date', detail: formatLongDate(dateKey), sub: undefined },
                  {
                    icon: CLOCK,
                    term: 'Time',
                    detail: hours.length ? rangeLabel(Math.min(...hours), hours.length) : 'Not picked yet',
                    sub: hours.length ? `${hours.length} hour${hours.length > 1 ? 's' : ''}` : undefined,
                  },
                  { icon: PIN, term: 'Where', detail: `${VENUE.address}, ${court.level}`, sub: undefined },
                ].map((row) => (
                  <div key={row.term} className="flex gap-3">
                    <span className="mt-0.5 text-brand-magenta-bright">
                      <Icon d={row.icon} />
                    </span>
                    <div>
                      <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-white/55">
                        {row.term}
                      </p>
                      <p className="mt-0.5 text-[15px] font-semibold">{row.detail}</p>
                      {row.sub && <p className="text-[14px] text-white/60">{row.sub}</p>}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-auto space-y-4 border-t border-white/15 pt-6">
              <div className="space-y-2 text-[14px] text-white/70">
                <div className="flex items-baseline justify-between">
                  <span>Subtotal</span>
                  <span>{aed(money.subtotal)}</span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span>VAT 5%</span>
                  <span>{aed(money.vat)}</span>
                </div>
              </div>
              <div className="flex items-baseline justify-between border-t border-white/15 pt-4">
                <span className="text-[12px] font-bold uppercase tracking-[0.18em] text-white/70">Total</span>
                <span className="text-[30px] font-extrabold italic tracking-tight">{aed(money.total)}</span>
              </div>
            </div>
          </div>
        </aside>

        {/* ---------- steps ---------- */}
        <div className="flex min-w-0 flex-1 flex-col">
          <header
            className={`flex items-center gap-3 border-b border-line px-5 sm:px-7 ${
              within ? 'py-3' : 'py-4'
            }`}
          >
            <ol className="flex min-w-0 flex-1 items-center gap-4 overflow-x-auto sm:gap-7">
              {steps.map((key, i) => {
                const n = i + 1
                const isDone = done(i)
                const active = key === step && !refs.length
                return (
                  <li key={key}>
                    <button
                      type="button"
                      onClick={() => isDone && !refs.length && setStep(key)}
                      disabled={!isDone || refs.length > 0}
                      aria-current={active ? 'step' : undefined}
                      className="flex items-center gap-2.5 whitespace-nowrap disabled:cursor-default"
                    >
                      <span
                        className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-[12px] font-bold tabular-nums transition ${
                          isDone
                            ? 'bg-brand-green text-white'
                            : active
                              ? 'bg-brand-magenta text-white'
                              : 'bg-wash-strong text-muted'
                        }`}
                      >
                        {isDone ? (
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                            <path d="m5 12.5 5 5L19 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        ) : (
                          n
                        )}
                      </span>
                      <span
                        className={`text-[13px] font-bold uppercase tracking-[0.1em] ${
                          active || isDone ? 'text-ink' : 'text-muted'
                        }`}
                      >
                        {LABEL[key]}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ol>
            {!within && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-line-strong text-muted transition hover:border-ink hover:bg-ink hover:text-white"
              >
                <svg width="13" height="13" viewBox="0 0 12 12" aria-hidden="true">
                  <path d="M1.5 1.5l9 9M10.5 1.5l-9 9" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
                </svg>
              </button>
            )}
          </header>

          <div
            ref={bodyRef}
            className={`min-h-0 flex-1 overflow-y-auto px-5 sm:px-7 ${within ? 'py-5' : 'py-6'}`}
          >
            {/* Keyed on the step so each panel fades up on its way in rather than
                swapping in place. */}
            <div
              key={refs.length ? 'done' : step === 'court' || step === 'slot' ? 'pick' : step}
              className="h-full animate-fade-up motion-reduce:animate-none"
            >
              {refs.length ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <p className="text-[13px] font-bold uppercase tracking-[0.14em] text-muted">Payment received</p>
                  <h3 className="mt-2 text-[30px] font-extrabold uppercase italic tracking-tight">
                    {booked.length > 1 ? `${booked.length} bookings confirmed` : 'You are on court'}
                  </h3>
                  {/* One code for the whole order: reception scans once, however
                      many hours or courts are on it. */}
                  <div className="mt-5 w-full max-w-[460px] divide-y divide-line border-y border-line text-left">
                    {booked.map((b) => (
                      <div key={b.reference} className="flex items-baseline justify-between gap-4 py-2.5">
                        <span className="min-w-0">
                          <span className="block text-[15px] font-semibold">{b.reference}</span>
                          <span className="block text-[14px] text-muted">
                            {formatLongDate(b.dateKey)} · {rangeLabel(Math.min(...b.hours), b.hours.length)}
                          </span>
                        </span>
                        <span className="shrink-0 text-[15px] font-semibold">{aed(b.paid)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-5">
                    <QrCode value={refs.join(',')} size={150} />
                  </div>

                  <p className="mt-4 max-w-[42ch] text-[14px] text-muted">
                    Show this at reception on Level 3. A copy is on its way to {form.email || 'your inbox'}.
                  </p>
                  <a
                    href={receiptDataUri(
                      booked.map((b) => ({
                        reference: b.reference,
                        court: `Court ${Number(courtById(b.courtId)?.number ?? 0)}`,
                        date: formatLongDate(b.dateKey),
                        time: rangeLabel(Math.min(...b.hours), b.hours.length),
                        amount: aed(b.paid),
                      })),
                      {
                        subtotal: aed(paidTotals.subtotal),
                        vat: aed(paidTotals.vat),
                        total: aed(paidTotals.total),
                      },
                    )}
                    download="glitch-sports-receipt.html"
                    className="mt-4 text-[14px] font-semibold underline underline-offset-4"
                  >
                    Download receipt
                  </a>

                  <div className="mt-6 grid w-full max-w-[460px] gap-3 sm:grid-cols-2">
                    <button type="button" onClick={dismiss} className="btn btn-md btn-outline w-full">
                      Book another court
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        resetCheckout()
                        leaveFor('/account/bookings')
                      }}
                      className="btn btn-md btn-primary w-full"
                    >
                      View my bookings
                    </button>
                  </div>
                </div>
              ) : step === 'court' || step === 'slot' ? (
                /* The picker the home page runs, unchanged — one slot picker for
                   the whole site rather than a second one drawn for the modal. Both
                   steps are the same instance, so the court chosen on one is still
                   chosen on the other. */
                <div className="space-y-6">
                  <div>
                    <h3 className="text-[26px] font-extrabold uppercase italic tracking-tight">
                      {step === 'court' ? 'Select court and sport' : 'Pick your hours'}
                    </h3>
                    <p className="mt-2 max-w-[54ch] text-[15px] leading-relaxed text-muted">
                      {step === 'court'
                        ? 'All four courts are the same floor and every one plays both sports. Choose the court, then the game.'
                        : 'One-hour slots. Tap adjacent hours to book a longer block on the same court.'}
                    </p>
                  </div>

                  <BookingPicker
                    request={request}
                    stage={step === 'court' ? 'court' : 'time'}
                    onPicked={goNext}
                    onSelectionChange={setPicking}
                  />
                </div>
              ) : step === 'signin' ? (
                <div className="max-w-[720px] space-y-6">
                  {!account && mode === 'registered' ? (
                    <div className="flex h-full min-h-[420px] flex-col items-center justify-center text-center">
                      {/* The tick draws itself on: the ring lands first, the stroke
                          follows it, so the moment reads as something completing. */}
                      <span className="relative grid h-28 w-28 shrink-0 place-items-center">
                        <span
                          aria-hidden="true"
                          className="absolute inset-0 rounded-full bg-brand-green/20 motion-reduce:hidden animate-ring-out"
                        />
                        <span className="relative grid h-[88px] w-[88px] place-items-center rounded-full bg-brand-green text-white shadow-pop animate-pop-in motion-reduce:animate-none">
                          <svg width="44" height="44" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                            <path
                              d="m5 12.5 5 5L19 7"
                              stroke="currentColor"
                              strokeWidth="2.8"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeDasharray="48"
                              className="animate-draw-tick motion-reduce:animate-none"
                            />
                          </svg>
                        </span>
                      </span>

                      <h3 className="mt-7 text-[32px] font-extrabold uppercase italic tracking-tight">
                        Congratulations!
                      </h3>
                      <p className="mx-auto mt-3 max-w-[38ch] text-[16px] leading-relaxed text-muted">
                        Your account is ready and you are signed in. Your slot is still held.
                      </p>
                      <button
                        type="button"
                        onClick={() => registered && signUp(registered)}
                        className="btn btn-md btn-cta mt-8 w-[240px]"
                      >
                        Continue
                      </button>
                    </div>
                  ) : !account ? (
                    <>
                      <div>
                        <h3 className="text-[26px] font-extrabold uppercase italic tracking-tight">
                          {mode === 'join'
                            ? 'Create an account'
                            : mode === 'reset'
                              ? 'Reset your password'
                              : mode === 'sent'
                                ? 'Check your inbox'
                                : 'Sign in'}
                        </h3>
                        <p className="mt-2 max-w-[54ch] text-[15px] leading-relaxed text-muted">
                          {mode === 'reset'
                            ? 'Tell us the email on the account and we will send a link to set a new password. Your slots stay held while you do it.'
                            : mode === 'sent'
                              ? `We have sent a reset link to ${signInEmail}. It is good for one hour — open it and you will be brought straight back here.`
                              : `Your slots stay held while you ${
                                  mode === 'join' ? 'join' : 'sign in'
                                }. An account keeps your bookings, your waiver and your receipts together.`}
                        </p>
                      </div>

                      {mode === 'sent' ? (
                        <div className="max-w-[420px] space-y-4">
                          <button
                            type="button"
                            onClick={() => setMode('signin')}
                            className="btn btn-lg btn-cta w-full"
                          >
                            Back to sign in
                          </button>
                          <p className="text-center text-[14px] text-muted">
                            Nothing arrived?{' '}
                            <button
                              type="button"
                              onClick={() => setMode('reset')}
                              className="font-semibold underline underline-offset-4"
                            >
                              Send it again
                            </button>
                          </p>
                        </div>
                      ) : mode === 'reset' ? (
                        <div className="max-w-[420px] space-y-5">
                          <Field label="Email address" required>
                            <input
                              className={input}
                              type="email"
                              value={signInEmail}
                              onChange={(e) => setSignInEmail(e.target.value)}
                              autoComplete="email"
                            />
                          </Field>
                          <button
                            type="button"
                            disabled={!signInEmail.trim()}
                            onClick={() => setMode('sent')}
                            className="btn btn-lg btn-cta w-full"
                          >
                            Send reset link
                          </button>
                          <p className="text-center text-[14px] text-muted">
                            Remembered it?{' '}
                            <button
                              type="button"
                              onClick={() => setMode('signin')}
                              className="font-semibold underline underline-offset-4"
                            >
                              Sign in
                            </button>
                          </p>
                        </div>
                      ) : mode === 'join' ? (
                        <div className="space-y-5">
                          {/* Two to a row: the register form asks for nine things, and
                              one column of them runs past the foot of the window. */}
                          <div className="grid gap-5 sm:grid-cols-2">
                            <Field label="Full name" required>
                              <input className={input} value={join.fullName} onChange={setJoinField('fullName')} autoComplete="name" />
                            </Field>
                            <Field label="Date of birth" required>
                              <input className={input} type="date" value={join.dob} onChange={setJoinField('dob')} autoComplete="bday" />
                            </Field>
                            <Field label="Phone" required>
                              <input className={input} type="tel" value={join.phone} onChange={setJoinField('phone')} autoComplete="tel" placeholder="+971" />
                            </Field>
                            <Field label="Email" required>
                              <input className={input} type="email" value={join.email} onChange={setJoinField('email')} autoComplete="email" />
                            </Field>
                            <Field label="Password" required>
                              <input className={input} type="password" value={join.password} onChange={setJoinField('password')} autoComplete="new-password" />
                            </Field>
                            <Field
                              label="Confirm password"
                              required
                              hint={
                                join.confirm && join.confirm !== join.password
                                  ? 'Both passwords have to match.'
                                  : undefined
                              }
                            >
                              <input className={input} type="password" value={join.confirm} onChange={setJoinField('confirm')} autoComplete="new-password" />
                            </Field>
                          </div>

                          <label className="flex cursor-pointer items-center gap-3 rounded-[16px] border border-line-strong p-4">
                            <input
                              type="checkbox"
                              checked={join.agreed}
                              onChange={(e) => setJoin((j) => ({ ...j, agreed: e.target.checked }))}
                              className="peer sr-only"
                            />
                            <span
                              aria-hidden="true"
                              className="grid h-5 w-5 shrink-0 place-items-center rounded-[6px] border-[1.5px] border-line-strong bg-white transition peer-checked:border-brand-magenta peer-checked:bg-brand-magenta peer-checked:[&>svg]:opacity-100"
                            >
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" className="text-white opacity-0 transition-opacity">
                                <path d="m5 12.5 5 5L19 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </span>
                            <span className="text-[15px]">I agree to the terms and conditions</span>
                          </label>

                          <div className="flex flex-wrap items-center justify-between gap-4">
                            <p className="text-[13px] text-muted">
                              <span className="text-brand-magenta">*</span> Indicates a mandatory field
                            </p>
                            <p className="text-[14px] text-muted">
                              Already have an account?{' '}
                              <button
                                type="button"
                                onClick={() => setMode('signin')}
                                className="font-semibold underline underline-offset-4"
                              >
                                Sign in
                              </button>
                            </p>
                          </div>

                          <button
                            type="button"
                            disabled={!joinReady}
                            onClick={() => {
                              setRegistered({
                                fullName: join.fullName.trim(),
                                email: join.email,
                                phone: join.phone,
                              })
                              setMode('registered')
                            }}
                            className="btn btn-lg btn-cta w-full"
                          >
                            Register
                          </button>
                        </div>
                      ) : (
                        <div className="max-w-[420px] space-y-5">
                          <Field label="Email address" required>
                            <input
                              className={input}
                              type="email"
                              value={signInEmail}
                              onChange={(e) => setSignInEmail(e.target.value)}
                              autoComplete="email"
                            />
                          </Field>
                          <div>
                            <Field label="Password" required>
                              <input
                                className={input}
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                autoComplete="current-password"
                              />
                            </Field>
                            <button
                              type="button"
                              onClick={() => setMode('reset')}
                              className="mt-2 text-[14px] font-semibold text-muted underline underline-offset-4 hover:text-ink"
                            >
                              Forgot password?
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => logIn(signInEmail)}
                            className="btn btn-lg btn-cta w-full"
                          >
                            Log in
                          </button>
                          <p className="text-center text-[14px] text-muted">
                            New here?{' '}
                            <button
                              type="button"
                              onClick={() => setMode('join')}
                              className="font-semibold underline underline-offset-4"
                            >
                              Create an account
                            </button>
                          </p>
                        </div>
                      )}
                    </>
                  ) : null}
                </div>
              ) : step === 'waiver' ? (
                <div className="max-w-[820px] space-y-6">
                  <div>
                    <h3 className="text-[26px] font-extrabold uppercase italic tracking-tight">Sign the waiver</h3>
                    <p className="mt-2 max-w-[54ch] text-[15px] leading-relaxed text-muted">
                      Everyone playing has to be covered. Anyone under 18 needs a parent or guardian to sign
                      for them.
                    </p>
                  </div>

                  <Field
                    label="Who is playing"
                    hint={
                      named.length
                        ? `${named.length} player${named.length > 1 ? 's' : ''} on the waiver`
                        : 'Leave blank and the waiver covers you alone.'
                    }
                  >
                    <textarea
                      rows={3}
                      value={players}
                      onChange={(e) => setPlayers(e.target.value)}
                      placeholder={`${form.firstName || 'First'} ${form.lastName || 'Last'}, one name per line`}
                      className={textarea}
                    />
                  </Field>

                  <ol className="space-y-2 text-[15px] leading-relaxed text-muted">
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

                  <div className="rounded-[16px] bg-wash p-5">
                    <p className="label mb-2">Consent signature</p>
                    <SignaturePad onSign={setSigned} />
                    <p className="mt-3 text-[13px] leading-relaxed text-muted">
                      A copy of the signed waiver is attached to your confirmation email. It stays valid for
                      12 months, so you will not be asked again.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="max-w-[760px] space-y-6">
                  <div>
                    <h3 className="text-[26px] font-extrabold uppercase italic tracking-tight">Pay and lock it in</h3>
                    <p className="mt-2 max-w-[54ch] text-[15px] leading-relaxed text-muted">
                      Card payment is taken by CCAvenue, so this is the one step that leaves the site. You
                      come straight back here for your reference.
                    </p>
                  </div>

                  {/* Where the QR and the receipt go. A line, not a step — the
                      account already holds it, and it only needs correcting rarely. */}
                  <div className="rounded-[16px] border border-line-strong p-5">
                    {editingContact ? (
                      <div className="grid gap-5 sm:grid-cols-2">
                        <Field label="Email address" required hint="Your QR code and receipt go here.">
                          <input className={input} type="email" value={form.email} onChange={set('email')} autoComplete="email" />
                        </Field>
                        <Field label="Phone number" required>
                          <input className={input} type="tel" value={form.phone} onChange={set('phone')} autoComplete="tel" placeholder="+971" />
                        </Field>
                      </div>
                    ) : (
                      <div className="flex flex-wrap items-baseline justify-between gap-3">
                        <p className="text-[15px]">
                          Confirmation goes to{' '}
                          <span className="font-semibold">{form.email || 'your inbox'}</span>
                          {form.phone ? <span className="text-muted"> · {form.phone}</span> : null}
                        </p>
                        <button
                          type="button"
                          onClick={() => setEditingContact(true)}
                          className="text-[14px] font-semibold underline underline-offset-4"
                        >
                          Change
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="rounded-[16px] bg-wash p-5">
                    <div className="space-y-3">
                      {cart.map((item) => (
                        <div key={item.id} className="flex items-baseline justify-between gap-6">
                          <p className="text-[15px] text-muted">{slotLine(item)}</p>
                          <p className="shrink-0 text-[15px] font-semibold">{aed(item.subtotal)}</p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 space-y-3 border-t border-line-strong pt-4">
                      <SummaryRow label="Subtotal" value={aed(money.subtotal)} />
                      <SummaryRow label="VAT 5%" value={aed(money.vat)} />
                      <SummaryRow label="Total to pay" value={aed(money.total)} strong />
                    </div>
                  </div>

                  <p className="flex items-center gap-2 text-[14px] text-muted">
                    <Icon d="M7 10V7a5 5 0 0 1 10 0v3M5.5 10h13A1.5 1.5 0 0 1 20 11.5v7A1.5 1.5 0 0 1 18.5 20h-13A1.5 1.5 0 0 1 4 18.5v-7A1.5 1.5 0 0 1 5.5 10Z" />
                    Card details are handled by CCAvenue — Glitch never sees or stores them.
                  </p>
                  <p className="text-[14px] text-muted">
                    Free changes and cancellation until 24 hours before your slot.
                  </p>
                </div>
              )}
            </div>
          </div>

          {!refs.length && (
            <footer
              className={`flex items-center gap-4 border-t border-line px-5 sm:px-7 ${
                within ? 'py-3' : 'py-4'
              }`}
            >
              {at > 0 && (
                <button
                  type="button"
                  onClick={() => setStep(steps[Math.max(0, at - 1)])}
                  aria-label="Back"
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-line-strong text-[14px] font-semibold text-ink transition hover:border-ink sm:w-auto sm:gap-2 sm:pl-2.5 sm:pr-5"
                >
                  <Icon d="M14 6l-6 6 6 6" />
                  {/* On a phone the footer also carries the price and the primary
                      action, so the arrow alone has to stand for the word. */}
                  <span className="hidden sm:inline">Back</span>
                </button>
              )}

              {/* On the slot step the bar says what it is about to book, and its
                  price, rather than a line of instruction. */}
              {step === 'slot' && hours.length ? (
                <div className="min-w-0 flex-1">
                  <p className="text-[19px] font-bold leading-tight">{aed(money.total)}</p>
                  <p className="truncate text-[13px] text-muted">
                    Court {Number(court.number)} · {formatShortDate(dateKey)} ·{' '}
                    {rangeLabel(Math.min(...hours), hours.length)}
                  </p>
                </div>
              ) : (
                <p className="min-w-0 flex-1 truncate text-[15px] text-muted">{HINT[step]}</p>
              )}

              <button
                type="button"
                onClick={advance}
                disabled={!gate[step]}
                className="flex h-12 shrink-0 items-center gap-2.5 rounded-full bg-brand-magenta px-7 text-[14px] font-bold uppercase tracking-[0.08em] text-white transition hover:brightness-110 disabled:bg-wash-strong disabled:text-muted"
              >
                {step === 'pay' ? (
                  `Pay ${aed(money.total)}`
                ) : step === 'slot' ? (
                  // The phone footer already carries the price and the court line;
                  // the longer label squeezes them, so it sheds its tail.
                  <>
                    Continue<span className="hidden sm:inline"> to book</span>
                  </>
                ) : (
                  'Continue'
                )}
                {step !== 'pay' && <Icon d="M5 12h13M13 6l6 6-6 6" />}
              </button>
            </footer>
          )}
        </div>
      </div>
    </div>
  )
}
