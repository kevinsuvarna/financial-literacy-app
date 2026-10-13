import { cx } from './cx';

/**
 * A chunky highlighter, tip to the left. Purely a picture — whatever drags it, and whatever
 * the keyboard does instead, belongs to the task using it.
 */
export function HighlighterPen({ label, lifted = false }: { label: string; lifted?: boolean }) {
  return (
    <div
      className={cx(
        'flex h-11 w-44 items-stretch transition-[filter]',
        lifted ? 'drop-shadow-xl' : 'drop-shadow-md',
      )}
    >
      <span className="h-5 w-5 self-center rounded-l-sm border-2 border-r-0 border-ink bg-highlighter" />
      <span className="w-3 bg-ink" />
      <span className="flex flex-1 items-center justify-center rounded-r-xl border-2 border-ink bg-highlighter font-display text-xs font-bold tracking-widest text-ink">
        {label}
      </span>
    </div>
  );
}
