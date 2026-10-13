import type { ComponentProps, ComponentPropsWithoutRef } from 'react';
import { cx } from './cx';

export type HeadingSize = 'display' | 'title' | 'section';

const headingSizes: Record<HeadingSize, string> = {
  display: 'text-3xl sm:text-4xl',
  title: 'text-xl sm:text-2xl',
  section: 'text-base',
};

// Includes `ref` (a plain prop in React 19) so a screen can move focus to its heading.
interface HeadingProps extends ComponentProps<'h1'> {
  level: 1 | 2 | 3;
  size?: HeadingSize;
}

export function Heading({ level, size = 'title', className, ...rest }: HeadingProps) {
  const Tag = `h${level}` as const;
  return (
    <Tag
      className={cx(
        'font-display font-bold tracking-wide text-balance',
        headingSizes[size],
        className,
      )}
      {...rest}
    />
  );
}

interface TextProps extends ComponentPropsWithoutRef<'p'> {
  tone?: 'default' | 'muted';
  size?: 'md' | 'sm';
  as?: 'p' | 'span' | 'div';
}

export function Text({
  tone = 'default',
  size = 'md',
  as: Tag = 'p',
  className,
  ...rest
}: TextProps) {
  return (
    <Tag
      className={cx(
        size === 'sm' ? 'text-sm' : 'text-base',
        tone === 'muted' && 'text-current/75',
        className,
      )}
      {...rest}
    />
  );
}
