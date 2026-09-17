import { useEffect, useRef, useState } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { COURTS, SOCIALS, VENUE } from '../data/catalog'
import { bookingHref, isSplitDeployment } from '../config'
import { aed } from '../lib/booking'
import CheckoutSteps, { type StepId } from './CheckoutSteps'
import BookingModal from './BookingModal'
import { CheckoutPanelProvider, useCheckoutPanel } from './CheckoutPanel'
import { Chevron } from './ui'
import { formatCountdown, useStore } from '../store/StoreProvider'

/** Brand glyphs for the footer. Sized by the parent, filled with currentColor. */
const SOCIAL_ICONS: Record<string, React.ReactNode> = {
  instagram: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="17.2" cy="6.8" r="1.2" fill="currentColor" />
    </>
  ),
  tiktok: (
    <path
      fill="currentColor"
      d="M16.5 3h-2.6v11.4a2.6 2.6 0 1 1-2.1-2.55V9.2a5.3 5.3 0 1 0 4.7 5.26V8.9a6.3 6.3 0 0 0 3.6 1.14V7.4a3.7 3.7 0 0 1-3.6-3.7Z"
    />
  ),
  facebook: (
    <path
      fill="currentColor"
      d="M13.5 21v-8h2.7l.4-3.1h-3.1V7.9c0-.9.25-1.5 1.55-1.5H16.7V3.63A21 21 0 0 0 14.28 3.5c-2.4 0-4.03 1.46-4.03 4.14V9.9H7.6V13h2.65v8Z"
    />
  ),
  youtube: (
    <>
      <rect x="2.5" y="5.5" width="19" height="13" rx="4" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path fill="currentColor" d="M10.4 9.2 15 12l-4.6 2.8Z" />
    </>
  ),
  whatsapp: (
    <path
      fill="currentColor"
      d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2Zm5.8 14.09c-.24.68-1.4 1.3-1.94 1.35-.5.05-.99.23-3.35-.7-2.82-1.11-4.6-3.98-4.74-4.17-.14-.19-1.13-1.5-1.13-2.86 0-1.36.71-2.03.96-2.31.25-.28.55-.35.73-.35.18 0 .37 0 .53.01.17.01.4-.06.62.48.24.57.8 1.97.87 2.11.07.14.12.31.02.5-.1.19-.15.31-.29.48-.14.17-.3.37-.43.5-.14.14-.29.29-.13.57.17.28.74 1.22 1.59 1.97 1.09.97 2.01 1.27 2.29 1.41.28.14.45.12.61-.07.17-.19.71-.83.9-1.11.19-.28.37-.23.62-.14.25.09 1.62.77 1.9.91.28.14.46.21.53.32.07.12.07.66-.17 1.34Z"
    />
  ),
}

/** The wordmark from the brand deck. */
function Logo({ onClick }: { onClick?: () => void }) {
  return (
    <Link
      to="/"
      onClick={() => {
        onClick?.()
        // Already home, so the route does not change and nothing would move on its
        // own — the logo has to do the scrolling itself.
        const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        window.scrollTo({ top: 0, behavior: calm ? 'auto' : 'smooth' })
      }}
      aria-label="Glitch Sports — home"
      className="block shrink-0"
    >
      {/* Full-colour vector: it carries its own outline and shadow, so it reads on
          the dark hero and the light footer alike — no inversion, no filter. */}
      <img
        src="/brand/logo.svg"
        alt="Glitch Sports"
        width={111}
        height={42}
        className="h-14 w-auto sm:h-[72px]"
      />
    </Link>
  )
}

/**
 * Entry point into the booking journey.
 *
 * On one origin that journey starts on the home page: the picker is mounted under
 * the hero, so this scrolls there rather than opening a booking screen. The state
 * flag is what HomePage watches — and the navigation is a replace when we are
 * already home, so pressing it repeatedly does not stack history entries.
 *
 * A split deployment has no picker on this origin, so it stays a plain cross-origin
 * link into booking.<domain>.
 */
