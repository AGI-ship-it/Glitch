import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { courtById } from '../data/catalog'
import { addDays, makeReference, priceFor, todayKey, totals } from '../lib/booking'
import type { Account, Booking, CartItem, CheckoutDetails, Participant, State } from './types'

const STORAGE_KEY = 'glitch.sports.v1'
/** §5 requires a temporary hold but never states how long. Ten minutes is the assumption. */
export const HOLD_MINUTES = 10

const emptyCheckout = () => ({
  details: null,
  waiverSigned: false,
  participants: [] as Participant[],
  paid: false,
  lastReferences: [] as string[],
})

const initialState = (): State => ({
  account: null,
  cart: [],
  holdExpiresAt: null,
  bookings: [],
  checkout: emptyCheckout(),
})

/** History for a returning account, so the Past tab and "Book again" have something to show. */
function demoHistory(): Booking[] {
  const today = todayKey()
  return [
    {
      reference: 'GS-2026-04120',
      courtId: 'basketball-1',
      dateKey: addDays(today, -8),
      hours: [18],
      paid: 120,
      status: 'completed',
      createdAt: Date.now() - 8 * 864e5,
    },
    {
      reference: 'GS-2026-03884',
      courtId: 'volleyball-1',
      dateKey: addDays(today, -17),
      hours: [20],
      paid: 100,
      status: 'completed',
      createdAt: Date.now() - 17 * 864e5,
    },
    {
      reference: 'GS-2026-03502',
      courtId: 'basketball-2',
      dateKey: addDays(today, -29),
      hours: [17],
      paid: 90,
      refunded: 90,
      status: 'cancelled',
      createdAt: Date.now() - 29 * 864e5,
    },
  ]
}

type Store = {
  state: State
  secondsLeft: number
  /** True after a hold ran out with items in the cart, until a new hold starts. */
  holdLapsed: boolean
  cartCount: number
  cartTotals: { subtotal: number; vat: number; total: number }
  logIn: (email: string, name?: string) => void
  signUp: (input: { fullName: string; email: string; phone: string }) => void
  logOut: () => void
  updateAccount: (patch: Partial<Account>) => void
  addToCart: (courtId: string, dateKey: string, hours: number[]) => void
  removeFromCart: (id: string) => void
  clearCart: () => void
  setDetails: (details: CheckoutDetails) => void
  signWaiver: (participants: Participant[]) => void
  pay: () => string[]
  resetCheckout: () => void
  reschedule: (reference: string, dateKey: string, hours: number[]) => void
  cancelBooking: (reference: string) => void
}

const StoreContext = createContext<Store | null>(null)

/**
 * Only the account and its bookings survive a reload. A cart is a live
 * slot hold — it cannot outlive the page that was counting it down, so a refresh
 * releases the courts and starts the checkout again from scratch.
 */
function load(): State {
  if (typeof window === 'undefined') return initialState()
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return initialState()
    const saved = JSON.parse(raw) as Partial<State>
    return {
      ...initialState(),
      account: saved.account ?? null,
      bookings: saved.bookings ?? [],
    }
  } catch {
    return initialState()
  }
}

