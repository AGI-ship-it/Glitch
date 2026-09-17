import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import {
  COURTS,
  SPORTS,
  VENUES,
  type Court,
  type SportId,
} from '../data/catalog'
import { addDays, formatShortDate, rangeLabel, slotsFor, todayKey } from '../lib/booking'
import { PATTERN_HOT } from '../lib/pattern'
import { Chevron, StripeRule } from '../components/ui'
import { useStore } from '../store/StoreProvider'
import BookingPicker, { shortCourtName, type PickerRequest } from '../components/BookingPicker'
import CheckoutSteps, { type StepId } from '../components/CheckoutSteps'
import { useCheckoutPanel } from '../components/CheckoutPanel'
import BookingModal from '../components/BookingModal'
import CourtStrip from '../components/CourtStrip'
import HoursTicker from '../components/HoursTicker'
import {
  CampaignBackdrop,
  CampaignOffer,
  CampaignTabs,
  useCampaignCarousel,
} from '../components/Campaign'


function clockLabel(hour: number) {
  const suffix = hour >= 12 ? 'PM' : 'AM'
  const h = hour % 12 === 0 ? 12 : hour % 12
  return `${h}:00 ${suffix}`
}

/** The next free hours across the courts the bar is filtered to, soonest first. */
function upcomingSlots(courts: Court[], today: string, limit = 8) {
  const out: { value: string; label: string }[] = []
  for (let day = 0; day < 4 && out.length < limit; day++) {
    const dateKey = addDays(today, day)
    const dayLabel =
      day === 0 ? 'Today' : day === 1 ? 'Tomorrow' : formatShortDate(dateKey).split(' ')[0]
    for (const court of courts) {
      for (const slot of slotsFor(court, dateKey)) {
        if (!slot.available || out.length >= limit) continue
        const value = `${court.id}|${dateKey}|${slot.hour}`
        if (out.some((o) => o.label === `${dayLabel} · ${clockLabel(slot.hour)}`)) continue
        out.push({ value, label: `${dayLabel} · ${clockLabel(slot.hour)}` })
      }
    }
  }
  return out
}

const FIELD_ICONS = {
  pin: (
    <>
      <path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11Z" stroke="currentColor" strokeWidth="1.8" fill="none" />
      <circle cx="12" cy="10" r="2.4" stroke="currentColor" strokeWidth="1.8" fill="none" />
    </>
  ),
  trophy: (
    <>
      <path d="M7 4h10v5a5 5 0 0 1-10 0V4Z" stroke="currentColor" strokeWidth="1.8" fill="none" />
      <path d="M7 6H4.5v1.5A3.5 3.5 0 0 0 8 11M17 6h2.5v1.5A3.5 3.5 0 0 1 16 11M12 14v3.5M8.5 20h7" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" />
    </>
  ),
  court: (
    <>
      <rect x="3.5" y="5" width="17" height="14" rx="2.5" stroke="currentColor" strokeWidth="1.8" fill="none" />
      <path d="M12 5v14" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="2.6" stroke="currentColor" strokeWidth="1.8" fill="none" />
    </>
  ),
  calendar: (
    <>
      <rect x="3.5" y="5" width="17" height="15" rx="3" stroke="currentColor" strokeWidth="1.8" fill="none" />
      <path d="M8 3v4M16 3v4M3.5 10h17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" fill="none" />
    </>
  ),
}

function SearchField({
  icon,
  label,
  divider,
  children,
}: {
  icon: keyof typeof FIELD_ICONS
  label: string
  divider?: boolean
  children: React.ReactNode
}) {
  return (
    <div
      className={`relative flex min-w-0 flex-1 flex-col justify-center px-5 py-3 sm:py-2 ${
        divider ? 'sm:border-l sm:border-white/10' : ''
      }`}
    >
      <span className="mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-brand-magenta-bright">
        <svg width="12" height="12" viewBox="0 0 24 24" aria-hidden="true">
          {FIELD_ICONS[icon]}
        </svg>
        {label}
      </span>
      {children}
      <Chevron className="pointer-events-none absolute bottom-[14px] right-4 h-4 w-4 text-white/45 sm:bottom-2" />
    </div>
  )
}

