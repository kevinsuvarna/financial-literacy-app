import { copy } from '@app/content';
import { SceneFrame } from '../components/SceneFrame';
import { Button, Heading, Stamp, Text } from '../components/ui';

export function CaseAssigned({ onOpen }: { onOpen: () => void }) {
  return (
    <SceneFrame scene="screen">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <Heading level={1} size="display">
          {copy.caseAssigned.heading}
        </Heading>
        <Stamp tone="clue" size="lg" animate>
          {copy.caseAssigned.stamp}
        </Stamp>
      </div>
      <Text className="max-w-prose">{copy.caseAssigned.body}</Text>
      <Button className="self-start" onClick={onOpen}>
        {copy.caseAssigned.cta}
      </Button>
    </SceneFrame>
  );
}
