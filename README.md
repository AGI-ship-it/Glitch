# Glitch Sports — court booking site

Built from the Figma wireframe deck [Booking prototype](https://www.figma.com/design/4oRDzANJ2R52vBtdewh6Py/Untitled?node-id=2-2),
following the prototype's own wiring and the BRD v3.3 notes embedded on that page.

React 19 + Vite + TypeScript + Tailwind CSS v3, HashRouter, no backend.

```bash
npm install
npm run dev        # http://localhost:5174
npm run build      # tsc -b && vite build
```

## The journey, as wired in the prototype

`01 Home (hero slider → search bar → booking picker, all one page) → 05 Login → 06 Cart → 07 Checkout → 07b Waiver (near.tl) → 07c Payment (CCAvenue) → 08 Confirmation`

The home page's search bar does not navigate: it hands the picker below the hero what
you chose and scrolls to it. `/book/:courtId` runs the same picker for a deep link
from the courts page.

| Prototype frame | Route |
|---|---|
| 01 / 02 / A1 / A2 Home, hero slider, search bar, inline booking | `/` |
| A6 Sports and courts — list with filters | `/courts` |
| A7 Contact us | `/contact` |
| 03 / 03b / 03c Booking — slot picker and all-courts grid | `/book/:courtId` |
| 05 / X1 Login (mandatory, §3.1 step 5 · §9) | `/login` |
| 05b / X1b Sign up | `/signup` |
| 06 / 06b Cart, with the slot-hold countdown | `/cart` |
| 07 / 07d Checkout | `/checkout` |
| 07b Waiver — external, near.tl | `/waiver` |
| 07c Payment — external, CCAvenue | `/payment` |
| 08 / 08b Confirmation, reference + QR | `/confirmation` |
| E2 / X3 My bookings (upcoming, empty state) | `/account/bookings` |
| E2b My bookings — past | `/account/bookings/past` |
| E3 Booking details | `/account/bookings/:reference` |
| E4 Reschedule | `/account/bookings/:reference/reschedule` |
| E5 / E6 Cancel and cancelled | `/account/bookings/:reference/cancel`, `.../cancelled` |
| X5 Account — personal information | `/account/personal` |
| X6 Account — saved cards | `/account/cards` |
| Footer pages (sitemap) | `/terms`, `/privacy`, `/faq` |

The `Z …` frames in Figma are marked superseded and were not built. Flow B (phone OTP
instead of a password) is an alternative to the same journey and is not built either —
the BRD baseline uses email and password.

## Two apps, one codebase

The booking journey is meant to run on its own origin — `booking.glitchsports.ae` — while
the marketing pages stay on the main domain. The booking app owns **login, sign up, the
cart, checkout and the court picker**; the marketing site owns home, courts, contact
and the legal pages.

Set the origin and every hand-off becomes an absolute cross-origin link, including the
redirect after login:

```bash
VITE_BOOKING_ORIGIN=https://booking.glitchsports.ae npm run build
```

Left unset — the default, and how this prototype runs — both halves live in one app and
the same paths resolve locally, so the journey is identical either way. The split is
defined in [src/config.ts](src/config.ts).

## Rules the booking logic enforces

- One-hour slots; a longer block must be **adjacent hours on one court**.
- Off-peak until 17:00, peak from 17:00. Friday to Sunday adds AED 20 an hour.
- VAT 5% on top of the subtotal.
- An account is **mandatory before the cart** — the booking page routes to login first.
- Slots are held for 10 minutes. When the hold lapses — or the page is reloaded — the
  cart empties and the courts go back on sale. §5 requires a hold but never states a
  duration; ten minutes is an assumption to confirm.
- A signed waiver is required before payment; the two promotional consents are optional
  (the wireframe flags them as wrongly bundled).
- Free changes and cancellation until 24 hours before the slot.

## What is mocked

No backend. Courts, prices and availability come from `src/data/catalog.ts` and
`src/lib/booking.ts`; availability is generated from a stable hash so a court shows the
same free hours on every reload. The account, its bookings and its saved cards live in
`localStorage`; the cart does not, so a refresh releases the hold. Any email and
password logs you in.

`/waiver` and `/payment` are stand-ins for near.tl and CCAvenue — they render inside
browser chrome to show that the customer leaves the site twice, and are labelled as
prototype pages. Nothing entered on them is sent or stored.

Court photography is not in the wireframe; every image is a labelled placeholder, and
the volleyball courts have none at all — their tiles fall back to the brand ground.

Offers were dropped after the meeting: no offers page, no promo slides, no codes. The
hero slider stays as the venue's own three statements.
