import { useEffect, useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import ExternalChrome from '../components/ExternalChrome'
import { courtById } from '../data/catalog'
import { aed, formatShortDate, rangeLabel } from '../lib/booking'
import { formatCountdown, useStore } from '../store/StoreProvider'

/**
 * The payment leg of checkout, played out the way a hosted gateway really feels:
 * leave glitchsports.ae → CCAvenue card page → the bank's 3-D Secure OTP page →
 * back to glitchsports.ae with the result. Declines, cancellations and the hold
 * running out mid-payment all have their own exits.
 */
type Phase =
  | 'handoff' // glitchsports.ae → CCAvenue interstitial
  | 'form' // CCAvenue hosted card page
  | 'contacting' // overlay: gateway handing over to the bank
  | 'otp' // bank ACS 3-D Secure challenge (in-app push approval)
  | 'authorising' // overlay: bank authorising
  | 'approved' // overlay: tick, about to return
  | 'returning' // CCAvenue → glitchsports.ae interstitial
  | 'declined'
  | 'expired'

const METHODS = [
  { id: 'card', label: 'Cards' },
  { id: 'applepay', label: 'Apple Pay' },
]

/** Cards ending 0002 are declined by the "bank" — the classic test-card convention. */
const DECLINE_SUFFIX = '0002'

const digitsOf = (v: string) => v.replace(/\D/g, '')
const formatCardNumber = (v: string) =>
  digitsOf(v)
    .slice(0, 16)
    .replace(/(.{4})/g, '$1 ')
    .trim()

const brandOf = (digits: string) => {
  if (digits.startsWith('4')) return 'VISA'
  if (/^5[1-5]/.test(digits) || /^2[2-7]/.test(digits)) return 'Mastercard'
  return null
}

const expiryValid = (v: string) => {
  const d = digitsOf(v)
  if (d.length !== 4) return false
  const month = Number(d.slice(0, 2))
  if (month < 1 || month > 12) return false
  const now = new Date()
  const year = 2000 + Number(d.slice(2))
  return year > now.getFullYear() || (year === now.getFullYear() && month >= now.getMonth() + 1)
}

const maskPhone = (phone: string) => {
  const d = digitsOf(phone)
  return `+${d.slice(0, 3)} ••• ••• ${d.slice(-2)}`
}

function SpinnerRing() {
  return <span className="h-16 w-16 animate-spin rounded-full border-4 border-line border-t-brand-magenta" />
}

function SuccessTick() {
  return (
    <>
      <span className="absolute inset-0 rounded-full bg-brand-magenta/30 animate-ring-out" />
      <span className="relative grid h-24 w-24 place-items-center rounded-full bg-brand-magenta animate-pop-in">
        <svg width="44" height="44" viewBox="0 0 48 48" fill="none" aria-hidden="true">
          <path
            d="M12 25.5 20.5 34 36 15"
            stroke="#fff"
            strokeWidth="4.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="48"
            className="animate-draw-tick"
          />
        </svg>
      </span>
    </>
  )
}

/** Full-screen overlay used while the gateway or bank is doing something on our behalf. */
function Processing({ title, sub, done }: { title: string; sub: string; done?: boolean }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/70 backdrop-blur-sm">
      <div className="w-[400px] max-w-[90vw] rounded-[28px] bg-white p-10 text-center shadow-pop">
        <div className="relative mx-auto grid h-24 w-24 place-items-center">
          {done ? <SuccessTick /> : <SpinnerRing />}
        </div>
        <p className="mt-8 text-[19px] font-bold" aria-live="polite">
          {title}
        </p>
        <p className="mt-2 text-[14px] text-muted">{sub}</p>
      </div>
    </div>
  )
}

/**
 * Glitch-branded full page for the moments you are between sites — leaving for
 * CCAvenue and coming back with the result.
 */
