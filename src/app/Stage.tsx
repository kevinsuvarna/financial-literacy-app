import { useLayoutEffect, useState, type ReactNode } from 'react'
import { SvgDefs } from '../components/art/SvgDefs'
import { CANVAS, ScaleContext } from './stageScale'

function fitScale(): number {
  return Math.min(window.innerWidth / CANVAS.width, window.innerHeight / CANVAS.height)
}

/** Scales the canvas proportionally and letterboxes it with the background colour. */
export function Stage({ children }: { children: ReactNode }) {
  const [scale, setScale] = useState(fitScale)

  useLayoutEffect(() => {
    const fit = () => setScale(fitScale())
    window.addEventListener('resize', fit)
    return () => window.removeEventListener('resize', fit)
  }, [])

  return (
    <div className="stage-viewport">
      <div className="stage" style={{ transform: `translate(-50%, -50%) scale(${scale})` }}>
        <SvgDefs />
        <ScaleContext value={scale}>{children}</ScaleContext>
      </div>
    </div>
  )
}
