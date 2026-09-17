import type { ReactNode } from 'react'

/**
 * The waiver and payment steps happen on third-party sites. The wireframe shows
 * them inside browser chrome so the journey reads honestly: the customer leaves
 * glitchsports.ae twice between checkout and confirmation.
 */
export default function ExternalChrome({
  url,
  note,
  /** A page that supplies its own full-bleed document shell opts out of the reading column. */
  contained = true,
  children,
}: {
  url: string
  note?: string
  contained?: boolean
  children: ReactNode
}) {
  return (
    <div className="min-h-screen bg-wash">
      <div className="border-b border-line-strong bg-white">
        <div className="flex h-[72px] items-center gap-6 px-7">
          <div className="flex gap-2">
            {['#d9d9d9', '#d9d9d9', '#d9d9d9'].map((c, i) => (
              <span key={i} className="h-3 w-3 rounded-full" style={{ background: c }} />
            ))}
          </div>
          <div className="flex h-[34px] flex-1 items-center rounded-lg bg-wash px-4 text-[14px] text-muted">
            🔒 {url}
          </div>
        </div>
      </div>

      <div className="border-b border-line bg-wash-strong/60">
        <p className="px-7 py-4 text-center text-[14px] text-ink-soft">
          You have left glitchsports.ae. This step is completed on a third-party site.
        </p>
      </div>

      {contained ? (
        <div className="mx-auto w-full max-w-[720px] px-6 py-12">{children}</div>
      ) : (
        children
      )}

      <div className="pb-10 text-center text-[13px] text-muted">
        <p>Prototype — this stands in for the third-party page. Nothing is sent or stored.</p>
        {note && <p className="mt-1.5">{note}</p>}
      </div>
    </div>
  )
}
