import { useEffect, useRef } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { HERO_SCRIM, steppedBars } from '../lib/pattern'
import { SOCIAL_ICONS } from '../components/Layout'
import { SOCIALS, VENUE } from '../data/catalog'
import { aed, slotLabel, SX_COURTS, SX_PRODUCT } from '../mocks/semnox'
import { Badge, formatDate } from './components'
import { formatTimer, useSemnox } from './store'
import './semnox.css'

const BACKGROUND = { backgroundImage: `${steppedBars()}, ${HERO_SCRIM}, var(--sx-color-bg-ramp)` }

function Logo() {
  return (
    <Link to="/semnox" aria-label="Glitch Sports — court booking" className="block shrink-0">
      <img src="/brand/logo.svg" alt="Glitch Sports" width={111} height={42} className="h-11 w-auto md:h-14" />
    </Link>
  )
}

const cartIcon = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M3 4h2l2.2 10.4A2 2 0 0 0 9.16 16h7.9a2 2 0 0 0 1.96-1.6L20.5 7H6"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="10" cy="20" r="1.5" fill="currentColor" />
    <circle cx="17" cy="20" r="1.5" fill="currentColor" />
  </svg>
)

/** Semnox's mini-cart: the header cart opens it, and its Checkout opens the checkout page. */
function CartMenu() {
  const { cart, removeLine, secondsLeft, cartOpen: open, setCartOpen: setOpen } = useSemnox()
  const navigate = useNavigate()
  const ref = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        buttonRef.current?.focus()
      }
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open, setOpen])

  const total = cart.reduce((a, l) => a + l.price, 0)

  return (
    <div ref={ref} className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls="sx-cart"
        aria-label={`Cart, ${cart.length} item${cart.length === 1 ? '' : 's'}`}
        onClick={() => setOpen(!open)}
        className="sx-icon-btn relative"
      >
        {cartIcon}
        <span className="absolute -right-2 -top-2">
          <Badge>{cart.length}</Badge>
        </span>
      </button>

      {open && (
        /* Semnox's mini-cart hangs off the header's bottom edge, flush right. */
        <div
          id="sx-cart"
          role="dialog"
          aria-label="Your cart"
          className="fixed right-0 top-20 z-50 w-full overflow-hidden bg-sx-surface text-sx-text shadow-[0_24px_48px_-16px_rgba(0,0,0,0.6)] md:w-[min(820px,64vw)] md:rounded-bl-sx-panel"
        >
          {cart.length ? (
            <>
              <ul className="max-h-[50vh] divide-y divide-[var(--sx-color-border)] overflow-y-auto">
                {cart.map((l) => (
                  <li
                    key={l.id}
                    className="grid grid-cols-[1fr_auto_auto] items-center gap-x-sx-md gap-y-0.5 px-sx-md py-sx-sm md:grid-cols-[minmax(0,1fr)_7rem_3rem_7rem_auto] md:px-sx-lg"
                  >
                    <div className="min-w-0">
                      <p className="text-sx-body-sm font-bold uppercase tracking-[0.02em]">
                        {SX_PRODUCT.name} · {SX_COURTS.find((c) => c.id === l.courtId)!.name}
                      </p>
                      <p className="text-sx-caption text-sx-muted">
                        {formatDate(l.dateKey)} · {slotLabel(l.hour)}
                      </p>
                    </div>
                    <span className="hidden text-sx-body-sm tabular-nums md:block">{aed(l.price)}</span>
                    <span className="text-sx-body-sm text-sx-muted">x 1</span>
                    <span className="hidden text-right text-sx-body-sm font-bold tabular-nums md:block">{aed(l.price)}</span>
                    <button
                      type="button"
                      aria-label={`Remove ${slotLabel(l.hour)}`}
                      onClick={() => removeLine(l.id)}
                      className="grid h-sx-touch w-sx-touch place-items-center rounded-sx-pill text-sx-text transition hover:bg-sx-raised"
                    >
                      <svg width="22" height="22" viewBox="0 0 20 20" aria-hidden="true">
                        <circle cx="10" cy="10" r="8.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
                        <path d="M7 7l6 6M13 7l-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    </button>
                    <span className="col-span-2 text-sx-body-sm font-bold tabular-nums md:hidden">{aed(l.price)}</span>
                  </li>
                ))}
              </ul>
              <div
                className="flex flex-wrap items-center justify-between gap-sx-md px-sx-md py-sx-md text-white md:px-sx-lg"
                style={{ backgroundImage: 'var(--sx-color-cta-gradient)' }}
              >
                <div>
                  <p className="text-sx-body-lg">
                    Total: <strong className="tabular-nums">{aed(total)}</strong>
                  </p>
                  {secondsLeft > 0 && <p className="text-sx-caption opacity-90">Held for {formatTimer(secondsLeft)}</p>}
                </div>
                <div className="flex gap-sx-md">
                  <button type="button" onClick={() => setOpen(false)} className="sx-btn sx-btn-dark min-w-[120px]">
                    Close
                  </button>
                  <button type="button" onClick={() => {
                      setOpen(false)
                      navigate('/semnox/checkout')
                    }} className="sx-btn sx-btn-light min-w-[120px]">
                    Checkout
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-sx-md px-sx-md py-sx-xl text-center">
              <p className="text-sx-body-md font-bold">Your cart is empty</p>
              <Link to="/semnox" onClick={() => setOpen(false)} className="sx-btn sx-btn-primary sx-btn-sm">
                Book a court
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/**
 * Customers land here from glitcharabia.com already set on a booking, so the
 * header carries no Book now and no page links — just one account link and the cart.
 */
function NavBar() {
  const { account } = useSemnox()

  return (
    <header className="sticky top-0 z-40 border-b border-sx-glass-border bg-[var(--sx-color-nav)] backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-shell items-center justify-between gap-sx-md px-sx-md md:px-sx-xl">
        <Logo />

        <div className="flex items-center gap-sx-md md:gap-sx-lg">
          {/* One spot for the account: Log in when signed out, the name once in. */}
          <NavLink
            to="/semnox/account"
            className={({ isActive }) =>
              `inline-flex min-h-sx-touch items-center rounded-sx-pill border-2 px-sx-md text-sx-body-sm font-bold transition ${
                isActive ? 'border-sx-cta-dark text-sx-text' : 'border-sx-border-strong hover:border-sx-text'
              }`
            }
          >
            {account ? `Hi ${account.firstName}` : 'Log in'}
          </NavLink>
          <CartMenu />
        </div>
      </div>
    </header>
  )
}

function Footer() {
  const link = 'inline-flex min-h-sx-touch items-center underline-offset-4 hover:text-sx-text hover:underline'
  return (
    <footer className="border-t border-sx-border bg-sx-bg">
      <span aria-hidden="true" className="block h-[3px] w-full" style={{ background: 'var(--sx-color-stripe)' }} />
      <div className="mx-auto flex max-w-shell flex-wrap items-center justify-between gap-x-sx-lg gap-y-sx-sm px-sx-md py-sx-sm text-sx-caption text-sx-muted md:px-sx-xl">
        <p>
          © {new Date().getFullYear()} {VENUE.legalName}
        </p>

        <ul className="flex gap-sx-sm">
          {SOCIALS.map((so) => (
            <li key={so.id}>
              <a
                href={so.id === 'whatsapp' ? VENUE.whatsapp : VENUE.parentSite}
                target="_blank"
                rel="noreferrer"
                aria-label={so.label}
                className="grid h-sx-touch w-sx-touch place-items-center rounded-sx-pill border border-sx-border-strong text-sx-text transition hover:border-sx-cta hover:bg-sx-cta"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                  {SOCIAL_ICONS[so.id]}
                </svg>
              </a>
            </li>
          ))}
        </ul>

        <ul className="flex flex-wrap gap-x-sx-lg">
          <li>
            <Link to="/terms" className={link}>
              Terms and conditions
            </Link>
          </li>
          <li>
            <Link to="/privacy" className={link}>
              Privacy policy
            </Link>
          </li>
          <li>
            {/* Prototype: returns to the local glitcharabia.com stand-in. */}
            <Link to="/glitcharabia" className={`${link} font-bold text-sx-text`}>
              Back to glitcharabia.com
            </Link>
          </li>
        </ul>
      </div>
    </footer>
  )
}

export default function SemnoxLayout() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [pathname])

  return (
    <div className="sx flex min-h-screen flex-col bg-fixed" style={BACKGROUND}>
      <NavBar />
      <main className="flex flex-1 flex-col">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
