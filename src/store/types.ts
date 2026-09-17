export type CartItem = {
  id: string
  courtId: string
  dateKey: string
  hours: number[]
  subtotal: number
}

export type BookingStatus = 'confirmed' | 'completed' | 'cancelled'

export type Booking = {
  reference: string
  courtId: string
  dateKey: string
  hours: number[]
  paid: number
  status: BookingStatus
  refunded?: number
  createdAt: number
}

export type Account = {
  firstName: string
  lastName: string
  email: string
  phone: string
  marketingEmail: boolean
  marketingWhatsapp: boolean
}

export type CheckoutDetails = {
  firstName: string
  lastName: string
  email: string
  phone: string
}

/**
 * Everyone playing on the booking, as listed on the waiver. The booker is always
 * the first row and cannot be removed — the rest are the players they add.
 */
export type Participant = {
  id: string
  name: string
  /** ISO date; the waiver derives "under 18" from it rather than storing a flag. */
  dob: string
  phone: string
  /** Required by the terms when the participant is under 18. */
  guardian?: string
}

export type CheckoutStage = {
  details: CheckoutDetails | null
  waiverSigned: boolean
  /** Signed for on the waiver — empty until that step is completed. */
  participants: Participant[]
  paid: boolean
  /** References minted by the last successful payment, shown on confirmation. */
  lastReferences: string[]
}

export type State = {
  account: Account | null
  cart: CartItem[]
  holdExpiresAt: number | null
  bookings: Booking[]
  checkout: CheckoutStage
}
