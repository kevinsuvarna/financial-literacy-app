/**
 * Moves focus to the first heading inside `container` — for when a whole screen has been
 * replaced, and the control that had focus went with it. Without this, keyboard and screen-
 * reader users are dropped back at the top of the page with no idea what changed; with it they
 * land on the new screen's title, and Tab carries on from there.
 */
export function focusFirstHeading(container: ParentNode | null | undefined): void {
  const heading = container?.querySelector<HTMLElement>('h1, h2');
  if (!heading) return;
  // Headings aren't focusable by default; -1 makes this one focusable from script only.
  if (!heading.hasAttribute('tabindex')) heading.tabIndex = -1;
  heading.focus();
}
