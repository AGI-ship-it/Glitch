import { useEffect, useRef } from 'react'

const BRAND = ['#e5199b', '#7b2ff7', '#2e2ed6', '#f5d400', '#ffffff']

type Piece = {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  rot: number
  spin: number
  colour: string
}

/**
 * One-shot confetti burst for the confirmation screen. Canvas rather than DOM nodes
 * so a couple of hundred pieces stay cheap, and it removes itself once every piece
 * has fallen off screen. Skipped entirely under prefers-reduced-motion.
 */
export default function Confetti({ pieces = 160 }: { pieces?: number }) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const w = (canvas.width = window.innerWidth * dpr)
    const h = (canvas.height = window.innerHeight * dpr)
    ctx.scale(dpr, dpr)

    const vw = window.innerWidth
    const vh = window.innerHeight

    // Two angled jets from the lower corners, the way a party popper actually throws.
    const confetti: Piece[] = Array.from({ length: pieces }, (_, i) => {
      const fromLeft = i % 2 === 0
      const spread = (Math.random() - 0.5) * 0.9
      const power = 14 + Math.random() * 12
      return {
        x: fromLeft ? vw * 0.12 : vw * 0.88,
        y: vh * 0.72,
        vx: (fromLeft ? 1 : -1) * (power * 0.55) + spread * 6,
        vy: -power + spread * 3,
        size: 6 + Math.random() * 7,
        rot: Math.random() * Math.PI,
        spin: (Math.random() - 0.5) * 0.3,
        colour: BRAND[Math.floor(Math.random() * BRAND.length)],
      }
    })

    let raf = 0
    const tick = () => {
      ctx.clearRect(0, 0, w, h)
      let alive = false

      for (const p of confetti) {
        p.vy += 0.42 // gravity
        p.vx *= 0.995 // drag
        p.x += p.vx
        p.y += p.vy
        p.rot += p.spin

        if (p.y < vh + 40) alive = true

        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate(p.rot)
        ctx.fillStyle = p.colour
        // Flat rectangles read as paper once they tumble.
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2)
        ctx.restore()
      }

      if (alive) raf = window.requestAnimationFrame(tick)
    }
    raf = window.requestAnimationFrame(tick)

    return () => window.cancelAnimationFrame(raf)
  }, [pieces])

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-50 h-full w-full"
    />
  )
}
