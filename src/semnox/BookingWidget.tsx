import { aed } from '../mocks/semnox'

/**
 * The Court booking product card, built from the Article.svg design: the
 * game.svg photo band, the title, a courts
 * stepper in an inset panel, the line total and Add to cart (our sticker button).
 * Fixed at the design's 360px width; on short screens the page scrolls rather than squeezing it.
 */

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
      {/* Photo band — the design's own artwork (basketball / volleyball split). */}
      <img
        src="/semnox/game.svg"
        alt="Basketball and volleyball — every court suits either game"
        width={344}
        height={276}
        className="block h-auto w-full rounded-sx-widget-media"
      />

      <div className="px-sx-sm pb-sx-sm pt-sx-md sm:px-sx-md">
        <h2 className="sx-display text-center text-[22px] leading-[1.05] sm:text-[26px]">
          Court booking
          <span className="block text-sx-hot">from {aed(unit).replace('.00', '')}</span>
        </h2>
        <p className="mt-sx-xs text-center text-sx-body-sm text-sx-widget-muted">Priced per hour · same rate on every court</p>

        {/* Courts inset */}
        <div className="mt-sx-md rounded-sx-inset bg-sx-widget-inset px-sx-sm py-sx-sm ring-1 ring-sx-widget-line sm:px-sx-md">
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

        <div className="mt-sx-md flex items-baseline justify-between px-1">
          <span className="text-sx-body-sm uppercase tracking-[0.06em] text-sx-widget-muted">From, per hour</span>
          <span aria-live="polite" className="text-[22px] font-extrabold tabular-nums leading-none sm:text-[26px]">
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
