import { COURTS } from '../data/catalog'
import { PATTERN_COOL } from '../lib/pattern'

/**
 * The courts as a row of numbered portrait cards over the brand's striped ground.
 *
 * The stock photography is pre-cropped to the tile's 3:4.6 at two widths — every
 * source was 5–8 megapixels, so the crop is done once at build time rather than
 * asking the browser to download a 6000px landscape and throw most of it away.
 * Each shot is then pushed through a duotone, which is what makes a set shot by
 * different photographers on different grounds read as one thing.
 */
/**
 * Written out in full rather than composed from the court id — a path built at
 * runtime is invisible to any tool that walks the bundle looking for assets, which
 * is how these came out broken when the site was inlined into a single file.
 */
const TILES: Record<string, { jpeg: string; fallback: string }> = {
  'basketball-1': {
    jpeg: '/brand/courts/court-1-440.jpg 440w, /brand/courts/court-1-880.jpg 880w',
    fallback: '/brand/courts/court-1-880.jpg',
  },
  'basketball-2': {
    jpeg: '/brand/courts/court-2-440.jpg 440w, /brand/courts/court-2-880.jpg 880w',
    fallback: '/brand/courts/court-2-880.jpg',
  },
  // Keyed by court id, and the ids still name a sport the courts are no longer tied to.
  'volleyball-1': {
    jpeg: '/brand/courts/court-3-440.jpg 440w, /brand/courts/court-3-880.jpg 880w',
    fallback: '/brand/courts/court-3-880.jpg',
  },
  'volleyball-2': {
    jpeg: '/brand/courts/court-4-440.jpg 440w, /brand/courts/court-4-880.jpg 880w',
    fallback: '/brand/courts/court-4-880.jpg',
  },
}

/** Half the shell at two columns, a quarter at four. */
const TILE_SIZES = '(min-width: 768px) 25vw, 50vw'

function CourtTile({ courtId, index }: { courtId: string; index: number }) {
  const court = COURTS.find((c) => c.id === courtId)!
  const number = String(index + 1).padStart(2, '0')
  const tile = TILES[court.id]

  return (
    <figure className="relative aspect-[3/4] w-full overflow-hidden rounded-[20px] bg-ink">
      {/* Grayscale underneath, colour on top: `mix-blend-color` keeps the
          photograph's luminance and takes only the gradient's hue. */}
      {tile ? (
        <img
          src={tile.fallback}
          srcSet={tile.jpeg}
          sizes={TILE_SIZES}
          alt=""
          loading="lazy"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : null}
      {/* The name sits at the top now, so the wash runs the other way. */}
      <span
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-b from-ink via-ink/45 to-transparent"
      />

      <span className="absolute inset-x-4 top-4 block">
        {/* No sport on the tile — a court is not tied to one, and the section head
            already says every court plays both. */}
        <span className="block text-[19px] font-extrabold uppercase leading-[0.95] tracking-tight text-white sm:text-[24px]">
          Court
          <br />
          {number}
        </span>
      </span>
    </figure>
  )
}

export default function CourtStrip() {
  return (
    <section id="courts" className="relative scroll-mt-[88px] overflow-hidden bg-ink py-12">
      <div aria-hidden="true" className="absolute inset-0" style={{ background: PATTERN_COOL }} />

      <div className="shell relative">
        <div className="mb-8 text-center">
          <p className="text-[12px] font-bold uppercase tracking-[0.18em] text-brand-yellow">Pick your court</p>
          <h2 className="mt-2 text-[32px] font-extrabold uppercase italic leading-[0.9] tracking-tight text-white sm:text-[44px]">
            Four courts, one floor
          </h2>
          <p className="mx-auto mt-3 max-w-[52ch] text-[15px] leading-relaxed text-white/60">
            Four identical courts on Level 3, rigged for the sport you pick. Choose one and
            the slot picker opens ready.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {COURTS.map((court, i) => (
            <CourtTile key={court.id} courtId={court.id} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}
