import { copy, phishingMessage } from '@app/content';
import { Card, Heading, Text } from '../ui';

/** The link is display text only — it is never an anchor and never navigates anywhere. */
export function PhishingMessageView() {
  return (
    <Card as="section" tone="sunken" className="flex flex-col gap-2">
      <Heading level={2} size="section">
        {copy.phishing.heading}
      </Heading>
      <Text size="sm" tone="muted">
        {copy.phishing.from}: {phishingMessage.sender}
      </Text>
      <Text>{phishingMessage.body}</Text>
      <Text className="font-semibold break-all underline">{phishingMessage.linkLabel}</Text>
    </Card>
  );
}
