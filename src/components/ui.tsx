import { useEffect, useRef, useState, type ReactNode } from 'react'

/**
 * The brand's diagonal glitch stripe, reduced to a small rule. Used under section
 * eyebrows and page headings so every screen carries a mark of the identity.
 */
export function StripeRule({ className = '' }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`block h-[6px] w-14 rounded-full ${className}`}
      style={{
        background:
          'repeating-linear-gradient(118deg, #2e2ed6 0 5px, transparent 5px 9px), linear-gradient(90deg, #2e2ed6, #7b2ff7 45%, #e5199b)',
      }}
    />
  )
}


/**
 * Court and offer imagery is not in the wireframe — every image slot is a grey
 * placeholder. These stand in with a stable generated pattern so the layout is
 * honest about what is still missing.
 */
export function Photo({
  label,
  className = 'aspect-[16/9] w-full',
  seed = 0,
  src,
  position = 'object-center',
}: {
  label: string
  className?: string
  seed?: number
  /** Brand photography. Without one the slot falls back to a labelled placeholder. */
  src?: string
  position?: string
}) {
  if (src) {
    return (
      <div className={`relative overflow-hidden rounded-[20px] bg-ink ${className}`}>
        <img src={src} alt={label} className={`h-full w-full object-cover ${position}`} />
      </div>
    )
  }

  const rotation = [12, -8, 24, -18, 4][seed % 5]
  return (
    <div
      className={`relative overflow-hidden rounded-[20px] bg-wash-strong ${className}`}
      role="img"
      aria-label={`${label} — photography to follow`}
    >
      <div
        className="absolute inset-0 opacity-70"
        style={{
          background: `repeating-linear-gradient(${rotation}deg, #d9d9d9 0 18px, #cfcfcf 18px 36px)`,
        }}
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[13px] font-semibold uppercase tracking-[0.14em] text-muted">
          {label}
        </span>
      </div>
    </div>
  )
}

/**
 * The venue on a map.
 *
 * Flat artwork rather than an openstreetmap.org iframe: the embed is a request out to
 * another origin, and anywhere that request is refused — a strict CSP, an offline
 * demo — the panel comes back empty, which is how the location went missing. The
 * tiles were fetched once at build time and stitched into `public/venue`, so the map
 * is an image the page already owns.
 *
 * The crop is centred on the building, which is what lets the pin sit at the middle
 * of the frame: `object-cover` keeps the centre of an image on the centre of its box
 * at every width, so the marker stays on the door as the card reflows.
 */
export function VenueMap({ className = 'h-[240px]' }: { className?: string }) {
  return (
    <div className={`relative w-full overflow-hidden bg-wash ${className}`}>
      <picture>
        <source type="image/webp" srcSet="/venue/deira-map.webp" />
        <img
          src="/venue/deira-map.jpg"
          alt="Street map of Deira with Glitch Sports marked at Al Ghurair Centre, by Union metro station"
          className="h-full w-full object-cover"
          loading="lazy"
        />
      </picture>

      <span
        aria-hidden="true"
        className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-white bg-brand-magenta shadow-[0_0_0_7px_rgba(209,20,140,0.22)]"
      />

      {/* Required by the tile licence, and the reason the map is allowed to be here. */}
      <span className="absolute bottom-1.5 right-1.5 rounded-full bg-white/85 px-2 py-0.5 text-[10px] font-semibold text-muted">
        © OpenStreetMap
      </span>
    </div>
  )
}