function subtotalFor(courtId: string, dateKey: string, hours: number[]) {
  const court = courtById(courtId)
  if (!court) return 0
  return hours.reduce((sum, h) => sum + priceFor(court, dateKey, h), 0)
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(load)
  const [now, setNow] = useState(() => Date.now())
  const [holdLapsed, setHoldLapsed] = useState(false)
  // Always-fresh snapshot for callbacks that need to read state without re-binding.
  const stateRef = useRef(state)
  stateRef.current = state

  useEffect(() => {
    const { account, bookings } = state
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ account, bookings }))
  }, [state])

  useEffect(() => {
    if (!state.holdExpiresAt) return
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [state.holdExpiresAt])

  const secondsLeft = state.holdExpiresAt
    ? Math.max(0, Math.round((state.holdExpiresAt - now) / 1000))
    : 0

  // The hold is the whole promise of the cart — when it lapses, the slots go back on sale.
  useEffect(() => {
    if (state.holdExpiresAt && secondsLeft === 0) {
      setHoldLapsed(true)
      setState((s) => ({ ...s, cart: [], holdExpiresAt: null, checkout: emptyCheckout() }))
    }
  }, [secondsLeft, state.holdExpiresAt])

  const patch = useCallback((fn: (s: State) => State) => setState(fn), [])

  const logIn = useCallback<Store['logIn']>((email, name) => {
    const [first, ...rest] = (name ?? 'Omar Al Rashid').split(' ')
    patch((s) => ({
      ...s,
      account: {
        firstName: first,
        lastName: rest.join(' ') || 'Al Rashid',
        email,
        phone: '+971 50 123 4567',
        marketingEmail: true,
        marketingWhatsapp: false,
      },
      bookings: s.bookings.length ? s.bookings : demoHistory(),
    }))
  }, [patch])

  const signUp = useCallback<Store['signUp']>(({ fullName, email, phone }) => {
    const [first, ...rest] = fullName.trim().split(' ')
    patch((s) => ({
      ...s,
      account: {
        firstName: first || 'Player',
        lastName: rest.join(' '),
        email,
        phone,
        marketingEmail: false,
        marketingWhatsapp: false,
      },
    }))
  }, [patch])

  const logOut = useCallback(() => {
    patch((s) => ({ ...s, account: null, checkout: emptyCheckout() }))
  }, [patch])

  const updateAccount = useCallback<Store['updateAccount']>((next) => {
    patch((s) => (s.account ? { ...s, account: { ...s.account, ...next } } : s))
  }, [patch])

  const addToCart = useCallback<Store['addToCart']>((courtId, dateKey, hours) => {
    if (!hours.length) return
    setHoldLapsed(false)
    patch((s) => {
      const item: CartItem = {
        id: `${courtId}-${dateKey}-${hours[0]}-${hours.length}`,
        courtId,
        dateKey,
        hours: [...hours].sort((a, b) => a - b),
        subtotal: subtotalFor(courtId, dateKey, hours),
      }
      const cart = s.cart.some((c) => c.id === item.id) ? s.cart : [...s.cart, item]
      return {
        ...s,
        cart,
        holdExpiresAt: s.holdExpiresAt ?? Date.now() + HOLD_MINUTES * 60_000,
        // A fresh cart starts a fresh checkout — the waiver must be signed again.
        checkout: s.cart.length ? s.checkout : emptyCheckout(),
      }
    })
  }, [patch])

  const removeFromCart = useCallback<Store['removeFromCart']>((id) => {
    patch((s) => {
      const cart = s.cart.filter((c) => c.id !== id)
      return { ...s, cart, holdExpiresAt: cart.length ? s.holdExpiresAt : null }
    })
  }, [patch])

  const clearCart = useCallback(() => {
    patch((s) => ({ ...s, cart: [], holdExpiresAt: null, checkout: emptyCheckout() }))
  }, [patch])

  const setDetails = useCallback<Store['setDetails']>((details) => {
    patch((s) => ({ ...s, checkout: { ...s.checkout, details } }))
  }, [patch])

  const signWaiver = useCallback<Store['signWaiver']>((participants) => {
    patch((s) => ({ ...s, checkout: { ...s.checkout, waiverSigned: true, participants } }))
  }, [patch])

  // Bookings are built OUTSIDE the setState updater: updaters must stay pure (StrictMode
  // double-invokes them, which would mint two references) and they do not run synchronously,
  // so the caller could not rely on an array filled from inside one.
  const pay = useCallback<Store['pay']>(() => {
    const existingRefs = stateRef.current.bookings.map((b) => b.reference)
    const created: Booking[] = stateRef.current.cart.map((item) => ({
      reference: makeReference(existingRefs),
      courtId: item.courtId,
      dateKey: item.dateKey,
      hours: item.hours,
      paid: totals(item.subtotal).total,
      status: 'confirmed' as const,
      createdAt: Date.now(),
    }))
    if (!created.length) return []
    setState((s) => ({
      ...s,
      bookings: [...created, ...s.bookings],
      cart: [],
      holdExpiresAt: null,
      checkout: { ...s.checkout, paid: true, lastReferences: created.map((b) => b.reference) },
    }))
    return created.map((b) => b.reference)
  }, [])

  const resetCheckout = useCallback(() => {
    patch((s) => ({ ...s, checkout: emptyCheckout() }))
  }, [patch])

  const reschedule = useCallback<Store['reschedule']>((reference, dateKey, hours) => {
    patch((s) => ({
      ...s,
      bookings: s.bookings.map((b) =>
        b.reference === reference
          ? { ...b, dateKey, hours, paid: totals(subtotalFor(b.courtId, dateKey, hours)).total }
          : b,
      ),
    }))
  }, [patch])

  const cancelBooking = useCallback<Store['cancelBooking']>((reference) => {
    patch((s) => ({
      ...s,
      bookings: s.bookings.map((b) =>
        b.reference === reference ? { ...b, status: 'cancelled', refunded: b.paid } : b,
      ),
    }))
  }, [patch])

  const cartTotals = useMemo(
    () => totals(state.cart.reduce((sum, item) => sum + item.subtotal, 0)),
    [state.cart],
  )

  const value: Store = {
    state,
    secondsLeft,
    holdLapsed,
    cartCount: state.cart.length,
    cartTotals,
    logIn,
    signUp,
    logOut,
    updateAccount,
    addToCart,
    removeFromCart,
    clearCart,
    setDetails,
    signWaiver,
    pay,
    resetCheckout,
    reschedule,
    cancelBooking,
  }

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used inside StoreProvider')
  return ctx
}

export const formatCountdown = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${`${seconds % 60}`.padStart(2, '0')}`
