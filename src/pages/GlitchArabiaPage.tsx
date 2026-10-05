import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

/**
 * A stand-in for the glitcharabia.com home page — the real entry point of the
 * journey. Only GLITCH SPORTS is wired: it hands off to the Semnox booking engine.
 * The other menu items are inert, as this page exists to show that hand-off.
 */

const GREEN = 'var(--ga-green)'

const NAV = [
  { label: 'Activities', menu: true },
  { label: 'Pricing', menu: true },
  { label: 'Birthday' },
  { label: 'Groups', menu: true },
  { label: 'Contact', menu: true },
  { label: 'Safety rules' },
]

const HOURS = ['Friday to Sunday - 10:00 AM to 12:00 AM', 'Monday to Thursday - 10:00 AM to 11:00 PM']

const SLIDES = [
  {
    eyebrow: 'New at Glitch',
    title: 'Glitch Sports',
    line: 'Basketball • Volleyball • 4 indoor courts',
    offer: 'Book a court from AED 120 an hour',
    cta: 'Book a court',
  },
  {
    eyebrow: 'Glitch Sports',
    title: 'Game on',
    line: 'Bring your squad to Level 3',
    offer: 'Any court, any game — booked by the hour',
    cta: 'Book now',
  },
]

function Arrow({ dir }: { dir: 'left' | 'right' }) {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d={dir === 'left' ? 'M19 12H5m6-6-6 6 6 6' : 'M5 12h14m-6-6 6 6-6 6'}
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default function GlitchArabiaPage() {
  const [slide, setSlide] = useState(0)
  const go = (by: number) => setSlide((s) => (s + by + SLIDES.length) % SLIDES.length)

  useEffect(() => {
    const t = window.setInterval(() => setSlide((s) => (s + 1) % SLIDES.length), 6000)
    return () => window.clearInterval(t)
  }, [])

  const s = SLIDES[slide]

  return (
    <div
      className="min-h-screen bg-white font-sans text-ink"
      style={{ ['--ga-green' as string]: '#4cb71e', ['--ga-lime' as string]: '#c8ff2c', ['--ga-purple' as string]: '#6a12c9' }}
    >
      {/* Nav */}
      <header className="sticky top-0 z-40" style={{ background: GREEN }}>
        <div className="mx-auto flex h-[88px] max-w-[1600px] items-center justify-between gap-6 px-6 lg:px-10">
          <img src="/brand/logo.png" alt="Glitch" width={262} height={80} className="h-14 w-auto" />

          <nav aria-label="Main" className="hidden items-center gap-8 lg:flex">
            {NAV.map((n) => (
              <span key={n.label} className="flex cursor-default items-center gap-1.5 text-[15px] font-extrabold uppercase tracking-[0.12em]">
                {n.label}
                {n.menu && (
                  <svg width="9" height="9" viewBox="0 0 10 10" aria-hidden="true">
                    <path d="M1 3h8L5 8z" fill="currentColor" />
                  </svg>
                )}
              </span>
            ))}
            <Link
              to="/semnox"
              className="border-y-[3px] border-transparent py-1 text-[15px] font-extrabold uppercase tracking-[0.12em] transition hover:border-ink"
            >
              Glitch Sports
            </Link>
          </nav>

          <span className="inline-flex h-11 cursor-default items-center rounded-md border-2 border-ink bg-white px-5 text-[14px] font-bold uppercase shadow-[3px_4px_0_0_#0d0d10]">
            Buy now
          </span>
        </div>
      </header>

      {/* Banner slider */}
      <section aria-roledescription="carousel" aria-label="Offers" className="relative overflow-hidden" style={{ background: 'var(--ga-purple)' }}>
        <picture>
          <source type="image/webp" srcSet="/offers/hero-neon-960.webp 960w, /offers/hero-neon-1440.webp 1440w, /offers/hero-neon-1920.webp 1920w" />
          <img
            src="/offers/hero-neon-1440.jpg"
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-60 mix-blend-luminosity"
          />
        </picture>
        <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(106,18,201,0)_30%,rgba(40,0,80,0.85)_100%)]" />

        <div className="relative mx-auto flex min-h-[420px] max-w-[1600px] flex-col items-center justify-center px-24 py-12 text-center text-white">
          <p className="text-[15px] font-extrabold uppercase tracking-[0.2em]" style={{ color: 'var(--ga-lime)' }}>
            {s.eyebrow}
          </p>
          <h1
            className="mt-2 text-[clamp(48px,7vw,104px)] font-extrabold uppercase italic leading-[0.9]"
            style={{ WebkitTextStroke: '3px #0d0d10', paintOrder: 'stroke fill' }}
          >
            {s.title}
          </h1>
          <p className="mt-4 text-[clamp(20px,2.4vw,34px)] font-extrabold uppercase" style={{ color: 'var(--ga-lime)' }}>
            {s.line}
          </p>
          <p className="mt-2 text-[clamp(18px,2vw,28px)] font-extrabold uppercase">{s.offer}</p>
          <Link
            to="/semnox"
            className="mt-6 inline-flex h-11 items-center rounded-md px-6 text-[15px] font-extrabold uppercase text-ink shadow-[3px_4px_0_0_#0d0d10]"
            style={{ background: 'var(--ga-lime)' }}
          >
            {s.cta}
          </Link>
        </div>

        <button
          type="button"
          aria-label="Previous offer"
          onClick={() => go(-1)}
          className="absolute left-6 top-1/2 grid h-16 w-16 -translate-y-1/2 place-items-center rounded-full bg-white text-ink shadow-[0_5px_0_0_var(--ga-green)] lg:left-16"
        >
          <Arrow dir="left" />
        </button>
        <button
          type="button"
          aria-label="Next offer"
          onClick={() => go(1)}
          className="absolute right-6 top-1/2 grid h-16 w-16 -translate-y-1/2 place-items-center rounded-full bg-white text-ink shadow-[0_5px_0_0_var(--ga-green)] lg:right-16"
        >
          <Arrow dir="right" />
        </button>
      </section>

      {/* Hours strip */}
      <div className="overflow-hidden" style={{ background: GREEN }}>
        <div className="flex h-[72px] animate-ticker items-center gap-10 whitespace-nowrap">
          {[...HOURS, ...HOURS, ...HOURS, ...HOURS].map((h, i) => (
            <span key={i} className="flex items-center gap-10 text-[17px] font-medium uppercase">
              <img src="/brand/smiley.svg" alt="" width={30} height={30} className="rounded-full bg-ink" />
              {h}
            </span>
          ))}
        </div>
      </div>

      {/* Intro */}
      <section className="mx-auto max-w-[1240px] px-6 py-20 text-center">
        <h2 className="mx-auto max-w-[12ch] text-[clamp(36px,4vw,52px)] font-extrabold uppercase leading-[1]">Where extra plays</h2>
        <p className="mx-auto mt-6 max-w-[90ch] text-[17px] leading-relaxed">
          Glitch is where fun goes to have fun, and where kids go to unleash their extra. Discover our extra-verse through
          tons of new adventures. Glitch brings together the best of active entertainment at Al Ghurair Centre, Level 2.
        </p>
        <Link
          to="/semnox"
          className="mt-8 inline-flex h-12 items-center rounded-md border-2 border-ink px-6 text-[15px] font-extrabold uppercase shadow-[3px_4px_0_0_#0d0d10]"
          style={{ background: GREEN }}
        >
          Book Glitch Sports
        </Link>
      </section>

      <p className="pb-10 text-center text-[13px] text-muted">
        Prototype stand-in for glitcharabia.com — only Glitch Sports links through.
      </p>
    </div>
  )
}
