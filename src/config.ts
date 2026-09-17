/**
 * The booking journey — court picker, login, cart, checkout — is intended to run on
 * its own origin (booking.glitchsports.ae), separate from the marketing site.
 *
 * Set VITE_BOOKING_ORIGIN to that origin in production and every entry point below
 * becomes an absolute link into it, including the post-login hand-off. Left empty
 * (the default, and in this prototype) the two live in one app and the same paths
 * resolve locally, so the flow is identical either way.
 */
export const BOOKING_ORIGIN = (import.meta.env.VITE_BOOKING_ORIGIN ?? '').replace(/\/$/, '')

/** Paths that belong to the booking app rather than the marketing site. */
export const BOOKING_PATHS = ['/book', '/login', '/signup', '/cart', '/checkout', '/confirmation']

export const isSplitDeployment = BOOKING_ORIGIN.length > 0

/** A link into the booking app — absolute when it is deployed on its own origin. */
export function bookingHref(path: string) {
  return isSplitDeployment ? `${BOOKING_ORIGIN}/#${path}` : path
}

/** Hand off to the booking app, crossing origins when they are split. */
export function goToBooking(path: string, navigate: (to: string, opts?: { replace?: boolean }) => void) {
  if (isSplitDeployment) {
    window.location.assign(bookingHref(path))
    return
  }
  navigate(path)
}
