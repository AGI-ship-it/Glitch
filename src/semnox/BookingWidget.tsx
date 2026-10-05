import { aed } from '../mocks/semnox'

/**
 * The Court booking product card, built from the Article.svg design: a split
 * basketball / volleyball photo cut on a pink diagonal, the title, a courts
 * stepper in an inset panel, the line total and Add to cart (our sticker button).
 */

/** The diagonal runs from 56% across the top to 44% across the bottom. */
const LEFT_CUT = 'polygon(0 0, 56% 0, 44% 100%, 0 100%)'
const RIGHT_CUT = 'polygon(56% 0, 100% 0, 100% 100%, 44% 100%)'

function SportPill({ sport, side }: { sport: 'basketball' | 'volleyball'; side: 'left' | 'right' }) {
  return (
    <span
      className={`absolute bottom-[10px] flex h-[24.5px] items-center gap-1.5 rounded-sx-pill bg-[rgba(23,8,56,0.85)] pl-2 pr-3 text-[11px] font-medium uppercase tracking-[0.06em] text-white backdrop-blur ${
        side === 'left' ? 'left-[10px]' : 'right-[10px]'
      }`}
    >
      <img src={`/semnox/icon-${sport}.svg`} alt="" width={16} height={16} />
      {sport}
    </span>
  )
}

export default function BookingWidget({
  unit,
  quantity,
  max,
  onQuantity,
  onAdd,
}: {
  unit: number
  quantity: number
  max: number
  onQuantity: (n: number) => void
  onAdd: () => void
}) {
  const stepBtn =
    'grid h-10 w-10 place-items-center rounded-sx-pill bg-white text-sx-widget-media transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100'

  return (
    <article className="w-full max-w-[360px] rounded-sx-card bg-sx-widget p-sx-sm text-left shadow-[var(--sx-shadow-widget)] backdrop-blur">
      {/* Photo band */}
      <div className="relative h-[clamp(64px,calc(100svh-770px),193.5px)] overflow-hidden rounded-sx-widget-media bg-sx-widget-media">
        <div className="absolute inset-0" style={{ clipPath: LEFT_CUT }}>
          <img src="/semnox/basketball.jpg" alt="A basketball player driving to the hoop" className="h-full w-[56%] object-cover" />
          <SportPill sport="basketball" side="left" />
        </div>
        <div className="absolute inset-0" style={{ clipPath: RIGHT_CUT }}>
          <img
            src="/semnox/volleyball.jpg"
            alt="A volleyball player spiking at the net"
            className="absolute right-0 h-full w-[56%] object-cover"
          />
          <SportPill sport="volleyball" side="right" />
        </div>
        <svg aria-hidden="true" className="absolute inset-0 h-full w-full" viewBox="0 0 344 193.5" preserveAspectRatio="none">
          <line x1="192.64" y1="0" x2="151.36" y2="193.5" stroke="var(--sx-color-hot)" strokeWidth="3.125" />
        </svg>
        <span className="absolute left-1/2 top-[10px] -translate-x-1/2 rounded-sx-pill bg-sx-badge px-sx-sm text-[11px] font-medium uppercase leading-[24.5px] tracking-[0.04em] text-sx-widget-media">
          60 min
        </span>
      </div>

      <div className="px-sx-md pb-sx-sm pt-sx-sm">
        <h2 className="sx-display text-center text-[clamp(22px,2.4vw,26px)] leading-[1.05]">
          Court booking
          <span className="block text-sx-hot">from {aed(unit).replace('.00', '')}</span>
        </h2>
        <p className="mt-sx-xs text-center text-sx-body-sm text-sx-widget-muted">Priced per hour · same rate on every court</p>

        {/* Courts inset */}
        <div className="mt-sx-md rounded-sx-inset bg-sx-widget-inset px-sx-md py-sx-sm ring-1 ring-sx-widget-line">
          <div className="flex items-center justify-between gap-sx-md">
            <p>
              <span id="sx-courts-label" className="block text-sx-body-md text-white">
                How many courts?
              </span>
              <span className="whitespace-nowrap text-sx-body-sm tabular-nums text-sx-widget-muted">{aed(unit)} per hour</span>
            </p>
            <div role="group" aria-labelledby="sx-courts-label" className="flex items-center rounded-sx-pill bg-black/25 p-1">
              <button type="button" aria-label="Fewer courts" disabled={quantity <= 1} onClick={() => onQuantity(quantity - 1)} className={stepBtn}>
                <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
                  <path d="M3.33 8h9.34" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
              <output aria-live="polite" className="w-11 text-center text-sx-h3 font-extrabold tabular-nums">
                {quantity}
              </output>
              <button type="button" aria-label="More courts" disabled={quantity >= max} onClick={() => onQuantity(quantity + 1)} className={stepBtn}>
                <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
                  <path d="M3.33 8h9.34M8 3.33v9.34" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          </div>
          {/* Quantity is courts, not players — the commonest mistake on this step. */}
          <p aria-live="polite" className="mt-sx-sm border-t border-sx-widget-line pt-sx-sm text-sx-caption text-sx-widget-muted">
            {quantity === 1
              ? 'Next, pick as many hours as you like on your court.'
              : `Next, pick as many hours as you like on each of your ${quantity} courts.`}
          </p>
        </div>

        <div className="mt-sx-sm flex items-baseline justify-between px-1">
          <span className="text-sx-body-sm uppercase tracking-[0.06em] text-sx-widget-muted">From, per hour</span>
          <span aria-live="polite" className="text-[24px] font-extrabold tabular-nums leading-none">
            {aed(unit * quantity)}
          </span>
        </div>

        <button type="button" onClick={onAdd} className="sx-btn sx-btn-primary mt-sx-md w-full">
          Add to cart
        </button>
      </div>
    </article>
  )
}
