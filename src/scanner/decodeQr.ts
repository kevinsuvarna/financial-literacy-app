import jsQR from 'jsqr'

/** Reads a QR code from RGBA pixels; null when there isn't one. */
export function decodeQr(rgba: Uint8ClampedArray, width: number, height: number): string | null {
  const code = jsQR(rgba, width, height, { inversionAttempts: 'dontInvert' })
  return code?.data ? code.data : null
}
