import { copy, phishingMessage } from '@app/content';
import { Text } from '../ui';

/**
 * The suspicious message, as a notification on Ananya's phone. The "link" is plain text — it
 * is never an anchor and never navigates anywhere.
 */
export function PhishingMessageView() {
  return (
    <section
      aria-label={copy.phishing.heading}
      className="flex max-w-md flex-col gap-1.5 rounded-card border border-on-canvas-muted/40 bg-canvas p-4 text-on-canvas shadow-xl"
    >
      <div className="flex items-center gap-2 text-xs text-on-canvas-muted">
        <span aria-hidden="true" className="size-4 rounded-sm bg-accent" />
        <span className="font-semibold tracking-wide uppercase">{copy.phishing.app}</span>
        <span aria-hidden="true">·</span>
        <span>{copy.phishing.now}</span>
      </div>
      <Text className="font-bold">
        <span className="sr-only">{copy.phishing.from}: </span>
        {phishingMessage.sender}
      </Text>
      <Text size="sm">{phishingMessage.body}</Text>
      <Text size="sm" className="font-semibold break-all underline">
        {phishingMessage.linkLabel}
      </Text>
    </section>
  );
}
