import { Fragment, useEffect, useId, useRef, useState, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { addDays, fromKey, toKey } from '../lib/booking'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'light'
  size?: 'sm' | 'md' | 'lg'
}

export function Button({ variant = 'primary', size = 'md', className = '', ...rest }: ButtonProps) {
  const sizeClass = size === 'md' ? '' : `sx-btn-${size}`
  return <button type="button" className={`sx-btn sx-btn-${variant} ${sizeClass} ${className}`} {...rest} />
}

export function IconButton({ label, className = '', ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return <button type="button" aria-label={label} className={`sx-icon-btn ${className}`} {...rest} />
}

export function Badge({ children, tone = 'cta' }: { children: ReactNode; tone?: 'cta' | 'highlight' }) {
  const toneClass = tone === 'cta' ? 'bg-sx-cta text-white' : 'bg-sx-highlight text-sx-ink'
  return (
    <span
      className={`inline-grid min-w-5 place-items-center rounded-sx-pill border-2 border-sx-ink px-1 text-[11px] font-extrabold leading-4 ${toneClass}`}
    >
      {children}
    </span>
  )
}

/** Marks where Semnox can't meet a BRD need. Flagged in the UI, not solved. */
export function GapNote({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <aside
      role="note"
      className={`flex gap-sx-sm rounded-sx-field border-2 border-dashed border-sx-ink bg-sx-gap p-sx-md text-left text-sx-body-sm text-sx-gap-text ${className}`}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" className="mt-0.5 shrink-0">
        <path d="M12 3 2 21h20L12 3Z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        <path d="M12 10v5M12 18v.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <p>
        <strong className="font-extrabold uppercase tracking-[0.08em]">Framework gap · </strong>
        {children}
      </p>
    </aside>
  )
}

export function Stepper({
  value,
  onChange,
  min = 1,
  max,
  label,
  hideLabel = false,
}: {
  value: number
  onChange: (n: number) => void
  min?: number
  max: number
  label: string
  hideLabel?: boolean
}) {
  const id = useId()
  return (
    <div role="group" aria-labelledby={id} className="flex flex-col items-center gap-sx-sm">
      <span
        id={id}
        className={hideLabel ? 'sr-only' : 'text-sx-caption font-bold uppercase tracking-[0.14em] text-sx-muted'}
      >
        {label}
      </span>
      <div className="flex items-center gap-sx-md rounded-sx-pill border border-sx-border-strong bg-sx-raised p-sx-xs">
        <IconButton label={`Fewer ${label.toLowerCase()}`} disabled={value <= min} onClick={() => onChange(value - 1)}>
          <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
            <path d="M3 8h10" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
          </svg>
        </IconButton>
        <output aria-live="polite" className="w-8 text-center text-sx-h3 font-extrabold tabular-nums">
          {value}
        </output>
        <IconButton label={`More ${label.toLowerCase()}`} disabled={value >= max} onClick={() => onChange(value + 1)}>
          <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
            <path d="M3 8h10M8 3v10" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
          </svg>
        </IconButton>
      </div>
    </div>
  )
}

/* ---------- date picker ---------- */

// Semnox's date picker is fixed: Sunday-first weeks, two-letter day names, square cells.
const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

export const formatDate = (key: string) =>
  fromKey(key).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })

const monthStart = (key: string) => `${key.slice(0, 7)}-01`

function shiftMonth(key: string, by: number) {
  const d = fromKey(key)
  const target = new Date(d.getFullYear(), d.getMonth() + by, 1)
  const last = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate()
  target.setDate(Math.min(d.getDate(), last))
  return toKey(target)
}

/** Sunday-first weeks covering the month, padded with nulls. */
function monthGrid(firstKey: string) {
  const first = fromKey(firstKey)
  const lead = first.getDay()
  const days = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate()
  const cells: (string | null)[] = Array(lead).fill(null)
  for (let d = 0; d < days; d++) cells.push(addDays(firstKey, d))
  while (cells.length % 7) cells.push(null)
  return cells
}