function Interstitial({
  title,
  sub,
  done,
  step,
}: {
  title: string
  sub: string
  done?: boolean
  step: 'payment' | 'confirmation'
}) {
  const steps = [
    { id: 'waiver', label: 'Waiver' },
    { id: 'payment', label: 'Payment' },
    { id: 'confirmation', label: 'Confirmation' },
  ]
  const activeIndex = steps.findIndex((s) => s.id === step)
  return (
    <div className="grid min-h-screen place-items-center bg-wash px-6">
      <div className="w-full max-w-[520px] rounded-[28px] bg-white p-10 text-center shadow-card">
        <img src="/brand/logo.png" alt="Glitch Sports" className="mx-auto h-9 w-auto" />
        <div className="relative mx-auto mt-9 grid h-24 w-24 place-items-center">
          {done ? <SuccessTick /> : <SpinnerRing />}
        </div>
        <p className="mt-8 text-[20px] font-bold" aria-live="polite">
          {title}
        </p>
        <p className="mx-auto mt-2 max-w-[38ch] text-[14px] text-muted">{sub}</p>

        <div className="mt-8 flex items-center justify-center gap-2">
          {steps.map((s, i) => (
            <div key={s.id} className="flex items-center gap-2">
              {i > 0 && <span className="h-px w-8 bg-line-strong" />}
              <span
                className={`rounded-full px-3 py-1 text-[12px] font-semibold ${
                  i < activeIndex
                    ? 'bg-wash text-muted'
                    : i === activeIndex
                      ? 'bg-brand-magenta text-white'
                      : 'border border-line-strong text-muted'
                }`}
              >
                {i < activeIndex ? `${s.label} ✓` : s.label}
              </span>
            </div>
          ))}
        </div>

        <p className="mt-8 text-[13px] text-muted">
          Do not press Back or refresh — you will be redirected automatically.
        </p>
      </div>
    </div>
  )
}

function FieldError({ children }: { children: string }) {
  return <p className="mt-1.5 text-[13px] font-medium text-[#c02342]">{children}</p>
}

