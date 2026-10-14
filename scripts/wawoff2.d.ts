declare module 'wawoff2' {
  const wawoff2: {
    /** woff2 font data → TrueType/OpenType font data. */
    decompress(input: Uint8Array): Promise<Uint8Array>
  }
  export default wawoff2
}
