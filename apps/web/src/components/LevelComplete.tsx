import { useEffect, useRef } from 'react';
import { copy, type Level } from '@app/content';
import { playSound } from '../audio/sounds';
import { useGame } from '../game';
import { getTaskPosition } from '../game/selectors';
import { Button, ButtonLink, Card, FadeIn, Heading, Stamp, Text } from './ui';

interface LevelCompleteProps {
  level: Level;
  levelNumber: number;
  /** The first task of the next level — already unlocked by the solve that got us here. */
  nextTaskId: string;
}

/**
 * The beat between levels. Purely a transition: the level was completed by the game machine
 * when its last task was solved, so reloading here loses nothing.
 */
export function LevelComplete({ level, levelNumber, nextTaskId }: LevelCompleteProps) {
  const game = useGame();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const next = getTaskPosition(nextTaskId);

  useEffect(() => {
    playSound('level-complete');
    headingRef.current?.focus();
  }, []);

  return (
    <FadeIn>
      <Card tone="story" className="flex flex-col items-center gap-5 border-4 py-10 text-center">
        <Stamp tone="gold" size="lg" animate>
          {copy.levelComplete.stamp}
        </Stamp>
        <Heading level={1} size="display" ref={headingRef} tabIndex={-1}>
          {copy.levelComplete.heading(levelNumber)}
        </Heading>
        <Heading level={2}>{level.label}</Heading>
        <Text className="max-w-prose">{level.completion}</Text>
        <div className="flex flex-wrap justify-center gap-3">
          {next && (
            <Button onClick={() => game.gotoTask(nextTaskId)}>
              {copy.levelComplete.next(next.levelNumber, next.level.label)}
            </Button>
          )}
          <ButtonLink to="/board" variant="secondary">
            {copy.nav.caseBoard}
          </ButtonLink>
        </div>
      </Card>
    </FadeIn>
  );
}
