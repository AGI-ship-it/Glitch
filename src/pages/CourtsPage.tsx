import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { COURTS, SPORTS, VENUE, type SportId } from '../data/catalog'
import { aed, formatShortDate, freeCount, priceFor, slotsFor, todayKey } from '../lib/booking'
import { Checkbox, PageHeading, Photo } from '../components/ui'

const TIME_BANDS = [
  { id: 'morning', label: 'Morning', range: '10:00 – 13:00', from: 10, to: 13 },
  { id: 'afternoon', label: 'Afternoon', range: '13:00 – 17:00', from: 13, to: 17 },
  { id: 'evening', label: 'Evening', range: '17:00 – 23:00', from: 17, to: 24 },
]

type Sort = 'price-asc' | 'price-desc' | 'availability'

export default function CourtsPage() {
  const today = todayKey()
  const [sports, setSports] = useState<SportId[]>(['basketball', 'volleyball'])
  const [dateKey, setDateKey] = useState(today)
  const [bands, setBands] = useState<string[]>([])
  const [maxPrice, setMaxPrice] = useState(160)
  const [indoorOnly, setIndoorOnly] = useState(false)
  const [availableNow, setAvailableNow] = useState(false)
  const [sort, setSort] = useState<Sort>('price-asc')

  const toggle = <T,>(list: T[], value: T, set: (next: T[]) => void) =>
    set(list.includes(value) ? list.filter((v) => v !== value) : [...list, value])

  const clearAll = () => {
    setSports(['basketball', 'volleyball'])
    setBands([])
    setMaxPrice(160)
    setIndoorOnly(false)
    setAvailableNow(false)
    setDateKey(today)
  }

  const rows = useMemo(() => {
    const activeBands = bands.length ? TIME_BANDS.filter((b) => bands.includes(b.id)) : TIME_BANDS
    return COURTS.filter((court) => {
      if (!sports.includes(court.sport)) return false
      if (indoorOnly && !court.indoor) return false
      if (court.offPeak > maxPrice) return false
      const inBand = slotsFor(court, dateKey).filter(
        (s) => s.available && activeBands.some((b) => s.hour >= b.from && s.hour < b.to) && s.price <= maxPrice,
      )
      if (bands.length && inBand.length === 0) return false
      if (availableNow && inBand.length === 0) return false
      return true
    })
      .map((court) => ({ court, free: freeCount(court, dateKey) }))
      .sort((a, b) => {
        if (sort === 'availability') return b.free - a.free
        const pa = priceFor(a.court, dateKey, 10)
        const pb = priceFor(b.court, dateKey, 10)
        return sort === 'price-asc' ? pa - pb : pb - pa
      })
  }, [sports, dateKey, bands, maxPrice, indoorOnly, availableNow, sort])

  const chips = [
    ...sports.map((s) => ({ id: `sport-${s}`, label: SPORTS.find((x) => x.id === s)!.name, clear: () => toggle(sports, s, setSports) })),
    ...bands.map((b) => ({ id: `band-${b}`, label: TIME_BANDS.find((x) => x.id === b)!.label, clear: () => toggle(bands, b, setBands) })),
    ...(indoorOnly ? [{ id: 'indoor', label: 'Indoor', clear: () => setIndoorOnly(false) }] : []),
    ...(availableNow ? [{ id: 'now', label: 'Available now', clear: () => setAvailableNow(false) }] : []),
  ]

  return (
    <div className="shell pb-16">
      <PageHeading
        title="Sports and courts"
        intro={`${VENUE.address} · ${VENUE.courtCount} courts`}
      />

      <div className="mt-10 grid gap-8 lg:grid-cols-[300px_1fr]">
        <aside className="card h-fit p-6">
          <div className="flex items-baseline justify-between">
            <h2 className="text-[19px] font-bold">Filters</h2>
            <button type="button" onClick={clearAll} className="text-[14px] text-muted hover:underline">
              Clear all
            </button>
          </div>

          <fieldset className="mt-6">
            <legend className="label">Sport</legend>
            {SPORTS.map((s) => {
              const count = COURTS.filter((c) => c.sport === s.id).length
              return (
                <div key={s.id} className="py-2">
                  <Checkbox
                    align="center"
                    checked={sports.includes(s.id)}
                    onChange={() => toggle(sports, s.id, setSports)}
                  >
                    <span className="flex items-center justify-between gap-3">
                      <span>{s.name}</span>
                      <span className="text-[14px] text-muted">{count}</span>
                    </span>
                  </Checkbox>
                </div>
              )
            })}
          </fieldset>

          <div className="mt-6">
            <label className="label" htmlFor="filter-date">
              Date
            </label>
            <input
              id="filter-date"
              type="date"
              value={dateKey}
              min={today}
              onChange={(e) => setDateKey(e.target.value || today)}
              className="field h-12"
            />
          </div>

          <fieldset className="mt-6">
            <legend className="label">Time of day</legend>
            <div className="space-y-2">
              {TIME_BANDS.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => toggle(bands, b.id, setBands)}
                  aria-pressed={bands.includes(b.id)}
                  className={`flex w-full items-center justify-between rounded-lg border px-4 py-2.5 text-[15px] transition ${
                    bands.includes(b.id) ? 'border-ink bg-ink text-white' : 'border-line-strong hover:border-ink'
                  }`}
                >
                  <span>{b.label}</span>
                  <span className={bands.includes(b.id) ? 'text-white/70' : 'text-muted'}>{b.range}</span>
                </button>
              ))}
            </div>
          </fieldset>

          <div className="mt-6">
            <label className="label" htmlFor="filter-price">
              Price per hour
            </label>
            <input
              id="filter-price"
              type="range"
              min={80}
              max={160}
              step={10}
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-full accent-ink"
            />
            <div className="mt-1 flex justify-between text-[14px] text-muted">
              <span>AED 80</span>
              <span>up to {aed(maxPrice)}</span>
            </div>
          </div>

          <fieldset className="mt-6">
            <legend className="label">Court type</legend>
            <div className="flex gap-3">
              {[
                { label: 'Indoor', active: indoorOnly, set: () => setIndoorOnly(true) },
                { label: 'Outdoor', active: false, set: () => setIndoorOnly(false) },
              ].map((opt) => (
                <button
                  key={opt.label}
                  type="button"
                  onClick={opt.set}
                  aria-pressed={opt.active}
                  className={`flex-1 rounded-lg border px-4 py-2.5 text-[15px] ${
                    opt.active ? 'border-ink bg-ink text-white' : 'border-line-strong hover:border-ink'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {!indoorOnly && (
              <p className="mt-2 text-[13px] text-muted">All four courts are indoor, on Level 3.</p>
            )}
          </fieldset>

          <label className="mt-6 flex cursor-pointer items-center justify-between">
            <span className="text-[15px] font-medium">Available now</span>
            <span
              className={`relative h-8 w-16 rounded-full transition ${availableNow ? 'bg-ink' : 'bg-wash-strong'}`}
            >
              <input
                type="checkbox"
                checked={availableNow}
                onChange={(e) => setAvailableNow(e.target.checked)}
                className="sr-only"
              />
              <span
                className={`absolute top-1 h-6 w-6 rounded-full bg-white transition-all ${
                  availableNow ? 'left-9' : 'left-1'
                }`}
              />
            </span>
          </label>
        </aside>

        <section>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-[24px] font-bold">
              {rows.length} court{rows.length === 1 ? '' : 's'} · {formatShortDate(dateKey)}
            </h2>
            <label className="flex items-center gap-2 text-[14px] text-muted">
              Sort
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as Sort)}
                className="rounded-lg border border-line-strong px-3 py-2 text-[14px] text-ink"
              >
                <option value="price-asc">Price, low first</option>
                <option value="price-desc">Price, high first</option>
                <option value="availability">Most availability</option>
              </select>
            </label>
          </div>

          {chips.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-3">
              {chips.map((c) => (
                <button key={c.id} type="button" onClick={c.clear} className="chip hover:border-ink">
                  {c.label} <span aria-hidden="true">×</span>
                </button>
              ))}
            </div>
          )}

          <div className="mt-6 space-y-4">
            {rows.map(({ court, free }, i) => (
              <article key={court.id} className="card flex flex-col gap-5 p-4 md:flex-row md:items-center">
                <div className="md:w-[220px] md:shrink-0">
                  <Photo label={court.name} src={court.image} seed={i} />
                </div>
                <div className="flex-1">
                  <h3 className="text-[20px] font-bold">{court.name}</h3>
                  <p className="mt-1 text-[15px] text-muted">
                    {court.indoor ? 'Indoor' : 'Outdoor'} · {court.level} · up to {court.capacity} players
                  </p>
                  <p className="mt-1 text-[14px] text-muted">{court.amenities}</p>
                  <p className="mt-3 text-[15px] font-semibold">
                    {free > 0 ? `${free} slots free` : 'Fully booked'}
                  </p>
                </div>
                <div className="md:w-[220px] md:text-right">
                  <p className="text-[22px] font-bold">From {aed(priceFor(court, dateKey, 10))}</p>
                  <p className="text-[14px] text-muted">per hour</p>
                  <Link
                    to={`/book/${court.id}?date=${dateKey}`}
                    className="btn btn-md btn-outline mt-4 w-full md:w-[200px]"
                  >
                    Book now
                  </Link>
                </div>
              </article>
            ))}

            {rows.length === 0 && (
              <div className="card p-10 text-center">
                <p className="text-[19px] font-semibold">No courts match those filters</p>
                <p className="mt-2 text-[15px] text-muted">
                  Try a different date, widen the price range, or clear the time of day.
                </p>
                <button type="button" onClick={clearAll} className="btn btn-md btn-outline mt-6">
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
