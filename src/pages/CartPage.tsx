import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { courtById, sportName } from '../data/catalog'
import { aed, formatLongDate, rangeLabel } from '../lib/booking'
import HoldTimer from '../components/HoldTimer'
import ProgressSteps from '../components/ProgressSteps'
import { useCheckoutPanel } from '../components/CheckoutPanel'
import { Chevron, SummaryRow } from '../components/ui'
import { useStore } from '../store/StoreProvider'

/** Banner shown when the customer comes back from CCAvenue without paying. */
function PaymentNotice({ notice, canRetry, onRetry }: { notice: 'cancelled' | 'failed'; canRetry: boolean; onRetry: () => void }) {
  return (
    <div className="mt-8 rounded-[22px] border-2 border-brand-magenta/40 bg-brand-magenta/5 p-6">
      <p className="text-[17px] font-bold">
        {notice === 'cancelled' ? 'Payment cancelled' : 'Your payment didn’t go through'}
      </p>
      <p className="mt-1.5 text-[15px] text-muted">
        No money has been taken. Your slots are still held — finish paying before the timer above
        runs out{notice === 'failed' ? ', or try a different card' : ''}.
      </p>
      {canRetry && (
        <button type="button" onClick={onRetry} className="btn btn-md btn-primary mt-4">
          Try payment again
        </button>
      )}
    </div>
  )
}

export default function CartPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { state, cartTotals, holdLapsed, removeFromCart } = useStore()
  const { openCheckout } = useCheckoutPanel()
  const { cart, account } = state
  const notice = (location.state as { notice?: 'cancelled' | 'failed' } | null)?.notice

  // §3.1 step 5 / §9 — the account is mandatory before the cart.
  if (!account && cart.length > 0) return <Navigate to="/login?next=/cart" replace />

  if (!cart.length) {
    return (
      <div className="shell py-20 text-center">
        {holdLapsed && (
          <p className="mx-auto mb-6 w-fit rounded-full bg-ink px-5 py-2.5 text-[14px] font-semibold text-white">
            Your 10-minute hold ran out — no money was taken
          </p>
        )}
        <h1 className="text-[28px] font-extrabold">
          {holdLapsed ? 'Those courts went back on sale' : 'Your cart is empty'}
        </h1>
        <p className="mx-auto mt-3 max-w-[52ch] text-[16px] text-muted">
          {holdLapsed
            ? 'Holds keep slots fair for everyone. Your details are safe — pick your slots again and checkout will be quicker this time.'
            : 'Slots are held for a few minutes once you add them. If a hold ran out, the court went back on sale — pick another time.'}
        </p>
        <Link to="/courts" className="btn btn-lg btn-primary mt-8 w-[260px]">
          {holdLapsed ? 'Pick my slots again' : 'Find a court'}
        </Link>
      </div>
    )
  }

  // Coming back from the gateway with the waiver already signed, payment is one click away.
  const canRetryPayment = !!state.checkout.details && state.checkout.waiverSigned

  const many = cart.length > 1

  /**
   * The cart is reachable from the home picker, a court page and the header, so
   * there is no single page to name. Browser history is the only honest answer;
   * a deep link straight to /cart has none, so that case falls back to the courts.
   */
  const goBack = () =>
    ((window.history.state?.idx ?? 0) > 0 ? navigate(-1) : navigate('/courts'))

  return (
    <>
      <ProgressSteps current={1} />
      <div className="shell pb-16">
        <div className="mx-auto max-w-[800px]">
          <nav className="pt-7 text-[15px]">
            <button
              type="button"
              onClick={goBack}
              className="inline-flex items-center gap-1 text-muted hover:underline"
            >
              <Chevron dir="left" className="h-3.5 w-3.5" />
              Back
            </button>
          </nav>

          {notice && (
            <PaymentNotice
              notice={notice}
              canRetry={canRetryPayment}
              onRetry={() => navigate('/payment')}
            />
          )}
          <div className="flex flex-col items-start gap-6 pb-10 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <HoldTimer
              title={many ? 'Both slots held until the timer runs out' : 'Slot held until the timer runs out'}
              sub={many ? 'One timer covers the whole cart' : 'After that the court goes back on sale'}
            />
            <Link to={`/book/${cart[0].courtId}`} className="btn btn-md btn-quiet w-full sm:w-[300px]">
              Add another booking
            </Link>
          </div>

          <h1 className="text-[20px] font-semibold">
            {cart.length} booking{many ? 's' : ''} in your cart
          </h1>

          <div className="mt-4 space-y-4">
            {cart.map((item) => {
              const court = courtById(item.courtId)!
              return (
                <article key={item.id} className="card relative p-6">
                  <p className="text-[22px] font-bold">
                    {sportName(court.sport)}
                  </p>
                  <p className="mt-1 text-[15px] text-muted">
                    {court.name} · {court.indoor ? 'Indoor' : 'Outdoor'} · up to {court.capacity} players
                  </p>
                  <p className="mt-4 text-[16px] font-medium">{formatLongDate(item.dateKey)}</p>
                  <p className="mt-1 text-[16px] font-medium">
                    {rangeLabel(Math.min(...item.hours), item.hours.length)} · {item.hours.length} hour
                    {item.hours.length > 1 ? 's' : ''}
                  </p>
                  <div className="my-5 h-px bg-line" />
                  <p className="text-[22px] font-bold">{aed(item.subtotal)}</p>

                  <button
                    type="button"
                    onClick={() => removeFromCart(item.id)}
                    aria-label="Remove this booking"
                    className="absolute right-5 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-line-strong hover:border-ink hover:bg-ink hover:text-white"
                  >
                    <svg width="17" height="18" viewBox="0 0 17 18" fill="none" aria-hidden="true">
                      <path
                        d="M2 4.5h13M6.5 4.5V2.8h4v1.7M4 4.5l.8 11h7.4l.8-11M7 8v5M10 8v5"
                        stroke="currentColor"
                        strokeWidth="1.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </article>
              )
            })}
          </div>

          <div className="card mt-6 space-y-4 p-6">
            <SummaryRow label="Subtotal" value={aed(cartTotals.subtotal)} />
            <SummaryRow label="VAT 5%" value={aed(cartTotals.vat)} />
            <div className="h-px bg-line" />
            <SummaryRow label="Total" value={aed(cartTotals.total)} strong />
          </div>

          <button
            type="button"
            onClick={() => openCheckout()}
            className="btn btn-lg btn-primary mt-6 h-16 w-full"
          >
            Continue to checkout
          </button>
        </div>
      </div>
    </>
  )
}
