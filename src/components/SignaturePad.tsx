import { useRef, useState } from 'react'

/** A dashed box that takes a drawn signature, and says whether anything is in it. */
export default function SignaturePad({ onSign }: { onSign: (signed: boolean) => void }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const drawing = useRef(false)
  const [empty, setEmpty] = useState(true)

  const at = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const c = ref.current!
    const r = c.getBoundingClientRect()
    return { x: ((e.clientX - r.left) / r.width) * c.width, y: ((e.clientY - r.top) / r.height) * c.height }
  }
  const mark = () => {
    if (!empty) return
    setEmpty(false)
    onSign(true)
  }
  const down = (e: React.PointerEvent<HTMLCanvasElement>) => {
    drawing.current = true
    const ctx = ref.current!.getContext('2d')!
    const p = at(e)
    ctx.lineWidth = 2.5
    ctx.lineCap = 'round'
    ctx.strokeStyle = '#1b1b1b'
    ctx.beginPath()
    ctx.moveTo(p.x, p.y)
    ctx.lineTo(p.x + 0.1, p.y)
    ctx.stroke()
    try {
      ref.current!.setPointerCapture(e.pointerId)
    } catch {
      // Pointer capture is a nicety; losing it only means a stroke can run off the box.
    }
    mark()
  }
  const move = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return
    const ctx = ref.current!.getContext('2d')!
    const p = at(e)
    ctx.lineTo(p.x, p.y)
    ctx.stroke()
    mark()
  }
  const up = () => {
    drawing.current = false
  }
  const clear = () => {
    const c = ref.current!
    c.getContext('2d')!.clearRect(0, 0, c.width, c.height)
    setEmpty(true)
    onSign(false)
  }

  return (
    <div>
      <div className="relative rounded-[14px] border-[1.5px] border-dashed border-line-strong bg-white">
        <canvas
          ref={ref}
          width={1120}
          height={280}
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={up}
          onPointerLeave={up}
          className="h-[130px] w-full touch-none"
        />
        {empty && (
          <span className="pointer-events-none absolute inset-0 grid place-items-center text-[15px] text-muted">
            Sign here
          </span>
        )}
      </div>
      {!empty && (
        <button
          type="button"
          onClick={clear}
          className="mt-2 text-[14px] text-muted underline underline-offset-4"
        >
          Clear signature
        </button>
      )}
    </div>
  )
}
