import type { ReactNode } from 'react';
import { copy, type SceneType } from '@app/content';
import { Badge, Card, type CardTone } from './ui';

const sceneTones: Record<SceneType, CardTone> = {
  call: 'raised',
  table: 'paper',
  screen: 'paper',
  cinematic: 'story',
};

/** The visual frame for one of the four scene types (CLAUDE.md rule 4). */
export function SceneFrame({ scene, children }: { scene: SceneType; children: ReactNode }) {
  return (
    <Card
      as="section"
      tone={sceneTones[scene]}
      data-scene={scene}
      aria-label={copy.scenes[scene]}
      className="flex flex-col gap-5"
    >
      <Badge tone="gold" className="self-start">
        {copy.scenes[scene]}
      </Badge>
      {children}
    </Card>
  );
}