function HeroSelect({
  value,
  placeholder,
  options,
  onChange,
}: {
  value: string
  placeholder?: string
  options: { value: string; label: string }[]
  onChange: (v: string) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const away = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    const esc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('mousedown', away)
    window.addEventListener('keydown', esc)
    return () => {
      window.removeEventListener('mousedown', away)
      window.removeEventListener('keydown', esc)
    }
  }, [open])

  const current = options.find((o) => o.value === value)

  return (
    <div ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`w-full truncate pr-8 text-left text-[15px] font-semibold focus:outline-none ${
          current ? 'text-white' : 'text-white/40'
        }`}
      >
        {current?.label ?? placeholder ?? 'Select'}
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute left-3 right-3 top-[calc(100%+12px)] z-30 max-h-[300px] overflow-auto rounded-[18px] bg-[#141319] p-1.5 shadow-[0_28px_60px_-16px_rgba(0,0,0,0.85)] ring-1 ring-white/10 animate-fade-up sm:left-2 sm:right-auto sm:min-w-[240px]"
        >
          {options.map((o) => {
            const selected = o.value === value
            return (
              <li key={o.value}>
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => {
                    onChange(o.value)
                    setOpen(false)
                  }}
                  className={`flex w-full items-center justify-between gap-6 rounded-xl px-4 py-2.5 text-left text-[14px] font-medium transition ${
                    selected
                      ? 'bg-white/10 text-white'
                      : 'text-white/75 hover:bg-brand-magenta hover:text-white'
                  }`}
                >
                  {o.label}
                  {selected && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path
                        d="m5 12.5 5 5L19 7"
                        stroke="#e5199b"
                        strokeWidth="2.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}


export default function HomePage() {
  const today = todayKey()
  const carousel = useCampaignCarousel()

  const [venue, setVenue] = useState(VENUES[0].id)
  const [sport, setSport] = useState<SportId | 'all'>('all')
  const [courtId, setCourtId] = useState(COURTS[0].id)
  const [slot, setSlot] = useState('')

  /** What the bar has handed the picker; the nonce lets the same slot fire twice. */
  const [request, setRequest] = useState<PickerRequest>({ nonce: 0 })
  const { state, cartCount } = useStore()
  const { openCheckout, closeCheckout, courtId: modalCourtId } = useCheckoutPanel()
  /** The stepper build books in a modal, so the page hands off rather than inlining. */
  const modalFlow = import.meta.env.VITE_FLOW === 'stepper'
  /**
   * The same window, raised inside the booking section instead of over the page —
   * the section keeps its place in the scroll and the booking happens in it.
   */
  const withinFlow = import.meta.env.VITE_FLOW === 'stepper-within'
  /** Which section of the booking accordion is open. */
  const [homeStep, setHomeStep] = useState<StepId>(1)

  // Emptying the cart puts the accordion back to picking a slot.
  useEffect(() => {
    if (!cartCount) setHomeStep(1)
  }, [cartCount])

  const last = state.cart[state.cart.length - 1]
  const pickedSummary = last
    ? `${shortCourtName(last.courtId)} · ${formatShortDate(last.dateKey)} · ${rangeLabel(
        Math.min(...last.hours),
        last.hours.length,
      )}`
    : undefined
  const bookRef = useRef<HTMLDivElement>(null)
  const pickerRef = useRef<HTMLDivElement>(null)

  const results = useMemo(() => {
    return COURTS.filter((c) => c.id === courtId)
  }, [courtId])

  /**
   * Numbered, not named after a sport: every court plays both, so "Court 1" is what
   * the customer is actually choosing between. No "all" — a booking is one court.
   */
  const courtOptions = useMemo(
    () => COURTS.map((c) => ({ value: c.id, label: `Court ${Number(c.number)}` })),
    [],
  )

  const slotOptions = useMemo(() => upcomingSlots(results, today), [results, today])
  const activeSlot = slotOptions.some((o) => o.value === slot) ? slot : (slotOptions[0]?.value ?? '')

  /**
   * One scroll, used by the bar, the header CTA and the closing band alike.
   *
   * The target is the picker card rather than the section around it: arriving on
   * the section heading leaves the hours below the fold, which is the one thing the
   * CTA promised. Centred where the card fits the viewport, pinned to its top where
   * it does not, so the sport and court rows are never the part that gets cut.
   */
  const scrollToPicker = () => {
    const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const behavior = calm ? 'auto' : 'smooth'
    const card = pickerRef.current
    if (!card) {
      bookRef.current?.scrollIntoView({ behavior, block: 'start' })
      return
    }
    const fits = card.getBoundingClientRect().height <= window.innerHeight - 32
    card.scrollIntoView({ behavior, block: fits ? 'center' : 'start' })
    // Move the keyboard caret with the eye, without a second jump.
    card.focus({ preventScroll: true })
  }

  /**
   * CCAvenue is a full page load, so the browser drops you back at the top of the
   * home page — above a reference that is sitting in the panel further down. Run to
   * it once, after a tick, so the router's own jump to the top lands first.
   */
  const refs = state.checkout.lastReferences
  const landed = useRef(false)
  useEffect(() => {
    if (!withinFlow) return
    if (!refs.length) {
      landed.current = false
      return
    }
    if (landed.current) return
    landed.current = true
    const id = window.setTimeout(scrollToPicker, 80)
    return () => window.clearTimeout(id)
  }, [withinFlow, refs.length])

  /**
   * The header's Book now, from this page or any other. It arrives as navigation
   * state rather than a hash so it survives HashRouter, and it is keyed on the
   * location key so pressing it again while already parked here scrolls again.
   */
  const location = useLocation()
  useEffect(() => {
    const intent = location.state as { book?: boolean; courts?: boolean } | null
    if (!intent?.book && !intent?.courts) return
    // A frame later: arriving from another route, the section is one paint old.
    const frame = window.requestAnimationFrame(() => {
      if (intent.book && modalFlow) {
        openCheckout()
        return
      }
      if (intent.book && withinFlow) {
        scrollToPicker()
        openCheckout()
        return
      }
      if (intent.courts) {
        const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        document
          .getElementById('courts')
          ?.scrollIntoView({ behavior: calm ? 'auto' : 'smooth', block: 'start' })
        return
      }
      scrollToPicker()
    })
    return () => window.cancelAnimationFrame(frame)
  }, [location.key, location.state])

  /**
   * The bar's whole job is to get you into the picker below it. Nothing navigates —
   * the booking section is on this page, so the button hands over what the bar has
   * chosen and scrolls down to it.
   */
  const startBooking = () => {
    const [slotCourt, slotDate, slotHour] = activeSlot ? activeSlot.split('|') : []
    // Where the booking is a window, every CTA raises it — there is nothing on the
    // page below to scroll to.
    if (modalFlow || withinFlow) {
      openCheckout(slotCourt ?? courtId)
      if (withinFlow) scrollToPicker()
      return
    }
    setRequest((r) => ({
      nonce: (r.nonce ?? 0) + 1,
      courtId: slotCourt ?? courtId,
      sport: sport === 'all' ? undefined : sport,
      dateKey: slotDate,
      hour: slotHour === undefined ? undefined : Number(slotHour),
    }))
    scrollToPicker()
  }

  const heroRef = useRef<HTMLDivElement>(null)
  const [tilt, setTilt] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const fine = window.matchMedia('(pointer: fine)').matches
    const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!fine || calm) return

    const el = heroRef.current
    if (!el) return

    let frame = 0
    const onMove = (e: MouseEvent) => {
      if (frame) return
      frame = window.requestAnimationFrame(() => {
        frame = 0
        const r = el.getBoundingClientRect()
        setTilt({
          x: ((e.clientX - r.left) / r.width - 0.5) * 2,
          y: ((e.clientY - r.top) / r.height - 0.5) * 2,
        })
      })
    }
    const onLeave = () => setTilt({ x: 0, y: 0 })

    el.addEventListener('mousemove', onMove)
    el.addEventListener('mouseleave', onLeave)
    return () => {
      el.removeEventListener('mousemove', onMove)
      el.removeEventListener('mouseleave', onLeave)
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [])

  const shift = (depth: number) => ({
    transform: `translate3d(${tilt.x * depth}px, ${tilt.y * depth}px, 0)`,
  })

  return (
    <>
      {/* Hero */}
      <section className="-mt-[100px] sm:-mt-[108px]">
        <div ref={heroRef} className="relative overflow-hidden bg-ink text-white [perspective:1200px]">
          {/* The slider owns the whole backdrop: brand ground, the slide's accent
              wash, its artwork and the scrim, all keyed off one index. */}
          <CampaignBackdrop index={carousel.index} />

          {/* Above the ticker, or the search bar's dropdowns open behind it: the
              transform here makes this a stacking context its children cannot
              escape, so the whole column has to clear z-10, not just the list. */}
          <div
            className="shell relative z-20 flex min-h-[100svh] flex-col justify-center pb-28 pt-32 transition-transform duration-500 ease-out will-change-transform"
            style={shift(-6)}
          >
            <h1 className="sr-only">Book your game time today at Glitch Sports</h1>

            <CampaignOffer index={carousel.index} />

            {/* The search bar. It no longer leaves for a booking page — it hands the
                picker below this hero what you chose and scrolls the page to it. */}
            {/* Above the slide tabs below it, which are also z-10 and come later —
                otherwise a field's dropdown opens behind them. */}
            <div className="relative z-20 mt-9 w-full max-w-[1000px]">
              <div className="relative flex flex-col rounded-[28px] border border-white/10 bg-white/[0.06] p-2 shadow-[0_32px_64px_-24px_rgba(0,0,0,0.75)] backdrop-blur-xl sm:flex-row sm:items-stretch">
                <SearchField icon="pin" label="Venue">
                  <HeroSelect
                    value={venue}
                    onChange={setVenue}
                    options={VENUES.map((v) => ({ value: v.id, label: v.name }))}
                  />
                </SearchField>

                <SearchField icon="court" label="Court" divider>
                  <HeroSelect value={courtId} onChange={setCourtId} options={courtOptions} />
                </SearchField>

                <SearchField icon="trophy" label="Sport" divider>
                  <HeroSelect
                    value={sport}
                    placeholder="Select sport"
                    onChange={(v) => setSport(v as SportId | 'all')}
                    options={[
                      { value: 'all', label: 'All sports' },
                      ...SPORTS.map((sp) => ({ value: sp.id, label: sp.name })),
                    ]}
                  />
                </SearchField>

                <SearchField icon="calendar" label="Slot" divider>
                  <HeroSelect
                    value={activeSlot}
                    placeholder="No slots free"
                    onChange={setSlot}
                    options={slotOptions}
                  />
                </SearchField>

                <button
                  type="button"
                  onClick={startBooking}
                  className="mt-2 flex h-[56px] items-center justify-center rounded-[20px] bg-brand-magenta px-9 text-[14px] font-bold uppercase tracking-[0.04em] text-white transition hover:brightness-110 sm:mt-0 sm:shrink-0 sm:self-center sm:rounded-full"
                >
                  Book now
                </button>
              </div>

            </div>

            <CampaignTabs {...carousel} />
          </div>

          <HoursTicker className="absolute inset-x-0 bottom-0 z-10" />

          {/* The same brand rule the sections below carry, closing the hero top and
              bottom. Above the ticker in the stack, so the lower one reads as the
              seam between the hero and the courts rather than a line inside it. */}
          <div
            aria-hidden="true"
            className="absolute inset-x-0 top-0 z-20 h-[4px]"
            style={{ background: 'linear-gradient(90deg, #2e2ed6, #7b2ff7 45%, #e5199b)' }}
          />
          <div
            aria-hidden="true"
            className="absolute inset-x-0 bottom-0 z-20 h-[4px]"
            style={{ background: 'linear-gradient(90deg, #2e2ed6, #7b2ff7 45%, #e5199b)' }}
          />
        </div>
      </section>

      {/* The courts, as pictures. Booking happens in the section below rather than
          from a tile, so nothing here is a way in. */}
      <CourtStrip />

      {/* Booking. On the modal build there is nothing to land on here — every CTA
          raises the window instead — so the section is left out entirely. */}
      {!modalFlow && (
        <section
          id="book"
          ref={bookRef}
          className={`scroll-mt-[96px] border-b border-line bg-wash sm:scroll-mt-[104px] ${
            withinFlow ? 'py-6' : 'py-12'
          }`}
        >
          <div className="shell">
            <div className={`mx-auto ${withinFlow ? 'max-w-[1180px]' : 'max-w-[840px]'}`}>
              {/* The window is the section on this build — it names its own steps,
                  so a heading over it only costs the panel height. */}
              <div className={`text-center ${withinFlow ? 'hidden' : ''}`}>
                <StripeRule className="mx-auto mb-4" />
                <p className="eyebrow">Booking</p>
                <h2
                  className={`mt-3 font-extrabold tracking-tight ${
                    withinFlow ? 'text-[26px] sm:text-[32px]' : 'text-[32px] sm:text-[44px]'
                  }`}
                >
                  Book your court
                </h2>
                {/* The window below owns the fold on this build, so the section
                    leads in with a line and gets out of its way. */}
                {!withinFlow && (
                  <p className="mx-auto mt-3 max-w-[52ch] text-[16px] leading-relaxed text-muted">
                    One-hour slots on all four courts. Tap adjacent hours for a longer block, then
                    work down the three steps.
                  </p>
                )}
              </div>

              {withinFlow ? (
                /* The panel is the section, not something raised over it: it is up
                   from the first paint, so there is no placeholder to sit behind. */
                <div
                  ref={pickerRef}
                  tabIndex={-1}
                  className="relative h-[min(880px,calc(100svh-128px))] min-h-[560px] scroll-mt-[96px] outline-none"
                >
                  <BookingModal within open onClose={closeCheckout} initialCourtId={modalCourtId} />
                </div>
              ) : (
                /* The whole booking runs here, in one column: pick a slot and the
                   same panel carries on down into details and the hand-off, rather
                   than sending the customer to a page or a popup. */
                <div ref={pickerRef} tabIndex={-1} className="mt-8 scroll-mt-[96px] outline-none">
                  <CheckoutSteps
                    step={homeStep}
                    setStep={setHomeStep}
                    stepOne={{
                      title: 'Pick your slot',
                      summary: pickedSummary,
                      body: <BookingPicker request={request} onPicked={() => setHomeStep(2)} />,
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Final CTA */}
      <section className="relative overflow-hidden py-14 text-white">
        <div aria-hidden="true" className="absolute inset-0" style={{ background: PATTERN_HOT }} />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-r from-ink/80 via-ink/40 to-transparent"
        />
        <div className="shell relative flex flex-col items-start gap-8 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[12px] font-bold uppercase tracking-[0.18em] text-brand-yellow">Ready to play?</p>
            <h2 className="mt-3 max-w-[16ch] text-[36px] font-extrabold uppercase italic leading-[0.9] tracking-tight sm:text-[48px]">
              Your court is waiting
            </h2>
            <p className="mt-4 max-w-[40ch] text-[17px] leading-relaxed text-white/75">
              Four indoor courts on Level 3. Book in under two minutes — kit included, QR check-in at reception.
            </p>
          </div>
          <div className="flex flex-wrap gap-4">
            <button
              type="button"
              onClick={() => startBooking()}
              className="inline-flex h-14 items-center rounded-full bg-brand-magenta px-9 text-[15px] font-bold uppercase tracking-[0.06em] text-white transition hover:brightness-110"
            >
              Book a court
            </button>
          </div>
        </div>
      </section>
    </>
  )
}