/** Deterministic QR-looking block so the confirmation screen has something to show. */
export function QrCode({ value, size = 180 }: { value: string; size?: number }) {
  const cells = 21
  let h = 2166136261
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  const bit = (i: number) => {
    h ^= i + 0x9e3779b9
    h = Math.imul(h, 2654435761)
    return ((h >>> 13) & 1) === 1
  }
  const isFinder = (r: number, c: number) =>
    (r < 7 && c < 7) || (r < 7 && c >= cells - 7) || (r >= cells - 7 && c < 7)

  const rects: ReactNode[] = []
  for (let r = 0; r < cells; r++) {
    for (let c = 0; c < cells; c++) {
      if (isFinder(r, c)) continue
      if (!bit(r * cells + c)) continue
      rects.push(<rect key={`${r}-${c}`} x={c} y={r} width={1} height={1} fill="#1b1b1b" />)
    }
  }
  const finder = (x: number, y: number) => (
    <g key={`f-${x}-${y}`}>
      <rect x={x} y={y} width={7} height={7} fill="#1b1b1b" />
      <rect x={x + 1} y={y + 1} width={5} height={5} fill="#fff" />
      <rect x={x + 2} y={y + 2} width={3} height={3} fill="#1b1b1b" />
    </g>
  )

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${cells} ${cells}`}
      shapeRendering="crispEdges"
      role="img"
      aria-label={`QR code for booking ${value}`}
      className="rounded-md bg-white p-0"
    >
      <rect width={cells} height={cells} fill="#fff" />
      {rects}
      {finder(0, 0)}
      {finder(cells - 7, 0)}
      {finder(0, cells - 7)}
    </svg>
  )
}

/**
 * The checkbox used everywhere in the product. The native input stays for keyboard
 * and screen readers but is visually hidden; the box beside it is drawn, so the
 * checked state matches the design system rather than the OS accent colour.
 */
export function Checkbox({
  checked,
  defaultChecked,
  onChange,
  required,
  disabled,
  align = 'start',
  children,
}: {
  checked?: boolean
  defaultChecked?: boolean
  onChange?: (checked: boolean) => void
  required?: boolean
  disabled?: boolean
  /** Long labels wrap, so the box sits at the top by default. */
  align?: 'start' | 'center'
  children?: ReactNode
}) {
  return (
    <label
      className={`group flex cursor-pointer gap-3 text-[15px] ${
        align === 'center' ? 'items-center' : 'items-start'
      } ${disabled ? 'cursor-not-allowed' : ''}`}
    >
      <input
        type="checkbox"
        checked={checked}
        defaultChecked={defaultChecked}
        required={required}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.checked)}
        className="peer sr-only"
      />
      <span
        aria-hidden="true"
        className={`grid h-5 w-5 shrink-0 place-items-center rounded-[4px] border-[1.5px] border-line-strong bg-white transition
                    group-hover:border-ink
                    peer-checked:border-ink peer-checked:bg-ink
                    peer-checked:[&>svg]:opacity-100
                    peer-focus-visible:ring-2 peer-focus-visible:ring-ink peer-focus-visible:ring-offset-2
                    peer-disabled:opacity-40 peer-disabled:group-hover:border-line-strong
                    ${align === 'start' ? 'mt-0.5' : ''}`}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          className="text-white opacity-0 transition-opacity"
        >
          <path
            d="m5 12.5 5 5L19 7"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <span className="min-w-0 flex-1">{children}</span>
    </label>
  )
}

export function Badge({ children, tone = 'dark' }: { children: ReactNode; tone?: 'dark' | 'light' }) {
  return (
    <span
      className={
        tone === 'dark'
          ? 'inline-flex items-center rounded-full bg-ink px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-white'
          : 'inline-flex items-center rounded-full border border-line-strong px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-muted'
      }
    >
      {children}
    </span>
  )
}

export function PageHeading({
  title,
  intro,
  crumb,
}: {
  title: string
  intro?: string
  crumb?: string
}) {
  return (
    <header className="pt-10 sm:pt-14">
      {crumb && <p className="mb-3 text-[13px] text-muted">{crumb}</p>}
      <StripeRule className="mb-5" />
      <h1 className="text-[32px] font-extrabold leading-tight sm:text-[40px]">{title}</h1>
      {intro && <p className="mt-3 max-w-[70ch] text-[16px] leading-relaxed text-muted">{intro}</p>}
    </header>
  )
}

export function SummaryRow({
  label,
  value,
  strong = false,
}: {
  label: string
  value: string
  strong?: boolean
}) {
  return (
    <div
      className={`flex items-baseline justify-between ${
        strong ? 'text-[20px] font-bold' : 'text-[15px] text-muted'
      }`}
    >
      <span>{label}</span>
      <span className={strong ? '' : 'font-semibold text-ink'}>{value}</span>
    </div>
  )
}

export function Note({ children }: { children: ReactNode }) {
  return (
    <p className="mt-4 text-[13px] leading-relaxed text-muted">{children}</p>
  )
}

/**
 * The one chevron on the site, drawn rather than typed. The glyphs it replaces —
 * ⌄ ‹ › — are punctuation, so their weight and centring came from whichever font
 * had them and never matched the type around them.
 */
export function Chevron({
  dir = 'down',
  className = 'h-4 w-4',
}: {
  dir?: 'up' | 'down' | 'left' | 'right'
  className?: string
}) {
  const d = {
    up: 'm6 14 6-6 6 6',
    down: 'm6 10 6 6 6-6',
    left: 'm14 6-6 6 6 6',
    right: 'm10 6 6 6-6 6',
  }[dir]
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={`shrink-0 ${className}`}>
      <path d={d} stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/**
 * A select drawn in the site's own type rather than the browser's. The hero runs a
 * dark one of its own over the artwork; this is the light one for a card, so a
 * chooser on a white panel does not drop an OS menu into the middle of the brand.
 */
export function SelectMenu({
  value,
  options,
  onChange,
  label,
  className = '',
}: {
  value: string
  options: { value: string; label: string }[]
  onChange: (v: string) => void
  label: string
  className?: string
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
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={label}
        className="flex w-full items-center rounded-full border-2 border-ink bg-white px-7 py-2.5 shadow-card"
      >
        <span className="w-full truncate text-left text-[19px] font-bold">{current?.label}</span>
        <Chevron className={`ml-4 h-[18px] w-[18px] text-muted transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute inset-x-0 top-[calc(100%+8px)] z-30 overflow-hidden rounded-[18px] border border-line-strong bg-white p-1.5 shadow-pop animate-fade-up"
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
                  className={`flex w-full items-center justify-between gap-6 rounded-xl px-5 py-2.5 text-left text-[16px] font-semibold transition ${
                    selected ? 'bg-wash text-ink' : 'text-ink-soft hover:bg-brand-magenta hover:text-white'
                  }`}
                >
                  {o.label}
                  {selected && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path
                        d="m5 12.5 5 5L19 7"
                        stroke="#d1148c"
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
