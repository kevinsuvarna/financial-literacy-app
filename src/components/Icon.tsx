const PATHS = {
  check: 'M4 12.5l5 5L20 6.5',
  lock: 'M7 11V8a5 5 0 0 1 10 0v3M5.5 11h13v9.5h-13z',
  pin: 'M12 21v-6M7 4h10M8.5 4l-1.5 8h10l-1.5-8M5.5 12h13',
} as const

export type IconName = keyof typeof PATHS

/** Decorative line icons; meaning is always also given in text. */
export function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  return (
    <svg className="icon" width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path d={PATHS[name]} fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
