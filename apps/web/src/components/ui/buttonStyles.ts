import { cx } from './cx';

export type ButtonVariant = 'primary' | 'secondary' | 'quiet';
export type ButtonSize = 'md' | 'sm';

const base =
  'inline-flex items-center justify-center gap-2 rounded-control font-display font-bold tracking-wide transition-colors disabled:cursor-not-allowed disabled:opacity-50';

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-on-accent',
  secondary: 'border-2 border-current',
  quiet: 'underline underline-offset-4',
};

// Tailwind only emits classes it can read verbatim, so the button (`:enabled` only) and link
// hover states are spelled out separately rather than derived from one another.
const buttonHover: Record<ButtonVariant, string> = {
  primary: 'enabled:hover:bg-accent-strong enabled:hover:text-surface',
  secondary: 'enabled:hover:bg-accent/20',
  quiet: 'enabled:hover:text-accent-strong',
};

const linkHover: Record<ButtonVariant, string> = {
  primary: 'hover:bg-accent-strong hover:text-surface',
  secondary: 'hover:bg-accent/20',
  quiet: 'hover:text-accent-strong',
};

const sizes: Record<ButtonSize, string> = {
  md: 'px-5 py-2.5 text-sm',
  sm: 'px-3 py-1.5 text-xs',
};

export function buttonClasses(
  variant: ButtonVariant = 'primary',
  size: ButtonSize = 'md',
  className?: string,
): string {
  return cx(base, variants[variant], buttonHover[variant], sizes[size], className);
}

export function buttonLinkClasses(
  variant: ButtonVariant = 'primary',
  size: ButtonSize = 'md',
  className?: string,
): string {
  return cx(base, variants[variant], linkHover[variant], sizes[size], className);
}
