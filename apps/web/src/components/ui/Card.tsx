import type { HTMLAttributes } from 'react';
import { cx } from './cx';

export type CardTone = 'paper' | 'sunken' | 'raised' | 'story';

const tones: Record<CardTone, string> = {
  paper: 'border-line bg-surface text-ink',
  sunken: 'border-line bg-surface-sunken text-ink',
  raised: 'border-on-canvas-muted/40 bg-canvas-raised text-on-canvas',
  story: 'border-gold bg-canvas text-on-canvas',
};

interface CardProps extends HTMLAttributes<HTMLElement> {
  tone?: CardTone;
  as?: 'div' | 'section' | 'article' | 'aside' | 'li';
}

export function Card({ tone = 'paper', as: Tag = 'div', className, ...rest }: CardProps) {
  return <Tag className={cx('rounded-card border p-5', tones[tone], className)} {...rest} />;
}
