import { useEffect, useRef, type ReactNode } from 'react'

/**
 * One numbered section of a vertical accordion.
 *
 * Only the live step is open. The ones behind it collapse to the answer they
 * captured, with a way back in; the ones ahead stay shut and dimmed. The booking
 * then reads as a short list of decisions rather than one long form.
 *
 * The body stays mounted while collapsed — a half-typed form must survive a trip
 * back to step one — so it is closed by animating the grid row to nothing and
 * marked `inert` rather than unmounted, which keeps the hidden fields out of the
 * tab order and away from a screen reader.
 */
export default function StepSection({
  n,
  title,
  open,
  done,
  summary,
  onEdit,
  alwaysOpen = false,
  children,
}: {
  n: number
  title: string
  open: boolean
  done: boolean
  summary?: ReactNode
  onEdit?: () => void
  /** Lay every step out at once instead of collapsing the ones you are not on. */
  alwaysOpen?: boolean
  children: ReactNode
}) {
  const shown = open || alwaysOpen
  const ahead = !open && !done
  const ref = useRef<HTMLElement>(null)
  const was = useRef(open)

  // Bring a step that has just opened into view, but only when it is actually
  // off-screen — `nearest` leaves a section that already fits exactly where it is,
  // which is what stops the page lurching on every advance.
  useEffect(() => {
    if (open && !alwaysOpen && !was.current && ref.current) {
      const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ref.current.scrollIntoView({ behavior: calm ? 'auto' : 'smooth', block: 'nearest' })
    }
    was.current = open
  }, [open, alwaysOpen])

  return (
    <section
      ref={ref}
      aria-current={open ? 'step' : undefined}
      className={`card overflow-hidden p-0 transition-opacity duration-300 ${
        ahead ? 'opacity-55' : 'opacity-100'
      }`}
    >
      <div className="flex items-center gap-4 px-5 py-4">
        <span
          aria-hidden="true"
          className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-[13px] font-bold tabular-nums transition-colors duration-300 ${
            done
              ? 'bg-brand-green text-white'
              : open
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
        <h3 className={`flex-1 text-[18px] transition-all ${open ? 'font-bold' : 'font-semibold'}`}>
          {title}
        </h3>
        {done && onEdit && !alwaysOpen && (
          <button
            type="button"
            onClick={onEdit}
            className="text-[14px] font-semibold text-muted underline-offset-4 transition hover:text-ink hover:underline"
          >
            Change
          </button>
        )}
      </div>

      {/* Both the collapsed answer and the open body animate on the same grid
          trick, so one closing and the next opening read as a single movement
          rather than two jumps. */}
      <div
        className={`grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none ${
          !shown && summary ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        }`}
      >
        <div className="overflow-hidden">
          <p
            aria-hidden={shown || !summary}
            className="px-5 pb-4 pl-[64px] text-[15px] text-muted"
          >
            {summary}
          </p>
        </div>
      </div>

      <div
        className={`grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none ${
          shown ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        }`}
      >
        <div className="overflow-hidden">
          <div
            inert={!shown}
            aria-hidden={!shown}
            className={`border-t border-line px-5 py-5 transition-opacity duration-200 ${
              shown ? 'opacity-100 delay-100' : 'opacity-0'
            }`}
          >
            {children}
          </div>
        </div>
      </div>
    </section>
  )
}
