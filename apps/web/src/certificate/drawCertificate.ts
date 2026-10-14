/** Everything needed to paint the certificate. Nothing in here knows about the DOM or content. */
export interface CertificateArt {
  width: number;
  height: number;
  colors: {
    background: string;
    text: string;
    /** Borders, rules and the seal. */
    accent: string;
  };
  fonts: {
    display: string;
    body: string;
  };
  text: {
    issuer: string;
    heading: string;
    subheading: string;
    lines: readonly string[];
    awardedTo: string;
    badge: string;
  };
}

/** The slice of the 2D canvas API the certificate is painted with — small enough to fake. */
export type CertificateCanvas = Pick<
  CanvasRenderingContext2D,
  | 'fillStyle'
  | 'strokeStyle'
  | 'lineWidth'
  | 'font'
  | 'textAlign'
  | 'textBaseline'
  | 'fillRect'
  | 'strokeRect'
  | 'fillText'
  | 'measureText'
  | 'beginPath'
  | 'arc'
  | 'stroke'
  | 'save'
  | 'restore'
  | 'translate'
  | 'rotate'
>;

/**
 * Breaks `text` into lines no wider than `maxWidth`, as measured by `measure`. A single word
 * that is too wide gets a line to itself rather than being cut.
 */
export function wrapText(
  text: string,
  maxWidth: number,
  measure: (candidate: string) => number,
): string[] {
  const lines: string[] = [];
  let line = '';

  for (const word of text.split(/\s+/).filter(Boolean)) {
    const candidate = line ? `${line} ${word}` : word;
    if (line && measure(candidate) > maxWidth) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/**
 * Paints the Junior Bank Officer certificate: a double border, the wording centred down the
 * page, and a round seal with the title in it. All sizes are fractions of the page, so the
 * same drawing works at any resolution.
 */
export function drawCertificate(ctx: CertificateCanvas, art: CertificateArt): void {
  const { width, height, colors, fonts, text } = art;
  const unit = height / 100;
  const centre = width / 2;
  const font = (weight: string, size: number, family: string) =>
    `${weight} ${Math.round(size * unit)}px ${family}`;

  ctx.fillStyle = colors.background;
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = colors.accent;
  ctx.lineWidth = unit * 0.9;
  ctx.strokeRect(unit * 3, unit * 3, width - unit * 6, height - unit * 6);
  ctx.lineWidth = unit * 0.25;
  ctx.strokeRect(unit * 4.6, unit * 4.6, width - unit * 9.2, height - unit * 9.2);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.fillStyle = colors.accent;
  ctx.font = font('bold', 2.6, fonts.display);
  ctx.fillText(text.issuer, centre, unit * 13);

  ctx.fillStyle = colors.text;
  ctx.font = font('bold', 8, fonts.display);
  ctx.fillText(text.heading, centre, unit * 24);
  ctx.font = font('bold', 4.4, fonts.display);
  ctx.fillText(text.subheading, centre, unit * 34);

  ctx.font = font('normal', 2.7, fonts.body);
  let y = unit * 43;
  for (const paragraph of text.lines) {
    for (const line of wrapText(paragraph, width * 0.7, (s) => ctx.measureText(s).width)) {
      ctx.fillText(line, centre, y);
      y += unit * 4;
    }
    y += unit * 1.5;
  }

  ctx.font = font('normal', 2.4, fonts.body);
  ctx.fillText(text.awardedTo, centre, unit * 66);

  // The seal: two rings and the title, tilted like a stamp that was pressed by hand.
  ctx.save();
  ctx.translate(centre, unit * 81);
  ctx.rotate(-0.1);
  ctx.strokeStyle = colors.accent;
  ctx.fillStyle = colors.accent;
  ctx.lineWidth = unit * 0.7;
  ctx.beginPath();
  ctx.arc(0, 0, unit * 12, 0, Math.PI * 2);
  ctx.stroke();
  ctx.lineWidth = unit * 0.25;
  ctx.beginPath();
  ctx.arc(0, 0, unit * 10.8, 0, Math.PI * 2);
  ctx.stroke();

  ctx.font = font('bold', 2.5, fonts.display);
  const sealLines = wrapText(text.badge.toUpperCase(), unit * 17, (s) => ctx.measureText(s).width);
  const lineHeight = unit * 3.4;
  sealLines.forEach((line, index) => {
    ctx.fillText(line, 0, (index - (sealLines.length - 1) / 2) * lineHeight);
  });
  ctx.fillText('★', 0, -unit * 7.6);
  ctx.fillText('★ ★ ★', 0, unit * 7.8);
  ctx.restore();
}