export function DatePicker({
  value,
  onChange,
  min,
  max,
  label,
}: {
  value: string
  onChange: (key: string) => void
  min: string
  max: string
  label: string
}) {
  const [open, setOpen] = useState(false)
  const [focusKey, setFocusKey] = useState(value)
  const wrapRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)
  const labelId = useId()

  const clamp = (k: string) => (k < min ? min : k > max ? max : k)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  useEffect(() => {
    if (open) gridRef.current?.querySelector<HTMLButtonElement>(`[data-key="${focusKey}"]`)?.focus()
  }, [open, focusKey])

  const close = () => {
    setOpen(false)
    triggerRef.current?.focus()
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    const moves: Record<string, () => string> = {
      ArrowLeft: () => addDays(focusKey, -1),
      ArrowRight: () => addDays(focusKey, 1),
      ArrowUp: () => addDays(focusKey, -7),
      ArrowDown: () => addDays(focusKey, 7),
      PageUp: () => shiftMonth(focusKey, -1),
      PageDown: () => shiftMonth(focusKey, 1),
    }
    if (e.key === 'Escape') {
      e.preventDefault()
      close()
    } else if (moves[e.key]) {
      e.preventDefault()
      setFocusKey(clamp(moves[e.key]()))
    }
  }

  const viewKey = monthStart(focusKey)
  const monthName = fromKey(viewKey).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
  const today = min

  return (
    <div ref={wrapRef} className="relative inline-flex flex-col items-center gap-sx-sm sm:flex-row sm:gap-sx-md">
      <span id={labelId} className="text-sx-body-md font-bold">
        {label}
      </span>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-labelledby={`${labelId} ${labelId}-v`}
        onClick={() => {
          setFocusKey(value)
          setOpen((o) => !o)
        }}
        className="sx-btn sx-btn-light"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <rect x="3.5" y="5" width="17" height="15.5" rx="3" stroke="currentColor" strokeWidth="2" />
          <path d="M3.5 10h17M8 3v4M16 3v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <span id={`${labelId}-v`} className="normal-case tracking-normal">
          {formatDate(value)}
        </span>
        <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true" className={open ? 'rotate-180' : ''}>
          <path d="M2 4.5 6 8l4-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>

      {open && (
        /* Semnox's stock calendar layout, re-skinned in Glitch colours (see .sx-cal). */
        <div
          role="dialog"
          aria-modal="false"
          aria-label="Choose a booking date"
          onKeyDown={onKeyDown}
          className="sx-cal absolute left-1/2 top-full z-30 mt-sx-xs w-[min(92vw,300px)] -translate-x-1/2 p-1 text-left"
        >
          <div className="sx-cal-head mb-1 flex items-center gap-1 p-1">
            <button
              type="button"
              aria-label="Previous month"
              disabled={viewKey <= monthStart(min)}
              onClick={() => setFocusKey(clamp(shiftMonth(focusKey, -1)))}
              className="sx-cal-arrow"
            >
              <svg width="8" height="8" viewBox="0 0 8 8" aria-hidden="true">
                <path d="M5.5 1.5 3 4l2.5 2.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </button>
            <p aria-live="polite" className="sx-cal-month flex-1">
              {monthName}
            </p>
            <button
              type="button"
              aria-label="Next month"
              disabled={viewKey >= monthStart(max)}
              onClick={() => setFocusKey(clamp(shiftMonth(focusKey, 1)))}
              className="sx-cal-arrow"
            >
              <svg width="8" height="8" viewBox="0 0 8 8" aria-hidden="true">
                <path d="M2.5 1.5 5 4 2.5 6.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          <div ref={gridRef} role="grid" aria-label={monthName} className="grid grid-cols-7 gap-0.5 text-center">
            {WEEKDAYS.map((d) => (
              <span key={d} role="columnheader" className="py-1 text-[13px] font-bold">
                {d}
              </span>
            ))}
            {monthGrid(viewKey).map((key, i) => {
              if (!key) return <span key={`pad-${i}`} />
              const disabled = key < min || key > max
              const selected = key === value
              return (
                <button
                  key={key}
                  type="button"
                  role="gridcell"
                  data-key={key}
                  tabIndex={key === focusKey ? 0 : -1}
                  disabled={disabled}
                  aria-selected={selected}
                  aria-current={key === today ? 'date' : undefined}
                  aria-label={fromKey(key).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
                  onClick={() => {
                    onChange(key)
                    close()
                  }}
                  className={`sx-cal-day ${selected ? 'is-selected' : ''}`}
                >
                  {fromKey(key).getDate()}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

/* ---------- tabs ---------- */

/** Segmented control: one frosted track, the chosen tab lifts out in pink. */
export function Tabs<T extends string>({
  label,
  items,
  value,
  onChange,
  idPrefix,
}: {
  label: string
  /** `done`: a pick is made here; `todo`: still needs one (multi-court bookings). */
  items: { id: T; label: string; caption?: string; marker?: 'done' | 'todo' }[]
  value: T
  onChange: (id: T) => void
  idPrefix: string
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([])

  const onKeyDown = (e: React.KeyboardEvent, i: number) => {
    const last = items.length - 1
    const next = { ArrowRight: i === last ? 0 : i + 1, ArrowLeft: i === 0 ? last : i - 1, Home: 0, End: last }[e.key]
    if (next === undefined) return
    e.preventDefault()
    onChange(items[next].id)
    refs.current[next]?.focus()
  }

  return (
    <div role="tablist" aria-label={label} className="grid grid-cols-4 gap-sx-sm sm:flex sm:flex-wrap">
      {items.map((item, i) => {
        const selected = item.id === value
        return (
          <button
            key={item.id}
            ref={(el) => {
              refs.current[i] = el
            }}
            type="button"
            role="tab"
            id={`${idPrefix}-tab-${item.id}`}
            aria-controls={`${idPrefix}-panel`}
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(item.id)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={`relative flex min-h-sx-touch flex-col items-center justify-center rounded-sx-field border-2 px-sx-sm py-sx-xs transition sm:min-w-[120px] sm:px-sx-lg ${
              selected
                ? 'border-sx-cta bg-sx-cta text-white'
                : item.marker === 'todo'
                  ? 'border-dashed border-sx-cta-dark bg-sx-surface text-sx-text hover:bg-sx-raised'
                  : 'border-sx-border-strong bg-sx-surface text-sx-text hover:bg-sx-raised'
            }`}
          >
            {item.marker === 'done' && (
              <svg width="16" height="16" viewBox="0 0 20 20" aria-hidden="true" className="absolute -right-1.5 -top-1.5">
                <circle cx="10" cy="10" r="9" fill="var(--sx-color-cta)" stroke="var(--sx-color-white)" strokeWidth="1.5" />
                <path d="m6 10.2 2.6 2.6L14 7.5" fill="none" stroke="var(--sx-color-white)" strokeWidth="2.4" strokeLinecap="round" />
              </svg>
            )}
            <span className="whitespace-nowrap text-sx-body-sm font-bold">
              {item.label}
              {item.marker === 'done' && <span className="sr-only">, picked</span>}
              {item.marker === 'todo' && <span className="sr-only">, still to pick</span>}
            </span>
            {item.caption && <span className="text-[11px] font-medium opacity-80">{item.caption}</span>}
          </button>
        )
      })}
    </div>
  )
}

/* ---------- slot tile ---------- */

export type SlotState = 'default' | 'selected' | 'soldout' | 'past' | 'incart' | 'locked'

const SLOT_STYLES: Record<SlotState, string> = {
  default: 'border-sx-border-strong bg-sx-surface text-sx-text hover:-translate-y-0.5 hover:bg-sx-raised',
  selected: 'border-sx-cta bg-sx-cta text-white',
  soldout: 'cursor-not-allowed border-dashed border-sx-border bg-transparent text-sx-muted opacity-60',
  past: 'cursor-not-allowed border-sx-border bg-sx-raised text-sx-muted',
  incart: 'cursor-not-allowed border-dashed border-sx-cta bg-sx-surface text-white',
  locked: 'cursor-not-allowed border-sx-border bg-sx-surface text-sx-muted opacity-50',
}

const SLOT_STATUS: Record<SlotState, (available: number) => string> = {
  default: (n) => `Available slots: ${n}`,
  selected: () => 'Selected',
  soldout: () => 'Sold out',
  past: () => 'Time passed',
  incart: () => 'In your cart',
  locked: (n) => `Available slots: ${n}`,
}

export function SlotTile({
  time,
  price,
  available,
  state,
  note,
  onToggle,
}: {
  time: string
  price: string
  available: number
  state: SlotState
  /** Small flag above the time, e.g. that the hour is free on every court picked. */
  note?: string
  onToggle: () => void
}) {
  const interactive = state === 'default' || state === 'selected'
  const selected = state === 'selected'
  return (
    <button
      type="button"
      aria-pressed={interactive ? selected : undefined}
      disabled={!interactive}
      onClick={onToggle}
      className={`relative flex flex-col items-center gap-0.5 rounded-sx-field border-2 px-sx-sm py-sx-sm text-center transition ${SLOT_STYLES[state]}`}
    >
      {note && (
        <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-sx-pill bg-sx-cta px-sx-sm text-[10px] font-bold uppercase leading-5 tracking-[0.06em] text-white">
          {note}
        </span>
      )}
      <span className="whitespace-nowrap text-sx-body-sm font-bold tabular-nums">{time}</span>
      <span className="whitespace-nowrap text-sx-caption">{SLOT_STATUS[state](available)}</span>
      <span className={`whitespace-nowrap text-sx-body-sm font-extrabold tabular-nums ${state === 'soldout' ? 'line-through' : ''}`}>
        {price}
      </span>
      {selected && (
        <svg width="16" height="16" viewBox="0 0 20 20" aria-hidden="true" className="absolute right-sx-xs top-sx-xs">
          <circle cx="10" cy="10" r="9" fill="var(--sx-color-cta)" />
          <path d="m6 10.2 2.6 2.6L14 7.5" fill="none" stroke="var(--sx-color-white)" strokeWidth="2.4" strokeLinecap="round" />
        </svg>
      )}
    </button>
  )
}

/* ---------- input ---------- */

export function Input({
  label,
  error,
  hint,
  className = '',
  ...rest
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string; hint?: string }) {
  const id = useId()
  return (
    <div className={`text-left ${className}`}>
      <label htmlFor={id} className="mb-sx-xs block text-sx-caption font-bold uppercase tracking-[0.12em] text-sx-muted">
        {label}
      </label>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error || hint ? `${id}-msg` : undefined}
        className={`h-12 w-full rounded-sx-field border bg-sx-glass px-sx-md text-sx-body-md text-sx-text placeholder:text-sx-muted focus:border-sx-cta-dark focus:bg-sx-glass-strong focus:outline-none ${
          error ? 'border-sx-cta-dark' : 'border-sx-glass-border'
        }`}
        {...rest}
      />
      {(error || hint) && (
        <p id={`${id}-msg`} className={`mt-sx-xs text-sx-caption ${error ? 'text-sx-cta-dark' : 'text-sx-muted'}`}>
          {error ?? hint}
        </p>
      )}
    </div>
  )
}

/* ---------- accordion ---------- */

export function AccordionItem({
  index,
  title,
  summary,
  open,
  disabled,
  onToggle,
  children,
}: {
  index: number
  title: string
  summary?: string
  open: boolean
  disabled?: boolean
  onToggle: () => void
  children: ReactNode
}) {
  const id = useId()
  return (
    <section
      className={`rounded-sx-panel border transition ${
        open ? 'border-sx-cta-dark bg-sx-glass shadow-[var(--sx-shadow-glow)]' : 'border-sx-glass-border bg-sx-glass'
      }`}
    >
      <h2>
        <button
          type="button"
          id={`${id}-h`}
          aria-expanded={open}
          aria-controls={`${id}-p`}
          disabled={disabled}
          onClick={onToggle}
          className="flex min-h-[64px] w-full items-center gap-sx-md px-sx-md text-left disabled:cursor-not-allowed disabled:opacity-50 md:px-sx-lg"
        >
          <span
            className={`grid h-8 w-8 shrink-0 place-items-center rounded-sx-pill text-sx-body-sm font-extrabold ${
              open ? 'text-white' : 'border border-sx-glass-border text-sx-muted'
            }`}
            style={open ? { backgroundImage: 'var(--sx-color-cta-gradient)' } : undefined}
          >
            {index}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sx-body-md font-extrabold uppercase tracking-[0.08em]">{title}</span>
            {summary && !open && <span className="block truncate text-sx-caption text-sx-muted">{summary}</span>}
          </span>
          <svg width="14" height="14" viewBox="0 0 12 12" aria-hidden="true" className={`transition ${open ? 'rotate-180' : ''}`}>
            <path d="M2 4.5 6 8l4-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </h2>
      {open && (
        <div id={`${id}-p`} role="region" aria-labelledby={`${id}-h`} className="border-t border-sx-glass-border p-sx-md md:p-sx-lg">
          {children}
        </div>
      )}
    </section>
  )
}

/* ---------- timer ---------- */

/** Cart hold countdown, drawn as a ring that empties. */
export function Timer({ seconds, total }: { seconds: number; total: number }) {
  const r = 26
  const c = 2 * Math.PI * r
  const label = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`
  return (
    <div className="flex items-center gap-sx-sm" role="timer" aria-label={`Cart held for ${label}`}>
      <div className="relative h-16 w-16">
        <svg viewBox="0 0 64 64" className="h-full w-full -rotate-90" aria-hidden="true">
          <circle cx="32" cy="32" r={r} fill="none" stroke="var(--sx-color-glass-border)" strokeWidth="5" />
          <circle
            cx="32"
            cy="32"
            r={r}
            fill="none"
            stroke="var(--sx-color-cta-on-dark)"
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={c * (1 - seconds / total)}
            className="transition-[stroke-dashoffset] duration-1000 ease-linear"
          />
        </svg>
        <span aria-hidden="true" className="absolute inset-0 grid place-items-center text-sx-caption font-extrabold tabular-nums">
          {label}
        </span>
      </div>
      <span className="text-sx-caption text-sx-muted">
        Slots held
        <br />
        for you
      </span>
    </div>
  )
}

/* ---------- step indicator ---------- */

const STEPS = [
  { label: 'Date and ticket', to: '/semnox' },
  { label: 'Select slots', to: '/semnox/slots' },
  { label: 'Checkout', to: '/semnox/checkout' },
]

/** Soft progress line across the booking; finished steps link back. */
export function StepIndicator({ current }: { current: 1 | 2 | 3 }) {
  return (
    <ol className="flex flex-wrap items-center justify-center gap-x-sx-sm gap-y-sx-xs text-sx-body-sm">
      {STEPS.map((step, i) => {
        const n = i + 1
        const done = n < current
        const active = n === current
        const dot = (
          <span
            className={`grid h-7 w-7 shrink-0 place-items-center rounded-sx-pill text-sx-caption font-extrabold ${
              active ? 'text-white shadow-[var(--sx-shadow-glow)]' : 'border border-sx-glass-border bg-sx-glass'
            }`}
            style={active ? { backgroundImage: 'var(--sx-color-cta-gradient)' } : undefined}
          >
            {done ? (
              <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
                <path d="m2.5 6.2 2.2 2.2L9.5 3.6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            ) : (
              n
            )}
          </span>
        )
        return (
          <Fragment key={step.label}>
            {i > 0 && <li aria-hidden="true" className="h-px w-6 bg-sx-glass-border sm:w-12" />}
            <li aria-current={active ? 'step' : undefined}>
              {done ? (
                <Link
                  to={step.to}
                  className="flex min-h-sx-touch items-center gap-sx-sm rounded-sx-pill px-sx-xs text-sx-muted transition hover:text-sx-text"
                >
                  {dot}
                  <span className="sr-only">Step {n}, done: </span>
                  {step.label}
                </Link>
              ) : (
                <span className={`flex min-h-sx-touch items-center gap-sx-sm px-sx-xs ${active ? 'font-bold text-sx-text' : 'text-sx-muted'}`}>
                  {dot}
                  <span className="sr-only">Step {n}: </span>
                  {step.label}
                </span>
              )}
            </li>
          </Fragment>
        )
      })}
    </ol>
  )
}
