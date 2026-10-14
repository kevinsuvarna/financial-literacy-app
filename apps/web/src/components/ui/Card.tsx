import type { HTMLAttributes, Ref } from 'react';
import { cx } from './cx';

export type CardTone = 'paper' | 'sunken' | 'raised' | 'story' | 'success';

const tones: Record<CardTone, string> = {
  paper: 'border-line bg-surface text-ink',
  sunken: 'border-line bg-surface-sunken text-ink',
  raised: 'border-on-canvas-muted/40 bg-canvas-raised text-on-canvas',
  story: 'border-gold bg-canvas text-on-canvas',
  success: 'border-success bg-success-soft text-ink',
};

interface CardProps extends HTMLAttributes<HTMLElement> {
  // A plain prop in React 19 — for a screen that needs to measure or read the card's styles.
  ref?: Ref<HTMLDivElement>;
  tone?: CardTone;
  as?: 'div' | 'section' | 'article' | 'aside' | 'li';
}

export function Card({ tone = 'paper', as: Tag = 'div', className, ref, ...rest }: CardProps) {
  return (
    <Tag
      // Every tag this can be is an HTMLElement; the ref is typed for the default, a div.
      ref={ref as Ref<never>}
      className={cx('rounded-card border p-5', tones[tone], className)}
      {...rest}
    />
  );
}
