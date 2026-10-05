import { useLocation } from 'react-router-dom'
import { PaymentGateway } from '../../pages/PaymentPage'
import { slotLabel, SX_COURTS } from '../../mocks/semnox'
import { formatDate } from '../components'
import { useSemnox } from '../store'

/** The same hosted gateway the main site uses, fed from the Semnox cart. */
export default function PaymentScreen() {
  const { cart, account, secondsLeft, waiverSigned, placeOrder } = useSemnox()
  // Checkout passes the grand total, so a coupon carries through to the card page.
  const total = (useLocation().state as { total?: number } | null)?.total ?? cart.reduce((a, l) => a + l.price, 0)
  const holder = account ? [account.firstName, account.lastName].filter(Boolean).join(' ') : ''

  return (
    <PaymentGateway
      source={{
        lines: cart.map((l) => ({
          id: l.id,
          label: `${SX_COURTS.find((c) => c.id === l.courtId)!.name} · ${formatDate(l.dateKey)} · ${slotLabel(l.hour)}`,
        })),
        total,
        holder,
        phone: account?.phone ?? '+971 50 123 4567',
        cartCount: cart.length,
        secondsLeft,
        waiverSigned,
        pay: () => placeOrder(total) !== null,
        paths: { cart: '/semnox/checkout', waiver: '/semnox/waiver' },
        returnTo: () => '/semnox/confirmation',
      }}
    />
  )
}
