import { formatCountdown, useStore } from '../store/StoreProvider'

export default function HoldTimer({
  title,
  sub,
  size = 'lg',
}: {
  title: string
  sub: string
  size?: 'lg' | 'sm'
}) {
  const { secondsLeft } = useStore()
  const dim = size === 'lg' ? 'h-[76px] w-[76px] text-[20px]' : 'h-16 w-16 text-[17px]'
  const low = secondsLeft > 0 && secondsLeft < 120
  return (
    <div className="flex items-center gap-6">
      <div
        className={`grid shrink-0 place-items-center rounded-full border-2 font-bold tabular-nums ${dim} ${
          low ? 'border-ink bg-ink text-white' : 'border-line-strong'
        }`}
        aria-live="polite"
      >
        {formatCountdown(secondsLeft)}
      </div>
      <div>
        <p className="text-[17px] font-semibold">{title}</p>
        <p className="mt-1 text-[14px] text-muted">{sub}</p>
      </div>
    </div>
  )
}
