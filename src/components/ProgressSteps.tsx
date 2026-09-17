/**
 * The three steps between a held slot and a booking reference.
 *
 * Sign and pay are one step because both happen off glitchsports.ae — near.tl
 * takes the signature and CCAvenue takes the card. The bar cannot appear on
 * either of those pages, so it has to name the whole detour once, up front,
 * rather than pretend there are two more of our screens to come.
 */
const STEPS = ['Your slots', 'Your details', 'Waiver', 'Pay'] as const

export type BookingStep = 1 | 2 | 3 | 4

export default function ProgressSteps({
  current,
  /** The reference has been issued — every step reads as done. */
  complete = false,
}: {
  current: BookingStep
  complete?: boolean
}) {
  return (
    /**
     * Full bleed and pinned directly under the 80px header, so the step you are on
     * stays legible while a long cart or a form scrolls past underneath it.
     */
    <nav
      aria-label="Booking progress"
      className="sticky top-20 z-20 border-b border-line bg-white/90 backdrop-blur-md"
    >
      <ol className="shell flex max-w-[864px] items-center gap-2 py-3.5 sm:gap-3">
        {STEPS.map((label, i) => {
          const n = i + 1
          const done = complete || n < current
          const active = !complete && n === current
          return (
            <li key={label} className="flex flex-1 items-center gap-2 last:flex-none sm:gap-3">
              <span className="flex shrink-0 items-center gap-2.5">
                <span
                  aria-hidden="true"
                  className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-[13px] font-bold tabular-nums transition ${
                    done
                      ? 'bg-brand-magenta text-white'
                      : active
                        ? 'bg-ink text-white'
                        : 'bg-wash-strong text-muted'
                  }`}
                >
                  {done ? (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path
                        d="m5 12.5 5 5L19 7"
                        stroke="currentColor"
                        strokeWidth="2.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : (
                    n
                  )}
                </span>
                {/* Only the step you are on is named on a phone — three labels do
                    not fit at 390px without truncating all of them. */}
                <span
                  className={`text-[14px] ${active ? 'font-semibold text-ink' : 'text-muted'} ${
                    active ? '' : 'hidden sm:inline'
                  }`}
                >
                  {label}
                </span>
              </span>
              {n < STEPS.length && (
                <span
                  aria-hidden="true"
                  className={`h-px min-w-4 flex-1 ${done ? 'bg-brand-magenta' : 'bg-line'}`}
                />
              )}
              <span className="sr-only">
                {done ? 'completed' : active ? 'current step' : 'not started'}
              </span>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
