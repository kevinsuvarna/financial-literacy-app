import { useEffect, useRef, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { copy } from '@app/content';
import { playSound } from '../audio/sounds';
import { downloadCertificate } from '../certificate/downloadCertificate';
import {
  Button,
  ButtonLink,
  Card,
  Confetti,
  FadeIn,
  Heading,
  Notice,
  Seal,
  Text,
} from '../components/ui';
import { useGame } from '../game';

/** When the seal's thud lands: as its stamp animation hits the page. */
const SEAL_THUD_AFTER_MS = 300;

/**
 * Mission complete. The certificate is the same for every player — there is no name on it,
 * because the game never asks for one.
 *
 * It can be kept two ways, both entirely on this device: printed (index.css has the print
 * rules; everything but the certificate hides itself) or saved as a picture.
 */
export function CertificateScreen() {
  const game = useGame();
  const certificateRef = useRef<HTMLDivElement>(null);
  const [downloadFailed, setDownloadFailed] = useState(false);
  const earned = game.state === 'missionComplete';

  useEffect(() => {
    if (!earned) return;
    playSound('level-complete');
    playSound('thud', { delayMs: SEAL_THUD_AFTER_MS });
  }, [earned]);

  // Also covers "Replay mission": RESET returns the game to notStarted, which lands here.
  if (game.state === 'notStarted') return <Navigate to="/" replace />;
  if (!earned) return <Navigate to="/board" replace />;

  async function download() {
    if (!certificateRef.current) return;
    setDownloadFailed(!(await downloadCertificate(certificateRef.current)));
  }

  return (
    <FadeIn className="flex flex-col gap-5">
      <Card
        ref={certificateRef}
        tone="story"
        data-testid="certificate"
        className="relative flex flex-col items-center gap-5 overflow-hidden border-4 px-6 py-10 text-center print:border-8 print:bg-transparent print:text-ink"
      >
        <Confetti />
        <Text size="sm" className="font-display font-bold tracking-widest text-gold print-colors">
          {copy.certificate.issuer}
        </Text>
        <Heading level={1} size="display">
          {copy.certificate.heading}
        </Heading>
        <Heading level={2}>{copy.certificate.subheading}</Heading>
        {copy.certificate.lines.map((line) => (
          <Text key={line} className="max-w-prose">
            {line}
          </Text>
        ))}
        <div className="flex flex-col items-center gap-4">
          <Text size="sm" tone="muted">
            {copy.certificate.awardedTo}
          </Text>
          <Seal animate>{copy.certificate.badge}</Seal>
        </div>
      </Card>

      {downloadFailed && <Notice tone="info">{copy.certificate.downloadFailed}</Notice>}

      <div className="flex flex-wrap justify-center gap-3 print:hidden">
        <ButtonLink to="/board">{copy.certificate.backToBoard}</ButtonLink>
        <Button variant="secondary" onClick={game.reset}>
          {copy.certificate.replay}
        </Button>
        <Button variant="secondary" onClick={() => window.print()}>
          {copy.certificate.print}
        </Button>
        <Button variant="secondary" onClick={() => void download()}>
          {copy.certificate.download}
        </Button>
      </div>
    </FadeIn>
  );
}
