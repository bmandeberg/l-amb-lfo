import { useEffect, useRef } from 'react'
import { secondaryColor } from '@/app/globals'

interface LFOScopeProps {
  value: number
}

const width = 310
const height = 40

export default function LFOScope({ value }: LFOScopeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const latest = useRef(value)
  const idxRef = useRef(0)
  const dataRef = useRef<Float32Array>(new Float32Array(width).fill(0))

  latest.current = value // keep newest sample

  useEffect(() => {
    const dpr = window.devicePixelRatio ?? 1
    const cvs = canvasRef.current!
    cvs.width = width * dpr
    cvs.height = height * dpr
    cvs.style.width = `${width}px`
    cvs.style.height = `${height}px`

    const ctx = cvs.getContext('2d')!
    ctx.scale(dpr, dpr)
    ctx.strokeStyle = secondaryColor
    ctx.lineWidth = 1
    ctx.lineJoin = 'round'
    ctx.lineCap = 'round'

    let raf: number
    const loop = () => {
      // 1  write sample into ring-buffer
      const buf = dataRef.current
      let idx = idxRef.current
      buf[idx] = latest.current
      idx = (idx + 1) % width
      idxRef.current = idx

      // 2  clear & redraw
      ctx.clearRect(0, 0, width, height)
      ctx.beginPath()

      const getSample = (x: number) => buf[(idx + x) % width]
      const toY = (v: number) => (1 - v) * (height - 1)

      const win = (i: number) => (getSample(i - 1) + getSample(i) + getSample(i + 1)) / 3

      for (let x = 0; x < width; x++) {
        const y = toY(win(x))
        if (x === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
      }

      ctx.stroke()
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])

  return <canvas ref={canvasRef} style={{ display: 'block' }} aria-label="LFO visualiser" />
}
