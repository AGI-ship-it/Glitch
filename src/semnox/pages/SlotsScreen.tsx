import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { aed, slotLabel, slotsFor, SX_COURTS, type SxSlot } from '../../mocks/semnox'
import { formatDate, SlotTile, Tabs, type SlotState } from '../components'
import { useSemnox, type CartLine } from '../store'

const lineId = (courtId: string, dateKey: string, hour: number) => `${courtId}|${dateKey}|${hour}`
const courtName = (id: string) => SX_COURTS.find((c) => c.id === id)!.name

const GROUPS = [
  { label: 'Daytime', test: (h: number) => h < 17 },
  { label: 'Evening', test: (h: number) => h >= 17, from: 'from 17:00' },
]

export default function SlotsScreen() {
  const { dateKey, quantity, cart, addLines } = useSemnox()
  const navigate = useNavigate()
  const [courtId, setCourtId] = useState(SX_COURTS[0].id)
  const [selected, setSelected] = useState<CartLine[]>([])

  const inCart = new Set(cart.map((l) => l.id))
  const slots = slotsFor(dateKey, courtId)
  // Past hours collapse into one line so the grid opens on the first bookable time.
  const upcoming = slots.filter((s) => !s.past)
  const passedCount = slots.length - upcoming.length
  // Quantity is the number of courts; hours on them are open-ended.
  const usedCourts = [...new Set(selected.map((l) => l.courtId))]
  const atCourtLimit = usedCourts.length >= quantity
  /** Picking here would bring in one court more than was asked for. */
  const courtLocked = atCourtLimit && !usedCourts.includes(courtId)
  const complete = usedCourts.length === quantity
  const multi = quantity > 1
  const subtotal = selected.reduce((a, l) => a + l.price, 0)

  /** An hour right next to one already picked on this court — for building a block. */
  const nextToPick = (hour: number) =>
    selected.some((l) => l.courtId === courtId && Math.abs(l.hour - hour) === 1)

  const stateOf = (slot: SxSlot): SlotState => {
    const id = lineId(courtId, dateKey, slot.hour)
    if (inCart.has(id)) return 'incart'
    if (selected.some((l) => l.id === id)) return 'selected'
    if (slot.past) return 'past'
    if (!slot.available) return 'soldout'
    if (courtLocked) return 'locked'
    return 'default'
  }

  // Any number of hours, on up to `quantity` courts.
  const toggle = (slot: SxSlot) => {
    const id = lineId(courtId, dateKey, slot.hour)
    if (selected.some((l) => l.id === id)) {
      setSelected(selected.filter((l) => l.id !== id))
      return
    }
    if (courtLocked) return
    setSelected([...selected, { id, courtId, dateKey, hour: slot.hour, price: slot.price }])
  }


  const continueShopping = () => {
    addLines(selected)
    navigate('/semnox')
  }
  const checkout = () => {
    if (complete) {
      addLines(selected, false)
      setSelected([])
    }
    navigate('/semnox/checkout')
  }

  const tabs = SX_COURTS.map((c) => ({
    id: c.id,
    label: c.name,
    caption: `${slotsFor(dateKey, c.id).filter((s) => s.available && !s.past).length} free`,
    marker: selected.some((l) => l.courtId === c.id) ? ('done' as const) : undefined,
  }))

  return (
    <section className="mx-auto w-full flex max-w-shell flex-col items-center px-sx-md pb-[calc(var(--sx-bar-h)+var(--sx-space-lg))] pt-sx-lg text-center md:px-sx-xl">
      <h1 className="sx-display text-sx-display-lg">Select slots</h1>
      <span className="sx-stripe mt-sx-md" aria-hidden="true" />

      {/* Semnox's folder tabs: step 1 behind, step 2 in front, joined to the panel. */}
      <div className="mt-sx-lg w-full text-left">
        <ol className="flex gap-sx-xs">
          <li>
            <Link
              to="/semnox"
              className="flex min-h-sx-touch flex-col justify-center rounded-t-sx-field bg-sx-raised px-sx-md py-sx-sm text-sx-muted transition hover:text-sx-text"
            >
              <span className="text-sx-body-md font-bold">Step 1</span>
              <span className="text-sx-caption">Date and ticket</span>
            </Link>
          </li>
          <li aria-current="step" className="flex min-h-sx-touch flex-col justify-center rounded-t-sx-field bg-sx-surface px-sx-md py-sx-sm">
            <span className="text-sx-body-md font-bold text-sx-cta-dark">Step 2</span>
            <span className="text-sx-caption text-sx-text">Select slots</span>
          </li>
        </ol>

        <div className="rounded-b-sx-card rounded-tr-sx-card bg-sx-surface p-sx-md text-sx-text md:p-sx-lg">
          <p className="text-sx-h3 font-extrabold">Visit Date: {formatDate(dateKey)}</p>
          <p className="mt-sx-xs text-sx-body-sm text-sx-muted">
            {multi
              ? `Choose your ${quantity} courts, then pick as many hours as you like on each. Every court suits any game.`
              : 'Choose a court, then pick as many hours as you like. Every court suits any game.'}
          </p>

          <div className="mt-sx-md rounded-sx-field border border-sx-border bg-sx-bg p-sx-md">
            <h2 className="mb-sx-sm text-sx-body-sm font-bold">Select facility:</h2>
            <Tabs label="Courts" items={tabs} value={courtId} onChange={setCourtId} idPrefix="sx-court" />
          </div>

          <div
            role="tabpanel"
            id="sx-court-panel"
            aria-labelledby={`sx-court-tab-${courtId}`}
            className="mt-sx-md rounded-sx-field border border-sx-border bg-sx-bg p-sx-md"
          >
            <h2 className="text-sx-body-sm font-bold">Select schedule:</h2>
            {courtLocked && (
              <p className="mt-sx-xs rounded-sx-field bg-sx-raised px-sx-md py-sx-sm text-sx-caption">
                You chose {quantity} court{quantity > 1 ? 's' : ''} ({usedCourts.map(courtName).join(', ')}). Clear those hours to
                switch to {courtName(courtId)}, or go back to Step 1 to add a court.
              </p>
            )}
            {passedCount > 0 && (
              <p className="mt-sx-xs text-sx-caption text-sx-muted">
                {upcoming.length ? `Earlier times today have passed (${passedCount}).` : 'All times on this day have passed. Pick another date.'}
              </p>
            )}
            {GROUPS.map((g) => {
              const group = upcoming.filter((s) => g.test(s.hour))
              if (!group.length) return null
              return (
                <div key={g.label} className="mt-sx-md">
                  <h3 className="text-sx-caption font-bold uppercase tracking-[0.12em] text-sx-muted">
                    {g.label}
                    <span className="ml-sx-sm font-semibold normal-case tracking-normal text-sx-cta-dark">
                      {g.from ? `${g.from} · ` : ''}
                      {aed(group[0].price)} per hour
                    </span>
                  </h3>
                  <div className="mt-sx-sm grid grid-cols-2 gap-x-sx-sm gap-y-sx-md sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-7">
                    {group.map((slot) => {
                      const state = stateOf(slot)
                      const next = state === 'default' && nextToPick(slot.hour)
                      return (
                        <SlotTile
                          key={slot.hour}
                          time={slotLabel(slot.hour)}
                          price={aed(slot.price)}
                          available={slot.available}
                          state={state}
                          note={next ? 'Next hour free' : undefined}
                          onToggle={() => toggle(slot)}
                        />
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Sticky action bar — Semnox's bottom bar, re-skinned. */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-sx-glass-border bg-sx-bg">
        <div className="mx-auto flex max-w-shell flex-col gap-sx-sm px-sx-md py-sx-md md:flex-row md:items-center md:justify-between md:px-sx-xl">
          <div aria-live="polite" className="min-w-0">
            {selected.length ? (
              <ul className="flex flex-wrap gap-sx-xs">
                {selected.map((l) => (
                  <li
                    key={l.id}
                    className="rounded-sx-pill px-sx-sm py-0.5 text-sx-caption font-bold tabular-nums text-white"
                    style={{ backgroundImage: 'var(--sx-color-cta-gradient)' }}
                  >
                    {courtName(l.courtId)} · {slotLabel(l.hour)}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sx-body-sm font-bold">No slot selected yet</p>
            )}
            {selected.length > 0 && (
              <p className="mt-sx-xs flex flex-wrap items-center gap-x-sx-sm text-sx-caption text-sx-muted">
                <span className="flex gap-1" aria-hidden="true">
                  {Array.from({ length: quantity }, (_, i) => (
                    <span key={i} className={`h-1.5 w-5 rounded-sx-pill ${i < usedCourts.length ? 'bg-sx-cta' : 'bg-sx-border-strong'}`} />
                  ))}
                </span>
                <span className={complete ? 'font-bold text-sx-text' : ''}>
                  {usedCourts.length} of {quantity} court{quantity > 1 ? 's' : ''} · {selected.length} hour
                  {selected.length > 1 ? 's' : ''} · {aed(subtotal)}
                  {!complete && ` — pick hours on ${quantity - usedCourts.length} more court${quantity - usedCourts.length > 1 ? 's' : ''}`}
                </span>
              </p>
            )}
          </div>
          <div className="grid grid-cols-[1.4fr_1fr] gap-sx-sm whitespace-nowrap md:flex md:gap-sx-md">
            <button type="button" disabled={!complete} onClick={continueShopping} className="sx-btn sx-btn-light sx-btn-sm">
              Continue shopping
            </button>
            <button
              type="button"
              disabled={!complete && !(selected.length === 0 && cart.length > 0)}
              onClick={checkout}
              className="sx-btn sx-btn-primary sx-btn-sm"
            >
              Checkout
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
