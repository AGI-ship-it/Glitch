/**
 * A horizontal stepper: the whole journey named across the top, one panel of
 * content beneath it. Steps already completed are clickable, so going back is a
 * tap on the step rather than a hunt for a Change link.
 */
export default function Stepper({
  steps,
  current,
  onSelect,
  compact = false,
}: {
  steps: { n: 1 | 2 | 3 | 4; title: string; done: boolean }[]
  current: number
  onSelect: (n: 1 | 2 | 3 | 4) => void
  compact?: boolean
}) {
  return (
    <nav aria-label="Booking steps" className="border-b border-line bg-wash px-4 py-3.5 sm:px-5">
      <ol className="flex items-center gap-1.5 sm:gap-2">
        {steps.map((s, i) => {
          const active = s.n === current
          const reached = s.done || active
          const clickable = s.done && !active
          return (
            <li key={s.n} className="flex flex-1 items-center gap-1.5 last:flex-none sm:gap-2">
              <button
                type="button"
                onClick={() => clickable && onSelect(s.n)}
                disabled={!clickable}
                aria-current={active ? 'step' : undefined}
                className={`flex shrink-0 items-center gap-2 rounded-full py-1 pl-1 pr-1 transition sm:pr-3 ${
                  clickable ? 'hover:bg-wash-strong' : 'cursor-default'
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-[12px] font-bold tabular-nums transition-colors ${
                    s.done
                      ? 'bg-brand-green text-white'
                      : reached
                        ? 'bg-ink text-white'
                        : 'bg-wash-strong text-muted'
                  }`}
                >
                  {s.done ? (
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path
                        d="m5 12.5 5 5L19 7"
                        stroke="currentColor"
                        strokeWidth="2.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : (
                    s.n
                  )}
                </span>
                {/* Three or four labels will not sit side by side on a phone or in
                    the header panel, so only the live one is named there. */}
                <span
                  className={`whitespace-nowrap text-[13px] ${
                    active ? 'font-semibold text-ink' : 'text-muted'
                  } ${active ? '' : compact ? 'hidden' : 'hidden md:inline'}`}
                >
                  {s.title}
                </span>
              </button>
              {i < steps.length - 1 && (
                <span
                  aria-hidden="true"
                  className={`h-px min-w-3 flex-1 transition-colors ${
                    s.done ? 'bg-brand-green' : 'bg-line-strong'
                  }`}
                />
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