function BookNowCta({ onClick, block = false }: { onClick?: () => void; block?: boolean }) {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { openCheckout } = useCheckoutPanel()

  const className = block
    ? 'mt-6 flex h-14 w-full items-center justify-center rounded-full bg-brand-magenta text-[17px] font-bold text-white'
    : 'hidden h-11 items-center rounded-full bg-brand-magenta px-7 text-[15px] font-bold text-white transition hover:brightness-110 sm:inline-flex'

  const inner = <>Book now</>

  if (isSplitDeployment) {
    return (
      <a href={bookingHref(`/book/${COURTS[0].id}`)} onClick={onClick} className={className}>
        {inner}
      </a>
    )
  }

  return (
    <button
      type="button"
      onClick={() => {
        onClick?.()
        // Where the booking is a modal there is nothing to scroll to — raise it.
        if (MODAL_FLOW) return openCheckout()
        navigate('/', { state: { book: true }, replace: pathname === '/' })
      }}
      className={className}
    >
      {inner}
    </button>
  )
}

/**
 * The cart as a panel under the header, so a slot added from the home picker can
 * be checked without leaving the page. It previews and hands off — checkout stays
 * a page of its own, because the step after it is a redirect to near.tl and a
 * form inside a dropdown has nowhere to send you.
 */
/**
 * The stepper build runs the whole booking in a modal instead of a side panel, so
 * the header CTA opens that and the panel below is never mounted.
 */
const MODAL_FLOW = import.meta.env.VITE_FLOW === 'stepper'
/**
 * Both window builds run the whole booking in one panel, so neither wants the
 * header's cart dropdown offering a second way through the same steps.
 */
const WINDOW_FLOW = MODAL_FLOW || import.meta.env.VITE_FLOW === 'stepper-within'

/**
 * Checkout, run from the header rather than a page of its own — the whole flow
 * hangs off the cart in the top right, so a slot picked anywhere on the site can
 * be paid for without the page changing under you.
 *
 * Step three still leaves: near.tl takes the signature and CCAvenue takes the
 * card, and neither can be drawn inside a panel. The panel carries you up to that
 * hand-off and then gets out of the way.
 */
function CartMenu() {
  const { cartCount, cartTotals, secondsLeft } = useStore()
  const { open, openCheckout, closeCheckout } = useCheckoutPanel()
  const [step, setStep] = useState<StepId>(1)
  const ref = useRef<HTMLDivElement>(null)
  const { pathname } = useLocation()

  useEffect(() => closeCheckout(), [pathname])

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) closeCheckout()
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && closeCheckout()
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open, closeCheckout])

  // Emptying the cart from inside the panel leaves nothing to check out.
  useEffect(() => {
    if (!cartCount) {
      closeCheckout()
      setStep(1)
    }
  }, [cartCount, closeCheckout])

  if (!cartCount) return null

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => (open ? closeCheckout() : openCheckout())}
        aria-expanded={open}
        aria-label={`Checkout, ${cartCount} booking${cartCount > 1 ? 's' : ''} held`}
        className="relative flex h-11 items-center gap-2 rounded-full border border-white/35 px-4 text-white transition hover:border-white"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M3 4h2l2.2 10.4A2 2 0 0 0 9.16 16h7.9a2 2 0 0 0 1.96-1.6L20.5 7H6"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="10" cy="20" r="1.4" fill="currentColor" />
          <circle cx="17" cy="20" r="1.4" fill="currentColor" />
        </svg>
        <span className="grid h-5 min-w-5 place-items-center rounded-full bg-white px-1 text-[11px] font-bold text-ink">
          {cartCount}
        </span>
        {secondsLeft > 0 && (
          <span className="hidden text-[13px] font-semibold tabular-nums text-white/70 sm:inline">
            {formatCountdown(secondsLeft)}
          </span>
        )}
      </button>

      {open && (
        /* Fixed to the top right rather than hung off the button, so it lands in
           the same place whether the header or the home page opened it. */
        <div
          role="dialog"
          aria-label="Checkout"
          className="fixed right-4 top-[88px] z-50 flex max-h-[calc(100vh-104px)] w-[min(92vw,460px)] flex-col overflow-hidden rounded-[24px] border border-line bg-white text-ink shadow-pop sm:right-8"
        >
          <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-3.5">
            <p className="text-[15px] font-semibold">Checkout</p>
            <div className="flex items-center gap-3">
              {secondsLeft > 0 && (
                <span className="text-[14px] font-semibold tabular-nums text-muted">
                  {formatCountdown(secondsLeft)} left
                </span>
              )}
              <button
                type="button"
                onClick={closeCheckout}
                aria-label="Close checkout"
                className="grid h-7 w-7 place-items-center rounded-full border border-line-strong text-muted transition hover:border-ink hover:bg-ink hover:text-white"
              >
                <svg width="11" height="11" viewBox="0 0 12 12" aria-hidden="true">
                  <path d="M1.5 1.5l9 9M10.5 1.5l-9 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto bg-wash p-4">
            <CheckoutSteps step={step} setStep={setStep} compact onLeave={closeCheckout} />
          </div>

          <div className="flex items-baseline justify-between border-t border-line px-5 py-3.5">
            <span className="text-[15px] text-muted">Total</span>
            <span className="text-[19px] font-bold">{aed(cartTotals.total)}</span>
          </div>
        </div>
      )}
    </div>
  )
}

