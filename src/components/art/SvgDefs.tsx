/**
 * Shared SVG filters, mounted once on the canvas.
 * `rough-edge` gives outlines the hand-cut, distressed look of the mockups.
 */
export function SvgDefs() {
  return (
    <svg className="svg-defs" width="0" height="0" aria-hidden="true" focusable="false">
      <filter id="rough-edge" x="-3%" y="-3%" width="106%" height="106%">
        <feTurbulence type="fractalNoise" baseFrequency="0.09" numOctaves="2" seed="7" result="noise" />
        <feDisplacementMap in="SourceGraphic" in2="noise" scale="4.5" xChannelSelector="R" yChannelSelector="G" />
      </filter>
      <filter id="rough-edge-soft" x="-3%" y="-3%" width="106%" height="106%">
        <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="2" seed="3" result="noise" />
        <feDisplacementMap in="SourceGraphic" in2="noise" scale="3" xChannelSelector="R" yChannelSelector="G" />
      </filter>
      <filter id="rough-edge-strong" x="-4%" y="-6%" width="108%" height="112%">
        <feTurbulence type="fractalNoise" baseFrequency="0.07" numOctaves="3" seed="11" result="noise" />
        <feDisplacementMap in="SourceGraphic" in2="noise" scale="9" xChannelSelector="R" yChannelSelector="G" />
      </filter>
    </svg>
  )
}
