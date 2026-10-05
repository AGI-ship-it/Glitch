import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { addDays, todayKey } from '../lib/booking'
import { closingHour, HOLD_SECONDS, priceFor } from '../mocks/semnox'

export type CartLine = {
  id: string
  courtId: string
  dateKey: string
  hour: number
  price: number
}

export type Account = { firstName: string; lastName?: string; contact: string; phone?: string }

export type Order = { reference: string; lines: CartLine[]; total: number; placedAt: number }

type SemnoxState = {
  account: Account | null
  signIn: (a: Account) => void
  signOut: () => void
  waiverSigned: boolean
  signWaiver: () => void
  orders: Order[]
  lastOrder: Order | null
  placeOrder: (total: number) => Order | null
  dateKey: string
  setDateKey: (key: string) => void
  quantity: number
  setQuantity: (n: number) => void
  cart: CartLine[]
  addLines: (lines: CartLine[], openCart?: boolean) => void
  cartOpen: boolean
  setCartOpen: (open: boolean) => void
  removeLine: (id: string) => void
  clearCart: () => void
  secondsLeft: number
}

const Ctx = createContext<SemnoxState | null>(null)

/** One past visit, so My bookings has history to show. */
function seedOrders(): Order[] {
  const dateKey = addDays(todayKey(), -9)
  const line = { id: `court-2|${dateKey}|18`, courtId: 'court-2', dateKey, hour: 18, price: priceFor(dateKey, 18) }
  return [{ reference: 'GS-204117', lines: [line], total: line.price, placedAt: Date.now() - 12 * 864e5 }]
}

/** Today, unless today's last slot has already started. */
function firstBookableDate() {
  const today = todayKey()
  return new Date().getHours() >= closingHour(today) - 1 ? addDays(today, 1) : today
}

export function SemnoxProvider({ children }: { children: ReactNode }) {
  const [dateKey, setDateKey] = useState(firstBookableDate)
  const [quantity, setQuantity] = useState(1)
  const [cart, setCart] = useState<CartLine[]>([])
  const [holdUntil, setHoldUntil] = useState<number | null>(null)
  const [now, setNow] = useState(Date.now)
  const [account, setAccount] = useState<Account | null>(null)
  const [cartOpen, setCartOpen] = useState(false)
  const [orders, setOrders] = useState<Order[]>(seedOrders)
  const [lastRef, setLastRef] = useState<string | null>(null)
  const [waiverSigned, setWaiverSigned] = useState(false)

  useEffect(() => {
    if (!holdUntil) return
    const t = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(t)
  }, [holdUntil])

  const secondsLeft = holdUntil ? Math.max(0, Math.round((holdUntil - now) / 1000)) : 0

  // Semnox releases the hold when the timer runs out.
  useEffect(() => {
    if (holdUntil && secondsLeft === 0) {
      setCart([])
      setHoldUntil(null)
    }
  }, [holdUntil, secondsLeft])

  const value = useMemo<SemnoxState>(
    () => ({
      account,
      signIn: setAccount,
      signOut: () => {
        setAccount(null)
        setWaiverSigned(false)
      },
      waiverSigned,
      signWaiver: () => setWaiverSigned(true),
      orders,
      lastOrder: orders.find((o) => o.reference === lastRef) ?? null,
      placeOrder: (total) => {
        if (!cart.length) return null
        const order: Order = {
          reference: `GS-${String(Date.now()).slice(-6)}`,
          lines: cart,
          total,
          placedAt: Date.now(),
        }
        setOrders((o) => [order, ...o])
        setLastRef(order.reference)
        setCart([])
        setHoldUntil(null)
        setCartOpen(false)
        return order
      },
      dateKey,
      setDateKey,
      quantity,
      setQuantity,
      cart,
      cartOpen,
      setCartOpen,
      // Semnox drops the cart open the moment something is added.
      addLines: (lines, openCart = true) => {
        setCart((c) => [...c, ...lines])
        setCartOpen(openCart)
        setHoldUntil((h) => h ?? Date.now() + HOLD_SECONDS * 1000)
        setNow(Date.now())
      },
      removeLine: (id) =>
        setCart((c) => {
          const next = c.filter((l) => l.id !== id)
          if (!next.length) setHoldUntil(null)
          return next
        }),
      clearCart: () => {
        setCart([])
        setHoldUntil(null)
      },
      secondsLeft,
    }),
    [account, waiverSigned, orders, lastRef, dateKey, quantity, cart, cartOpen, secondsLeft],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useSemnox() {
  const v = useContext(Ctx)
  if (!v) throw new Error('useSemnox outside SemnoxProvider')
  return v
}

export const formatTimer = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