export default function PaymentPage() {
  const navigate = useNavigate()
  const { state, cartTotals, secondsLeft, pay } = useStore()

  const [phase, setPhase] = useState<Phase>('handoff')
  const [method, setMethod] = useState('card')

  // Card form — prefilled with a demo card so the happy path is one click; still
  // fully editable (end the number in 0002 to rehearse a decline).
  const [card, setCard] = useState(() => {
    const d = state.checkout.details
    const holder = d ? `${d.firstName} ${d.lastName}`.trim() : ''
    return {
      number: '4111 1111 1111 1111',
      exp: '12 / 28',
      cvv: '123',
      name: holder || 'Omar Al Rashid',
    }
  })
  const [errors, setErrors] = useState<Partial<Record<keyof typeof card, string>>>({})

  // 3-D Secure — in-app push approval, the way UAE banks do it now.
  const [phoneVisible, setPhoneVisible] = useState(false)

  const [declineReason, setDeclineReason] = useState<'bank' | 'app'>('bank')
  const [cancelAsk, setCancelAsk] = useState(false)

  // Snapshot the order at mount so the return leg can still show it after pay()
  // (or the hold expiring) clears the live cart.
  const [order] = useState(() => ({
    items: state.cart.map((item) => ({ ...item })),
    total: cartTotals.total,
    phone: state.checkout.details?.phone ?? state.account?.phone ?? '+971 50 000 0000',
    reference: `GS-ORD-${Date.now().toString().slice(-8)}`,
  }))

  const cardDigits = digitsOf(card.number)
  const brand = brandOf(cardDigits)
  const willDecline = cardDigits.endsWith(DECLINE_SUFFIX)
  const holdAlive = secondsLeft > 0 && state.cart.length > 0

  // If the hold runs out before the bank has approved anything, the transaction dies.
  const preAuth = phase === 'form' || phase === 'contacting' || phase === 'otp'
  useEffect(() => {
    if (preAuth && !state.cart.length) setPhase('expired')
  }, [preAuth, state.cart.length])

  // Timed legs of the journey. pay() runs inside the approved→returning timeout so it
  // fires exactly once; if the hold lapsed in flight it creates nothing, and we say so.
  useEffect(() => {
    const after = (ms: number, fn: () => void) => {
      const id = window.setTimeout(fn, ms)
      return () => window.clearTimeout(id)
    }
    if (phase === 'handoff') return after(2400, () => setPhase('form'))
    if (phase === 'contacting') return after(1300, () => setPhase('otp'))
    if (phase === 'authorising')
      return after(1800, () => {
        if (willDecline) {
          setDeclineReason('bank')
          setPhase('declined')
        } else setPhase('approved')
      })
    if (phase === 'approved')
      return after(1500, () => {
        const references = pay()
        if (references.length) setPhase('returning')
        else setPhase('expired')
      })
    if (phase === 'returning')
      return after(2000, () => {
        // Back to whichever page was running the accordion, so the reference lands
        // in the same place the booking was made rather than on a separate screen.
        let back: string | null = null
        try {
          back = sessionStorage.getItem('gs:return-to')
          sessionStorage.removeItem('gs:return-to')
        } catch {
          back = null
        }
        navigate(back ?? '/confirmation', { replace: true })
      })
  }, [phase, willDecline, pay, navigate])

  // The push notification "arrives on the phone" a beat after the bank page loads.
  useEffect(() => {
    if (phase !== 'otp' || phoneVisible) return
    const id = window.setTimeout(() => setPhoneVisible(true), 2200)
    return () => window.clearTimeout(id)
  }, [phase, phoneVisible])

  // A real gateway warns before you abandon a transaction in flight.
  const inFlight = phase !== 'handoff' && phase !== 'form' && phase !== 'declined' && phase !== 'expired'
  useEffect(() => {
    if (!inFlight) return
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [inFlight])

  if (!order.items.length) return <Navigate to="/cart" replace />
  if (phase === 'handoff' && !state.checkout.waiverSigned) return <Navigate to="/waiver" replace />

  const submitCard = (e: FormEvent) => {
    e.preventDefault()
    const next: typeof errors = {}
    if (cardDigits.length !== 16) next.number = 'Enter the 16-digit card number.'
    if (!expiryValid(card.exp)) next.exp = 'Enter a valid future expiry (MM / YY).'
    if (digitsOf(card.cvv).length < 3) next.cvv = 'Enter the 3-digit code on the back.'
    setErrors(next)
    if (Object.keys(next).length) return
    setPhoneVisible(false)
    setPhase('contacting')
  }

  const approveInApp = () => {
    setPhoneVisible(false)
    setPhase('authorising')
  }

  const rejectInApp = () => {
    setPhoneVisible(false)
    setDeclineReason('app')
    setPhase('declined')
  }

  const cancelTransaction = () =>
    navigate('/cart', { state: { notice: 'cancelled' }, replace: true })

  const tryAgain = () => {
    setCard((c) => ({ ...c, number: '', cvv: '' }))
    setErrors({})
    setCancelAsk(false)
    setPhase('form')
  }

  /* ---------- Between-sites interstitials (Glitch-branded) ---------- */

  if (phase === 'handoff')
    return (
      <Interstitial
        step="payment"
        title="Taking you to secure payment…"
        sub={`Waiver received. We are redirecting you to CCAvenue to pay ${aed(order.total)}. Your slot stays held while you pay.`}
      />
    )

  if (phase === 'returning')
    return (
      <Interstitial
        step="confirmation"
        done
        title="Payment approved"
        sub="Returning you to glitchsports.ae and confirming your booking…"
      />
    )

  /* ---------- Hold expired mid-payment ---------- */

  if (phase === 'expired')
    return (
      <ExternalChrome url="secure.ccavenue.ae/transaction/initTrans">
        <div className="rounded-[28px] border border-line-strong bg-white p-10 text-center">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-wash text-[26px]">⏱</span>
          <h1 className="mt-6 text-[24px] font-extrabold">Session expired</h1>
          <p className="mx-auto mt-3 max-w-[46ch] text-[15px] leading-relaxed text-muted">
            The merchant's slot hold ran out before the payment completed, so the transaction was
            cancelled. <strong className="text-ink">No money has been taken.</strong> The courts have
            gone back on sale — pick your slots again.
          </p>
          <button type="button" onClick={() => navigate('/cart', { replace: true })} className="btn btn-lg btn-primary mt-8 w-[300px]">
            Return to Glitch Sports
          </button>
        </div>
      </ExternalChrome>
    )

  /* ---------- Declined ---------- */

  if (phase === 'declined')
    return (
      <ExternalChrome url="secure.ccavenue.ae/transaction/result">
        <div className="rounded-[28px] border border-line-strong bg-white p-10 text-center">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#c02342]/10 text-[26px] text-[#c02342]">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M12 7v6M12 16.5v.5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
            </svg>
          </span>
          <h1 className="mt-6 text-[24px] font-extrabold">Payment declined</h1>
          <p className="mx-auto mt-3 max-w-[46ch] text-[15px] leading-relaxed text-muted">
            {declineReason === 'app'
              ? 'The payment request was rejected in your banking app.'
              : 'Your bank declined this card (insufficient funds).'}{' '}
            <strong className="text-ink">No money has been taken.</strong>
          </p>
          <div className="mx-auto mt-5 max-w-[420px] rounded-2xl bg-wash p-4 text-[14px]">
            <div className="flex justify-between">
              <span className="text-muted">Order</span>
              <span className="font-medium tabular-nums">{order.reference}</span>
            </div>
            <div className="mt-1.5 flex justify-between">
              <span className="text-muted">Amount</span>
              <span className="font-semibold">{aed(order.total)}</span>
            </div>
            <div className="mt-1.5 flex justify-between">
              <span className="text-muted">Status</span>
              <span className="font-semibold text-[#c02342]">Declined</span>
            </div>
          </div>
          <p className="mt-5 text-[14px] text-muted">
            {holdAlive ? (
              <>
                Your slots are still held for{' '}
                <strong className="tabular-nums text-ink">{formatCountdown(secondsLeft)}</strong> — you
                can try another card.
              </>
            ) : (
              'Your slot hold has also run out — head back and pick your slots again.'
            )}
          </p>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            {holdAlive && (
              <button type="button" onClick={tryAgain} className="btn btn-lg btn-primary w-full sm:w-[240px]">
                Try another card
              </button>
            )}
            <button
              type="button"
              onClick={() => navigate('/cart', { state: { notice: 'failed' }, replace: true })}
              className="btn btn-lg btn-outline w-full sm:w-[240px]"
            >
              Return to Glitch Sports
            </button>
          </div>
        </div>
      </ExternalChrome>
    )

  /* ---------- Bank 3-D Secure challenge ---------- */

  if (phase === 'otp' || phase === 'authorising' || phase === 'approved')
    return (
      <ExternalChrome
        url="acs.gulftrustbank.ae/3dsecure/challenge"
        note="Demo: approve or reject the request on the simulated phone."
      >
        {phase === 'authorising' && (
          <Processing title="Authorising payment…" sub="Do not close or refresh this page." />
        )}
        {phase === 'approved' && (
          <Processing done title="Payment approved" sub="Returning you to Glitch Sports…" />
        )}

        <div className="rounded-[28px] border border-line-strong bg-white">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-7 py-5">
            <div>
              <p className="text-[19px] font-bold tracking-tight">Gulf Trust Bank</p>
              <p className="text-[13px] text-muted">3-D Secure verification</p>
            </div>
            <span className="rounded-full bg-wash px-4 py-2 text-[13px] font-medium text-muted">
              Card ending {cardDigits.slice(-4)}
            </span>
          </div>

          <div className="p-7 sm:p-9">
            <div className="rounded-[22px] bg-wash p-5 text-[14px]">
              <div className="flex justify-between">
                <span className="text-muted">Merchant</span>
                <span className="font-semibold">CCAvenue · Glitch Sports</span>
              </div>
              <div className="mt-2 flex justify-between">
                <span className="text-muted">Amount</span>
                <span className="font-semibold">{aed(order.total)}</span>
              </div>
              <div className="mt-2 flex justify-between">
                <span className="text-muted">Date</span>
                <span className="font-medium">{new Date().toLocaleDateString('en-GB')}</span>
              </div>
            </div>

            <h1 className="mt-7 text-[22px] font-extrabold">Approve in your banking app</h1>
            <p className="mt-2 text-[15px] leading-relaxed text-muted">
              We've sent a payment approval request to the Gulf Trust Bank app on your
              registered device (<strong className="text-ink">{maskPhone(order.phone)}</strong>).
              Open the notification and approve to continue.
            </p>

            <div className="mt-6 flex items-center gap-3 rounded-2xl bg-wash px-5 py-4">
              <span className="h-5 w-5 shrink-0 animate-spin rounded-full border-2 border-line-strong border-t-brand-magenta" />
              <p className="text-[15px] font-medium" aria-live="polite">
                Waiting for your approval…
              </p>
              <span className="ml-auto tabular-nums text-[14px] text-muted">
                Slot hold {formatCountdown(secondsLeft)}
              </span>
            </div>

            <div className="mt-5 text-[14px]">
              <button
                type="button"
                onClick={() => {
                  setPhoneVisible(false)
                  window.setTimeout(() => setPhoneVisible(true), 900)
                }}
                className="font-semibold underline underline-offset-4"
              >
                Resend notification
              </button>
            </div>

            <button
              type="button"
              onClick={() => setCancelAsk(true)}
              className="mt-8 w-full text-center text-[14px] font-medium text-muted underline-offset-4 hover:underline"
            >
              Cancel and return to merchant
            </button>
          </div>
        </div>

        {phase === 'otp' && phoneVisible && (
          <PhonePush total={order.total} onApprove={approveInApp} onReject={rejectInApp} />
        )}

        {cancelAsk && (
          <CancelDialog
            secondsLeft={secondsLeft}
            onKeep={() => setCancelAsk(false)}
            onCancel={cancelTransaction}
          />
        )}
      </ExternalChrome>
    )

  /* ---------- CCAvenue hosted payment page ---------- */

  /* The gateway is a plain, utilitarian page in the merchant's own chrome — not the
     Glitch design system. Styles here are deliberately local so it reads as a
     different site the moment it loads. */
  const cc =
    'h-[38px] w-full rounded-[4px] border border-[#ccc] bg-white px-3 text-[14px] text-[#333] ' +
    'placeholder:text-[#999] outline-none focus:border-[#66afe9]'
  const ccGreen =
    'rounded-[4px] bg-[#5cb85c] px-5 py-2.5 text-[14px] text-white transition hover:bg-[#4cae4c]'

  const expDigits = digitsOf(card.exp)
  const setExp = (m: string, y: string) => {
    setCard((c) => ({ ...c, exp: `${m} / ${y}` }))
    setErrors((er) => ({ ...er, exp: undefined }))
  }
  const months = Array.from({ length: 12 }, (_, i) => `${i + 1}`.padStart(2, '0'))
  const years = Array.from({ length: 10 }, (_, i) => `${26 + i}`)

  return (
    <ExternalChrome
      url="secure.ccavenue.ae/transaction/initTrans"
      contained={false}
      note={`Demo cards: any 16-digit number is approved · end it in ${DECLINE_SUFFIX} to see a decline.`}
    >
      {phase === 'contacting' && (
        <Processing title="Contacting your bank…" sub="Do not close or refresh this page." />
      )}

      <div className="bg-[#f0f0f0] px-4 py-8">
        <div className="mx-auto w-full max-w-[900px] border border-[#ddd] bg-white">
          {/* The merchant's own banner, as CCAvenue renders it. */}
          <div className="bg-black px-6 py-4">
            <img src="/brand/logo.png" alt="Glitch Sports" className="h-14 w-auto bg-white p-2" />
          </div>

          <div className="px-6 py-6 sm:px-8">
            <p className="text-[14px] text-[#333]">CCAvenueHostedPayment</p>
            <div className="mt-3 h-px bg-[#ddd]" />

            <div className="mt-5 flex justify-end">
              <select className="h-[34px] rounded-[4px] border border-[#ccc] bg-white px-2 text-[14px] text-[#333]">
                <option>English</option>
                <option>العربية</option>
              </select>
            </div>

            <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_290px]">
              <div>
                <section className="border border-[#ddd]">
                  <h2 className="border-b border-[#ddd] bg-[#e9e9e9] px-4 py-2.5 text-[15px] text-[#333]">
                    Shipping Information
                  </h2>
                  <div className="p-5">
                    <p className="text-[15px] font-bold text-[#333]">Shipping Address</p>
                    <div className="mt-4 space-y-3">
                      <input className={cc} placeholder="Recipients Name" defaultValue={card.name} />
                      <input className={cc} placeholder="Address" />
                      <div className="grid gap-3 sm:grid-cols-2">
                        <input className={cc} placeholder="PO Box / Zip Code(optional)" />
                        <input className={cc} placeholder="City" defaultValue="Dubai" />
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <input className={cc} placeholder="State(optional)" />
                        <select className={cc} defaultValue="AE">
                          <option value="">Select Country</option>
                          <option value="AE">United Arab Emirates</option>
                        </select>
                      </div>
                      <div className="sm:w-1/2 sm:pr-1.5">
                        <input className={cc} placeholder="Phone Number." defaultValue={order.phone} />
                      </div>
                    </div>
                  </div>
                </section>

                <section className="mt-6 border border-[#ddd]">
                  <h2 className="border-b border-[#ddd] bg-[#e9e9e9] px-4 py-2.5 text-[15px] text-[#333]">
                    Payment Information
                  </h2>
                  <div className="grid sm:grid-cols-[190px_1fr]">
                    <div className="border-b border-[#ddd] sm:border-b-0 sm:border-r">
                      {METHODS.map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setMethod(m.id)}
                          aria-pressed={method === m.id}
                          className={`flex w-full items-center justify-between border-b border-[#ddd] px-4 py-3.5 text-left text-[14px] ${
                            method === m.id ? 'bg-white font-medium text-[#333]' : 'bg-[#fafafa] text-[#555]'
                          }`}
                        >
                          {m.label}
                          {method === m.id && <span aria-hidden="true">›</span>}
                        </button>
                      ))}
                    </div>

                    <div className="p-5">
                      {method === 'card' ? (
                        <form onSubmit={submitCard} noValidate>
                          <div className="rounded-[4px] border border-[#ddd] bg-[#fafafa] p-5">
                            <p className="text-[15px] font-bold text-[#333]">Pay with New Card</p>

                            <div className="relative mt-4">
                              <input
                                id="p-card"
                                inputMode="numeric"
                                placeholder="Card"
                                autoComplete="off"
                                value={card.number}
                                onChange={(e) => {
                                  setCard((c) => ({ ...c, number: formatCardNumber(e.target.value) }))
                                  setErrors((er) => ({ ...er, number: undefined }))
                                }}
                                aria-invalid={!!errors.number}
                                className={`${cc} pr-16 tabular-nums`}
                              />
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 rounded-[3px] border border-[#ccc] bg-white px-1.5 py-1 text-[10px] font-bold text-[#666]">
                                {brand ?? 'CARD'}
                              </span>
                            </div>
                            {errors.number && <FieldError>{errors.number}</FieldError>}

                            <div className="mt-3 grid grid-cols-3 gap-2">
                              <select
                                aria-label="Expiry month"
                                className={cc}
                                value={expDigits.slice(0, 2)}
                                onChange={(e) => setExp(e.target.value, expDigits.slice(2, 4))}
                              >
                                <option value="">Month</option>
                                {months.map((m) => <option key={m} value={m}>{m}</option>)}
                              </select>
                              <select
                                aria-label="Expiry year"
                                className={cc}
                                value={expDigits.slice(2, 4)}
                                onChange={(e) => setExp(expDigits.slice(0, 2), e.target.value)}
                              >
                                <option value="">Year</option>
                                {years.map((y) => <option key={y} value={y}>20{y}</option>)}
                              </select>
                              <input
                                type="password"
                                inputMode="numeric"
                                maxLength={4}
                                placeholder="CVV"
                                autoComplete="off"
                                value={card.cvv}
                                onChange={(e) => {
                                  setCard((c) => ({ ...c, cvv: digitsOf(e.target.value).slice(0, 4) }))
                                  setErrors((er) => ({ ...er, cvv: undefined }))
                                }}
                                aria-invalid={!!errors.cvv}
                                className={cc}
                              />
                            </div>
                            {(errors.exp || errors.cvv) && (
                              <FieldError>{errors.exp ?? errors.cvv!}</FieldError>
                            )}
                          </div>

                          <p className="mt-5 text-[16px] text-[#333]">
                            <span className="font-bold text-[#3ba9dd]">{aed(order.total)}</span>{' '}
                            (Total Amount Payable)
                          </p>

                          <div className="mt-3 flex flex-wrap gap-3">
                            <button type="submit" className={ccGreen}>
                              Make Payment
                            </button>
                            <button
                              type="button"
                              onClick={() => setCancelAsk(true)}
                              className={ccGreen}
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      ) : (
                        <div className="rounded-[4px] border border-dashed border-[#ccc] p-8 text-center">
                          <p className="text-[15px] font-bold text-[#333]">
                            {METHODS.find((m) => m.id === method)!.label}
                          </p>
                          <p className="mx-auto mt-2 max-w-[40ch] text-[13px] text-[#666]">
                            Not wired up in this prototype. Choose Cards to walk the rest of the
                            journey.
                          </p>
                          <button
                            type="button"
                            onClick={() => setMethod('card')}
                            className={`${ccGreen} mt-5`}
                          >
                            Pay by card instead
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </section>
              </div>

              <aside className="h-fit border border-[#ddd]">
                <div className="px-4 py-3">
                  <p className="text-[14px] font-bold uppercase tracking-[0.02em] text-[#333]">
                    Order Details
                  </p>
                  <div className="mt-3 flex justify-between border-b border-[#eee] pb-2 text-[13px] text-[#333]">
                    <span className="font-bold">Order #:</span>
                    <span className="tabular-nums">{order.reference}</span>
                  </div>
                  <div className="flex justify-between border-b border-[#eee] py-2 text-[13px] text-[#333]">
                    <span>Order Amount</span>
                    <span className="tabular-nums">{order.total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between py-2 text-[14px] text-[#333]">
                    <span className="font-bold">Total Amount</span>
                    <span className="font-bold tabular-nums">{aed(order.total)}</span>
                  </div>
                  <div className="mt-2 space-y-1 border-t border-[#eee] pt-2">
                    {order.items.map((item) => {
                      const court = courtById(item.courtId)!
                      return (
                        <p key={item.id} className="text-[12px] text-[#777]">
                          {court.name} · {formatShortDate(item.dateKey)} ·{' '}
                          {rangeLabel(Math.min(...item.hours), item.hours.length)}
                        </p>
                      )
                    })}
                    <p className="pt-1 text-[12px] text-[#777]">
                      Slot held {formatCountdown(secondsLeft)}
                      {holdAlive ? '' : ' · expired'}
                    </p>
                  </div>
                </div>
              </aside>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-4 border-t border-[#ddd] px-6 py-5 sm:px-8">
            <div className="text-[#666]">
              <p className="text-[11px]">Powered by</p>
              <p className="text-[20px] font-bold tracking-tight text-[#c8202f]">
                CC<span className="text-[#1b4b9b]">Avenue</span>
                <sup className="text-[9px]">®</sup>
              </p>
            </div>
            <div className="flex items-center gap-3 text-[10px] font-bold">
              <span className="rounded-[3px] border border-[#d8b400] bg-[#fffbe6] px-2.5 py-1.5 text-[#8a6d00]">
                ✓ Norton SECURED
              </span>
              <span className="rounded-[3px] border border-[#2f8f4e] bg-[#f1fbf3] px-2.5 py-1.5 text-[#1f6b39]">
                PCI DSS COMPLIANT
              </span>
            </div>
          </div>
        </div>
      </div>

      {cancelAsk && (
        <CancelDialog
          secondsLeft={secondsLeft}
          onKeep={() => setCancelAsk(false)}
          onCancel={cancelTransaction}
        />
      )}
    </ExternalChrome>
  )
}

/**
 * Stand-in for the customer's phone: the banking app's push notification, rendered
 * in the corner of the screen so the demo can approve or reject the payment.
 */
function PhonePush({
  total,
  onApprove,
  onReject,
}: {
  total: number
  onApprove: () => void
  onReject: () => void
}) {
  return (
    <div className="fixed bottom-6 right-6 z-40 w-[340px] max-w-[calc(100vw-48px)] animate-fade-up">
      <div className="rounded-[26px] bg-ink p-4 text-white shadow-pop ring-1 ring-white/10">
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-white/60">
          <span className="grid h-5 w-5 place-items-center rounded-md bg-brand-magenta text-[10px] font-bold text-white">
            GT
          </span>
          Gulf Trust Bank · now
        </div>
        <p className="mt-2.5 text-[15px] font-bold">Approve payment?</p>
        <p className="mt-0.5 text-[13px] text-white/70">
          {aed(total)} at CCAvenue · Glitch Sports. If this wasn't you, reject the request.
        </p>
        <div className="mt-3.5 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onReject}
            className="rounded-full bg-white/10 py-2.5 text-[14px] font-semibold transition hover:bg-white/20"
          >
            Reject
          </button>
          <button
            type="button"
            onClick={onApprove}
            className="rounded-full bg-brand-magenta py-2.5 text-[14px] font-semibold transition hover:brightness-110"
          >
            Approve
          </button>
        </div>
      </div>
      <p className="mt-2 text-center text-[12px] text-muted">
        Simulated phone — stands in for your banking app
      </p>
    </div>
  )
}

function CancelDialog({
  secondsLeft,
  onKeep,
  onCancel,
}: {
  secondsLeft: number
  onKeep: () => void
  onCancel: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/60 px-6 backdrop-blur-sm">
      <div className="w-full max-w-[440px] rounded-[28px] bg-white p-8 text-center shadow-pop">
        <h2 className="text-[21px] font-extrabold">Cancel this transaction?</h2>
        <p className="mx-auto mt-3 max-w-[40ch] text-[15px] leading-relaxed text-muted">
          No money will be taken. Your slots stay held for{' '}
          <strong className="tabular-nums text-ink">{formatCountdown(secondsLeft)}</strong>, so you can
          come back and pay before the hold runs out.
        </p>
        <div className="mt-7 space-y-3">
          <button type="button" onClick={onKeep} className="btn btn-lg btn-primary w-full">
            Continue payment
          </button>
          <button type="button" onClick={onCancel} className="btn btn-lg btn-outline w-full">
            Cancel and return to Glitch Sports
          </button>
        </div>
      </div>
    </div>
  )
}
