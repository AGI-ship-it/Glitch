/**
 * The brand's stepped-stripe pattern, rebuilt in CSS.
 *
 * A colour ramp with a run of slanted bars across it. Built rather than shipped as
 * artwork: resolution-independent, no request, and the ramp can be re-coloured per
 * section without a new file.
 */

/**
 * The bars are *stepped*, which is the part a `repeating-linear-gradient` cannot do
 * and which this file used to be missing: they run in horizontal rows, and each row
 * sits a little right of the one below, so a diagonal climbs as a staircase instead
 * of an unbroken straight line. Drawn once as an SVG tile and repeated.
 */
const BAR = {
  /** Distance from one bar to the next inside a row. */
  period: 54,
  /** The bar itself, measured horizontally. */
  width: 20,
  /** Height of a single row of bars. */
  row: 84,
  /** How far a bar leans right over its own height. */
  lean: 14,
  /**
   * How far each row sits right of the one below — the step in the staircase.
   * Must divide `period`, or the tile will not line up with its own repeat.
   */
  step: 18,
  /** Translucent slate: it darkens and desaturates the ramp rather than tinting it. */
  ink: 'rgba(22,24,36,0.32)',
}

/** Rows per tile — enough for the step to come back into phase with the period. */
const ROWS = BAR.period / BAR.step

function steppedBars(fill: string = BAR.ink) {
  const height = BAR.row * ROWS
  const bars: string[] = []

  for (let r = 0; r < ROWS; r++) {
    const top = r * BAR.row
    const bottom = top + BAR.row
    // Lower rows sit further left, so the staircase climbs towards the right.
    const shift = (ROWS - 1 - r) * BAR.step
    // One period either side, so a bar leaning over the tile edge still lands.
    for (let k = -1; k <= 1; k++) {
      const x = shift + k * BAR.period
      bars.push(`<path d='M${x} ${bottom}h${BAR.width}l${BAR.lean} -${BAR.row}h-${BAR.width}z'/>`)
    }
  }

  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' width='${BAR.period}' height='${height}' ` +
    `viewBox='0 0 ${BAR.period} ${height}'><g fill='${fill}'>${bars.join('')}</g></svg>`

  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`
}

const BARS = steppedBars()

/** Green through blue into magenta — the cool half of the identity. */
export const PATTERN_COOL = `${BARS}, linear-gradient(103deg, #0a2f22 0%, #14329c 34%, #2036d8 58%, #b8188f 88%, #e5199b 100%)`

/** Green through magenta into orange — the hot half, for a campaign surface. */
export const PATTERN_HOT = `${BARS}, linear-gradient(103deg, #0d2c12 0%, #8c0f5a 30%, #e5199b 62%, #f0722a 88%, #f5a02a 100%)`

/**
 * Brand colour sprinkled across a white run: a scatter of small soft dabs rather than
 * one large wash, so the page reads as flecked with the identity's colours instead of
 * tinted by them. Positions are hand-placed rather than random — the run has to look
 * the same on every render, and an even spread reads as wallpaper.
 *
 * `x` and `y` are percentages of the run, but the size is in px on purpose: the run
 * behind this is several screens tall, and a percentage-sized dab stretches into a
 * band instead of staying a fleck.
 */
const SPRINKLE: [x: number, y: number, size: number, rgb: string, alpha: number][] = [
  [7, 2, 300, '46,46,214', 0.2],
  [92, 5, 240, '229,25,155', 0.18],
  [46, 9, 150, '123,47,247', 0.14],
  [18, 14, 190, '229,25,155', 0.13],
  // Yellow runs at a higher alpha than the rest throughout: it is the lightest colour
  // on the deck, so on a white ground it needs roughly double to register at all.
  [74, 17, 150, '245,212,0', 0.34],
  [3, 22, 220, '32,54,216', 0.16],
  [60, 26, 170, '46,46,214', 0.13],
  [88, 31, 260, '123,47,247', 0.15],
  [30, 35, 140, '229,25,155', 0.14],
  [10, 39, 160, '245,212,0', 0.3],
  [12, 42, 200, '123,47,247', 0.12],
  [68, 46, 150, '32,54,216', 0.14],
  [95, 52, 190, '229,25,155', 0.16],
  [40, 57, 150, '245,212,0', 0.32],
  [5, 63, 240, '46,46,214', 0.15],
  [78, 68, 160, '229,25,155', 0.14],
  [86, 71, 140, '245,212,0', 0.28],
  [24, 74, 180, '32,54,216', 0.13],
  [58, 79, 140, '123,47,247', 0.14],
  [90, 85, 250, '229,25,155', 0.18],
  [32, 88, 150, '245,212,0', 0.3],
  [14, 90, 170, '46,46,214', 0.14],
  [48, 96, 200, '229,25,155', 0.16],
]

export const PATTERN_SPRINKLE = SPRINKLE.map(
  ([x, y, size, rgb, alpha]) =>
    `radial-gradient(${size}px ${size}px at ${x}% ${y}%, rgba(${rgb},${alpha}) 0%, rgba(${rgb},0) 70%)`,
).join(',')

/**
 * The hero's left-hand scrim, in deep blue rather than ink — the fold reads as brand
 * colour receding off the left edge instead of a black panel over the artwork.
 *
 * #121254 is the deck indigo (#2e2ed6) held at its own hue and dropped to a 20%
 * lightness, so the left of the fold stays in the family of the cool ramp it sits
 * over. The yellow display type clears 11:1 on it. It lives here rather than in
 * tailwind.config.js because only these two gradients use it, and a second copy of
 * the hex is a second thing to keep in step.
 *
 * Written as a gradient string rather than Tailwind `via-26% to-46%` utilities on
 * purpose: Tailwind emits `from-<n>%` but silently drops `via-<n>%` and `to-<n>%`,
 * so the authored stops never reached the stylesheet and every scrim fell back to
 * 50%/100%. Explicit stops here cannot be dropped.
 */
export const HERO_SCRIM =
  'linear-gradient(90deg, #121254 0%, rgba(18,18,84,0.72) 26%, rgba(18,18,84,0) 46%)'

/** The same scrim at a lighter touch, for a slide that supplies its own bright ground. */
export const HERO_SCRIM_SOFT =
  'linear-gradient(90deg, rgba(18,18,84,0.7) 0%, rgba(18,18,84,0.25) 24%, rgba(18,18,84,0) 44%)'
