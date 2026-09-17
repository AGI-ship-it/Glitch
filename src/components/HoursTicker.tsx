import { OPENING_HOURS, clock12 } from '../data/catalog'

/**
 * The opening hours as a running strip, the way the brand sets them on its own
 * artwork: black caps on green, each line separated by the Glitch mark.
 *
 * The list is rendered twice and the track slides exactly half its width, which is
 * what makes the loop seamless — at -50% the second copy sits precisely where the
 * first started. The duplicate is hidden from assistive tech so the hours are
 * announced once rather than twice.
 */
const LINES = OPENING_HOURS.map(
  (h) => `${h.days} — ${clock12(h.open)} to ${clock12(h.close)}`,
)

function Run({ copy }: { copy: number }) {
  return (
    <ul aria-hidden={copy > 0} className="flex shrink-0 items-center">
      {LINES.map((line) => (
        <li key={line} className="flex shrink-0 items-center">
          <span className="whitespace-nowrap px-7 text-[13px] font-bold uppercase tracking-[0.06em] text-ink sm:text-[15px]">
            {line}
          </span>
          <img
            src="/brand/smiley.svg"
            alt=""
            aria-hidden="true"
            width={26}
            height={26}
            className="h-[22px] w-[22px] shrink-0 sm:h-[26px] sm:w-[26px]"
          />
        </li>
      ))}
    </ul>
  )
}

export default function HoursTicker({ className = '' }: { className?: string }) {
  return (
    <section
      aria-label="Opening hours"
      // Brand yellow with ink type, at ~15:1. Green sat outside the deck entirely; of
      // the palette, yellow is the one colour not already spoken for in this fold —
      // magenta belongs to the CTA sitting just above it, and indigo is the ground.
      className={`overflow-hidden bg-brand-yellow py-3 ${className}`}
    >
      {/* w-max so the track is as wide as its content rather than the viewport; without
          it the copies wrap and the slide has nothing to travel across. */}
      <div className="flex w-max animate-ticker motion-reduce:animate-none">
        <Run copy={0} />
        <Run copy={1} />
      </div>
    </section>
  )
}
