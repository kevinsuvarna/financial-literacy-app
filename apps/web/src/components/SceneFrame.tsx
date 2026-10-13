import type { ReactNode } from 'react';
import { copy, type SceneType } from '@app/content';
import { Badge, Card, type CardTone } from './ui';

const sceneTones: Record<SceneType, CardTone> = {
  call: 'raised',
  table: 'paper',
  screen: 'paper',
  cinematic: 'story',
};

interface SceneFrameProps {
  scene: SceneType;
  children: ReactNode;
  /** Decoration laid over the whole frame (it must not take pointer events). */
  overlay?: ReactNode;
}

/** The visual frame for one of the four scene types (CLAUDE.md rule 4). */
export function SceneFrame({ scene, children, overlay }: SceneFrameProps) {
  return (
    <Card
      as="section"
      tone={sceneTones[scene]}
      data-scene={scene}
      aria-label={copy.scenes[scene]}
      className="relative flex flex-col gap-5"
    >
      <Badge tone="gold" className="self-start">
        {copy.scenes[scene]}
      </Badge>
      {children}
      {overlay}
    </Card>
  );
}