function AccountMenu() {
  const { state, logOut } = useStore()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  if (!state.account) {
    return (
      <Link
        to="/login"
        className="inline-flex h-11 items-center rounded-full bg-white/10 px-5 text-[15px] font-semibold text-white ring-1 ring-white/15 backdrop-blur-md transition hover:bg-white/20"
      >
        Sign up / Log in
      </Link>
    )
  }

  const links = [
    { to: '/account/bookings', label: 'My bookings' },
    { to: '/account/bookings/past', label: 'Past bookings' },
    { to: '/account/personal', label: 'Account details' },
  ]

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex h-11 items-center gap-2 rounded-full bg-white/10 px-5 text-[15px] font-semibold text-white ring-1 ring-white/15 backdrop-blur-md transition hover:bg-white/20"
      >
        {state.account.firstName}
        <Chevron className={`h-4 w-4 text-white/60 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        // Dark glass, matching the nav pill and the hero dropdown — self-contained, so
        // it reads the same over the dark hero and over light pages after scrolling.
        <div className="absolute right-0 z-40 mt-2 w-[280px] rounded-[22px] bg-ink/95 p-4 text-white shadow-[0_28px_60px_-16px_rgba(0,0,0,0.85)] ring-1 ring-white/10 backdrop-blur-xl animate-fade-up">
          <p className="px-3 text-[15px] font-semibold">
            {state.account.firstName} {state.account.lastName}
          </p>
          <p className="px-3 text-[13px] text-white/60">{state.account.email}</p>
          <div className="my-3 h-px bg-white/10" />
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              onClick={() => setOpen(false)}
              className="block rounded-xl px-3 py-2.5 text-[15px] font-medium text-white/80 transition hover:bg-white/10 hover:text-white"
            >
              {l.label}
            </Link>
          ))}
          <div className="my-3 h-px bg-white/10" />
          <button
            type="button"
            onClick={() => {
              logOut()
              setOpen(false)
            }}
            className="block w-full rounded-xl px-3 py-2.5 text-left text-[15px] font-medium text-white/80 transition hover:bg-brand-magenta hover:text-white"
          >
            Log out
          </button>
        </div>
      )}
    </div>
  )
}

function Header() {
  const [scrolled, setScrolled] = useState(false)
  // On the home page the nav floats over the hero so the artwork runs to the top,
  // then picks up a translucent backdrop once you scroll past it.
  const overHero = useLocation().pathname === '/'

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const floating = overHero && !scrolled

  return (
    <header
      className={`sticky top-0 z-40 text-white transition-colors duration-300 ${
        floating ? 'pt-5 sm:pt-7' : 'bg-ink/75 backdrop-blur-xl'
      }`}
    >
      <div className="shell flex h-20 items-center justify-between gap-4">
        <Logo />
        <div className="flex items-center gap-3">
          {!WINDOW_FLOW && <CartMenu />}
          <AccountMenu />
          <BookNowCta />
        </div>
      </div>
    </header>
  )
}

/**
 * `flush` drops the gap above the footer. Pages that end on shell-width content want
 * the breathing room; a page that ends on a full-bleed band wants the two to meet, and
 * the gap reads as a strip of stray white between them.
 */
function Footer({ flush = false }: { flush?: boolean }) {
  const LEGAL = [
    { to: '/terms', label: 'Terms and conditions' },
    { to: '/privacy', label: 'Privacy policy' },
  ]

  return (
    <footer className={`bg-ink text-white ${flush ? '' : 'mt-16'}`}>
      {/* The same glitch stripe as the hero, run thin along the top edge. */}
      <div
        aria-hidden="true"
        className="h-[3px] w-full"
        style={{ background: 'linear-gradient(90deg, #2e2ed6, #7b2ff7 45%, #e5199b)' }}
      />
      <div className="shell py-12">
        <div className="grid gap-9 md:grid-cols-[1fr_auto] md:items-start">
          <div>
            <Logo />
            <p className="mt-5 max-w-[38ch] text-[15px] leading-relaxed text-white/65">
              Basketball and volleyball courts by the hour at {VENUE.address}.
            </p>
            <div className="mt-7 flex gap-3">
              {SOCIALS.map((s) => (
                <a
                  key={s.id}
                  href={s.id === 'whatsapp' ? VENUE.whatsapp : VENUE.parentSite}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={s.label}
                  className="grid h-11 w-11 place-items-center rounded-full border border-white/40 bg-white/5 text-white transition hover:border-brand-magenta-bright hover:bg-brand-magenta-bright hover:text-white"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
                    {SOCIAL_ICONS[s.id]}
                  </svg>
                </a>
              ))}
            </div>
          </div>

          <nav className="md:text-right">
            <p className="eyebrow !text-white/55">More</p>
            <ul className="mt-4 space-y-2.5 text-[15px]">
              {LEGAL.map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className="underline-offset-4 hover:underline">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
            <img
              src="/brand/agcentre.svg"
              alt="Al Ghurair Centre"
              width={95}
              height={57}
              className="mt-8 h-12 w-auto md:ml-auto"
            />
          </nav>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-white/15 pt-6 text-[14px] text-white/60 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {VENUE.legalName}
          </p>
          <a href={VENUE.parentSite} className="underline-offset-4 hover:underline">
            Back to glitcharabia.com
          </a>
        </div>
      </div>
    </footer>
  )
}

function WhatsAppFab() {
  return (
    <div className="group fixed bottom-6 right-6 z-40 flex items-center gap-3">
      {/* Label slides out on hover — on touch the button alone carries the meaning. */}
      <span className="pointer-events-none hidden translate-x-2 rounded-full bg-white px-4 py-2 text-[14px] font-semibold text-ink opacity-0 shadow-pop transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100 sm:block">
        Chat with us
      </span>

      <a
        href={VENUE.whatsapp}
        target="_blank"
        rel="noreferrer"
        aria-label="Message us on WhatsApp"
        className="relative grid h-16 w-16 place-items-center rounded-full transition duration-300 hover:scale-105 active:scale-95"
      >
        {/* Soft halo that keeps pulsing, so the button reads as live support. */}
        <span
          aria-hidden="true"
          className="absolute inset-0 rounded-full bg-[#25D366] opacity-40 animate-ring-out"
        />
        <span
          aria-hidden="true"
          className="absolute inset-0 rounded-full shadow-[0_12px_32px_-8px_rgba(37,211,102,0.75)]"
          style={{ background: 'linear-gradient(160deg, #5BD066 0%, #25D366 45%, #1DA851 100%)' }}
        />
        {/* Official WhatsApp glyph rather than an approximation. */}
        <svg
          width="34"
          height="34"
          viewBox="0 0 24 24"
          fill="#fff"
          aria-hidden="true"
          className="relative drop-shadow-[0_1px_1px_rgba(0,0,0,0.18)]"
        >
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
        </svg>
      </a>
    </div>
  )
}

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
  }, [pathname])
  return null
}

/** Mounted once so the modal can be raised from anywhere on the page. */
function BookingSurface() {
  const { open, openCheckout, closeCheckout, courtId } = useCheckoutPanel()
  const refs = useStore().state.checkout.lastReferences

  /**
   * CCAvenue is a full-page redirect and the modal build has no accordion on the
   * page to land in, so the modal raises itself again on the reference it left to
   * fetch. Keyed on the count alone — openCheckout changes identity with `open`.
   */
  useEffect(() => {
    if (refs.length) openCheckout()
  }, [refs.length])

  return <BookingModal open={open} onClose={closeCheckout} initialCourtId={courtId} />
}

export default function Layout() {
  // The home page closes on a full-bleed band, so the footer meets it directly.
  const onHome = useLocation().pathname === '/'

  return (
    <CheckoutPanelProvider>
      <div className="flex min-h-screen flex-col">
        <ScrollToTop />
        <Header />
        <main className="flex-1">
          <Outlet />
        </main>
        <Footer flush={onHome} />
        <WhatsAppFab />
        {MODAL_FLOW && <BookingSurface />}
      </div>
    </CheckoutPanelProvider>
  )
}
