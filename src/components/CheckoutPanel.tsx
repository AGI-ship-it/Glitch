import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'

/**
 * Whether the checkout panel is open, shared across the tree.
 *
 * The panel is drawn by the header but opened from anywhere — the home page runs
 * the first step inline and needs to hand the rest over without changing the page
 * under the customer.
 */
type Panel = {
  open: boolean
  openCheckout: (courtId?: string) => void
  closeCheckout: () => void
  /** Which court the modal should open on, when one was named. */
  courtId?: string
}

const CheckoutPanelContext = createContext<Panel | null>(null)

export function CheckoutPanelProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const [courtId, setCourtId] = useState<string | undefined>()
  const value = useMemo(
    () => ({
      open,
      courtId,
      openCheckout: (id?: string) => {
        if (id) setCourtId(id)
        setOpen(true)
      },
      closeCheckout: () => setOpen(false),
    }),
    [open, courtId],
  )
  return <CheckoutPanelContext.Provider value={value}>{children}</CheckoutPanelContext.Provider>
}

export function useCheckoutPanel() {
  const ctx = useContext(CheckoutPanelContext)
  if (!ctx) throw new Error('useCheckoutPanel must be used inside CheckoutPanelProvider')
  return ctx
}
